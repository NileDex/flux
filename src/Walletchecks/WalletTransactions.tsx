import { useState, useEffect, useMemo } from 'react';
import { Aptos, Network, AptosConfig } from '@aptos-labs/ts-sdk';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

interface Transaction {
  version: string;
  timestamp: string;
  rawTimestamp: string; // Store raw microseconds timestamp
  type: string;
  sender: string;
  recipient?: string;
  amount?: string;
  status: string;
  hash: string;
}

interface WalletTransactionsProps {
  walletAddress: string;
}

const TRANSACTIONS_PER_PAGE = 20;
const EXPLORER_BASE_URL = 'https://explorer.movementlabs.xyz';

export default function WalletTransactions({ walletAddress }: WalletTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  const aptosConfig = new AptosConfig({
    fullnode: 'https://mainnet.movementnetwork.xyz/v1',
    network: Network.CUSTOM,
  });
  const aptos = new Aptos(aptosConfig);

  // Calculate monthly transaction data for all 12 months of 2025
  const monthlyData = useMemo(() => {
    // Initialize all 12 months of 2025 with 0 transactions
    const months2025 = [
      'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 
      'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025',
      'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025'
    ];

    const monthCounts: { [key: string]: number } = {};
    months2025.forEach(month => {
      monthCounts[month] = 0;
    });
    
    // Count actual transactions using raw timestamps
    allTransactions.forEach(tx => {
      try {
        // Use rawTimestamp (in microseconds) and convert to milliseconds for JavaScript Date
        const date = new Date(Number(tx.rawTimestamp) / 1000);
        if (!isNaN(date.getTime()) && date.getFullYear() === 2025) {
          const monthKey = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          if (monthCounts.hasOwnProperty(monthKey)) {
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
          }
        }
      } catch (error) {
        console.error('Error parsing timestamp:', tx.rawTimestamp, error);
      }
    });

    // Convert to array in chronological order with short month names
    const data = months2025.map(month => ({
      month: month.split(' ')[0], // Just "Jan", "Feb", etc.
      fullMonth: month,
      count: monthCounts[month] || 0,
      transactions: monthCounts[month] || 0
    }));

    return data;
  }, [allTransactions]);

  const totalTransactionsCount = monthlyData.reduce((sum, d) => sum + d.count, 0);

  useEffect(() => {
    if (walletAddress) {
      fetchTransactions(currentPage);
      fetchAllTransactions(); // Fetch all transactions for the chart
    } else {
      setLoading(false);
      setTransactions([]);
      setAllTransactions([]);
    }
  }, [walletAddress, currentPage]);

  const parseRecipient = (recipient: unknown): string => {
    if (!recipient) return '[Unknown]';
    
    if (typeof recipient === 'object' && recipient !== null) {
      if ('inner' in recipient) return `0x${String(recipient.inner)}`;
      if ('address' in recipient) return `0x${String(recipient.address)}`;
      if ('recipient' in recipient) return `0x${String(recipient.recipient)}`;
      return '[Contract]';
    }
    
    return typeof recipient === 'string' 
      ? recipient.startsWith('0x') ? recipient : `0x${recipient}`
      : String(recipient);
  };

  const parseAmount = (amountArg: unknown): string => {
    if (!amountArg) return '0';
    
    try {
      let amount = String(amountArg);
      if (amount.startsWith('0x')) {
        amount = parseInt(amount, 16).toString();
      }
      return (Number(amount) / 10**8).toFixed(4);
    } catch {
      return '0';
    }
  };

  const formatTimestamp = (timestampMicros: string): string => {
    try {
      // Aptos timestamps are in microseconds, convert to milliseconds for JavaScript Date
      const dateValue = new Date(Number(timestampMicros) / 1000);
      return isNaN(dateValue.getTime()) 
        ? 'Unknown date' 
        : dateValue.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Lagos',
          });
    } catch {
      return 'Unknown date';
    }
  };

  const processTransactionData = (txData: any) => {
    return txData.map((tx: any) => {
      const type = tx.payload?.function?.includes('::transfer') ? 'Transfer'
        : tx.payload?.function?.includes('::swap') ? 'Swap'
        : tx.payload?.function?.includes('::stake') ? 'Staking'
        : 'Transaction';

      return {
        version: String(tx.version) || 'Unknown',
        timestamp: formatTimestamp(tx.timestamp), // Formatted for display
        rawTimestamp: tx.timestamp, // Raw microseconds for chart processing
        type,
        sender: `0x${tx.sender}` || walletAddress,
        recipient: tx.payload?.arguments?.[0] ? parseRecipient(tx.payload.arguments[0]) : undefined,
        amount: tx.payload?.arguments?.[1] ? parseAmount(tx.payload.arguments[1]) : undefined,
        status: tx.success ? 'Success' : 'Failed',
        hash: String(tx.hash) || 'Unknown',
      };
    });
  };

  const fetchAllTransactions = async () => {
    if (!walletAddress) return;

    try {
      const accountInfo = await aptos.getAccountInfo({ accountAddress: walletAddress });
      const totalTransactions = Number(accountInfo.sequence_number) || 0;
      
      // Fetch all transactions in batches
      const allTxs = [];
      const batchSize = 100;
      const maxBatches = Math.ceil(Math.min(totalTransactions, 1000) / batchSize); // Limit to 1000 for performance

      for (let i = 0; i < maxBatches; i++) {
        try {
          const batch = await aptos.getAccountTransactions({
            accountAddress: walletAddress,
            options: {
              limit: batchSize,
              offset: i * batchSize,
            },
          });
          allTxs.push(...batch);
        } catch (error) {
          console.error(`Error fetching batch ${i}:`, error);
          break;
        }
      }

      const processedTxs = processTransactionData(allTxs);
      setAllTransactions(processedTxs);
    } catch (error) {
      console.error('Error fetching all transactions:', error);
    }
  };

  const fetchTransactions = async (page: number) => {
    if (!walletAddress) {
      setLoading(false);
      setError('No wallet address available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      try {
        await aptos.getAccountInfo({ accountAddress: walletAddress });
      } catch (error) {
        if ((error as { errorCode?: string }).errorCode === 'account_not_found') {
          setTransactions([]);
          setAllTransactions([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      const accountTransactions = await aptos.getAccountTransactions({
        accountAddress: walletAddress,
        options: {
          limit: TRANSACTIONS_PER_PAGE,
          offset: (page - 1) * TRANSACTIONS_PER_PAGE,
        },
      });

      const accountInfo = await aptos.getAccountInfo({ accountAddress: walletAddress });
      const totalTransactions = Number(accountInfo.sequence_number) || 100;
      setTotalPages(Math.ceil(totalTransactions / TRANSACTIONS_PER_PAGE));

      const processedTransactions = processTransactionData(accountTransactions);
      setTransactions(processedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(
        error instanceof Error && error.message.includes('network') ? 'Network error. Please check your connection.'
        : error instanceof Error && error.message.includes('rate limit') ? 'Too many requests. Please try again later.'
        : 'Unable to fetch transactions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeIcon = (type: string, sender: string) => {
    const hue = sender.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) % 360;
    const bgStyle = {
      background: `linear-gradient(45deg, hsl(${hue}, 70%, 50%), hsl(${hue + 60}, 70%, 50%))`,
    };

    return (
      <div className="tx-pfp-container">
        <div className={`tx-pfp ${type !== 'Transfer' ? 'swap-pfp' : ''}`} style={bgStyle} />
      </div>
    );
  };

  const truncateAddress = (addr: string) => {
    if (!addr || addr === '[Unknown]') return 'Unknown';
    if (addr === '[Contract]') return <span className="tx-contract">Contract</span>;
    return addr.startsWith('0x') 
      ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
      : addr;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`${label} 2025`}</p>
          <p className="tooltip-value">
            <span className="tooltip-indicator"></span>
            {`Transactions: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis 
            dataKey="month" 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="transactions" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      );
    }

    if (chartType === 'area') {
      return (
        <AreaChart data={monthlyData}>
          <defs>
            <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis 
            dataKey="month" 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="transactions" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorTransactions)" 
            strokeWidth={2}
          />
        </AreaChart>
      );
    }

    return (
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis 
          dataKey="month" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="transactions" 
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    );
  };

  return (
    <>
      <style>{`
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

        /* Transaction Hub */
        .profiz-transaction-hub {
          min-height: 100vh;
          border-radius: var(--radius-lg);
          margin: 0;
          background-color: var(--primary-bg);
          padding: 1rem;
          box-sizing: border-box;
        }

        .transactions-container {
          margin-top: 1rem;
          border-radius: var(--radius-lg);
          padding: 1rem;
          background-color: var(--primary-bg);
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .transactions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .wallet-address-display {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          word-break: break-all;
        }

        .no-wallet {
          color: var(--text-muted);
        }

        /* Chart Styles */
        .txchart-container {
          background-color: var(--card-bg);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border-primary);
          width: 100%;
          box-sizing: border-box;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .chart-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .chart-stats {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .chart-controls {
          display: flex;
          background: var(--secondary-bg);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-primary);
        }

        .chart-controls button {
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: calc(var(--radius-sm) - 1px);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
          font-weight: 500;
          color: var(--text-muted);
        }

        .chart-controls button.active {
          background: var(--accent-blue);
          color: var(--text-primary);
        }

        .chart-controls button:hover:not(.active) {
          color: var(--text-primary);
          background: rgba(59, 130, 246, 0.1);
        }

        .chart-wrapper {
          height: 300px;
          width: 100%;
          min-width: 0;
        }

        .chart-tooltip {
          background: var(--card-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .tooltip-label {
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
        }

        .tooltip-value {
          color: var(--text-muted);
          margin: 0;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tooltip-indicator {
          width: 8px;
          height: 8px;
          background: var(--accent-blue);
          border-radius: 50%;
        }

        /* Loading state */
        .transactions-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          gap: 1rem;
          background-color: var(--primary-bg);
          min-height: 200px;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
          font-size: 2rem;
          color: var(--accent-blue);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Error state */
        .transactions-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          gap: 1rem;
          background-color: var(--primary-bg);
          min-height: 200px;
        }

        .error-message {
          color: var(--text-primary);
          margin-bottom: 1rem;
          max-width: 100%;
          word-break: break-word;
        }

        .retry-button {
          background-color: var(--card-bg);
          border: 1px solid var(--border-primary);
          color: var(--accent-blue);
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition-base);
        }

        .retry-button:hover {
          background-color: var(--secondary-bg);
          border-color: var(--accent-blue);
        }

        /* Empty state */
        .no-transactions {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          gap: 1rem;
          background-color: var(--primary-bg);
          min-height: 200px;
        }

        /* Transactions table */
        .transactions-table-container {
          width: 100%;
          overflow-x: auto;
          margin-bottom: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          background-color: var(--primary-bg);
          -webkit-overflow-scrolling: touch;
        }

        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          background-color: var(--primary-bg);
          min-width: 600px;
        }

        .transactions-table th,
        .transactions-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-primary);
          color: var(--text-primary);
          background-color: var(--primary-bg);
        }

        .transactions-table th {
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .transactions-table tr:hover {
          background: rgba(59, 130, 246, 0.03);
        }

        /* Table cell specific styling */
        .tx-type-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 120px;
        }

        .tx-icon {
          font-size: 1rem;
          color: var(--accent-blue);
        }

        .amount {
          font-weight: 500;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge.success {
          background-color: rgba(76, 175, 80, 0.2);
          color: var(--text-primary);
        }

        .status-badge.failed {
          background-color: rgba(239, 68, 68, 0.2);
          color: var(--text-primary);
        }

        .explorer-link {
          color: var(--accent-blue);
          font-weight: 500;
          transition: color 0.2s ease;
          text-decoration: none;
        }

        .explorer-link:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        .tx-pfp-container {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background-color: var(--card-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tx-pfp {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .swap-pfp {
          background-color: rgba(59, 130, 246, 0.2);
          color: var(--accent-blue);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .tx-type {
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .tx-contract {
          color: var(--accent-blue);
          font-weight: 500;
        }

        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }

        .pagination-controls button {
          background-color: var(--card-bg);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition-base);
          font-size: 0.875rem;
          min-width: 80px;
          text-align: center;
        }

        .pagination-controls button:hover:not(:disabled) {
          background-color: var(--accent-blue);
          border-color: var(--accent-blue);
        }

        .pagination-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-controls span {
          color: var(--text-muted);
          font-size: 0.875rem;
          min-width: 120px;
          text-align: center;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .chart-controls {
            width: 100%;
            justify-content: center;
          }
          
          .pagination-controls {
            flex-direction: column;
            gap: 0.5rem;
          }

          .pagination-controls button {
            width: 100%;
          }

          .transactions-table th,
          .transactions-table td {
            padding: 0.75rem 0.5rem;
          }

          .tx-type-container {
            gap: 0.5rem;
          }

          .tx-pfp-container {
            width: 24px;
            height: 24px;
          }
        }

        @media (max-width: 480px) {
          .profiz-transaction-hub {
            padding: 0.5rem;
          }

          .transactions-container {
            padding: 0.5rem;
          }

          .txchart-container {
            padding: 1rem;
          }

          .chart-title {
            font-size: 1rem;
          }

          .chart-controls button {
            padding: 0.5rem;
            font-size: 0.75rem;
          }

          .transactions-table {
            font-size: 0.8rem;
          }

          .transactions-table th,
          .transactions-table td {
            padding: 0.5rem 0.25rem;
          }
        }
      `}</style>

      <div className="profiz-transaction-hub">
        <div className="transactions-container">
          <div className="transactions-header">
            {walletAddress && (
              <div className="wallet-address-display">
                Wallet: {truncateAddress(walletAddress)}
              </div>
            )}
          </div>

          {/* Monthly Transaction Chart with Recharts */}
          <div className="txchart-container">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Monthly Transaction Activity - 2025</h3>
                <p className="chart-stats">
                  Total: {totalTransactionsCount} transactions
                </p>
              </div>
              <div className="chart-controls">
                <button 
                  className={chartType === 'bar' ? 'active' : ''}
                  onClick={() => setChartType('bar')}
                >
                  Bar
                </button>
                <button 
                  className={chartType === 'line' ? 'active' : ''}
                  onClick={() => setChartType('line')}
                >
                  Line
                </button>
                <button 
                  className={chartType === 'area' ? 'active' : ''}
                  onClick={() => setChartType('area')}
                >
                  Area
                </button>
              </div>
            </div>
            
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </div>

          {loading ? (
            <div className="transactions-loading">
              <div className="spinner-icon">⟳</div>
              <p>Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="transactions-error">
              <p className="error-message">{error}</p>
              <button 
                className="retry-button"
                onClick={() => fetchTransactions(currentPage)}
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions found</p>
            </div>
          ) : (
            <>
              <div className="transactions-table-container">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Timestamp</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.hash}>
                        <td>
                          <div className="tx-type-container">
                            {getTransactionTypeIcon(tx.type, tx.sender)}
                            <span className="tx-type">{tx.type}</span>
                          </div>
                        </td>
                        <td>{tx.timestamp}</td>
                        <td>{truncateAddress(tx.sender)}</td>
                        <td>{truncateAddress(tx.recipient || '[Unknown]')}</td>
                        <td className="amount">{tx.amount || '0'}</td>
                        <td>
                          <div className={`status-badge ${tx.status.toLowerCase()}`}>
                            {tx.status}
                          </div>
                        </td>
                        <td>
                          <a 
                            href={`${EXPLORER_BASE_URL}/txn/${tx.hash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="explorer-link"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}