import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import idl from '../idl/metaid_nft.json';

// Replace with your deployed program ID
const PROGRAM_ID = new PublicKey("HqfRUQe2y18NCem7JLRmP1d3nudXzQXDc7uaWLXtrjTV");
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

interface MetaIdData {
  owner: PublicKey;
  metadataUri: string;
  createdAt: number;
  mint: PublicKey;
  bump: number;
}

const MetaIdMinter: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [metadataUri, setMetadataUri] = useState('https://gateway.ipfs.io/ipfs/QmExample123456');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [mintedNft, setMintedNft] = useState<{ mint: string; metaidPda: string; } | null>(null);
  const [existingMetaId, setExistingMetaId] = useState<MetaIdData | null>(null);

  // Helper function to derive MetaID PDA
  const getMetaidPDA = async (wallet: PublicKey): Promise<[PublicKey, number]> => {
    return await PublicKey.findProgramAddressSync(
      [Buffer.from("metaid"), wallet.toBuffer()],
      PROGRAM_ID
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

  // Check if user already has a MetaID
  const checkExistingMetaId = async () => {
    if (!publicKey) return;

    try {
      const provider = new anchor.AnchorProvider(
        connection,
        window.solana,
        { commitment: 'confirmed' }
      );
      const program = new anchor.Program(idl as any, provider);
      
      const [metaidPDA] = await getMetaidPDA(publicKey);
      
      const metaidAccount = await (program.account as any).metaIdData.fetch(metaidPDA);
      setExistingMetaId(metaidAccount as any);
      setStatus({ type: 'info', message: 'You already have a MetaID NFT!' });
    } catch (error) {
      // No MetaID exists yet
      setExistingMetaId(null);
    }
  };

  // Mint MetaID NFT
  const mintMetaId = async () => {
    if (!publicKey) {
      setStatus({ type: 'error', message: 'Please connect your wallet first!' });
      return;
    }

    if (!metadataUri.trim()) {
      setStatus({ type: 'error', message: 'Please enter a valid metadata URI!' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Minting your MetaID NFT...' });

    try {
      const provider = new anchor.AnchorProvider(
        connection,
        window.solana,
        { commitment: 'confirmed' }
      );
      const program = new anchor.Program(idl as any, provider);

      // Generate new mint keypair
      const mintKeypair = Keypair.generate();
      
      // Derive PDAs
      const [metaidPDA] = await getMetaidPDA(publicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );
      const metadata = await getMetadataAddress(mintKeypair.publicKey);
      const masterEdition = await getMasterEditionAddress(mintKeypair.publicKey);

      console.log('Minting with accounts:', {
        payer: publicKey.toBase58(),
        metaidPDA: metaidPDA.toBase58(),
        mint: mintKeypair.publicKey.toBase58(),
      });

      // Build transaction
      const tx = await (program.methods as any)
        .mintMetaid(metadataUri)
        .accounts({
          payer: publicKey,
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
        } as any)
        .signers([mintKeypair])
        .transaction();

      // Send transaction
      const signature = await sendTransaction(tx, connection, {
        signers: [mintKeypair],
      });

      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed');

      setMintedNft({
        mint: mintKeypair.publicKey.toBase58(),
        metaidPda: metaidPDA.toBase58(),
      });

      setStatus({
        type: 'success',
        message: `MetaID NFT minted successfully! Transaction: ${signature.slice(0, 8)}...`,
      });

      // Refresh existing MetaID
      await checkExistingMetaId();
    } catch (error: any) {
      console.error('Minting error:', error);
      
      let errorMessage = 'Failed to mint MetaID NFT. ';
      if (error.message?.includes('already in use')) {
        errorMessage += 'You already have a MetaID NFT!';
      } else if (error.message?.includes('User rejected')) {
        errorMessage += 'Transaction was rejected.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Check for existing MetaID on wallet connection
  useState(() => {
    if (publicKey) {
      checkExistingMetaId();
    }
  });

  if (!publicKey) {
    return (
      <div className="card">
        <h2>🔌 Connect Your Wallet</h2>
        <p style={{ marginTop: '1em' }}>
          Please connect your Solana wallet to mint your unique MetaID NFT.
        </p>
        <div style={{ marginTop: '2em', padding: '1em', background: 'rgba(255,165,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)' }}>
          <p style={{ fontSize: '0.9em' }}>
            ⚠️ <strong>Note:</strong> The smart contract needs to be deployed to Devnet first.
            <br />Follow the DEPLOYMENT_GUIDE.md to build and deploy the program.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ marginBottom: '2em', padding: '1em', background: 'rgba(255,165,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)' }}>
        <p style={{ fontSize: '0.9em', margin: 0 }}>
          ⚠️ <strong>Demo Mode:</strong> The smart contract is not yet deployed to Devnet.
          <br />To enable minting, follow the steps in DEPLOYMENT_GUIDE.md to build and deploy the program.
          <br />Program ID: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>HqfRUQe2y18NCem7JLRmP1d3nudXzQXDc7uaWLXtrjTV</code>
        </p>
      </div>
      
      <h2>🎨 Mint Your MetaID NFT</h2>
      <p style={{ margin: '1em 0', opacity: 0.9 }}>
        Each wallet can mint only one unique MetaID NFT. This NFT represents your digital identity.
      </p>

      {existingMetaId ? (
        <div className="nft-info">
          <h3>✅ Your MetaID NFT</h3>
          <p><strong>Owner:</strong> {existingMetaId.owner.toBase58()}</p>
          <p><strong>Mint:</strong> {existingMetaId.mint.toBase58()}</p>
          <p><strong>Metadata URI:</strong> {existingMetaId.metadataUri}</p>
          <p><strong>Created:</strong> {new Date(existingMetaId.createdAt * 1000).toLocaleString()}</p>
        </div>
      ) : (
        <>
          <div style={{ margin: '2em 0' }}>
            <label style={{ display: 'block', marginBottom: '0.5em', textAlign: 'left', maxWidth: '500px', margin: '0 auto 0.5em' }}>
              <strong>Metadata URI (IPFS or other):</strong>
            </label>
            <input
              type="text"
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="https://gateway.ipfs.io/ipfs/Qm..."
              disabled={loading}
            />
          </div>

          <button
            onClick={mintMetaId}
            disabled={loading || !metadataUri.trim()}
            style={{ fontSize: '1.1em', padding: '0.8em 2em', marginTop: '1em' }}
          >
            {loading ? '⏳ Minting...' : '🚀 Mint MetaID NFT'}
          </button>
        </>
      )}

      {status && (
        <div className={`status ${status.type}`} style={{ marginTop: '2em' }}>
          <p>{status.message}</p>
        </div>
      )}

      {mintedNft && (
        <div className="nft-info" style={{ marginTop: '2em' }}>
          <h3>🎉 NFT Minted Successfully!</h3>
          <p><strong>Mint Address:</strong> {mintedNft.mint}</p>
          <p><strong>MetaID PDA:</strong> {mintedNft.metaidPda}</p>
          <p style={{ marginTop: '1em' }}>
            <a
              href={`https://explorer.solana.com/address/${mintedNft.mint}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#a8edea', textDecoration: 'underline' }}
            >
              View on Solana Explorer →
            </a>
          </p>
        </div>
      )}

      <div style={{ marginTop: '2em', padding: '1em', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '0.5em' }}>ℹ️ About MetaID</h3>
        <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
          MetaID uses Program Derived Addresses (PDAs) with seeds ["metaid", wallet_pubkey] 
          to ensure each wallet can only mint one NFT. The NFT is created using Solana's 
          Metaplex standard with custom metadata stored on-chain and detailed attributes in IPFS.
        </p>
      </div>
    </div>
  );
};

export default MetaIdMinter;
