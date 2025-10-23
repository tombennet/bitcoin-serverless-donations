# Bitcoin Serverless Payments

A simple, self-custodial solution for accepting private, on-chain Bitcoin donations with minimal overhead and a good level of privacy.

This repository contains both the serverless backend and an npm package which serves as the frontend. You can see a [live demo on my blog](https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/).

![Bitcoin Serverless Payments widget](/src/img/preview.png)

## ✨ Features

- **Serverless**: No database required, and zero server maintenance.
- **Sovereign**: Receive payments directly to your own wallet - just grab your account XPUB and you're good to go.
- **Private**: No third-party payment processors, middlemen, or KYC requirements. Automatically rotate addresses for privacy.
- **Free**: Backend can be hosted for free on Netlify, and the convenient `BitcoinPay()` browser function is easy to integrate into any website.

## 🚀 Quick Start

### Backend

One click deployment to Netlify - just set your environment variables and you're ready to go.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tombennet/bitcoin-serverless-payments#BITCOIN_XPUB=your_extended_public_key&BITCOIN_DERIVATION_PATH=your_account_path)

### Frontend

The simplest approach is to add the CDN versions of the script and stylesheet, and then call `BitcoinPay.render()`.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bitcoin-serverless-payments@latest/dist/bitcoin-pay.min.css"
/>
<script src="https://cdn.jsdelivr.net/npm/bitcoin-serverless-payments@latest/dist/bitcoin-pay.min.js"></script>

<div id="bitcoin-donate"></div>

<script>
  BitcoinPay.render({
    endpoint: "https://your-site.netlify.app/.netlify/functions/get-address",
    element: "#bitcoin-donate",
    fallbackAddress: "bc1q...",
  }).catch((error) => {
    console.error("Failed to render Bitcoin widget:", error);
  });
</script>
```

**For a complete step-by-step tutorial, visit: [https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/](https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/)**

## 📦 Backend Setup

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
4. **Deploy to Netlify**, and set both environment variables in your deployment settings. Your function's endpoint will be available at this path:

   ```bash
    /.netlify/functions/get-address
   ```

**Common Derivation Paths:**

- **BIP84 (P2WPKH)**: `m/84'/0'/0'` - Native SegWit, most common for modern wallets (bech32 addresses starting with `bc1q`). Extended public keys begin with `zpub`.
- **BIP86 (P2TR)**: `m/86'/0'/0'` - Taproot (bech32m addresses starting with `bc1p`). Extended public keys begin with `xpub`.
- **BIP44 (P2PKH)**: `m/44'/0'/0'` - Legacy addresses (base58 format). Extended public keys begin with `xpub`.
- **BIP49 (P2WPKH-in-P2SH)**: `m/49'/0'/0'` - Nested SegWit (P2SH addresses starting with `3`). Extended public keys begin with `ypub`.

**Important Notes:**

- Your XPUB should be from the **account level** (e.g., `m/84'/0'/0'`). The system automatically derives receiving addresses (`/0/index`) from your account-level XPUB.
- For example, if your XPUB is derived from `m/84'/0'/0'`, the system will generate addresses at `m/84'/0'/0'/0/index`
- Ensure values are enclosed in quotes, e.g. `BITCOIN_DERIVATION_PATH="m/84'/0'/0'"`

**Advanced users**: See [TECHNICAL.md](TECHNICAL.md) for implementation details, cache management, and troubleshooting.

## 🎨 Frontend Setup

### Add the library

The fastest way to get started is to load the script via CDN using a basic `<script>` tag (shown above in Quick Start). Alternatively, if you're using a bundler like Vite, you can install this library as an ES module using npm:

```bash
npm install bitcoin-serverless-payments
```

Then import the script and styles into your project:

```javascript
import { BitcoinPay } from "bitcoin-serverless-payments";
import "bitcoin-serverless-payments/css";
```

Loading it this way comes with several advantages, including a smaller bundle size and better caching.

Once you've loaded the script, you can use the `BitcoinPay()` function.

### Render the widget

The `BitcoinPay()` function expects 3 parameters:

- `element`: A unique element ID into which it will render the payment widget.
- `endpoint`: The full URL of your backend function - by default it will live at `/.netlify/functions/get-address` on whichever domain you deployed to.
- `fallbackAddress`: The Bitcoin address to use if your backend function is ever unavailable. I'd suggest picking the first unused address from the account associated with your XPUB.

For example:

```html
<script>
  BitcoinPay.render({
    element: "#bitcoin-donate",
    endpoint: "https://your-site.netlify.app/.netlify/functions/get-address",
    fallbackAddress: "bc1q...",
  }).catch((error) => {
    console.error("Failed to render Bitcoin widget:", error);
  });
</script>
```

### Bitcoin + Lightning support

You also have the option of a two-panel layout, supporting both Bitcoin and Lightning payments. You'll need a static [Lightning address](https://lightningaddress.com/) to use this option.

```html
<script>
  BitcoinPay.render({
    element: "#bitcoin-donate",
    endpoint: "https://your-site.netlify.app/.netlify/functions/get-address",
    fallbackAddress: "bc1q...",
    lightning: "yourname@provider.com",
  }).catch((error) => {
    console.error("Failed to render Bitcoin widget:", error);
  });
</script>
```

You can have multiple Bitcoin payment widgets on the same page by using different element IDs and calling `BitcoinPay.render()` multiple times.

### Customization

The widget can be fully customized using CSS custom properties (variables). You can change colors, spacing, typography, and more to match your site's design. **Dark mode is supported automatically** based on the user's system preferences.

```css
.bitcoin-pay-widget {
  --btc-pay-primary: #2563eb;
  --btc-pay-primary-hover: #1d4ed8;
  --btc-pay-border-radius: 4px;
}
```

Refer to [bitcoin-pay.css](/src/bitcoin-pay.css) to see the full list of variables.

**Important**: Whichever route you take, always verify that your XPUB generates expected addresses by comparing the first few addresses with your wallet software. This is critical to ensure you can receive funds.

## 🏗️ How It Works

### Backend (Serverless function)

Your extended public key (or 'XPUB', exported from your Bitcoin wallet) is stored as an environment variable, along with its derivation path. The serverless function derives addresses using [Swan's XPUB tool](https://github.com/swan-bitcoin/xpub-tool), stores them, rotates them, checks for transactions, and removes used addresses from circulation.

- Address pool rotates every 10 minutes automatically
- The mempool.space API is used to check for used addresses, which are replaced with fresh ones from your XPUB
- Pool size stays constant at 5 addresses to prevent index bloat
- Supports BIP44 (P2PKH), BIP49 (P2WPKH-in-P2SH), BIP84 (P2WPKH), and BIP86 (P2TR) address types

### Frontend (`BitcoinPay` function)

The frontend script:

- Fetches a Bitcoin address from your serverless function
- Displays a QR code for easy scanning
- Provides a copy button for the address
- Caches addresses for 10 minutes to reduce API calls
- Falls back to your specified address if the API is unavailable
- Supports both Bitcoin-only and Bitcoin + Lightning layouts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Before submitting, please ensure all tests pass.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Bitcoin community**
