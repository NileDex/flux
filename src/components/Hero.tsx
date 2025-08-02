import { useState } from 'react';
import { useAccount } from '@razorlabs/razorkit';
import QRCode from 'react-qr-code';
import { FaCopy, FaQrcode } from 'react-icons/fa';

function shortenAddress(address?: string | null) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Hero() {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Failed to copy address:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="hero-root">
      <div className="hero-content">
        <div className="hero-pfp-col">
          <div className="hero-pfp">
            <video className="hero-blockie" autoPlay loop muted playsInline>
              <source src="/src/assets/modalillustration.webm" type="video/webm" />
            </video>
          </div>
        </div>
        <div className="hero-main-col">
          <div className="hero-title-row">
            <span className="hero-title">MySpace</span>
            {address && (
              <div className="hero-address-row">
                <span className="hero-address">{shortenAddress(address)}</span>
                <button 
                  className="hero-copy-btn" 
                  onClick={handleCopy} 
                  title="Copy address"
                  disabled={!address}
                >
                  <FaCopy size={16} />
                </button>
                <button 
                  className="hero-qr-btn" 
                  onClick={() => setShowQR(true)} 
                  title="Show QR Code"
                  disabled={!address}
                >
                  <FaQrcode size={16} />
                </button>
                {copied && <span className="hero-copied">Copied!</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      {showQR && address && (
        <div className="hero-qr-modal-backdrop" onClick={() => setShowQR(false)}>
          <div className="hero-qr-modal" onClick={e => e.stopPropagation()}>
            <QRCode value={address} size={200} bgColor="#051a2d" fgColor="#fff" />
            <div className="hero-qr-modal-address">{shortenAddress(address)}</div>
            <button 
              className="hero-qr-modal-copy-btn" 
              onClick={handleCopy} 
              title="Copy address"
            >
              <FaCopy size={16} />
              <span>Copy Address</span>
            </button>
          </div>
        </div>
      )}
      <style>{`
        .hero-root {
          width: 100%;
          background: #051a2d;
          color: #fff;
          padding: 2.5rem 0 1.5rem 1.5rem;
          border-bottom: 1px solid rgba(59,130,246,0.08);
        }
        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
          gap: 2.5rem;
          padding: 0 2rem;
        }
        .hero-pfp-col {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }
        .hero-pfp {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-blockie {
          width: 200px;
          height: 200px;
          object-fit: cover;
        }
        .hero-main-col {
          flex: 1 1 0%;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .hero-title-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .hero-title {
          font-size: 2.1rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .hero-address-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .hero-address {
          font-family: monospace;
          font-size: 1.1rem;
          color: #b3e0ff;
        }
        .hero-copy-btn, .hero-qr-btn {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .hero-copy-btn:hover, .hero-qr-btn:hover {
          background: rgba(59,130,246,0.12);
        }
        .hero-copy-btn:disabled, .hero-qr-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .hero-copied {
          color: #aaffcc;
          font-size: 0.95rem;
        }

        /* QR Modal Styles */
        .hero-qr-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-qr-modal {
          background: rgba(5, 26, 45, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          position: relative;
          min-width: 280px;
        }
        .hero-qr-modal-address {
          color: #b3e0ff;
          font-family: monospace;
          font-size: 1rem;
          text-align: center;
          font-weight: 500;
        }
        .hero-qr-modal-copy-btn {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }
        .hero-qr-modal-copy-btn:hover {
          background: rgba(59, 130, 246, 0.25);
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .hero-content {
            flex-direction: row-reverse;
            align-items: flex-start;
            gap: 1.5rem;
            justify-content: space-between;
          }
          .hero-pfp-col {
            align-items: flex-end;
          }
          .hero-main-col {
            flex: 1;
          }
        }
        @media (max-width: 600px) {
          .hero-content {
            padding: 0 0.5rem;
            flex-direction: row-reverse;
            justify-content: space-between;
          }
          .hero-title {
            font-size: 1.3rem;
          }
          .hero-pfp {
            width: 200px;
            height: 120px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .hero-blockie {
            width: 200px;
            height: 200px;
          }
          .hero-pfp-col {
            flex: 0 0 auto;
            align-items: flex-end;
          }
          .hero-main-col {
            flex: 1;
            max-width: calc(100% - 140px);
          }
        }
      `}</style>
    </div>
  );
}