import { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import MetaIdMinter from './components/MetaIdMinter';

// Default styles for wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

const App: FC = () => {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet;
  
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ padding: '20px', minHeight: '100vh' }}>
            <header style={{ marginBottom: '40px' }}>
              <h1>🪪 MetaID NFT</h1>
              <p style={{ fontSize: '1.2em', marginBottom: '20px', opacity: 0.9 }}>
                Your Unique Digital Identity on Solana
              </p>
              <WalletMultiButton />
            </header>
            
            <main>
              <MetaIdMinter />
            </main>

            <footer style={{ marginTop: '60px', opacity: 0.7, fontSize: '0.9em' }}>
              <p>Built with ❤️ using Anchor & Metaplex</p>
              <p style={{ marginTop: '10px' }}>
                Network: <strong>{network}</strong>
              </p>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
