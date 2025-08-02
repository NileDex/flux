import { useTransactionCount } from './hooks/useTransactionCount';
import { FaServer } from 'react-icons/fa';
import { useState } from 'react';

const TransactionCount = () => {
  const { count, loading, error } = useTransactionCount();
  const [showDebug, setShowDebug] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="transaction-count-container">
      {/* Header Section */}
      <div className="count-header">
        <div className="header-main">
          <div className="header-content">
            <h1>Transaction Count</h1>
            <p>Real-time Movement blockchain statistics</p>
          </div>
        </div>
        
        {/* Debug Information */}
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
                  <span className="debug-value">{count}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Formatted:</span>
                  <span className="debug-value">{formatNumber(count)}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Loading:</span>
                  <span className="debug-value">{loading ? 'Yes' : 'No'}</span>
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

      {/* Main Count Display */}
      <div className="count-display">
        <div className="count-value">{formatNumber(count)}</div>
        <div className="count-label">Total Transactions</div>
        <div className="count-description">All processed transactions on Movement network</div>
      </div>

      <style>{`
        .transaction-count-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
          background: var(--primary-bg);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Header with Integrated Debug */
        .count-header {
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

        /* Count Display */
        .count-display {
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 3rem 2rem;
          backdrop-filter: blur(10px);
          text-align: center;
          border-color: var(--accent-blue);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.05));
        }

        .count-value {
          color: var(--text-primary);
          font-size: 4rem;
          font-weight: 700;
          margin-bottom: 1rem;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }

        .count-label {
          color: var(--text-secondary);
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .count-description {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.4;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .transaction-count-container {
            padding: 1rem;
          }

          .count-header {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1rem;
            text-align: center;
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

          .header-content h1 {
            font-size: 1.75rem;
          }

          .count-display {
            padding: 2rem 1.5rem;
          }

          .count-value {
            font-size: 3rem;
          }

          .count-label {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .transaction-count-container {
            padding: 0.5rem;
          }

          .count-header {
            padding: 1.25rem;
          }

          .count-display {
            padding: 1.5rem 1.25rem;
          }

          .count-value {
            font-size: 2.5rem;
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

export default TransactionCount; 