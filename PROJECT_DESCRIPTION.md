# Project Description

**Deployed Frontend URL:** https://metaid-mz0fh774u-ashutosh-mishras-projects-e63a074b.vercel.app

**Deployed Frontend URL 2 (building):** https://synelar.vercel.app

**Solana Program ID:** `HqfRUQe2y18NCem7JLRmP1d3nudXzQXDc7uaWLXtrjTV` (✅ Deployed on Devnet)

**Solana Explorer:** https://explorer.solana.com/address/HqfRUQe2y18NCem7JLRmP1d3nudXzQXDc7uaWLXtrjTV?cluster=devnet

## Project Overview

### Description
MetaID or Synelar NFT or Synelar is a unique digital identity system built on Solana that allows each wallet to mint exactly one unique NFT representing their identity on the blockchain. This dApp implements a robust identity verification system using Program Derived Addresses (PDAs) to enforce the one-NFT-per-wallet constraint, ensuring that each user's MetaID or Synelar is truly unique and cannot be duplicated.

The system leverages Solana's Metaplex Token Metadata standard to create fully compliant NFTs with customizable metadata stored both on-chain (minimal data for efficiency) and off-chain (detailed profile information via IPFS). This architecture provides a perfect balance between decentralization, data availability, and cost efficiency.

### Key Features

- **One NFT Per Wallet:** Enforced at the program level using PDA seeds, making it impossible for any wallet to mint multiple MetaID or Synelar NFTs
- **Metaplex Standard Compliance:** Full integration with Solana's token metadata program for industry-standard NFT creation
- **On-Chain Identity Storage:** Minimal but essential identity data stored directly on Solana (owner, creation timestamp, metadata URI)
- **Off-Chain Metadata Support:** Link to IPFS or other decentralized storage for rich profile data, images, and attributes
- **Master Edition NFT:** Each MetaID or Synelar is a true NFT with supply of 1, making it non-fungible and unique
- **Immutable Creation Records:** Timestamp of creation permanently stored on-chain
- **User-Friendly Frontend:** Beautiful React interface with wallet adapter integration for seamless minting
- **Real-time Status:** Check if a wallet already has a MetaID or Synelar before attempting to mint
  
### How to Use the dApp

1. **Connect Wallet**
   - Click the "Select Wallet" button in the top navigation
   - Choose your preferred Solana wallet (Phantom, Solflare, etc.)
   - Approve the connection request in your wallet

2. **Check Existing MetaID or Synelar**
   - Upon wallet connection, the dApp automatically checks if you already have a MetaID or Synelar NFT
   - If found, your existing MetaID or Synelar information will be displayed (owner, mint address, metadata URI, creation date)

