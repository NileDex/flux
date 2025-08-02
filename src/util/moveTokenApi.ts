export interface MoveTokenData {
  id: string;
  name: string;
  symbol: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
  };
}

export const fetchMoveTokenData = async (): Promise<MoveTokenData | null> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/movement'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Move token data');
    }
    
    const data: MoveTokenData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Move token data:', error);
    return null;
  }
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(price);
};

export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}; 