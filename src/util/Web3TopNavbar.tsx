import { useState } from "react";
import { 
  FaTwitter,
  FaDiscord,
  FaTelegram,
  FaGithub,
  FaLinkedin,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaGlobe,
  FaInfoCircle,
  FaExternalLinkAlt
} from "react-icons/fa";
import { Link } from "react-router-dom";
import WalletConnectButton from "../components/WalletConnect";
import MoveTokenPrice from "../components/MoveTokenPrice";

interface Web3TopNavbarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

// Network endpoints information
const NETWORK_LINKS = [
  {
    id: 126,
    name: 'Movement Mainnet',
    explorerUrl: 'https://explorer.movementnetwork.xyz/?network=mainnet',
    faucetUrl: null,
    icon: '🟢'
  },
  {
    id: 250,
    name: 'Bardock Testnet',
    explorerUrl: 'https://explorer.movementnetwork.xyz/?network=bardock+testnet',
    faucetUrl: 'https://faucet.movementnetwork.xyz/',
    icon: '🟡'
  },
  {
    id: 177,
    name: 'Porto Testnet',
    explorerUrl: 'https://explorer.movementnetwork.xyz/?network=porto+testnet',
    faucetUrl: 'https://faucet.testnet.movementinfra.xyz/',
    icon: '🔵'
  }
];

