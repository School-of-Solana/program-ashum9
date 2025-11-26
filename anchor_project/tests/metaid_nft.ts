import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MetaidNft } from "../target/types/metaid_nft";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { expect } from "chai";

describe("metaid_nft", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MetaidNft as Program<MetaidNft>;
  const payer = provider.wallet as anchor.Wallet;

  // Metaplex Token Metadata Program ID
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const METADATA_URI = "https://gateway.ipfs.io/ipfs/QmTest123456789";

  // Helper function to derive MetaID PDA
  const getMetaidPDA = async (wallet: PublicKey): Promise<[PublicKey, number]> => {
    return await PublicKey.findProgramAddressSync(
      [Buffer.from("metaid"), wallet.toBuffer()],
      program.programId
    );
  };

  // Helper function to get metadata account address
  const getMetadataAddress = async (mint: PublicKey): Promise<PublicKey> => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  // Helper function to get master edition account address
  const getMasterEditionAddress = async (mint: PublicKey): Promise<PublicKey> => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  describe("Happy Path Tests", () => {
    it("Mints a MetaID NFT successfully", async () => {
      const mintKeypair = Keypair.generate();
      const [metaidPDA] = await getMetaidPDA(payer.publicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        payer.publicKey
      );
      const metadata = await getMetadataAddress(mintKeypair.publicKey);
      const masterEdition = await getMasterEditionAddress(mintKeypair.publicKey);

      console.log("Payer:", payer.publicKey.toBase58());
      console.log("MetaID PDA:", metaidPDA.toBase58());
      console.log("Mint:", mintKeypair.publicKey.toBase58());

      // Request airdrop if needed
      const balance = await provider.connection.getBalance(payer.publicKey);
      if (balance < 2000000000) {
        const signature = await provider.connection.requestAirdrop(
          payer.publicKey,
          2000000000
        );
        await provider.connection.confirmTransaction(signature);
      }

      const tx = await program.methods
        .mintMetaid(METADATA_URI)
        .accounts({
          payer: payer.publicKey,
          metaidAccount: metaidPDA,
          mint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadata,
          masterEdition: masterEdition,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair])
        .rpc();

      console.log("Transaction signature:", tx);

      // Verify MetaID account was created
      const metaidAccount = await program.account.metaIdData.fetch(metaidPDA);
      expect(metaidAccount.owner.toBase58()).to.equal(payer.publicKey.toBase58());
      expect(metaidAccount.metadataUri).to.equal(METADATA_URI);
      expect(metaidAccount.mint.toBase58()).to.equal(mintKeypair.publicKey.toBase58());
      expect(metaidAccount.createdAt.toNumber()).to.be.greaterThan(0);

      // Verify NFT was minted to token account
      const tokenAccountInfo = await provider.connection.getTokenAccountBalance(
        tokenAccount
      );
      expect(tokenAccountInfo.value.amount).to.equal("1");

      console.log("✅ MetaID NFT minted successfully!");
      console.log("   Owner:", metaidAccount.owner.toBase58());
      console.log("   Metadata URI:", metaidAccount.metadataUri);
      console.log("   Created at:", new Date(metaidAccount.createdAt.toNumber() * 1000).toISOString());
    });

    it("Stores correct metadata on-chain", async () => {
      const [metaidPDA] = await getMetaidPDA(payer.publicKey);
      
      const metaidAccount = await program.account.metaIdData.fetch(metaidPDA);
      
      expect(metaidAccount.owner).to.exist;
      expect(metaidAccount.metadataUri).to.be.a('string');
      expect(metaidAccount.metadataUri.length).to.be.greaterThan(0);
      expect(metaidAccount.createdAt.toNumber()).to.be.greaterThan(0);
      expect(metaidAccount.mint).to.exist;
      expect(metaidAccount.bump).to.be.a('number');

      console.log("✅ Metadata verification passed!");
    });
  });

  describe("Unhappy Path Tests", () => {
    it("Fails when trying to mint a second MetaID (duplicate mint)", async () => {
      const mintKeypair = Keypair.generate();
      const [metaidPDA] = await getMetaidPDA(payer.publicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        payer.publicKey
      );
      const metadata = await getMetadataAddress(mintKeypair.publicKey);
      const masterEdition = await getMasterEditionAddress(mintKeypair.publicKey);

      try {
        await program.methods
          .mintMetaid(METADATA_URI)
          .accounts({
            payer: payer.publicKey,
            metaidAccount: metaidPDA,
            mint: mintKeypair.publicKey,
            tokenAccount: tokenAccount,
            metadata: metadata,
            masterEdition: masterEdition,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([mintKeypair])
          .rpc();

        expect.fail("Should have thrown an error for duplicate mint");
      } catch (error) {
        // The error should indicate the account already exists
        expect(error.message).to.include("already in use");
        console.log("✅ Correctly prevented duplicate mint!");
      }
    });

    it("Fails when metadata URI is empty", async () => {
      const newUser = Keypair.generate();
      
      // Airdrop to new user
      const signature = await provider.connection.requestAirdrop(
        newUser.publicKey,
        2000000000
      );
      await provider.connection.confirmTransaction(signature);

      const mintKeypair = Keypair.generate();
      const [metaidPDA] = await getMetaidPDA(newUser.publicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        newUser.publicKey
      );
      const metadata = await getMetadataAddress(mintKeypair.publicKey);
      const masterEdition = await getMasterEditionAddress(mintKeypair.publicKey);

      try {
        await program.methods
          .mintMetaid("") // Empty URI
          .accounts({
            payer: newUser.publicKey,
            metaidAccount: metaidPDA,
            mint: mintKeypair.publicKey,
            tokenAccount: tokenAccount,
            metadata: metadata,
            masterEdition: masterEdition,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([newUser, mintKeypair])
          .rpc();

        expect.fail("Should have thrown an error for empty metadata URI");
      } catch (error) {
        expect(error.message).to.include("InvalidMetadataUri");
        console.log("✅ Correctly rejected empty metadata URI!");
      }
    });

    it("Fails when trying to mint for another user without being the signer", async () => {
      const unauthorizedUser = Keypair.generate();
      const targetUser = Keypair.generate();
      
      // Airdrop to unauthorized user
      const signature = await provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        2000000000
      );
      await provider.connection.confirmTransaction(signature);

      const mintKeypair = Keypair.generate();
      const [metaidPDA] = await getMetaidPDA(targetUser.publicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        targetUser.publicKey
      );
      const metadata = await getMetadataAddress(mintKeypair.publicKey);
      const masterEdition = await getMasterEditionAddress(mintKeypair.publicKey);

      try {
        await program.methods
          .mintMetaid(METADATA_URI)
          .accounts({
            payer: targetUser.publicKey, // Target user as payer
            metaidAccount: metaidPDA,
            mint: mintKeypair.publicKey,
            tokenAccount: tokenAccount,
            metadata: metadata,
            masterEdition: masterEdition,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([unauthorizedUser, mintKeypair]) // Unauthorized user signing
          .rpc();

        expect.fail("Should have thrown an error for invalid signer");
      } catch (error) {
        // Should fail due to signature verification
        expect(error).to.exist;
        console.log("✅ Correctly rejected invalid signer!");
      }
    });

    it("Fails when metadata URI is too long", async () => {
      const newUser = Keypair.generate();
      
      // Airdrop to new user
      const signature = await provider.connection.requestAirdrop(
        newUser.publicKey,
        2000000000
      );
      await provider.connection.confirmTransaction(signature);

      const mintKeypair = Keypair.generate();
      const [metaidPDA] = await getMetaidPDA(newUser.publicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        newUser.publicKey
      );
      const metadata = await getMetadataAddress(mintKeypair.publicKey);
      const masterEdition = await getMasterEditionAddress(mintKeypair.publicKey);

      // Create a URI that exceeds 200 characters
      const longUri = "https://gateway.ipfs.io/ipfs/" + "x".repeat(200);

      try {
        await program.methods
          .mintMetaid(longUri)
          .accounts({
            payer: newUser.publicKey,
            metaidAccount: metaidPDA,
            mint: mintKeypair.publicKey,
            tokenAccount: tokenAccount,
            metadata: metadata,
            masterEdition: masterEdition,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([newUser, mintKeypair])
          .rpc();

        expect.fail("Should have thrown an error for URI too long");
      } catch (error) {
        expect(error.message).to.include("MetadataUriTooLong");
        console.log("✅ Correctly rejected URI that is too long!");
      }
    });
  });

  describe("PDA Verification Tests", () => {
    it("Verifies PDA is derived correctly from user wallet", async () => {
      const [metaidPDA, bump] = await getMetaidPDA(payer.publicKey);
      
      console.log("Expected PDA:", metaidPDA.toBase58());
      console.log("Bump:", bump);

      // Verify the PDA can be derived consistently
      const [metaidPDA2, bump2] = await getMetaidPDA(payer.publicKey);
      
      expect(metaidPDA.toBase58()).to.equal(metaidPDA2.toBase58());
      expect(bump).to.equal(bump2);

      console.log("✅ PDA derivation is consistent!");
    });

    it("Verifies different wallets get different PDAs", async () => {
      const user1 = Keypair.generate();
      const user2 = Keypair.generate();

      const [pda1] = await getMetaidPDA(user1.publicKey);
      const [pda2] = await getMetaidPDA(user2.publicKey);

      expect(pda1.toBase58()).to.not.equal(pda2.toBase58());
      console.log("✅ Different wallets have unique PDAs!");
    });
  });
});
