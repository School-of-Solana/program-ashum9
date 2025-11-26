# MetaID NFT Deployment Guide

Complete step-by-step guide to deploy the MetaID NFT program and frontend.

## Prerequisites

- Solana CLI installed and configured
- Anchor CLI installed (0.30.1 or later)
- Node.js and npm/yarn
- A Solana wallet with SOL for deployment fees

## Part 1: Program Deployment

### Step 1: Build the Program

```bash
cd anchor_project
anchor build
```

### Step 2: Get Program ID

```bash
solana address -k target/deploy/metaid_nft-keypair.json
```

Copy this address - you'll need it for the next steps.

### Step 3: Update Program ID

Update the program ID in three locations:

**File 1: `programs/metaid_nft/src/lib.rs`**
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**File 2: `Anchor.toml`**
```toml
[programs.devnet]
metaid_nft = "YOUR_PROGRAM_ID_HERE"
```

**File 3: `frontend/src/components/MetaIdMinter.tsx`**
```typescript
const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```

### Step 4: Rebuild

```bash
anchor build
```

### Step 5: Configure Solana CLI

```bash
# For Devnet
solana config set --url devnet

# Check your wallet
solana address

# Check balance
solana balance
```

### Step 6: Airdrop SOL (Devnet only)

```bash
# Get 2 SOL for deployment
solana airdrop 2

# Verify
solana balance
```

### Step 7: Deploy

```bash
anchor deploy --provider.cluster devnet
```

### Step 8: Verify Deployment

```bash
solana program show YOUR_PROGRAM_ID
```

## Part 2: Testing

### Run Tests on Localnet

```bash
anchor test
```

### Run Tests on Devnet

```bash
anchor test --provider.cluster devnet
```

Expected output:
- ✅ All 8 tests passing
- Happy path: mint successful, metadata verified, PDA consistent
- Unhappy path: duplicate mint fails, empty URI fails, invalid signer fails

## Part 3: Frontend Deployment

### Step 1: Update IDL

Copy the generated IDL to frontend:

```bash
cp target/idl/metaid_nft.json ../frontend/src/idl/
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and test:
- Connect wallet (use Phantom or Solflare)
- Mint MetaID NFT
- Verify transaction on Solana Explorer

### Step 4: Build for Production

```bash
npm run build
```

### Step 5: Deploy to Vercel

**Option A: Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Vercel Dashboard**

1. Go to vercel.com and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Set build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy"

**Option C: Netlify**

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

Or use Netlify's drag-and-drop interface with the `dist` folder.

## Part 4: Create IPFS Metadata

### Option 1: Using Pinata (Recommended)

1. Sign up at pinata.cloud
2. Upload your profile image
3. Copy the IPFS hash
4. Create metadata JSON (see `metadata-example.json`)
5. Update the image URL with your IPFS hash
6. Upload the JSON file to Pinata
7. Copy the JSON IPFS URL to use when minting

### Option 2: Using NFT.Storage

1. Sign up at nft.storage
2. Upload your files
3. Get IPFS URLs
4. Use in metadata

### Example Metadata Structure

```json
{
  "name": "Your MetaID",
  "symbol": "METAID",
  "description": "Your unique identity",
  "image": "https://gateway.ipfs.io/ipfs/YOUR_IMAGE_HASH",
  "attributes": [
    { "trait_type": "Verification", "value": "Unverified" }
  ]
}
```

## Part 5: Update PROJECT_DESCRIPTION.md

After deployment, update:

```markdown
**Deployed Frontend URL:** https://your-app.vercel.app

**Solana Program ID:** YOUR_DEPLOYED_PROGRAM_ID
```

## Verification Checklist

- [ ] Program builds without errors
- [ ] All tests pass (8/8)
- [ ] Program deployed to Devnet
- [ ] Program ID updated in all files
- [ ] IDL copied to frontend
- [ ] Frontend connects to wallet
- [ ] Can mint MetaID NFT successfully
- [ ] Duplicate mint correctly fails
- [ ] NFT visible in Solana Explorer
- [ ] NFT shows in wallet (Phantom/Solflare)
- [ ] Frontend deployed and accessible
- [ ] PROJECT_DESCRIPTION.md updated

## Common Issues and Solutions

### Issue: "Program ID mismatch"
**Solution:** Ensure program ID is updated in lib.rs, Anchor.toml, and rebuilt

### Issue: "Insufficient funds"
**Solution:** Airdrop more SOL: `solana airdrop 2`

### Issue: "Transaction simulation failed"
**Solution:** Check program logs: `solana logs YOUR_PROGRAM_ID`

### Issue: "Frontend can't find IDL"
**Solution:** Copy IDL: `cp target/idl/metaid_nft.json ../frontend/src/idl/`

### Issue: "Wallet connection fails"
**Solution:** Ensure wallet extension is installed and unlocked

### Issue: "Test validator won't start"
**Solution:** Kill existing validator: `pkill solana-test-validator`

## Cost Estimates

**Devnet (Free):**
- Program deployment: Free (airdropped SOL)
- NFT minting: ~0.01 SOL (airdropped)

**Mainnet:**
- Program deployment: ~2-5 SOL
- NFT minting per user: ~0.01-0.02 SOL
- Rent for MetaID account: ~0.002 SOL (one-time)

## Monitoring

### View Program Logs

```bash
solana logs YOUR_PROGRAM_ID
```

### View Account Data

```bash
solana account YOUR_PDA_ADDRESS
```

### Check Transaction

```bash
solana confirm TRANSACTION_SIGNATURE
```

## Security Notes

- Never commit private keys to git
- Keep `target/deploy/*-keypair.json` secure
- Use different wallets for deployment vs. user testing
- Always test on devnet before mainnet
- Consider using a multisig for upgrade authority

## Support

If you encounter issues:
1. Check the program logs
2. Verify all program IDs are updated
3. Ensure sufficient SOL balance
4. Review Anchor version compatibility
5. Check Solana network status

## Next Steps

After successful deployment:
1. Test thoroughly with different wallets
2. Get community feedback
3. Consider security audit for mainnet
4. Document any additional features
5. Share your deployed dApp!

Good luck! 🚀