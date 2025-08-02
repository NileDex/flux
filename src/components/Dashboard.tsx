import { useState } from 'react';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { FaImage, FaExchangeAlt, FaChartPie } from 'react-icons/fa';
import WalletTransactions from '../Walletchecks/WalletTransactions';
import NetworthDistribution from './NetworthDistribution';
import AccountNfts from './AccountNft';
import PortfolioChart from './PortfolioChart';
import { useNftCount } from './hooks/useNftCount';
import { usePortfolioTotal } from './hooks/usePortfolioTotal';
import { useCollectionsCount } from './hooks/useCollectionsCount';
import { useAccount } from '@razorlabs/razorkit';
import NoWalletMessage from './NoWalletMessage';

const Dashboard = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  // Initialize balance visibility from localStorage, default to true
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('balanceVisible');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const { address } = useAccount();
  const { nftCount, loading: nftLoading } = useNftCount();
  const { portfolioTotal, loading: portfolioLoading } = usePortfolioTotal();
  const { collectionsCount, loading: collectionsLoading } = useCollectionsCount();
  
  console.log('🎯 Dashboard Data:', { nftCount, nftLoading, portfolioTotal, portfolioLoading, collectionsCount, collectionsLoading });
  
  // Function to mask sensitive values
  const maskValue = (value: string, type: 'currency' | 'count' = 'currency') => {
    if (isBalanceVisible) return value;
    
    if (type === 'currency') {
      return '$****.**';
    } else {
      return '***';
    }
  };

  const toggleBalanceVisibility = () => {
    const newVisibility = !isBalanceVisible;
    setIsBalanceVisible(newVisibility);
    // Save to localStorage to persist across sessions
    localStorage.setItem('balanceVisible', JSON.stringify(newVisibility));
  };
  
  const dashboardItems = [
    {
      title: 'Portfolio',
      value: portfolioLoading ? '...' : maskValue(`$${portfolioTotal.toFixed(2)}`, 'currency'),
      type: 'currency',
      loading: portfolioLoading,
      component: address ? <PortfolioChart /> : <NoWalletMessage />
    },
    {
      title: 'NFTs',
      value: nftLoading ? '...' : maskValue(nftCount.toString(), 'count'),
      subtitle: 'items',
      type: 'count',
      loading: nftLoading,
      collectionsCount: collectionsLoading ? '...' : maskValue(collectionsCount.toString(), 'count'),
      component: address ? <AccountNfts /> : <NoWalletMessage />
    },
    {
      title: 'Transaction Blocks',
      value: '',
      type: 'action',
      loading: false,
      component: address ? <WalletTransactions walletAddress={address} /> : <NoWalletMessage />
    },
    {
      title: 'Networth',
      value: '',
      type: 'action',
      loading: false,
      component: address ? <NetworthDistribution /> : <NoWalletMessage />
    }
  ];

  const selectedComponent = dashboardItems[activeIndex]?.component;

  return (
    <div className="dashboard">


      <div className="dashboard-grid">
        {/* Portfolio Card */}
        <div
          className={`dashboard-card portfolio-card${activeIndex === 0 ? ' active' : ''}`}
        >
          {dashboardItems[0].loading && (
            <div className="card-loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
          <div className="card-content" onClick={() => setActiveIndex(0)}>
            <h3 className="card-title">{dashboardItems[0].title}</h3>
            <div className="card-value currency">{dashboardItems[0].value}</div>
          </div>
          <div className="portfolio-controls">
            <button
              className="balance-toggle-btn"
              onClick={toggleBalanceVisibility}
              title={isBalanceVisible ? 'Hide balances' : 'Show balances'}
            >
              {isBalanceVisible ? (
                <Eye size={18} />
              ) : (
                <EyeOff size={18} />
              )}
            </button>
            <div className="card-arrow" onClick={() => setActiveIndex(0)}>
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        {/* Secondary Cards Row */}
        <div className="secondary-cards-wrapper">
          {dashboardItems.slice(1).map((item, index) => {
            const getIcon = () => {
              switch(item.title) {
                case 'NFTs':
                  return <FaImage size={24} />;
                case 'Transaction Blocks':
                  return <FaExchangeAlt size={24} />;
                case 'Networth':
                  return <FaChartPie size={24} />;
                default:
                  return null;
              }
            };

            return (
              <div
                key={index + 1}
                className={`dashboard-card secondary-card${activeIndex === index + 1 ? ' active' : ''}`}
                onClick={() => setActiveIndex(index + 1)}
              >
                {item.loading && (
                  <div className="card-loading-spinner">
                    <div className="spinner"></div>
                  </div>
                )}
                <div className="card-content">
                  <div className="card-title-wrapper">
                    <div className="card-icon">{getIcon()}</div>
                    <h3 className="card-title">{item.title}</h3>
                  </div>
                  {item.type === 'count' && (
                    <div className="card-value-container">
                      <span className="card-value">{item.value}</span>
                      <span className="card-subtitle">{item.subtitle}</span>
                    </div>
                  )}
                </div>
                <div className="card-arrow">
                  <ChevronRight size={20} />
                </div>
                {item.type === 'count' && item.collectionsCount && (
                  <div className="card-collections-badge">
                    {item.collectionsCount} collections
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area Below Cards */}
      <div className="dashboard-content">
        {selectedComponent}
      </div>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background: var(--primary-bg);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          max-width: 1200px;
          margin: 0 auto 2rem auto;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .balance-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-base);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .balance-toggle-btn:hover {
          color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.1);
        }

        .balance-toggle-btn:active {
          transform: scale(0.95);
        }

        .portfolio-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto 2rem auto;
        }

        .secondary-cards-wrapper {
          display: contents;
        }

        .dashboard-card {
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all var(--transition-base);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .dashboard-card:hover {
          border-color: var(--accent-blue);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .dashboard-card.active {
          border-color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.1);
        }

        .card-content {
          flex: 1;
        }

        .card-title {
          color: var(--text-secondary);
          font-size: 1rem;
          font-weight: 500;
          margin: 0 0 0.5rem 0;
          opacity: 0.9;
        }

        .card-value {
          color: var(--text-primary);
          font-size: 2rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.2;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          letter-spacing: -0.02em;
        }

        .card-value.currency {
          font-size: 2.5rem;
        }

        .card-value-container {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .card-subtitle {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 400;
          margin-left: 0.5rem;
        }

        .card-collections-badge {
          position: absolute;
          bottom: 0.75rem;
          right: 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-blue);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }

        .card-loading-spinner {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 10;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-top: 2px solid var(--accent-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .card-arrow {
          color: var(--text-muted);
          transition: all var(--transition-base);
          opacity: 0.7;
        }

        .dashboard-card.active .card-arrow {
          color: var(--accent-blue);
          opacity: 1;
        }

        /* Hide icons on desktop and tablet */
        .card-icon {
          display: none;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          min-height: 400px;
          backdrop-filter: blur(10px);
        }

        .dashboard-content h2 {
          color: var(--text-primary);
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .dashboard-content p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Responsive Design */
        @media (max-width: 900px) {
          .dashboard {
            padding: 1rem;
          }
          
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .dashboard-card {
            padding: 1.25rem;
          }
          .card-value {
            font-size: 1.75rem;
          }
          .card-value.currency {
            font-size: 2rem;
          }
          .dashboard-content {
            padding: 8px 5px;
          }
        }

        @media (max-width: 600px) {
          .dashboard-grid {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .portfolio-card {
            order: 1;
          }

          .secondary-cards-wrapper {
            order: 2;
            display: flex;
            gap: 0.75rem;
          }

          .secondary-card {
            flex: 1;
            padding: 1rem;
            min-height: 90px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .secondary-card .card-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          /* Show and style icons only on mobile */
          .secondary-card .card-icon {
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--accent-blue);
          }

          .secondary-card .card-title {
            display: none;
          }

          .secondary-card .card-title-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-bottom: 0;
          }

          .secondary-card .card-value {
            display: none;
          }

          .secondary-card .card-value-container {
            display: none;
          }

          .secondary-card .card-subtitle {
            display: none;
          }

          .secondary-card .card-arrow {
            display: none;
          }

          .secondary-card .card-collections-badge {
            display: none;
          }
        }

        /* CSS Variables */
        :root {
          --primary-bg: #0a0f1c;
          --secondary-bg: #1a1f2e;
          --card-bg: rgba(26, 31, 46, 0.8);
          --glass-bg: rgba(26, 31, 46, 0.95);
          --accent-blue: #3b82f6;
          --accent-blue-hover: #2563eb;
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
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: var(--primary-bg);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;