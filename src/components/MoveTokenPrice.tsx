import React, { useState, useEffect } from 'react';
import { fetchMoveTokenData, formatPrice, formatPercentage, MoveTokenData } from '../util/moveTokenApi';

const MoveTokenPrice: React.FC = () => {
  const [priceData, setPriceData] = useState<MoveTokenData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchMoveTokenData();
        setPriceData(data);
      } catch (error) {
        console.error('Error fetching Move token data:', error);
      }
    };

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!priceData) {
    return null;
  }

  return (
    <div className="move-token-price">
      <div className="token-info">
        <img 
          src={priceData.image.small}
          alt={priceData.name}
          className="token-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span className="token-name">{priceData.symbol.toUpperCase()}</span>
      </div>
      <span className="price">
        {formatPrice(priceData.market_data.current_price.usd)}
      </span>
      <span 
        className={`price-change ${
          priceData.market_data.price_change_percentage_24h >= 0 
            ? 'positive' 
            : 'negative'
        }`}
      >
        {formatPercentage(priceData.market_data.price_change_percentage_24h)}
      </span>
      
      <style>{`
        .move-token-price {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 4px 8px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: var(--radius-sm);
          transition: all var(--transition-base);
        }
        
        .move-token-price:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .token-info {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .token-logo {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          object-fit: contain;
        }
        
        .token-name {
          color: var(--accent-blue);
          font-weight: 600;
          letter-spacing: 0.25px;
          font-size: 0.7rem;
        }
        
        .price {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.7rem;
        }
        
        .price-change {
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
          font-size: 0.6rem;
          font-weight: 600;
        }
        
        .price-change.positive {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .price-change.negative {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        @media (max-width: 768px) {
          .move-token-price {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MoveTokenPrice;