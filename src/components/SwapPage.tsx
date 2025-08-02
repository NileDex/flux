import React from 'react';
import { useAccount } from '@razorlabs/razorkit';
import SwapComponent from './AccountSidebar/SwapComponent';
import NoWalletMessage from './NoWalletMessage';

const SwapPage: React.FC = () => {
  const { address } = useAccount();

  if (!address) {
    return <NoWalletMessage/>;
  }

  return (
    <div className="swap-page">
      <div className="swap-page-container">
        <SwapComponent isEmbedded={true} showHeader={false} />
      </div>

      <style>{`
        .swap-page {
          min-height: 100vh;
          background: var(--primary-bg, #0a0f1c);
          color: var(--text-primary, #ffffff);
          padding: 2rem 1rem;
        }

        .swap-page-container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }





        @media (max-width: 768px) {
          .swap-page {
            padding: 1rem 0.5rem;
          }
          

          

        }
      `}</style>
    </div>
  );
};

export default SwapPage; 