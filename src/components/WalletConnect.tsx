import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useWallet } from '@razorlabs/razorkit';
import { FaCheckCircle } from 'react-icons/fa';
import { useAlert } from './alert/AlertContext';

// Storage key for signed wallets
const SIGNED_WALLETS_KEY = 'movedao_signed_wallets';

// Helper functions for managing signed wallets
const getSignedWallets = (): string[] => {
  try {
    const stored = localStorage.getItem(SIGNED_WALLETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addSignedWallet = (address: string) => {
  try {
    const signed = getSignedWallets();
    if (!signed.includes(address)) {
      signed.push(address);
      localStorage.setItem(SIGNED_WALLETS_KEY, JSON.stringify(signed));
    }
  } catch (error) {
    console.error('Failed to save signed wallet:', error);
  }
};

const isWalletSigned = (address: string): boolean => {
  return getSignedWallets().includes(address);
};

// Multi-step modal for wallet connect and signing
const WalletModal = ({
  isOpen,
  onClose,
  onWalletSelected,
  wallets,
  configuredWallets,
  requireSigning = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  onWalletSelected: (walletName: string) => void;
  wallets: any[];
  configuredWallets: any[];
  requireSigning?: boolean;
}) => {
  // Step state: 'select' (choose wallet), 'sign' (sign message), 'done' (finished)
  const [step, setStep] = useState<'select' | 'sign' | 'done'>('select');
  const [, setSelectedWallet] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const { showAlert } = useAlert();

  if (!isOpen) return null;
  const allWallets = [...configuredWallets, ...wallets];
  const availableWallets = allWallets.filter((wallet, index, self) =>
    index === self.findIndex((w) => w.name === wallet.name)
  );

  // Handle wallet selection and move to sign step or complete
  const handleWalletSelected = async (walletName: string) => {
    setSelectedWallet(walletName);
    try {
      await onWalletSelected(walletName);
      
      // Always go to sign step on first connection, regardless of previous signing
      if (requireSigning) {
        setStep('sign');
      } else {
        // No signing required, complete connection
        showAlert('Wallet connected', 'success');
        onClose();
      }
    } catch (e) {
      showAlert('Wallet connection failed', 'error');
      setError('Wallet connection failed');
    }
  };

  // Handle signing the message
  const handleSign = async () => {
    setSigning(true);
    setError(null);
    try {
      const message = `Sign in to MoveDAO\nNonce: ${Date.now()}`;
      await wallet.signMessage({ 
        message: message, 
        nonce: Date.now().toString() 
      });
      
      // Mark this wallet as signed
      if (wallet.account) {
        addSignedWallet(wallet.account.address);
      }
      
      setStep('done');
      showAlert('Wallet verified successfully', 'success');
      
      // Auto-close after successful signing
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      if (e && e.message && e.message.toLowerCase().includes('user rejected')) {
        showAlert('Signature rejected by user', 'error');
        setError('You rejected the signature request.');
      } else {
        showAlert('Signing failed', 'error');
        setError('Failed to sign message. Please try again.');
      }
    } finally {
      setSigning(false);
    }
  };

  // Skip signing step
  const handleSkipSigning = () => {
    showAlert('Wallet connected (verification skipped)', 'info');
    onClose();
  };

  // Progress indicator for modal steps
  const Progress = () => (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', 
          background: step === 'select' ? 'var(--accent-blue)' : '#22c55e', 
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16
        }}>
          {step === 'sign' || step === 'done' ? <FaCheckCircle color="#22c55e" size={20} /> : '1'}
        </span>
        <span style={{ color: step === 'select' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>Select Wallet</span>
      </div>
      {requireSigning && (
        <>
          <div style={{ width: 32, height: 2, background: step === 'done' ? 'var(--accent-blue)' : 'var(--border-primary)', alignSelf: 'center' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', 
              background: step === 'done' ? '#22c55e' : (step === 'sign' ? 'var(--accent-blue)' : 'var(--secondary-bg)'), 
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16
            }}>
              {step === 'done' ? <FaCheckCircle color="#22c55e" size={20} /> : '2'}
            </span>
            <span style={{ color: step === 'sign' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>Verify Wallet</span>
          </div>
        </>
      )}
    </div>
  );

  // Modal UI
  return (
    <div className="wallet-connect-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', 
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="wallet-connect-modal-container" style={{
        background: 'var(--card-bg)', color: 'var(--text-primary)', 
        borderRadius: 'var(--radius-lg)', minWidth: 320, maxWidth: 400, 
        boxShadow: '0 4px 24px rgba(0,0,0,0.32)', padding: 28, 
        display: 'flex', flexDirection: 'column', justifyContent: 'center', 
        alignItems: 'center', border: '1px solid var(--border-primary)'
      }}>
        <div className="wallet-connect-modal-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          width: '100%', marginBottom: 18
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Connect Wallet</h3>
          <button className="wallet-connect-modal-close-btn" onClick={onClose} style={{
            fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', 
            color: 'var(--text-primary)', transition: 'var(--transition-base)'
          }}>&times;</button>
        </div>
        <Progress />
        <div className="wallet-connect-modal-content" style={{ width: '100%' }}>
          {step === 'select' && (
            <div className="wallet-connect-wallet-list">
              <h4 style={{ fontSize: 16, fontWeight: 500, marginBottom: 10, color: 'var(--text-primary)' }}>Select Wallet</h4>
              <div className="wallet-connect-wallet-items" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {availableWallets?.map((wallet) => {
                  const isWalletReady = wallet.installed !== false && (wallet.installed || wallet.name === 'Razor');
                  return (
                    <div
                      key={wallet.name}
                      className="wallet-connect-wallet-item"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', 
                        cursor: 'pointer', background: 'var(--secondary-bg)', transition: 'var(--transition-base)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--border-accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--secondary-bg)';
                        e.currentTarget.style.borderColor = 'var(--border-primary)';
                      }}
                      onClick={() => {
                        if (isWalletReady) {
                          handleWalletSelected(wallet.name);
                        } else {
                          showAlert('Wallet not installed. Please install and try again.', 'error');
                          if (wallet.name === 'Razor') {
                            window.open('https://chromewebstore.google.com/detail/razor-wallet/fdcnegogpncmfejlffnofpngdiejii', '_blank');
                          } else if (wallet.downloadUrl?.browserExtension) {
                            window.open(wallet.downloadUrl.browserExtension, '_blank');
                          } else {
                            window.open(`https://www.google.com/search?q=${wallet.name}+wallet+install`, '_blank');
                          }
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {wallet.iconUrl ? (
                          <img src={wallet.iconUrl} alt={wallet.name} width={32} height={32} style={{ borderRadius: 6, background: '#fff' }} />
                        ) : (
                          <span style={{ fontSize: 24 }}>{wallet.name === 'Razor' ? '⚡' : '🔮'}</span>
                        )}
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{wallet.name}</span>
                      </div>
                      <div>
                        {isWalletReady ? (
                          <span style={{ color: '#22c55e', fontWeight: 500 }}>Connect</span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontWeight: 500 }}>Install</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {availableWallets.length === 0 && (
                <div className="wallet-connect-no-wallets-message" style={{ marginTop: 18, color: 'var(--text-muted)' }}>
                  <p>No wallets detected. Please install a supported wallet extension.</p>
                </div>
              )}
            </div>
          )}
          {step === 'sign' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Verify your wallet ownership</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>This signature is required only once per wallet</p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={handleSign}
                  disabled={signing}
                  style={{
                    padding: '10px 20px', borderRadius: 'var(--radius-md)', 
                    background: 'var(--accent-blue)', color: '#fff', fontWeight: 600, 
                    fontSize: 14, border: 'none', cursor: signing ? 'not-allowed' : 'pointer',
                    transition: 'var(--transition-base)', opacity: signing ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!signing) {
                      e.currentTarget.style.background = 'var(--accent-blue-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!signing) {
                      e.currentTarget.style.background = 'var(--accent-blue)';
                    }
                  }}
                >
                  {signing ? 'Signing...' : 'Sign Message'}
                </button>
                <button
                  onClick={handleSkipSigning}
                  disabled={signing}
                  style={{
                    padding: '10px 20px', borderRadius: 'var(--radius-md)', 
                    background: 'var(--secondary-bg)', color: 'var(--text-secondary)', fontWeight: 500, 
                    fontSize: 14, border: '1px solid var(--border-primary)', cursor: signing ? 'not-allowed' : 'pointer',
                    transition: 'var(--transition-base)', opacity: signing ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!signing) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!signing) {
                      e.currentTarget.style.background = 'var(--secondary-bg)';
                    }
                  }}
                >
                  Skip for Now
                </button>
              </div>
              {error && <div style={{ color: '#ef4444', marginTop: 8, fontSize: 13, textAlign: 'center' }}>{error}</div>}
            </div>
          )}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <FaCheckCircle color="#22c55e" size={48} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>Wallet Verified!</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>You won't need to sign again with this wallet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Button for header, opens modal, shows wallet status
const WalletConnectButton = () => {
  const { select, disconnect, configuredWallets, detectedWallets, account, name, connected } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [walletSigned, setWalletSigned] = useState(false);
  const { showAlert } = useAlert();

  // Check if current wallet is signed when account changes
  useEffect(() => {
    if (account) {
      setWalletSigned(isWalletSigned(account.address));
    } else {
      setWalletSigned(false);
    }
  }, [account]);

  // Button style
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    background: 'var(--secondary-bg)',
    borderRadius: 'var(--radius-md)',
    height: 36,
    minWidth: 0,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    maxWidth: 180,
    transition: 'var(--transition-base)',
    border: `1px solid ${walletSigned ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-primary)'}`
  };
  
  // Inner content style
  const innerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: 0,
    height: 28,
    minWidth: 0,
    overflow: 'hidden',
  };
  
  // Get icon for connected wallet
  const getWalletIcon = () => {
    const allWallets = [...configuredWallets, ...detectedWallets];
    const wallet = allWallets.find((w) => w.name === name);
    if (wallet && wallet.iconUrl) {
      return <img src={wallet.iconUrl} alt={wallet.name} width={18} height={18} style={{ borderRadius: 4, background: 'none' }} />;
    }
    return <span style={{ fontSize: 16 }}>{name === 'Razor' ? '⚡' : '🔮'}</span>;
  };
  
  // Handle wallet connect
  const handleConnect = async (walletName: string) => {
    try {
      await select(walletName);
    } catch (e) {
      showAlert('Wallet connection error', 'error');
    }
  };
  
  // Handle wallet disconnect
  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await disconnect();
      setModalKey((k) => k + 1);
      setWalletSigned(false);
      setShowModal(false); // Ensure modal is closed after disconnect
      showAlert('Wallet disconnected', 'info');
    } catch (e) {
      showAlert('Network error on disconnect', 'error');
    }
  };
  
  // Open modal and reset step - check if wallet is already signed
  const handleOpenModal = () => {
    // Only proceed if we're not already connected
    if (!connected) {
      setModalKey((k) => k + 1);
      setShowModal(true);
    }
  };
  
  // Truncate address for display
  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Determine if we should show modal or connect directly
  const shouldShowModal = () => {
    // Don't show modal if already connected
    if (connected) return false;
    
    // Only show modal when explicitly opened and not connected
    return showModal;
  };

  // Render button and modal
  return (
    <>
      <button
        className="wallet-connect-header-btn"
        style={buttonStyle}
        onClick={connected ? undefined : handleOpenModal}
        tabIndex={0}
        onMouseEnter={(e) => {
          if (!connected) {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.borderColor = 'var(--border-accent)';
          }
        }}
        onMouseLeave={(e) => {
          if (!connected) {
            e.currentTarget.style.background = 'var(--secondary-bg)';
            e.currentTarget.style.borderColor = walletSigned ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-primary)';
          }
        }}
      >
        <div style={innerStyle}>
          {connected && account ? (
            <>
              {getWalletIcon()}
              <span style={{
                fontFamily: 'monospace',
                fontSize: 13,
                color: 'var(--text-primary)',
                background: 'none',
                borderRadius: 6,
                padding: '1px 6px',
                fontWeight: 600,
                letterSpacing: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{truncateAddress(account.address)}</span>
              {walletSigned && (
                <FaCheckCircle 
                  color="#22c55e" 
                  size={12} 
                  title="Wallet verified"
                  style={{ flexShrink: 0 }}
                />
              )}
              <span
                onClick={handleDisconnect}
                style={{
                  marginLeft: 4,
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition-base)',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                title="Disconnect"
              >
                &#10005;
              </span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </div>
      </button>
      {typeof window !== 'undefined' && shouldShowModal() && ReactDOM.createPortal(
        <WalletModal
          key={modalKey}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onWalletSelected={handleConnect}
          wallets={detectedWallets}
          configuredWallets={configuredWallets}
          requireSigning={true}
        />, document.body)}
    </>
  );
};

export default WalletConnectButton;