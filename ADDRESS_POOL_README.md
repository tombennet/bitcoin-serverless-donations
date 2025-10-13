# Bitcoin Address Pool System

This system provides a dynamic XPUB-based address pool that automatically rotates Bitcoin addresses every 10 minutes, ensuring privacy and minimising odds of address reuse.

## How It Works

1. **XPUB Derivation**: Addresses are derived from a Bitcoin XPUB using proper BIP44/49/84/86 standards. This is deterministic - the same XPUB always generates the same addresses in the same order.
2. **Address Pool**: Maintains a pool of 5 addresses at any time
3. **10-Minute Rotation**: Every 10 minutes, the system:
   - Rotates to the next address in the pool (deterministic rotation)
   - Checks the mempool.space API to see if this next address has been used
   - If unused, serves that address
   - If used, continues checking addresses in rotation order until finding an unused one
   - Replaces used addresses with freshly derived ones
4. **State Management**: Uses Netlify Blobs to persist pool state between function invocations
5. **Multi-Standard Support**: Automatically detects and supports BIP44 (P2PKH), BIP49 (P2WPKH-in-P2SH), BIP84 (P2WPKH), BIP86 (P2TR) address types

## Environment Variables

Set your Bitcoin wallet's account XPUB and its derivation path as environment variables in your Netlify deployment:

```
BITCOIN_XPUB="your_xpub_here"
BITCOIN_DERIVATION_PATH="your_path_here"
```

Ensure to enclose all values in double inverted commas, e.g. `BITCOIN_DERIVATION_PATH="m/84'/0'/0'"`.

**Important**: Your extended public key (XPUB) and derivation path should correspond to the account level (e.g., `m/84'/0'/0'` for BIP84). The system will automatically generate receiving addresses.

### Common Derivation Paths

- **BIP84 (P2WPKH)**: `m/84'/0'/0'` - Native Segwit, most common for modern wallets (bech32 addresses). Extended public keys begin with `zpub`.
- **BIP86 (P2TR)**: `m/86'/0'/0'` - Taproot (bech32m addresses). Nested SegWit (P2SH addresses). Extended public keys begin with `xpub`.
- **BIP44 (P2PKH)**: `m/44'/0'/0'` - Legacy addresses (base58 format). Extended public keys begin with `xpub`.
- **BIP49 (P2WPKH-in-P2SH)**: `m/49'/0'/0'` - Nested SegWit (P2SH addresses). Extended public keys begin with `ypub`.

**Important Notes**

- The XPUB you provide should be derived from the **account level** (e.g., `m/84'/0'/2'`). The system automatically derives receiving addresses (`/0/index`) from your account-level XPUB.
- For example, if your XPUB is derived from `m/84'/0'/2'`, the system will generate addresses at `m/84'/0'/2'/0/index`
- The system automatically detects the address type (P2PKH, P2WPKH, P2WPKH-in-P2SH) from the derivation path
- Both environment variables are required for maximum robustness and flexibility
- When testing your setup, be sure to check that the derived addresses **match those you see in your wallet software**. This is a _vital_ step in ensuring you receive any funds that are sent to you.

## Dependencies

The system uses the following npm packages:

- `@swan-bitcoin/xpub-lib`: HD wallet key derivation and address generation
- `@bitcoinerlab/secp256k1`: Elliptic curve cryptography for Taproot support - the popular `tiny-secp256k1` library doesn't work in a serverless environment due to issues with the WASM
- `@netlify/blobs`: State persistence for the address pool
- `@netlify/functions`: Serverless function framework

## Error Handling

- If mempool.space API is unavailable, assumes addresses are unused (safe default)
- If XPUB is invalid, returns 500 error
- If pool state is corrupted, reinitializes with fresh addresses
