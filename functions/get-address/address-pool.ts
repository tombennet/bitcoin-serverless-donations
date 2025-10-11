import { getStore } from "@netlify/blobs";
import { HDKey } from "@scure/bip32";
import { bech32, bech32m, createBase58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha2.js";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { utf8ToBytes, concatBytes, bytesToHex } from "@noble/hashes/utils.js";

export interface AddressPoolEntry {
  index: number;
  address: string;
  lastCheck: number;
  hasActivity: boolean;
}

export interface AddressPoolState {
  currentIndex: number;
  lastRotation: number;
  pool: AddressPoolEntry[];
}

const POOL_SIZE = 5;
const ROTATION_INTERVAL = 10 * 60 * 1000; // 10 minutes
const STORE_NAME = "address-pool";

/** BIP340/BIP341 tagged hash: H_tag(m) = sha256(sha256(tag)||sha256(tag)||m) */
function taggedHash(tag: string, m: Uint8Array): Uint8Array {
  const t = utf8ToBytes(tag);
  const th = sha256(t);
  return sha256(concatBytes(th, th, m));
}

/** BIP86 output key = P + H_TapTweak(P)*G (no script tree) -> return x-only(Q) */
function taprootTweakXOnly(internalXOnly: Uint8Array): Uint8Array {
  // tweak = H_TapTweak(internal_xonly)
  const tweak = taggedHash("TapTweak", internalXOnly);
  const tweakBig = BigInt("0x" + bytesToHex(tweak));

  // Lift x-only to even-Y point per BIP340: use compressed key 0x02||X
  const P = secp256k1.Point.fromHex("02" + bytesToHex(internalXOnly));

  // Q = P + tweak*G   (handle rare tweak==0 gracefully)
  const Q =
    tweakBig === 0n ? P : P.add(secp256k1.Point.BASE.multiply(tweakBig));

  // Return x-only bytes of Q (drop 0x02/0x03)
  return Q.toBytes(true).slice(1);
}

export class AddressPoolManager {
  private store: ReturnType<typeof getStore>;
  private xpub: string;
  private derivationPath: string;

  constructor(xpub: string, derivationPath: string) {
    this.store = getStore(STORE_NAME);
    this.xpub = xpub;
    this.derivationPath = derivationPath;
  }

  /**
   * Get version strings for HDKey based on purpose
   */
  private getVersionStrings(purpose: number): {
    public: number;
    private: number;
  } {
    switch (purpose) {
      case 44:
        return { public: 0x488b21e, private: 0x488ade4 }; // xpub / xprv
      case 49:
        return { public: 0x49d7cb2, private: 0x49d7878 }; // ypub / yprv
      case 84:
        return { public: 0x4b24746, private: 0x4b2430c }; // zpub / zprv
      case 86:
        return { public: 0x488b21e, private: 0x488ade4 }; // xpub / xprv
      default:
        throw new Error(
          `Unsupported purpose: ${purpose}. Supported: 44 (P2PKH), 49 (P2WPKH-in-P2SH), 84 (P2WPKH), 86 (P2TR)`
        );
    }
  }

  /**
   * Detect purpose from derivation path
   */
  private detectPurpose(): number {
    // Extract purpose from derivation path (e.g., m/84'/0'/0' -> 84)
    const match = this.derivationPath.match(/m\/(\d+)'/);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Default to BIP84 if no purpose found
    return 84;
  }

  /**
   * Derive a Bitcoin address from XPUB at the given index
   */
  private deriveAddress(index: number): string {
    try {
      // Detect purpose from derivation path
      const purpose = this.detectPurpose();

      // Try to create HDKey without version strings first (let it auto-detect)
      let hdkey: HDKey;
      try {
        hdkey = HDKey.fromExtendedKey(this.xpub);
      } catch (error) {
        // If auto-detection fails, try with explicit version strings
        const versionStrings = this.getVersionStrings(purpose);
        hdkey = HDKey.fromExtendedKey(this.xpub, versionStrings);
      }

      // Derive the child key for this address index
      // XPUB is at account level, so we derive to change level (0 for receiving) then to address index
      // Note: We can only derive non-hardened children from XPUB
      const child = hdkey.derive(`m/0/${index}`);

      if (!child.publicKey) {
        throw new Error(`Failed to derive public key for index ${index}`);
      }

      const base58check = createBase58check(sha256);
      const HASH160 = (buf: Uint8Array) => ripemd160(sha256(buf));

      const verP2PKH = 0x00;
      const verP2SH = 0x05;
      let address = "";

      if (purpose === 44) {
        // Legacy P2PKH: base58check(version + HASH160(pubkey))
        const payload = new Uint8Array([verP2PKH, ...HASH160(child.publicKey)]);
        address = base58check.encode(payload);
      }

      if (purpose === 49) {
        // P2WPKH-in-P2SH: base58check(version + HASH160(redeemScript))
        const redeemScript = new Uint8Array([
          0x00,
          0x14,
          ...HASH160(child.publicKey),
        ]);
        const payload = new Uint8Array([verP2SH, ...HASH160(redeemScript)]);
        address = base58check.encode(payload);
      }

      if (purpose === 84) {
        // Native SegWit (P2WPKH): bech32 encode witness v0 + HASH160(pubkey)
        const words = bech32.toWords(HASH160(child.publicKey));
        words.unshift(0x00); // witness version 0
        address = bech32.encode("bc", words);
      }

      if (purpose === 86) {
        // Taproot (P2TR)
        // internal x-only from compressed pubkey
        const xOnlyInternal = child.publicKey.slice(1, 33);

        // BIP86 tweak
        const xOnlyTweaked = taprootTweakXOnly(xOnlyInternal);

        // bech32m encode: witness v1 + 32-byte x-only
        const words = bech32m.toWords(xOnlyTweaked);
        words.unshift(0x01); // v1
        // Assume mainnet
        address = bech32m.encode("bc", words);
      }

      if (!address) {
        throw new Error(`Unsupported purpose: ${purpose}`);
      }

      return address;
    } catch (error) {
      throw new Error(`Address derivation failed for index ${index}: ${error}`);
    }
  }

  /**
   * Check if an address has activity on mempool.space
   */
  private async checkAddressActivity(address: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://mempool.space/api/address/${address}`
      );

      if (!response.ok) {
        throw new Error(`Mempool API error: ${response.status}`);
      }

      const data = await response.json();

      // Check if address has any transactions
      return data.chain_stats?.tx_count > 0 || data.mempool_stats?.tx_count > 0;
    } catch (error) {
      console.error(`Failed to check activity for address ${address}:`, error);
      // On error, assume no activity to be safe
      return false;
    }
  }

  /**
   * Get the current pool state from Netlify Blobs
   */
  private async getPoolState(): Promise<AddressPoolState | null> {
    try {
      const data = await this.store.get("pool-state", { type: "json" });
      return data as AddressPoolState | null;
    } catch (error) {
      console.error("Failed to get pool state:", error);
      return null;
    }
  }

  /**
   * Save the current pool state to Netlify Blobs
   */
  private async savePoolState(state: AddressPoolState): Promise<void> {
    try {
      await this.store.set("pool-state", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save pool state:", error);
      throw error;
    }
  }

  /**
   * Initialize a new address pool
   */
  private async initializePool(): Promise<AddressPoolState> {
    const pool: AddressPoolEntry[] = [];

    for (let i = 0; i < POOL_SIZE; i++) {
      const address = this.deriveAddress(i);
      pool.push({
        index: i,
        address,
        lastCheck: Date.now(),
        hasActivity: false,
      });
    }

    const state: AddressPoolState = {
      currentIndex: 0,
      lastRotation: Date.now(),
      pool,
    };

    await this.savePoolState(state);
    return state;
  }

  /**
   * Replace used addresses in the pool with fresh ones
   * Removes used addresses and adds fresh ones to the end, maintaining sequential generation
   */
  private async replaceUsedAddresses(
    state: AddressPoolState
  ): Promise<AddressPoolState> {
    const usedAddresses = state.pool.filter((entry) => entry.hasActivity);
    const unusedAddresses = state.pool.filter((entry) => !entry.hasActivity);

    if (usedAddresses.length === 0) {
      return state;
    }

    // Find the highest index in the pool to continue from
    const maxIndex = Math.max(...state.pool.map((entry) => entry.index));
    let nextIndex = maxIndex + 1;

    // Start with unused addresses, then add fresh ones to the end
    const newPool = [...unusedAddresses];

    // Generate fresh addresses for each used address
    for (const usedEntry of usedAddresses) {
      const newAddress = this.deriveAddress(nextIndex);
      newPool.push({
        index: nextIndex,
        address: newAddress,
        lastCheck: Date.now(),
        hasActivity: false,
      });
      nextIndex++;
    }

    // Update currentIndex to point to the first unused address in the new pool
    const newCurrentIndex = newPool.findIndex((entry) => !entry.hasActivity);
    const adjustedCurrentIndex = newCurrentIndex >= 0 ? newCurrentIndex : 0;

    return {
      ...state,
      pool: newPool,
      currentIndex: adjustedCurrentIndex,
    };
  }

  /**
   * Get the current address to serve, handling rotation logic
   */
  async getCurrentAddress(): Promise<string> {
    let state = await this.getPoolState();

    // Initialize pool if it doesn't exist
    if (!state) {
      state = await this.initializePool();
    }

    const now = Date.now();
    const timeSinceLastRotation = now - state.lastRotation;

    // Check if we need to rotate (10 minutes have passed)
    if (timeSinceLastRotation >= ROTATION_INTERVAL) {
      // Always rotate after 10 minutes - find the next unused address
      let selectedEntry: AddressPoolEntry | null = null;
      let nextIndex = (state.currentIndex + 1) % state.pool.length;

      // Check addresses in rotation order until we find an unused one
      for (let i = 0; i < state.pool.length; i++) {
        const entry = state.pool[nextIndex];

        // Check if this address has activity
        const hasActivity = await this.checkAddressActivity(entry.address);

        // Update the entry with current activity status
        entry.hasActivity = hasActivity;
        entry.lastCheck = now;

        // If this address is unused, select it
        if (!hasActivity) {
          selectedEntry = entry;
          state.currentIndex = nextIndex;
          break;
        }

        // Move to next address in rotation
        nextIndex = (nextIndex + 1) % state.pool.length;
      }

      // Replace any used addresses we found during rotation with fresh ones
      state = await this.replaceUsedAddresses(state);

      // If all addresses were used, reset to first address
      if (!selectedEntry) {
        state.currentIndex = 0;
      }

      // Update rotation time
      state.lastRotation = now;

      // Save the updated state
      await this.savePoolState(state);
    }

    // Return the current address
    return state.pool[state.currentIndex].address;
  }

  /**
   * Get pool statistics for debugging
   */
  async getPoolStats(): Promise<{
    poolSize: number;
    usedAddresses: number;
    unusedAddresses: number;
    lastRotation: number;
    timeUntilNextRotation: number;
    currentAddress: string;
    poolEntries: Array<{
      index: number;
      address: string;
      hasActivity: boolean;
      lastCheck: number;
    }>;
  }> {
    const state = await this.getPoolState();

    if (!state) {
      return {
        poolSize: 0,
        usedAddresses: 0,
        unusedAddresses: 0,
        lastRotation: 0,
        timeUntilNextRotation: 0,
        currentAddress: "",
        poolEntries: [],
      };
    }

    const usedAddresses = state.pool.filter(
      (entry) => entry.hasActivity
    ).length;
    const unusedAddresses = state.pool.length - usedAddresses;
    const timeUntilNextRotation = Math.max(
      0,
      ROTATION_INTERVAL - (Date.now() - state.lastRotation)
    );
    const currentAddress = state.pool[state.currentIndex]?.address || "";

    return {
      poolSize: state.pool.length,
      usedAddresses,
      unusedAddresses,
      lastRotation: state.lastRotation,
      timeUntilNextRotation,
      currentAddress,
      poolEntries: state.pool.map((entry) => ({
        index: entry.index,
        address: entry.address,
        hasActivity: entry.hasActivity,
        lastCheck: entry.lastCheck,
      })),
    };
  }

  /**
   * Force a pool rotation (useful for testing)
   */
  async forceRotation(): Promise<string> {
    const state = await this.getPoolState();

    if (!state) {
      throw new Error("No pool state found");
    }

    // Force rotation by setting lastRotation to a time that would trigger rotation
    state.lastRotation = Date.now() - ROTATION_INTERVAL - 1;
    await this.savePoolState(state);

    // Get the new address (this will trigger rotation)
    return await this.getCurrentAddress();
  }

  /**
   * Clear the entire pool cache and regenerate (useful when derivation path changes)
   */
  async clearCache(): Promise<void> {
    try {
      await this.store.delete("pool-state");
    } catch (error) {
      console.error("Failed to clear pool cache:", error);
      throw error;
    }
  }
}
