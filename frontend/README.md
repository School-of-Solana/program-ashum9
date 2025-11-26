# MetaID NFT Frontend

A React-based frontend for minting unique MetaID NFTs on Solana.

## Features

- 🔐 Wallet connection (Phantom, Solflare)
- 🎨 Mint unique MetaID NFT (one per wallet)
- 📊 View existing MetaID information
- 🔗 Integration with Solana Devnet
- ✨ Beautiful gradient UI

## Setup

```bash
npm install
npm run dev
```

## Building for Production

```bash
npm run build
npm run preview
```

## Deployment

Deploy to Vercel, Netlify, or any static hosting service:

1. Run `npm run build`
2. Upload the `dist` folder
3. Configure environment variables if needed

## Environment

- Network: Devnet
- RPC: Solana public RPC endpoints
- Program ID: Update in `src/components/MetaIdMinter.tsx`