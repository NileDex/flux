import { useTotalTransactions } from './hooks/useTotalTransactions';
import { FaExchangeAlt, FaNetworkWired, FaGlobe, FaChartLine, FaClock, FaServer } from 'react-icons/fa';
import { useState } from 'react';

const TotalTransactions = () => {
  const { totalTransactions, error } = useTotalTransactions();
  const [showDebug, setShowDebug] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (error) {
    return (
      <div className="network-container">
        <div className="error-container">
          <div className="error-icon">
            <FaNetworkWired />
          </div>
          <h3>Connection Error</h3>
          <p>Unable to fetch network data. Please try again later.</p>
          <button 
            className="debug-btn"
            onClick={() => setShowDebug(!showDebug)}
          >
            Show Debug Info
          </button>
          {showDebug && (
            <div className="debug-info">
              <p><strong>Error:</strong> {error}</p>
              <p><strong>Count:</strong> {totalTransactions}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="network-container">
      {/* Header Section with Integrated Debug */}
      <div className="network-header">
        <div className="header-main">
          <div className="header-icon">
            <FaGlobe />
          </div>
          <div className="header-content">
            <h1>Network Overview</h1>
            <p>Real-time Movement blockchain statistics</p>
          </div>
        </div>
        
        {/* Integrated Debug Information */}
        <div className="header-debug-section">
          <div className="debug-toggle-container">
            <button 
              className="debug-toggle"
              onClick={() => setShowDebug(!showDebug)}
              title="Toggle debug mode"
            >
              <FaServer />
            </button>
          </div>
          
          {showDebug && (
            <div className="integrated-debug-panel">
              <h3>Debug Information</h3>
              <div className="debug-grid">
                <div className="debug-item">
                  <span className="debug-label">Raw Count:</span>
                  <span className="debug-value">{totalTransactions}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Formatted:</span>
                  <span className="debug-value">{formatNumber(totalTransactions)}</span>
                </div>

                <div className="debug-item">
                  <span className="debug-label">Error:</span>
                  <span className="debug-value">{error || 'None'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-icon">
              <FaExchangeAlt />
            </div>
            <div className="stat-badge">Live</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(totalTransactions)}</div>
            <div className="stat-label">Total Transactions</div>
            <div className="stat-description">All processed transactions on Movement network</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
                         <div className="stat-icon">
               <FaChartLine />
             </div>
            <div className="stat-badge">Active</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Network Status</div>
            <div className="stat-description">Movement mainnet operational</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-badge">Real-time</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">Instant</div>
            <div className="stat-label">Data Updates</div>
            <div className="stat-description">Live transaction monitoring</div>
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="network-info">
        <div className="info-card">
          <h3>About Movement Network</h3>
          <p>
            Movement is a high-performance blockchain network designed for scalability, security, and speed. 
            This dashboard provides real-time insights into network activity and transaction processing.
          </p>
        </div>
        
        <div className="info-card">
          <h3>Data Source</h3>
          <p>
            All statistics are sourced from the Movement Network indexer, ensuring accurate and 
            up-to-date information about network performance and transaction activity.
          </p>
        </div>
      </div>

      <style>{`
        .network-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: var(--primary-bg);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }



        /* Error State */
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
          gap: 1.5rem;
        }

        .error-icon {
          font-size: 3rem;
          color: #ef4444;
        }

        .error-container h3 {
          color: var(--text-primary);
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .error-container p {
          color: var(--text-muted);
          margin: 0;
          font-size: 1rem;
          max-width: 400px;
        }

        .debug-btn {
          background: var(--accent-blue);
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition-base);
        }

        .debug-btn:hover {
          background: var(--accent-blue-hover);
          transform: translateY(-1px);
        }

        .debug-info {
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          padding: 1rem;
          margin-top: 1rem;
          text-align: left;
          max-width: 400px;
        }

        .debug-info p {
          margin: 0.25rem 0;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        /* Header with Integrated Debug */
        .network-header {
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 2rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 2rem;
        }

        .header-main {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex: 1;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--accent-blue), #1d4ed8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.75rem;
        }

        .header-content h1 {
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-content p {
          color: var(--text-muted);
          margin: 0;
          font-size: 1rem;
        }

        .header-debug-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
          min-width: 300px;
        }

        .debug-toggle-container {
          display: flex;
          justify-content: flex-end;
        }

        .debug-toggle {
          background: transparent;
          border: 1px solid var(--border-primary);
          color: var(--text-muted);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-base);
          font-size: 1rem;
        }

        .debug-toggle:hover {
          color: var(--accent-blue);
          border-color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.1);
        }

        /* Integrated Debug Panel */
        .integrated-debug-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          width: 100%;
          min-width: 280px;
        }

        .integrated-debug-panel h3 {
          color: var(--text-primary);
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .debug-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .debug-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-sm);
        }

        .debug-label {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .debug-value {
          color: var(--text-primary);
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 2rem;
          backdrop-filter: blur(10px);
          transition: all var(--transition-base);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          border-color: var(--accent-blue);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-card.primary {
          border-color: var(--accent-blue);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.05));
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: var(--accent-blue);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
        }

        .stat-card:not(.primary) .stat-icon {
          background: var(--text-muted);
        }

        .stat-badge {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-blue);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .stat-card:not(.primary) .stat-badge {
          background: rgba(100, 116, 139, 0.1);
          color: var(--text-muted);
          border-color: rgba(100, 116, 139, 0.2);
        }

        .stat-value {
          color: var(--text-primary);
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .stat-description {
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.4;
        }

        /* Network Info */
        .network-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .info-card {
          padding: 1.5rem;
        }

        .info-card h3 {
          color: var(--text-primary);
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .info-card p {
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
          font-size: 0.95rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .network-container {
            padding: 1rem;
          }

          .network-header {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1rem;
            text-align: center;
            align-items: center;
          }

          .header-main {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
            text-align: center;
          }

          .header-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .header-debug-section {
            width: 100%;
            min-width: auto;
            align-items: center;
          }

          .integrated-debug-panel {
            width: 100%;
            min-width: auto;
          }

          .header-icon {
            width: 56px;
            height: 56px;
            font-size: 1.5rem;
          }

          .header-content h1 {
            font-size: 1.75rem;
          }

          .header-content p {
            font-size: 0.9rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .stat-card {
            padding: 1.5rem;
          }

          .stat-header {
            margin-bottom: 1rem;
          }

          .stat-icon {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }

          .stat-value {
            font-size: 2rem;
          }

          .stat-label {
            font-size: 1rem;
          }

          .stat-description {
            font-size: 0.8rem;
          }

          .network-info {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .info-card {
            padding: 1.25rem;
          }

          .info-card h3 {
            font-size: 1.1rem;
          }

          .info-card p {
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .network-container {
            padding: 0.75rem;
          }

          .network-header {
            padding: 1rem;
            gap: 0.75rem;
            text-align: center;
            align-items: center;
          }

          .header-main {
            align-items: center;
            text-align: center;
          }

          .header-content {
            text-align: center;
            align-items: center;
          }

          .header-icon {
            width: 48px;
            height: 48px;
            font-size: 1.25rem;
          }

          .header-content h1 {
            font-size: 1.5rem;
          }

          .header-content p {
            font-size: 0.85rem;
          }

          .stats-grid {
            gap: 0.75rem;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-header {
            margin-bottom: 0.75rem;
          }

          .stat-icon {
            width: 36px;
            height: 36px;
            font-size: 0.9rem;
          }

          .stat-badge {
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
          }

          .stat-value {
            font-size: 1.75rem;
            margin-bottom: 0.25rem;
          }

          .stat-label {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          .stat-description {
            font-size: 0.75rem;
            line-height: 1.3;
          }

          .network-info {
            gap: 0.75rem;
          }

          .info-card {
            padding: 1rem;
          }

          .info-card h3 {
            font-size: 1rem;
            margin-bottom: 0.75rem;
          }

          .info-card p {
            font-size: 0.85rem;
            line-height: 1.5;
          }

          .integrated-debug-panel {
            padding: 1rem;
          }

          .integrated-debug-panel h3 {
            font-size: 1.1rem;
            margin-bottom: 0.75rem;
          }

          .debug-grid {
            gap: 0.5rem;
          }

          .debug-item {
            padding: 0.5rem;
          }

          .debug-label, .debug-value {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 360px) {
          .network-container {
            padding: 0.5rem;
          }

          .network-header {
            padding: 0.75rem;
            text-align: center;
            align-items: center;
          }

          .header-main {
            align-items: center;
            text-align: center;
          }

          .header-content {
            text-align: center;
            align-items: center;
          }

          .header-content h1 {
            font-size: 1.25rem;
          }

          .header-content p {
            font-size: 0.8rem;
          }

          .stat-card {
            padding: 0.75rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .stat-label {
            font-size: 0.85rem;
          }

          .stat-description {
            font-size: 0.7rem;
          }

          .info-card {
            padding: 0.75rem;
          }

          .info-card h3 {
            font-size: 0.9rem;
          }

          .info-card p {
            font-size: 0.8rem;
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
        }
      `}</style>
    </div>
  );
};

export default TotalTransactions; 