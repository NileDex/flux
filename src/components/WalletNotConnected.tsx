import React from 'react';
import penguin from '../assets/penguin.png';

const WalletNotConnected: React.FC = () => (
  <div className="wallet-not-connected">
    <img src={penguin} alt="Not connected" className="wallet-illustration" />
    <div className="wallet-message">Wallet not connected</div>
    <style>{`
      .wallet-not-connected {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        min-height: 300px;
        background: rgba(26, 31, 46, 0.7);
        border-radius: 18px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      }
      .wallet-illustration {
        width: 120px;
        height: auto;
        margin-bottom: 1.5rem;
        opacity: 0.95;
      }
      .wallet-message {
        color: #b3e0ff;
        font-size: 1.3rem;
        font-weight: 500;
        text-align: center;
      }
      @media (max-width: 600px) {
        .wallet-illustration {
          width: 80px;
        }
        .wallet-message {
          font-size: 1rem;
        }
      }
    `}</style>
  </div>
);

export default WalletNotConnected; 