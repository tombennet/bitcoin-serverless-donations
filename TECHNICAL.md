# Technical Documentation

Advanced implementation details for the Bitcoin address pool system.

> **Note**: For basic setup instructions, see the main [README.md](README.md).

## System Architecture

### Address Derivation

Addresses are derived from a Bitcoin XPUB using [Swan's XPUB tool](https://github.com/swan-bitcoin/xpub-tool). This is deterministic - the same XPUB always generates the same addresses in the same order.

The system automatically detects and supports multiple BIP standards:

- **BIP44 (P2PKH)**: Legacy addresses
- **BIP49 (P2WPKH-in-P2SH)**: Nested SegWit
- **BIP84 (P2WPKH)**: Native SegWit
- **BIP86 (P2TR)**: Taproot

### Address Pool Management

1. **Pool Size**: Maintains exactly 5 addresses at any time
2. **10-Minute Rotation**: Every 10 minutes, the system:
   - Rotates to the next address in the pool (deterministic rotation)
   - Checks the mempool.space API to verify if the address has been used
   - If unused, serves that address
   - If used, continues checking addresses in rotation order until finding an unused one
   - Replaces used addresses with freshly derived ones
3. **State Management**: Uses Netlify Blobs to persist pool state between function invocations
4. **Index Tracking**: Maintains a `nextIndex` counter to track which address to derive next from the XPUB

### State Persistence

The address pool state is stored in Netlify Blobs with the following structure:

```typescript
{
  addresses: string[];      // Array of 5 Bitcoin addresses
  nextIndex: number;         // Next derivation index to use
  currentIndex: number;      // Current rotation position (0-4)
  lastRotation: number;      // Timestamp of last rotation
}
```

The cache key is generated from a hash of your XPUB and derivation path, ensuring automatic cache invalidation when these environment variables change.

## Cache Management

### Automatic Cache Invalidation

The address pool cache is **automatically invalidated** when you change your XPUB or derivation path. The system uses environment-based cache keys (`pool-state-<hash>`), so changing these variables will automatically generate fresh addresses without manual intervention.

### Manual Cache Clearing

If you need to manually clear the cache for troubleshooting:

**Via Netlify CLI:**

```bash
netlify blobs:delete address-pool pool-state-<hash>
```

**Via Netlify Dashboard:**

1. Go to your Project → Blobs
2. Find the `address-pool` store
3. Delete the relevant blob

The address pool will automatically regenerate on the next function invocation.

## Dependencies

The system uses the following npm packages:

- **`@swan-bitcoin/xpub-lib`**: HD wallet key derivation and address generation
- **`@bitcoinerlab/secp256k1`**: Elliptic curve cryptography for Taproot support. Note: the popular `tiny-secp256k1` library doesn't work in a serverless environment due to WASM compatibility issues.
- **`@netlify/blobs`**: State persistence for the address pool
- **`@netlify/functions`**: Serverless function framework

## Error Handling

The system includes several fail-safe mechanisms:

- **mempool.space API unavailable**: Assumes addresses are unused (safe default - privacy preserved)
- **Invalid XPUB**: Returns 500 error with validation message
- **Corrupted pool state**: Automatically reinitializes with fresh addresses
- **Invalid address format**: Validation catches format issues before serving

## Testing

Automated tests verify address derivation correctness across all supported BIP standards using official test vectors. Tests run on every push and weekly via GitHub Actions.

Tests validate:

- BIP44 (Legacy) address generation
- BIP49 (Nested SegWit) address generation
- BIP84 (Native SegWit) address generation
- BIP86 (Taproot) address generation
- Consistency with official test vectors

**Before production**: Always verify that your XPUB generates expected addresses by comparing the first few addresses with your wallet software. This is critical to ensure you can receive funds.

## API Reference

### Endpoint

`GET /.netlify/functions/get-address`

### Response

```json
{
  "address": "bc1q..."
}
```

### Status Codes

- **200**: Success, address returned
- **500**: Internal error (XPUB validation failure, derivation error, etc.)

## Security Considerations

- **XPUB Privacy**: Your XPUB is stored as an environment variable and never exposed to clients
- **Read-Only Access**: XPUB provides read-only access to derive addresses; funds cannot be spent
- **Address Rotation**: 10-minute rotation helps prevent address reuse and improves privacy
- **Used Address Detection**: Checks mempool.space to avoid reusing addresses that have received payments
