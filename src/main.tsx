import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { 
  WalletProvider, 
  RazorWallet,
  Chain,
  MovementMainnetChain,
  MovementBardockTestnetChain,
  DefaultChains
} from '@razorlabs/razorkit';
import '@razorlabs/razorkit/style.css';
import '@mosaicag/swap-widget/style.css';
import { AlertProvider } from './components/alert/AlertContext';

// Define supported chains/networks
const SupportedChains: Chain[] = [
  ...DefaultChains,
  MovementMainnetChain,
  MovementBardockTestnetChain,
  // NOTE: you can add custom chain (network),
  // but make sure the connected wallet does support it
  // customChain,
];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlertProvider>
      <WalletProvider 
        defaultWallets={[RazorWallet]} 
        autoConnect={true}  // Enable auto-reconnection
        chains={SupportedChains}
      >
        <App />
      </WalletProvider>
    </AlertProvider>
  </StrictMode>
);