3. **Mint Your MetaID or Synelar NFT** (if you don't have one)
   - Enter your metadata URI (IPFS link to your profile JSON)
   - Click "Mint MetaID or Synelar NFT" button
   - Approve the transaction in your wallet (requires SOL for transaction fees)
   - Wait for confirmation (typically 5-10 seconds on Devnet)

4. **View Your NFT**
   - After successful minting, view your NFT details on the page
   - Click the Solana Explorer link to see your NFT on-chain
   - Your NFT will appear in your wallet's collectibles section

## Program Architecture

The MetaID or Synelar NFT program is built using the Anchor framework and integrates with Metaplex's Token Metadata program for standardized NFT creation.

### PDA Usage

Program Derived Addresses (PDAs) are at the core of this program's security model. PDAs allow the program to deterministically generate addresses that are controlled by the program itself, not by any private key.

**PDAs Used:**

- **MetaID or Synelar Account PDA:**
  - **Seeds:** `["MetaID or Synelar", user_wallet_pubkey]`
  - **Purpose:** Stores the minimal identity metadata for each user
  - **Why:** Using the user's wallet public key as a seed ensures that each wallet has exactly one unique PDA. When a user attempts to mint, the program derives this PDA and tries to initialize it. If it already exists, the transaction fails, preventing duplicate mints.
  - **Security:** This approach makes it cryptographically impossible to mint multiple MetaID or Synelars for the same wallet, as the PDA address is deterministic and can only be initialized once.

The PDA derivation ensures:
1. **Uniqueness:** One MetaID or Synelar per wallet (address collision is impossible)
2. **Discoverability:** Anyone can derive a wallet's MetaID or Synelar PDA to check if it exists
3. **No Private Keys:** The program controls the PDA, not the user, preventing unauthorized modifications
4. **Efficiency:** No need to maintain a separate registry or lookup table

### Program Instructions

**Instructions Implemented:**

- **mint_MetaID or Synelar(ctx: Context<MintMetaID or Synelar>, metadata_uri: String)**
  - **Description:** Mints a unique MetaID or Synelar NFT for the calling wallet
  - **Parameters:**
    - `metadata_uri`: String URL pointing to off-chain JSON metadata (IPFS or other)
  - **Process:**
    1. Validates metadata URI (not empty, max 200 characters)
    2. Derives MetaID or Synelar PDA from caller's wallet (fails if already exists)
    3. Initializes MetaID or Synelar account with owner, URI, timestamp, and mint address
    4. Creates a new SPL token mint with 0 decimals (NFT standard)
    5. Mints exactly 1 token to the user's associated token account
    6. Creates Metaplex metadata account with name, symbol, and URI
    7. Creates Master Edition account (makes it a true NFT with max supply of 0)
  - **Accounts Required:**
    - `payer`: User's wallet (signer, pays for transaction)
    - `MetaID or Synelar_account`: PDA to store identity data (initialized)
    - `mint`: New mint account for the NFT (signer)
    - `token_account`: User's associated token account (receives NFT)
    - `metadata`: Metaplex metadata account
    - `master_edition`: Metaplex master edition account
    - Various program and sysvar accounts
  - **Error Cases:**
    - PDA already exists (user has MetaID or Synelar)
    - Invalid metadata URI (empty or too long)
    - Insufficient funds for rent/fees
    - Invalid signer

### Account Structure

```rust
/// Stores minimal identity metadata on-chain
#[account]
pub struct MetaID or SynelarData {
    /// Owner's wallet pubkey (32 bytes)
    /// The wallet address that owns this MetaID or Synelar
    pub owner: Pubkey,
    
    /// URI to off-chain metadata - IPFS or other (4 + 200 bytes)
    /// Links to a JSON file with detailed profile information
    pub metadata_uri: String,
    
    /// Timestamp when MetaID or Synelar was created (8 bytes)
    /// Unix timestamp for immutable creation record
    pub created_at: i64,
    
    /// NFT mint address (32 bytes)
    /// The SPL token mint for this MetaID or Synelar NFT
    pub mint: Pubkey,
    
    /// PDA bump seed (1 byte)
    /// Used for PDA signature verification
    pub bump: u8,
}

// Total account size: 8 (discriminator) + 32 + 204 + 8 + 32 + 1 = 285 bytes
```

**Account Design Rationale:**
- **owner**: Essential for identifying MetaID or Synelar ownership
- **metadata_uri**: Allows linking to rich off-chain data without bloating on-chain storage
- **created_at**: Immutable timestamp proves when identity was established
- **mint**: Links the PDA to the actual NFT mint for verification
- **bump**: Required for PDA signature operations

### Off-Chain Metadata Format

The `metadata_uri` should point to a JSON file following this structure:

```json
{
  "name": "Synelar MetaID or Synelar",
  "symbol": "MetaID or Synelar",
  "description": "Your unique digital identity on Solana",
  "image": "https://gateway.ipfs.io/ipfs/QmX...profile.jpg",
  "attributes": [
    { "trait_type": "Verification", "value": "Unverified" },
    { "trait_type": "XP Score", "value": "0" },
    { "trait_type": "Created", "value": "2025-11-25" }
  ],
  "external_url": "https://synelar.xyz/u/wallet123",
  "properties": {
    "files": [
      {
        "uri": "https://gateway.ipfs.io/ipfs/QmX...profile.jpg",
        "type": "image/png"
      }
    ],
    "category": "image",
    "creators": [{ "address": "<program_id>", "share": 100 }]
  }
}
```

## Testing

### Test Coverage

Our test suite comprehensively covers all critical functionality and edge cases to ensure the program behaves correctly under all circumstances.

**Happy Path Tests:**

- **Test 1: Successful MetaID or Synelar Minting**
  - Creates a new wallet, airdrops SOL
  - Mints MetaID or Synelar NFT with valid metadata URI
  - Verifies PDA account was created with correct data
  - Confirms NFT was minted to user's token account (balance = 1)
  - Validates all stored fields (owner, URI, timestamp, mint)

- **Test 2: Metadata Verification**
  - Fetches an existing MetaID or Synelar account
  - Validates all fields exist and are properly typed
  - Confirms metadata URI is stored correctly
  - Checks timestamp is reasonable (> 0)

- **Test 3: PDA Derivation Consistency**
  - Derives the same wallet's PDA multiple times
  - Confirms the PDA address is always identical
  - Validates bump seed consistency

**Unhappy Path Tests:**

- **Test 1: Duplicate Mint Prevention**
  - Attempts to mint a second MetaID or Synelar for the same wallet
  - Expects transaction to fail with "already in use" error
  - Confirms the PDA constraint is enforced properly

- **Test 2: Empty Metadata URI Rejection**
  - Attempts to mint with an empty string as URI
  - Expects custom error: `InvalidMetadataUri`
  - Validates input validation is working

- **Test 3: Invalid Signer Detection**
  - User A attempts to mint MetaID or Synelar for User B's wallet
  - Signs transaction with User A but uses User B's PDA
  - Expects signature verification failure
  - Confirms authorization checks are working

- **Test 4: Metadata URI Length Validation**
  - Attempts to mint with URI longer than 200 characters
  - Expects custom error: `MetadataUriTooLong`
  - Validates size constraints are enforced

- **Test 5: Different Wallets Get Unique PDAs**
  - Generates multiple wallet keypairs
  - Derives PDA for each wallet
  - Confirms all PDAs are unique
  - Validates PDA seed design

### Running Tests

```bash
# Install dependencies
cd anchor_project
npm install

# Build the program
anchor build

# Run all tests
anchor test

# Run tests with detailed output
anchor test -- --nocapture
```

**Test Environment:**
- Network: Localnet (Anchor automatically starts a local validator)
- Airdrops: Automated for test wallets
- Confirmation: Tests wait for transaction confirmations

### Additional Notes for Evaluators

**Implementation Highlights:**

1. **Security First:** The PDA design makes duplicate minting mathematically impossible
2. **Standards Compliance:** Full Metaplex integration ensures compatibility with all Solana NFT tooling
3. **Gas Optimization:** Minimal on-chain storage (285 bytes) keeps rent costs low
4. **Error Handling:** Clear, specific error messages for all failure cases
5. **Frontend Integration:** Complete React dApp with wallet adapter and real-time status

**Future Enhancements (Beyond v1):**
- Verification system (verified checkmark for confirmed identities)
- XP/reputation scoring system
- Social graph integration (follow/followers)
- Profile updates (with versioning)
- Identity delegation/recovery mechanisms

**Known Limitations:**
- Metadata URI is immutable after minting (by design, for identity integrity)
- No built-in transfer restrictions (NFT can be transferred like any token)
- Relies on off-chain metadata storage (IPFS or centralized)

**Deployment Instructions:**
1. Update program ID in `lib.rs`, `Anchor.toml`, and frontend
2. Build program: `anchor build`
3. Deploy to Devnet: `anchor deploy --provider.cluster devnet`
4. Update frontend IDL with generated file from `target/idl/`
5. Deploy frontend to Vercel/Netlify
6. Test thoroughly on Devnet before considering mainnet

This project demonstrates a production-ready implementation of identity management on Solana, leveraging PDAs for security, Metaplex for standards compliance, and React for user experience.