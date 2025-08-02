import { useState, useEffect } from 'react';
import { gql } from 'graphql-request';
import { createClient } from '../util/graphqlClient';
import { FaCoins, FaChartLine, FaExchangeAlt, FaBox } from 'react-icons/fa';

interface WalletStatsData {
  movement: {
    wallet_stats: {
      holdings_listed_count: number | string;
      holdings_count: number | string;
      value: number | string;
      usd_value: number | string;
      bought_volume: number | string;
      bought_usd_volume: number | string;
      sold_volume: number | string;
      sold_usd_volume: number | string;
      realized_profit_loss: number | string;
      realized_usd_profit_loss: number | string;
      unrealized_profit_loss: number | string;
      unrealized_usd_profit_loss: number | string;
    };
  };
}

interface WalletStatsProps {
  walletAddress: string;
}

const parseNumber = (value: number | string): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

const formatValue = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const WalletStats = ({ walletAddress }: WalletStatsProps) => {
  const [stats, setStats] = useState<WalletStatsData['movement']['wallet_stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletStats = async () => {
      try {
        setLoading(true);
        const client = createClient();
        
        const query = gql`
          query fetchWalletStats($wallet: String!) {
            movement {
              wallet_stats(address: $wallet) {
                holdings_listed_count
                holdings_count
                value
                usd_value
                bought_volume
                bought_usd_volume
                sold_volume
                sold_usd_volume
                realized_profit_loss
                realized_usd_profit_loss
                unrealized_profit_loss
                unrealized_usd_profit_loss
              }
            }
          }
        `;

        const response = await client.request<WalletStatsData>(query, {
          wallet: walletAddress
        });
        
        setStats(response.movement.wallet_stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchWalletStats();
    }
  }, [walletAddress]);

  if (loading) return <div className="stats-loading">Loading wallet stats...</div>;
  if (error) return <div className="stats-error">Error: {error}</div>;
  if (!stats) return <div className="stats-no-data">No wallet stats found</div>;

  return (
    <div className="wallet-stats-container">
      <h2 className="stats-title">
        <FaChartLine size={20} />
        Wallet Statistics
      </h2>
      
      <div className="stats-grid">
        {/* Holdings */}
        <div className="stat-card">
          <h3>
            <FaBox size={16} />
            Holdings
          </h3>
          <div className="stat-value">{parseNumber(stats.holdings_count)}</div>
          <div className="stat-label">Total Assets</div>
        </div>
        
        <div className="stat-card">
          <h3>
            <FaExchangeAlt size={16} />
            Listed
          </h3>
          <div className="stat-value">{parseNumber(stats.holdings_listed_count)}</div>
          <div className="stat-label">For Sale</div>
        </div>
        
        {/* Portfolio Value */}
        <div className="stat-card">
          <h3>
            <FaCoins size={16} />
            Portfolio Value
          </h3>
          <div className="stat-value">${formatValue(parseNumber(stats.usd_value))}</div>
          <div className="stat-label">{formatValue(parseNumber(stats.value))} MOVE</div>
        </div>
        
        {/* Trading Volume */}
        <div className="stat-card">
          <h3>Bought Volume</h3>
          <div className="stat-value">${formatValue(parseNumber(stats.bought_usd_volume))}</div>
          <div className="stat-label">{formatValue(parseNumber(stats.bought_volume))} MOVE</div>
        </div>
        
        <div className="stat-card">
          <h3>Sold Volume</h3>
          <div className="stat-value">${formatValue(parseNumber(stats.sold_usd_volume))}</div>
          <div className="stat-label">{formatValue(parseNumber(stats.sold_volume))} MOVE</div>
        </div>
        
        {/* Profit/Loss */}
        <div className="stat-card">
          <h3>Realized P/L</h3>
          <div className={`stat-value ${
            parseNumber(stats.realized_usd_profit_loss) >= 0 ? 'positive' : 'negative'
          }`}>
            ${formatValue(parseNumber(stats.realized_usd_profit_loss))}
          </div>
          <div className="stat-label">
            {formatValue(parseNumber(stats.realized_profit_loss))} MOVE
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Unrealized P/L</h3>
          <div className={`stat-value ${
            parseNumber(stats.unrealized_usd_profit_loss) >= 0 ? 'positive' : 'negative'
          }`}>
            ${formatValue(parseNumber(stats.unrealized_usd_profit_loss))}
          </div>
          <div className="stat-label">
            {formatValue(parseNumber(stats.unrealized_profit_loss))} MOVE
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletStats;