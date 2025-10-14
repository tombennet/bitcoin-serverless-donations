# Bitcoin Serverless Payments

A simple, self-custodial solution for accepting private, on-chain Bitcoin donations with minimal overhead and a good level of privacy.

## 🚀 Quick Start

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tombennet/bitcoin-serverless-payments#BITCOIN_XPUB=your_extended_public_key&BITCOIN_DERIVATION_PATH=your_account_path)

**For a complete step-by-step tutorial, visit: [https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/](https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/)**

## ✨ Features

- **Serverless**: No database required, and zero server maintenance.
- **Sovereign**: Receive payments directly to your own wallet - just grab your account XPUB and you're good to go.
- **Private**: No third-party payment processors, middlemen, or KYC requirements. Automatically rotate addresses for privacy.
- **Free**: Free hosting on Netlify, Vercel, or Cloudflare. Minimal codebase, easy to integrate into your existing project.

## 📦 Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/tombennet/bitcoin-serverless-payments.git
   cd bitcoin-serverless-payments
   npm install
   ```
2. **Set your environment variables in `.env`**:
   ```bash
   BITCOIN_XPUB="xpub6..."
   BITCOIN_DERIVATION_PATH="m/84'/0'/0'"
   ```
3. **Test locally**, making sure that the derived addresses match those you see in your wallet software
   ```bash
   netlify dev
   ```
4. **Deploy to Netlify** and set both environment variables in your deployment settings

### Environment Variables

- **`BITCOIN_XPUB`** (required): Extended public key (XPUB) for the Bitcoin wallet account you wish to use
- **`BITCOIN_DERIVATION_PATH`** (required): The derivation path to use for address generation

**Important**: Your XPUB and derivation path should correspond to the account level (e.g., `m/84'/0'/0'` for BIP84). The system will automatically generate receiving addresses. See [ADDRESS_POOL_README.md](ADDRESS_POOL_README.md) for detailed setup instructions.

## 🏗️ How It Works

### XPUB

Your extended public key (or 'XPUB', exported from your Bitcoin wallet) is stored as an environment variable, along with its derivation path. Remember, XPUBs cannot be used to spend funds - there's no need to touch a private key in this setup. Your XPUB is never exposed to the frontend; only derived addresses are served to users.

### Address Rotation

Your serverless function derives addresses using [Swan's XPUB tool](https://github.com/swan-bitcoin/xpub-tool), stores them, rotates them, checks for transactions, and removes used addresses from circulation.

- Address pool rotates every 10 minutes automatically
- The mempool.space API is used to check for used addresses, which are replaced with fresh ones from your XPUB
- Pool size stays constant at 5 addresses to prevent index bloat
- Supports BIP44 (P2PKH), BIP49 (P2WPKH-in-P2SH), and BIP84 (P2WPKH), BIP86 (P2TR) address types

### Local caching and fallbacks

Addresses served from the endpoint are cached in browser `localStorage` for 10 minutes, and rendered in a QR code. If the server is unavailable, we ensure graceful degradation by serving a fallback address.

## 📁 Project Structure

```
├── functions/
│   └── get-address/
│       ├── index.mts              # Main serverless function
│       ├── address-pool.ts        # Address pool management
│       └── validation.ts          # Environment validation utilities
├── dist/
│   ├── index.html                 # Minimal frontend
│   └── bitcoin.svg                # Bitcoin logo for QR code
├── ADDRESS_POOL_README.md         # Detailed address pool documentation
└── netlify.toml                   # Deployment configuration
```

## 📚 API Endpoints

### GET `/api/get-address`

Returns the current Bitcoin address for payments.

**Response:**

```json
{
  "address": "bc1q..."
}
```

## 🗑️ Cache Management

The address pool cache is **automatically invalidated** when you change your XPUB or derivation path. The system uses environment-based cache keys, so changing these variables will automatically generate fresh addresses without manual intervention.

If you need to manually clear the cache for other reasons, you can do so through:

- **Netlify CLI**: `netlify blobs:delete address-pool pool-state-<hash>`
- **Netlify Dashboard**: Go to your Project → Blobs → Delete the relevant blob from the `address-pool` store

The address pool will automatically regenerate when needed.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Bitcoin community**
