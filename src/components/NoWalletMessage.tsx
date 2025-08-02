const NoWalletMessage = () => {
  return (
    <div className="no-wallet-message">
      <div className="no-wallet-content">
        <div className="no-wallet-icon">👛</div>
        <h3 className="no-wallet-title">No Wallet Connected</h3>
        <p className="no-wallet-description">
          Please connect your wallet 
        </p>
      </div>
      
      <style>{`
        .no-wallet-message {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          width: 100%;
          padding: 2rem;
        }
        
        .no-wallet-content {
          text-align: center;
          max-width: 400px;
        }
        
        .no-wallet-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }
        
        .no-wallet-title {
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        
        .no-wallet-description {
          color: var(--text-secondary);
          font-size: 1rem;
          line-height: 1.5;
          margin: 0;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default NoWalletMessage; 