const Web3TopNavbar = ({ mobileOpen, setMobileOpen }: Web3TopNavbarProps) => {
  const [socialDropdownOpen, setSocialDropdownOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [mobileNetworkDropdownOpen, setMobileNetworkDropdownOpen] = useState(false);
  const [mobileSocialDropdownOpen, setMobileSocialDropdownOpen] = useState(false);
  const [infoNoticeVisible, setInfoNoticeVisible] = useState(true);

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  const socialLinks = [
    { icon: FaTwitter, url: "https://twitter.com/yourhandle", label: "Twitter" },
    { icon: FaDiscord, url: "https://discord.gg/yourserver", label: "Discord" },
    { icon: FaTelegram, url: "https://t.me/yourchannel", label: "Telegram" },
    { icon: FaGithub, url: "https://github.com/yourrepo", label: "GitHub" },
    { icon: FaLinkedin, url: "https://linkedin.com/company/yourcompany", label: "LinkedIn" }
  ];

  const navItems = [
    { text: "Dashboard", to: "/dashboard" },
    { text: "Swap", to: "/swap" },
    { text: "Network", to: "/network-transactions" }
  ];

  return (
    <>
      {/* Info Notice Bar */}
      {infoNoticeVisible && (
        <div className="info-notice-bar">
          <div className="info-notice-container">
            <div className="info-notice-content">
              <FaInfoCircle className="info-notice-icon" />
              <span className="info-notice-text">
                Data displayed may not be 100% accurate. For feedback, message me on 
                <a 
                  href="https://twitter.com/AkpanSunday193" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="info-notice-link"
                >
                  @AkpanSunday193
                  <FaExternalLinkAlt className="external-link-icon" />
                </a>
              </span>
            </div>
            <button 
              className="info-notice-close"
              onClick={() => setInfoNoticeVisible(false)}
              aria-label="Close notice"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      <nav className="top-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="logo">
              <img src="/flux.jpg" alt="Flux" className="logo-image" />
              <span className="logo-text">Flux</span>
            </div>
          </div>

          <div className="navbar-nav">
            {navItems.map((item) => (
              <Link
                key={item.text}
                to={item.to}
                className="nav-link"
                title={item.text}
              >
                <span className="nav-text">{item.text}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-right">
            <MoveTokenPrice />
            
            <div className="social-dropdown">
              <button
                className="social-dropdown-toggle"
                onClick={() => setSocialDropdownOpen(!socialDropdownOpen)}
                onBlur={() => setTimeout(() => setSocialDropdownOpen(false), 150)}
              >
                <span>Social</span>
                <FaChevronDown className={`dropdown-icon ${socialDropdownOpen ? 'rotate' : ''}`} />
              </button>
              
              {socialDropdownOpen && (
                <div className="social-dropdown-menu">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-dropdown-item"
                      title={social.label}
                    >
                      <social.icon className="social-icon" />
                      <span>{social.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Network Links Dropdown - Hidden on mobile */}
            <div className="network-dropdown desktop-only">
              <button
                className="network-dropdown-toggle"
                onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                onBlur={() => setTimeout(() => setNetworkDropdownOpen(false), 150)}
                title="Network Resources"
              >
                <FaGlobe className="network-icon" />
                <FaChevronDown className={`dropdown-icon ${networkDropdownOpen ? 'rotate' : ''}`} />
              </button>
              
              {networkDropdownOpen && (
                <div className="network-dropdown-menu">
                  <div className="network-dropdown-header">
                    <span>Movement Networks</span>
                  </div>
                  {NETWORK_LINKS.map((network) => (
                    <div key={network.id} className="network-dropdown-section">
                      <div className="network-info">
                        <div className="network-main">
                          <span className="network-status-icon">{network.icon}</span>
                          <span className="network-title">{network.name}</span>
                        </div>
                        <div className="network-links">
                          <a 
                            href={network.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="network-link"
                          >
                            Explorer
                          </a>
                          {network.faucetUrl && (
                            <a 
                              href={network.faucetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="network-link"
                            >
                              Faucet
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="network-dropdown-footer">
                    <a 
                      href="https://docs.movementnetwork.xyz/devs/networkEndpoints" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="network-docs-link"
                    >
                      📖 View All Network Endpoints
                    </a>
                  </div>
                </div>
              )}
            </div>

            <WalletConnectButton />

            <button
              className="mobile-menu-button"
              onClick={toggleMobileSidebar}
              aria-label="Toggle mobile menu"
            >
              <FaBars />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-sidebar ${mobileOpen ? 'mobile-sidebar-open' : ''}`}>
        <div className="mobile-backdrop" onClick={closeMobileSidebar}></div>
        <div className="mobile-sidebar-content">
          <div className="mobile-header">
            <div className="logo-container">
              <div className="logo">
                <img src="/flux.jpg" alt="Flux" className="logo-image" />
                <span className="logo-text">Flux</span>
              </div>
            </div>
            <button className="mobile-close" onClick={closeMobileSidebar}>
              <FaTimes />
            </button>
          </div>

          <div className="mobile-move-price">
            <MoveTokenPrice />
          </div>

          <nav className="mobile-nav">
            {navItems.map((item) => (
              <div key={item.text} className="mobile-nav-item">
                <Link 
                  to={item.to}
                  className="mobile-nav-button"
                  onClick={closeMobileSidebar}
                >
                  <span className="mobile-nav-text">{item.text}</span>
                </Link>
              </div>
            ))}
          </nav>

          {/* Mobile Network Resources Dropdown */}
          <div className="mobile-dropdown-section">
            <button
              className="mobile-dropdown-toggle"
              onClick={() => setMobileNetworkDropdownOpen(!mobileNetworkDropdownOpen)}
            >
              <FaGlobe className="mobile-dropdown-icon" />
              <span>Network Resources</span>
              <FaChevronDown className={`dropdown-icon ${mobileNetworkDropdownOpen ? 'rotate' : ''}`} />
            </button>
            
            {mobileNetworkDropdownOpen && (
              <div className="mobile-dropdown-content">
                {NETWORK_LINKS.map((network) => (
                  <div key={network.id} className="mobile-network-item">
                    <div className="mobile-network-header">
                      <span className="network-status-icon">{network.icon}</span>
                      <span className="network-title">{network.name}</span>
                    </div>
                    <div className="mobile-network-links">
                      <a 
                        href={network.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mobile-network-link"
                      >
                        Explorer
                      </a>
                      {network.faucetUrl && (
                        <a 
                          href={network.faucetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mobile-network-link"
                        >
                          Faucet
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                <a 
                  href="https://docs.movementnetwork.xyz/devs/networkEndpoints" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mobile-docs-link"
                >
                  📖 View All Endpoints
                </a>
              </div>
            )}
          </div>

          {/* Mobile Social Dropdown */}
          <div className="mobile-dropdown-section">
            <button
              className="mobile-dropdown-toggle"
              onClick={() => setMobileSocialDropdownOpen(!mobileSocialDropdownOpen)}
            >
              <FaTwitter className="mobile-dropdown-icon" />
              <span>Social Links</span>
              <FaChevronDown className={`dropdown-icon ${mobileSocialDropdownOpen ? 'rotate' : ''}`} />
            </button>
            
            {mobileSocialDropdownOpen && (
              <div className="mobile-dropdown-content">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-social-item"
                    title={social.label}
                  >
                    <social.icon className="mobile-social-icon" />
                    <span>{social.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="mobile-divider"></div>

          <div className="mobile-footer">
            <div className="mobile-copyright">
              © 2025 Flux
            </div>
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --primary-bg: #0a0f1c;
          --secondary-bg: #1a1f2e;
          --card-bg: rgba(26, 31, 46, 0.8);
          --glass-bg: rgba(26, 31, 46, 0.95);
          --accent-blue: #3b82f6;
          --accent-blue-hover: #2563eb;
          --accent-green: #10b981;
          --accent-yellow: #f59e0b;
          --text-primary: #ffffff;
          --text-secondary: #ffffff;
          --text-muted: #64748b;
          --border-primary: rgba(148, 163, 184, 0.1);
          --border-accent: rgba(59, 130, 246, 0.3);
          --radius-sm: 0.375rem;
          --radius-md: 0.5rem;
          --radius-lg: 0.75rem;
          --transition-base: 0.3s ease-in-out;
          --navbar-height: 70px;
          --info-notice-height: 40px;
        }

        /* Info Notice Bar Styles */
        .info-notice-bar {
          height: var(--info-notice-height);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
          border-bottom: 1px solid var(--border-accent);
          color: var(--text-primary);
          z-index: 999;
          position: relative;
        }

        .info-notice-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .info-notice-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .info-notice-icon {
          color: var(--accent-blue);
          font-size: 16px;
          flex-shrink: 0;
        }

        .info-notice-text {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .info-notice-link {
          color: var(--accent-blue);
          text-decoration: none;
          font-weight: 600;
          margin-left: 4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color var(--transition-base);
        }

        .info-notice-link:hover {
          color: var(--accent-blue-hover);
          text-decoration: underline;
        }

        .external-link-icon {
          font-size: 12px;
        }

        .info-notice-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-base);
          flex-shrink: 0;
        }

        .info-notice-close:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .top-navbar {
          height: var(--navbar-height);
          background: #051a2d;
          color: var(--text-primary);
          z-index: 1000;
        }
     
        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          justify-content: flex-start;
        }

        .logo {
          display: flex;
          align-items: center;
          margin: 0;
          gap: 12px;
        }

        .logo-image {
          width: 40px;
          height: auto;
          border-radius: var(--radius-md);
          object-fit: cover;
        }

        .logo-text {
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition-base);
          position: relative;
        }

        .nav-link:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .nav-text {
          white-space: nowrap;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Network Dropdown Styles */
        .network-dropdown {
          position: relative;
        }

        .network-dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;      
          border-radius: var(--radius-md);
          color: var(--accent-green);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .network-icon {
          font-size: 20px;
        }

        .dropdown-icon {
          font-size: 12px;
          transition: transform var(--transition-base);
        }

        .dropdown-icon.rotate {
          transform: rotate(180deg);
        }

        .network-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          min-width: 280px;
          z-index: 1001;
          animation: dropdown-enter 0.2s ease-out;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .network-dropdown-header {
          padding: 16px 16px 8px;
          border-bottom: 1px solid var(--border-primary);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .network-dropdown-section {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.05);
        }

        .network-dropdown-section:last-of-type {
          border-bottom: none;
        }

        .network-links {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .network-link {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-sm);
          color: var(--accent-blue);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all var(--transition-base);
        }

        .network-link:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }

        .network-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .network-main {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .network-status-icon {
          font-size: 14px;
        }

        .network-title {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .network-details {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .network-id {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: monospace;
        }

        .network-checkmark {
          color: var(--accent-green);
          font-weight: 600;
          font-size: 14px;
        }

        .network-dropdown-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-primary);
        }

        .network-docs-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 8px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-sm);
          color: var(--accent-blue);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all var(--transition-base);
        }

        .network-dropdown-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .network-dropdown-item:disabled:hover {
          background: none;
          color: var(--text-secondary);
        }

        .mobile-network-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile Dropdown Styles */
        .mobile-dropdown-section {
          margin-top: 24px;
        }

        .mobile-dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px;
          background: none;
          border: none;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-base);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .mobile-dropdown-toggle:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .mobile-dropdown-icon {
          font-size: 16px;
        }

        .mobile-dropdown-toggle span {
          flex: 1;
        }

        .mobile-dropdown-content {
          background: rgba(26, 31, 46, 0.3);
          border-top: 1px solid var(--border-primary);
        }

        .mobile-network-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.05);
        }

        .mobile-network-item:last-child {
          border-bottom: none;
        }

        .mobile-network-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .mobile-network-header .network-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .mobile-network-links {
          display: flex;
          gap: 8px;
        }

        .mobile-network-link {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-sm);
          color: var(--accent-blue);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all var(--transition-base);
        }

        .mobile-network-link:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }

        .mobile-docs-link {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.1);
          border: none;
          border-top: 1px solid var(--border-primary);
          color: var(--accent-blue);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all var(--transition-base);
        }

        .mobile-docs-link:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        /* Mobile Social Styles */
        .mobile-social-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          transition: all var(--transition-base);
          border-bottom: 1px solid rgba(148, 163, 184, 0.05);
        }

        .mobile-social-item:last-child {
          border-bottom: none;
        }

        .mobile-social-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .mobile-social-icon {
          font-size: 16px;
        }

        @keyframes dropdown-enter {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Existing styles continue... */
        .social-dropdown {
          position: relative;
        }

        .social-dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .social-dropdown-toggle:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .social-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          min-width: 160px;
          z-index: 1001;
          animation: dropdown-enter 0.2s ease-out;
        }

        .social-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          transition: all var(--transition-base);
        }

        .social-dropdown-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .social-icon {
          font-size: 16px;
        }

        .wallet-dropdown-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .wallet-dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: var(--radius-md);
          padding: 8px 14px;
          transition: background var(--transition-base);
        }
        .wallet-dropdown-toggle:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        .wallet-avatar {
          display: flex;
          align-items: center;
        }
        .wallet-blockie {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: repeating-linear-gradient(135deg, #3b82f6, #00d4ff 10px, #3b82f6 20px);
          margin-right: 4px;
        }
        .wallet-address-short {
          font-family: monospace;
          font-size: 1rem;
        }
        .wallet-dropdown-menu {
          position: absolute;
          top: 110%;
          right: 0;
          min-width: 220px;
          background: var(--glass-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          z-index: 1002;
          padding: 1.5rem 1rem 1rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: dropdown-enter 0.2s ease-out;
        }
        .wallet-dropdown-avatar {
          margin-bottom: 0.5rem;
        }
        .wallet-blockie-large {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: repeating-linear-gradient(135deg, #3b82f6, #00d4ff 10px, #3b82f6 20px);
        }
        .wallet-dropdown-address-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
        }
        .wallet-dropdown-address {
          font-family: monospace;
          font-size: 1.1rem;
        }
        .wallet-copy-btn {
          background: none;
          border: none;
          color: var(--accent-blue);
          cursor: pointer;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          transition: background var(--transition-base);
        }
        .wallet-copy-btn:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        .wallet-disconnect-btn {
          width: 100%;
          background: var(--accent-blue);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 0;
          margin-top: 0.5rem;
          cursor: pointer;
          transition: background var(--transition-base);
        }
        .wallet-disconnect-btn:hover {
          background: var(--accent-blue-hover);
        }
        .connect-wallet-button {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-blue);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-base);
          white-space: nowrap;
        }

        .connect-wallet-button:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
        }

        .connect-wallet-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .mobile-menu-button {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 18px;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .mobile-menu-button:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .mobile-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: 1050;
          visibility: hidden;
          opacity: 0;
          transition: visibility var(--transition-base), opacity var(--transition-base);
        }

        .mobile-sidebar-open {
          visibility: visible;
          opacity: 1;
        }

        .mobile-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
        }

        .mobile-sidebar-content {
          position: relative;
          width: 280px;
          height: 100%;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-primary);
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform var(--transition-base);
        }

        .mobile-sidebar-open .mobile-sidebar-content {
          transform: translateX(0);
        }

        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 16px 16px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .mobile-close:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .mobile-move-price {
          padding: 16px;
        }

        .mobile-nav {
          padding: 16px 8px;
        }

        .mobile-nav-item {
          margin-bottom: 8px;
        }

        .mobile-nav-button {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 16px;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-decoration: none;
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .mobile-nav-button:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .mobile-nav-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .mobile-divider {
          height: 1px;
          background: var(--border-primary);
          margin: 16px 0;
        }

        .mobile-footer {
          padding: 16px;
          margin-top: auto;
        }

        .mobile-copyright {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Desktop only class */
        .desktop-only {
          display: block;
        }

        @media (max-width: 768px) {
          .info-notice-container {
            padding: 0 16px;
          }

          .info-notice-text {
            font-size: 0.8rem;
          }

          .navbar-nav {
            display: none;
          }
          
          .social-dropdown {
            display: none;
          }

          .desktop-only {
            display: none;
          }

          .connect-wallet-button {
            padding: 6px 10px;
            font-size: 0.75rem;
          }
          
          .mobile-menu-button {
            display: flex;
          }
          
          .navbar-container {
            padding: 0 16px;
          }

          .navbar-right {
            gap: 12px;
          }
        }

        @media (max-width: 640px) {
          .info-notice-text {
            font-size: 0.75rem;
          }

          .logo-text {
            font-size: 1rem;
          }

          .connect-wallet-button {
            padding: 5px 8px;
            font-size: 0.7rem;
          }
        }

        @media (max-width: 480px) {
          .info-notice-container {
            padding: 0 12px;
          }

          .info-notice-text {
            font-size: 0.7rem;
          }

          .info-notice-link {
            margin-left: 2px;
          }

          .logo-text {
            display: block;
          }
          
          .logo-image {
            width: 32px;
            height: 32px;
          }
          
          .navbar-brand {
            gap: 8px;
          }

          .connect-wallet-button {
            padding: 4px 6px;
            font-size: 0.65rem;
          }
        }

        @media (max-width: 360px) {
          .info-notice-container {
            padding: 0 8px;
          }

          .info-notice-text {
            font-size: 0.65rem;
          }

          .navbar-container {
            padding: 0 12px;
          }
          
          .navbar-right {
            gap: 8px;
          }
          
          .logo-image {
            width: 28px;
            height: 28px;
          }

          .connect-wallet-button {
            padding: 4px 6px;
            font-size: 0.6rem;
          }
        }
      `}</style>
    </>
  );
};

export default Web3TopNavbar;