# 🚀 MetaID NFT - Quick Reference

## 📋 Quick Commands

### Build & Test
```bash
cd anchor_project
anchor build          # Build program
anchor test          # Run all tests
anchor test -- --nocapture  # Verbose tests
```

### Deploy
```bash
# Get program ID
solana address -k target/deploy/metaid_nft-keypair.json

# Deploy to devnet
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet

# Verify
solana program show <PROGRAM_ID>
```

### Frontend
```bash
cd frontend
npm install
cp ../anchor_project/target/idl/metaid_nft.json src/idl/
npm run dev          # Development
npm run build        # Production build
```

---

## 🔑 Key Files to Update After Building

1. **programs/metaid_nft/src/lib.rs** - Line 14
   ```rust
   declare_id!("YOUR_PROGRAM_ID");
   ```

2. **Anchor.toml** - Lines 7-8
   ```toml
   [programs.devnet]
   metaid_nft = "YOUR_PROGRAM_ID"
   ```

3. **frontend/src/components/MetaIdMinter.tsx** - Line 24
   ```typescript
   const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID");
   ```

---

## 📐 PDA Derivation (TypeScript)

```typescript
const [metaidPDA, bump] = await PublicKey.findProgramAddressSync(
  [Buffer.from("metaid"), userWallet.toBuffer()],
  programId
);
```

---

## 📊 Account Sizes

| Account | Size | Rent (SOL) |
|---------|------|------------|
| MetaID PDA | 285 bytes | ~0.002 |
| NFT Mint | 82 bytes | ~0.0014 |
| Token Account | 165 bytes | ~0.0022 |
| Metadata | ~679 bytes | ~0.0056 |
| Master Edition | ~282 bytes | ~0.0039 |

**Total per mint:** ~0.015 SOL

---

## 🧪 Test Checklist

- [ ] ✅ Happy: Successful mint
- [ ] ✅ Happy: Metadata verified
- [ ] ✅ Happy: PDA consistent
- [ ] ❌ Unhappy: Duplicate mint fails
- [ ] ❌ Unhappy: Empty URI fails
- [ ] ❌ Unhappy: Long URI fails
- [ ] ❌ Unhappy: Invalid signer fails
- [ ] ✅ PDA: Different wallets, different PDAs

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | `cargo clean && anchor build` |
| Tests fail | Kill validator: `pkill solana-test-validator` |
| Program ID mismatch | Update in lib.rs, rebuild |
| Deploy fails | Check balance: `solana balance` |
| Frontend errors | Copy IDL: `cp target/idl/*.json ../frontend/src/idl/` |
| Wallet won't connect | Ensure extension installed |

---

## 📱 Frontend Features

```typescript
// Check if user has MetaID
const [metaidPDA] = await getMetaidPDA(wallet.publicKey);
const metaid = await program.account.metaIdData.fetch(metaidPDA);

// Mint MetaID
await program.methods
  .mintMetaid(metadataUri)
  .accounts({ /* ... */ })
  .rpc();
```

---

## 🌐 Useful Links

- Solana Explorer: `https://explorer.solana.com/address/<ADDRESS>?cluster=devnet`
- Metaplex Docs: `https://docs.metaplex.com`
- Anchor Docs: `https://www.anchor-lang.com/docs`
- Solana Cookbook: `https://solanacookbook.com`

---

## 📊 Error Codes

| Code | Name | Message |
|------|------|---------|
| 6000 | InvalidMetadataUri | Metadata URI cannot be empty |
| 6001 | MetadataUriTooLong | Metadata URI is too long (max 200) |

---

## 🎯 Deployment Checklist

- [ ] Program built successfully
- [ ] All 8 tests passing
- [ ] Program ID updated in 3 files
- [ ] Program deployed to devnet
- [ ] Program verified on explorer
- [ ] IDL copied to frontend
- [ ] Frontend runs locally
- [ ] Mint works on devnet
- [ ] Duplicate mint correctly fails
- [ ] NFT visible in wallet
- [ ] Frontend deployed
- [ ] PROJECT_DESCRIPTION.md updated
- [ ] README.md has correct links

---

## 💡 Quick Tips

1. **Always rebuild after changing program ID**
2. **Test on devnet before mainnet**
3. **Keep keypair files secure**
4. **Use descriptive metadata URIs**
5. **Monitor transaction logs for debugging**
6. **Cache IDL for faster frontend loading**

---

## 📞 Emergency Commands

```bash
# Stop all Solana processes
pkill solana

# Reset test validator
rm -rf test-ledger

# Clean everything
anchor clean && cargo clean

# Fresh start
anchor build && anchor test
```

---

## 🎓 Learning Resources

- **Anchor Book:** https://book.anchor-lang.com
- **Solana Docs:** https://docs.solana.com
- **Metaplex Docs:** https://docs.metaplex.com
- **School of Solana:** https://github.com/Ackee-Blockchain/school-of-solana

---

*Keep this file handy for quick reference during development!*
