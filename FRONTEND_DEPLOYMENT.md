# Frontend Deployment Instructions

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
```bash
cd /Users/ashum9/ackee/program-ashum9
git add .
git commit -m "Add program deployment and frontend configuration"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `School-of-Solana/program-ashum9`
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

Vercel will automatically build and deploy your frontend. You'll get a URL like:
`https://metaid-nft-<random>.vercel.app`

## Option 2: Deploy to Netlify

### Via Netlify Web Interface
1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click "Deploy site"

## Option 3: Deploy to GitHub Pages

### Step 1: Update vite.config.ts
Add base path:
```typescript
export default defineConfig({
  base: '/program-ashum9/',
  // ... rest of config
});
```

### Step 2: Build and Deploy
```bash
cd frontend
npm run build
cd dist
git init
git add -A
git commit -m 'Deploy'
git push -f git@github.com:School-of-Solana/program-ashum9.git main:gh-pages
```

Then enable GitHub Pages in repository settings pointing to gh-pages branch.

## After Deployment

Once deployed, update `PROJECT_DESCRIPTION.md` with your frontend URL:
```markdown
**Deployed Frontend URL:** https://your-frontend-url.vercel.app
```

## Testing the Deployed Frontend

1. Visit your deployed URL
2. Connect your Solana wallet (make sure it's on Devnet)
3. Request devnet SOL from faucet if needed: https://faucet.solana.com
4. Try minting a MetaID NFT
5. Verify the NFT appears in your wallet

## Troubleshooting

- **Build Fails**: The Trezor wallet adapter may cause build issues. You can remove it from dependencies if not needed.
- **Program Not Found**: Verify your Program ID is correct in `frontend/src/components/MetaIdMinter.tsx`
- **Wallet Not Connecting**: Make sure you're on Devnet in your wallet settings
