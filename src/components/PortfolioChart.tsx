import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { usePortfolioHistory } from './hooks/usePortfolioHistory';

const PortfolioChart: React.FC = () => {
  const [timeframe] = useState<'7d'>('7d'); // Only 7d timeframe
  const { portfolioData, loading, error } = usePortfolioHistory(timeframe);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-value">
            {formatCurrency(payload[0].value)}
          </p>
          <p className={`tooltip-change ${payload[0].payload.change >= 0 ? 'positive' : 'negative'}`}>
            {payload[0].payload.change >= 0 ? '+' : ''}{payload[0].payload.change}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tick formatter for XAxis to show proper dates
  const formatXAxisTick = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading && portfolioData.length === 0) {
    return (
      <div className="portfolio-chart-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-chart-container">
        <div className="error-state">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (portfolioData.length === 0 && !loading) {
    return (
      <div className="portfolio-chart-container">
        <div className="empty-state">
          <p>Connect your wallet to view portfolio analytics</p>
        </div>
      </div>
    );
  }

  const currentValue = portfolioData[portfolioData.length - 1]?.value || 0;
  const previousValue = portfolioData[portfolioData.length - 2]?.value || 0;
  const totalChange = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  return (
    <div className="portfolio-chart-container">
      <div className="chart-header">
        <div className="chart-title-section">
          <h2>Portfolio Performance</h2>
          <div className="portfolio-summary">
            <div className="current-value">
              <span className="value-label">Current Value</span>
              <span className="value-amount">{formatCurrency(currentValue)}</span>
            </div>
            <div className={`value-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
              <span className="change-amount">
                {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
              </span>
              <span className="change-period">vs yesterday</span>
            </div>
          </div>
        </div>
        
        <div className="timeframe-display">
          <span className="timeframe-label">Last 7 Days</span>
        </div>
      </div>

      <div className="chart-wrapper">
        {loading && portfolioData.length > 0 && (
          <div className="chart-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={portfolioData}
            margin={{ 
              top: 10, 
              right: window.innerWidth < 768 ? 10 : 20, 
              left: window.innerWidth < 768 ? 0 : 10, 
              bottom: 10 
            }}
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={formatXAxisTick}
              stroke="#64748b"
              fontSize={window.innerWidth < 768 ? 10 : 12}
              tickLine={false}
              axisLine={false}
              interval={window.innerWidth < 480 ? 1 : 0}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={window.innerWidth < 768 ? 10 : 12}
              tickLine={false}
              axisLine={false}
              tickFormatter={window.innerWidth < 768 ? formatCurrencyCompact : formatCurrency}
              width={window.innerWidth < 768 ? 50 : 80}
            />
            <Tooltip 
              content={<CustomTooltip />}
              labelFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={window.innerWidth < 768 ? 1.5 : 2}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ r: window.innerWidth < 768 ? 3 : 4, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .portfolio-chart-container {
          width: 100%;
          background:#090f1b;
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(20px);
          margin-top: 1rem;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 16px;
        }

        .chart-title-section h2 {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .portfolio-summary {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .current-value {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .value-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .value-amount {
          color: #ffffff;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .value-change {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }

        .change-amount {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .change-period {
          color: #64748b;
          font-size: 0.75rem;
        }

        .value-change.positive .change-amount {
          color: #10b981;
        }

        .value-change.negative .change-amount {
          color: #ef4444;
        }

        .timeframe-display {
          display: flex;
          align-items: center;
        }

        .timeframe-label {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          color: #3b82f6;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .chart-wrapper {
          position: relative;
          width: 100%;
          height: 350px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 16px;
        }

        .chart-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(26, 31, 46, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          z-index: 10;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-state p,
        .error-state p,
        .empty-state p {
          color: #64748b;
          font-size: 1rem;
          margin: 16px 0 0 0;
        }

        .custom-tooltip {
          background: rgba(26, 31, 46, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          padding: 12px;
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .tooltip-date {
          color: #64748b;
          font-size: 0.75rem;
          margin: 0 0 4px 0;
        }

        .tooltip-value {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .tooltip-change {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0;
        }

        .tooltip-change.positive {
          color: #10b981;
        }

        .tooltip-change.negative {
          color: #ef4444;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .portfolio-chart-container {
            padding: 16px;
            margin-bottom: 16px;
          }

          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
          }

          .chart-title-section h2 {
            font-size: 1.25rem;
            margin-bottom: 12px;
          }

          .portfolio-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            width: 100%;
          }

          .value-change {
            align-items: flex-start;
          }

          .value-amount {
            font-size: 1.5rem;
          }

          .change-amount {
            font-size: 1rem;
          }

          .chart-wrapper {
            height: 280px;
            padding: 12px;
          }

          .timeframe-label {
            padding: 6px 12px;
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .portfolio-chart-container {
            padding: 12px;
            border-radius: 8px;
          }

          .chart-title-section h2 {
            font-size: 1.125rem;
          }

          .portfolio-summary {
            gap: 8px;
          }

          .value-amount {
            font-size: 1.25rem;
          }

          .chart-wrapper {
            height: 240px;
            padding: 8px;
          }

          .custom-tooltip {
            padding: 8px;
          }

          .tooltip-value {
            font-size: 0.875rem;
          }

          .tooltip-change {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 320px) {
          .chart-wrapper {
            height: 200px;
          }

          .value-amount {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PortfolioChart;