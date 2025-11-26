# MetaID NFT - Anchor Program

A Solana program that enables unique digital identity through NFTs. Each wallet can mint exactly one MetaID NFT, enforced at the protocol level using Program Derived Addresses (PDAs).

## 🏗️ Architecture

- **Framework:** Anchor 0.30.1
- **Token Standard:** Metaplex Token Metadata
- **PDA Seeds:** `["metaid", user_wallet_pubkey]`
- **Network:** Devnet (ready for mainnet)

## 📦 Installation

```bash
# Install dependencies
npm install

# Build the program
anchor build

# Get the program ID
solana address -k target/deploy/metaid_nft-keypair.json

# Update program ID in lib.rs and Anchor.toml
# Then rebuild
anchor build
```

## 🧪 Testing

```bash
# Run all tests
anchor test

# Run with verbose output
anchor test -- --nocapture

# Run on devnet
anchor test --provider.cluster devnet
```

## 🚀 Deployment

### Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Check your balance
solana balance

# Airdrop if needed
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID>
```

### Deploy to Mainnet

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Ensure sufficient SOL for deployment (~3-5 SOL)
solana balance

# Deploy
anchor deploy --provider.cluster mainnet

# Verify
solana program show <PROGRAM_ID>
```

## 📋 Program Instructions

### mint_metaid

Mints a unique MetaID NFT for the calling wallet.

**Parameters:**
- `metadata_uri: String` - URI to off-chain metadata (IPFS recommended)

**Constraints:**
- One mint per wallet (enforced by PDA)
- URI must not be empty
- URI max length: 200 characters

**Example:**
```typescript
await program.methods
  .mintMetaid("https://gateway.ipfs.io/ipfs/Qm...")
  .accounts({
    payer: wallet.publicKey,
    metaidAccount: metaidPDA,
    mint: mintKeypair.publicKey,
    // ... other accounts
  })
  .signers([mintKeypair])
  .rpc();
```

## 🔐 PDA Structure

```
MetaID PDA = derive(
  seeds: ["metaid", user_wallet],
  program_id: metaid_nft
)
```

This ensures:
- ✅ One MetaID per wallet
- ✅ Deterministic address
- ✅ No duplicate minting
- ✅ Easy discoverability

## 📊 Account Structure

```rust
pub struct MetaIdData {
    pub owner: Pubkey,        // 32 bytes
    pub metadata_uri: String, // 4 + 200 bytes
    pub created_at: i64,      // 8 bytes
    pub mint: Pubkey,         // 32 bytes
    pub bump: u8,             // 1 byte
}
// Total: 285 bytes (including discriminator)
```

## 🎨 Frontend Integration

Update the program ID in the frontend:

```typescript
// frontend/src/components/MetaIdMinter.tsx
const PROGRAM_ID = new PublicKey("YOUR_DEPLOYED_PROGRAM_ID");
```

Copy the IDL:

```bash
cp target/idl/metaid_nft.json ../frontend/src/idl/
```

## 🧰 Useful Commands

```bash
# Build only
anchor build

# Clean build artifacts
anchor clean

# Upgrade program (requires upgrade authority)
anchor upgrade --program-id <PROGRAM_ID> target/deploy/metaid_nft.so

# View program logs
solana logs <PROGRAM_ID>

# Get account info
solana account <PDA_ADDRESS>
```

## 🐛 Troubleshooting

**Build Errors:**
- Ensure Rust and Anchor CLI are up to date
- Run `cargo clean` then `anchor build`

**Test Failures:**
- Check Solana test validator is not already running
- Ensure sufficient airdrop in tests
- Verify anchor.toml wallet path is correct

**Deployment Errors:**
- Verify sufficient SOL balance
- Check program size limits
- Ensure correct RPC endpoint

## 📝 License

MIT