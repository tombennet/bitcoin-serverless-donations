# Bitcoin Serverless Payments

A simple, self-custodial solution for accepting private, on-chain Bitcoin payments using XPUBs and serverless functions. This project enables indie developers to accept Bitcoin donations with minimal overhead and a good level of privacy.

## 🚀 Quick Start

**For a complete step-by-step tutorial, visit: [https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/](https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/)**

## ✨ Features

- **Serverless**: Deploy on Netlify with zero server maintenance. Easily adaptable to other hosting providers.
- **Private**: No third-party payment processors, middlemen, or KYC requirements.
- **Simple**: Minimal codebase, easy to integrate into your existing project.
- **Sovereign**: Receive payments directly to your own wallet.
- **Cost-effective**: Free hosting on Netlify (or Vercel, Cloudflare, etc) with minimal operational costs

## 🏗️ How It Works

1. **Address Generation**: Export addresses from Sparrow Wallet as CSV
2. **Processing**: Convert CSV to JSON using the included utility script
3. **Distribution**: Serverless function randomly serves addresses based on hashed client fingerprint
4. **Display**: Frontend renders QR code and copy button for easy payment, and stores Bitcoin address for 24 hours

## 📦 Installation

```bash
git clone https://github.com/tombennet/bitcoin-serverless-payments.git
cd bitcoin-serverless-payments
npm install
```

## 🔧 Setup

1. **Export addresses from Sparrow Wallet** as CSV
2. **Process the export**:
   ```bash
   npm run process-sparrow -- "path/to/your/sparrow-export.csv"
   ```
3. **Test and deploy**:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
├── functions/
│   └── get-address/
│       ├── index.mts              # Serverless function
│       └── addresses.js           # Generated address list
├── utils/
│   ├── process-sparrow-export.js  # Sparrow CSV to JSON converter
│   └── SAMPLE.csv                 # Sample export
├── dist/
│   ├── index.html                 # Minimal frontend inc script
│   └── bitcoin.svg                # Bitcoin logo for QR code
└── netlify.toml                   # Deployment configuration
```

## 🔒 Privacy & Security

### Keep your address pool private

Public addresses are distributed at random, but based on a semi-stable client fingerprint (a hash of IP, city, and date).

Remember, you should _never_ include your extended public key (XPUB) in your frontend code.

### Local caching and fallbacks

Addresses served from the endpoint are cached in browser `localStorage` for 24 hours. If the server is unavailable, we ensure graceful degradation by serving a fallback address.

### Balance monitoring and used addresses

In version 1.0 of this setup, it's necessary to manually mark used addresses in `addresses.js` to remove them from circulation. More detail on this process is available in my [accompanying tutorial](https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/). In a future release, I intend to add options for automated balance checking and a persistent storage layer.

## 📚 Learn More

For a complete tutorial covering:

- Setting up Sparrow Wallet
- Generating and exporting addresses
- Customizing the experience
- Security considerations

**Visit: [https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/](https://bennet.org/blog/private-serverless-bitcoin-payments-for-indie-devs/)**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Bitcoin community**
