import { getStore } from "@netlify/blobs";
import {
  addressFromExtPubKey,
  addressesFromExtPubKey,
  Purpose,
  initEccLib,
} from "@swan-bitcoin/xpub-lib";
import { createHash } from "crypto";
import ecc from "@bitcoinerlab/secp256k1";

// Initialize ECC library for Taproot support
initEccLib(ecc);

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

/**
 * Generate a hash of the environment configuration for cache key versioning
 */
function generateEnvironmentHash(xpub: string, derivationPath: string): string {
  const configString = `${xpub}:${derivationPath}`;
  return createHash("sha256").update(configString).digest("hex").slice(0, 16);
}

export class AddressPoolManager {
  private store: ReturnType<typeof getStore>;
  private xpub: string;
  private derivationPath: string;
  private environmentHash: string;
  private cacheKey: string;

  constructor(xpub: string, derivationPath: string) {
    this.store = getStore(STORE_NAME);
    this.xpub = xpub;
    this.derivationPath = derivationPath;
    this.environmentHash = generateEnvironmentHash(xpub, derivationPath);
    this.cacheKey = `pool-state-${this.environmentHash}`;
  }

  /**
   * Detect purpose from derivation path and return xpub-lib Purpose enum
   */
  private detectPurpose(): Purpose {
    // Extract purpose from derivation path (e.g., m/84'/0'/0' -> 84)
    const match = this.derivationPath.match(/m\/(\d+)'/);
    const purposeNumber = match ? parseInt(match[1], 10) : 84; // Default to BIP84

    // Map purpose number to xpub-lib Purpose enum
    switch (purposeNumber) {
      case 44:
        return Purpose.P2PKH;
      case 49:
        return Purpose.P2SH;
      case 84:
        return Purpose.P2WPKH;
      case 86:
        return Purpose.P2TR;
      default:
        throw new Error(
          `Unsupported purpose: ${purposeNumber}. Supported: 44 (P2PKH), 49 (P2WPKH-in-P2SH), 84 (P2WPKH), 86 (P2TR)`
        );
    }
  }

  /**
   * Derive a Bitcoin address from XPUB at the given index
   */
  private deriveAddress(index: number): string {
    try {
      const result = addressFromExtPubKey({
        extPubKey: this.xpub,
        network: "mainnet",
        purpose: this.detectPurpose(),
        change: 0, // receiving addresses
        keyIndex: index, // address index
      });

      return result.address;
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
      // On error, assume no activity
      return false;
    }
  }

  /**
   * Get the current pool state from Netlify Blobs
   */
  private async getPoolState(): Promise<AddressPoolState | null> {
    try {
      const data = await this.store.get(this.cacheKey, { type: "json" });
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
      await this.store.set(this.cacheKey, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save pool state:", error);
      throw error;
    }
  }

  /**
   * Initialize a new address pool
   */
  private async initializePool(): Promise<AddressPoolState> {
    // Generate all pool addresses in one call
    const addresses = addressesFromExtPubKey({
      extPubKey: this.xpub,
      network: "mainnet",
      purpose: this.detectPurpose(),
      change: 0, // receiving addresses
      addressCount: POOL_SIZE,
      addressStartIndex: 0, // start from index 0
    });

    const pool: AddressPoolEntry[] = addresses.map((result, i) => ({
      index: i,
      address: result.address,
      lastCheck: Date.now(),
      hasActivity: false,
    }));

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
}
