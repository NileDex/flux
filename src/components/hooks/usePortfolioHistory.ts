import { useState, useEffect } from 'react';
import { useAccount } from "@razorlabs/razorkit";
import tokenMetadata from '../tokenMetadata.json';

interface TokenMetadata {
  chainId: number;
  tokenAddress: string | null;
  faAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  bridge: string | null;
  logoUrl: string;
  websiteUrl: string;
  coinGeckoId: string | null;
  coinMarketCapId: number | null;
}

interface TokenMetadataMap {
  [key: string]: TokenMetadata;
}

interface PortfolioDataPoint {
  date: string;
  timestamp: number;
  value: number;
  change: number;
}

interface DailyBalanceSnapshot {
  [assetType: string]: number;
}

const movementTokens = tokenMetadata as TokenMetadataMap;

export const usePortfolioHistory = (timeframe: '7d' | '30d' | '90d') => {
  const { address } = useAccount();
  const [portfolioData, setPortfolioData] = useState<PortfolioDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovePrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=movement&vs_currencies=usd"
      );
      const data = await response.json();
      return data.movement?.usd || 0;
    } catch (error) {
      console.error("Error fetching MOVE price:", error);
      return 0;
    }
  };

  const getFungibleAssetActivities = async (walletAddress: string, days: number) => {
    try {
      const startDate = new Date(Date.now() - (days + 1) * 24 * 60 * 60 * 1000);
      const startTime = startDate.toISOString();

      const response = await fetch('https://indexer.mainnet.movementnetwork.xyz/v1/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetFungibleAssetActivities($owner: String!, $startTime: timestamp!) {
              fungible_asset_activities(
                where: {
                  owner_address: { _eq: $owner },
                  transaction_timestamp: { _gte: $startTime },
                  type: { _nin: ["0x1::aptos_coin::GasFeeEvent"] }
                },
                order_by: { transaction_timestamp: asc }
              ) {
                transaction_timestamp
                amount
                type
                asset_type
                metadata {
                  symbol
                  decimals
                }
              }
            }
          `,
          variables: { owner: walletAddress, startTime }
        }),
      });

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);
      return result.data?.fungible_asset_activities || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  };

  const getCurrentBalances = async (walletAddress: string) => {
    try {
      const response = await fetch('https://indexer.mainnet.movementnetwork.xyz/v1/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetCurrentBalances($owner: String!) {
              current_fungible_asset_balances(where: { owner_address: { _eq: $owner } }) {
                asset_type
                amount
                metadata {
                  symbol
                  decimals
                }
              }
            }
          `,
          variables: { owner: walletAddress }
        }),
      });

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);

      const movePrice = await fetchMovePrice();
      const balances: DailyBalanceSnapshot = {};
      let totalValue = 0;

      result.data.current_fungible_asset_balances.forEach((balance: any) => {
        const tokenMeta = movementTokens[balance.asset_type] || {};
        const decimals = balance.metadata?.decimals || tokenMeta.decimals || 8;
        const amount = parseFloat(balance.amount) / (10 ** decimals);
        const symbol = balance.metadata?.symbol || tokenMeta.symbol || 'UNKNOWN';
        
        let value = 0;
        if (['USDC', 'USDC.e', 'USDT', 'USDT.e'].includes(symbol)) {
          value = amount; // Stablecoins at $1
        } else if (symbol === 'MOVE') {
          value = amount * movePrice;
        }
        // Other tokens contribute $0 to total value
        
        balances[balance.asset_type] = amount;
        totalValue += value;
      });

      return { balances, totalValue };
    } catch (error) {
      console.error('Error fetching balances:', error);
      return { balances: {}, totalValue: 0 };
    }
  };

  const buildHistoricalBalances = async (activities: any[], currentBalances: DailyBalanceSnapshot, days: number) => {
    const movePrice = await fetchMovePrice();
    let workingBalances = { ...currentBalances };
    
    // Calculate current total value
    let workingTotalValue = Object.entries(workingBalances).reduce((sum, [assetType, amount]) => {
      const tokenMeta = movementTokens[assetType] || {};
      const symbol = tokenMeta.symbol || '';
      let value = 0;
      if (['USDC', 'USDC.e', 'USDT', 'USDT.e'].includes(symbol)) {
        value = amount;
      } else if (symbol === 'MOVE') {
        value = amount * movePrice;
      }
      return sum + value;
    }, 0);

    const dailyValues: { [timestamp: number]: number } = {};
    const activitiesByDay: { [dayTimestamp: number]: any[] } = {};

    // Group activities by day
    activities.forEach(activity => {
      const activityDate = new Date(activity.transaction_timestamp);
      const dayTimestamp = new Date(
        activityDate.getFullYear(),
        activityDate.getMonth(),
        activityDate.getDate()
      ).getTime();
      
      if (!activitiesByDay[dayTimestamp]) {
        activitiesByDay[dayTimestamp] = [];
      }
      activitiesByDay[dayTimestamp].push(activity);
    });

    // Process each day from most recent to oldest
    for (let i = 0; i <= days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayTimestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).getTime();

      // Store current value for this day
      dailyValues[dayTimestamp] = workingTotalValue;

      // Process activities for this day (in reverse order)
      const dayActivities = activitiesByDay[dayTimestamp] || [];
      dayActivities.reverse().forEach(activity => {
        const assetType = activity.asset_type;
        const tokenMeta = movementTokens[assetType] || {};
        const decimals = activity.metadata?.decimals || tokenMeta.decimals || 8;
        const amount = parseFloat(activity.amount) / (10 ** decimals);
        const symbol = activity.metadata?.symbol || tokenMeta.symbol || 'UNKNOWN';
        const activityType = activity.type;

        if (!workingBalances[assetType]) {
          workingBalances[assetType] = 0;
        }

        let valueChange = 0;
        if (['USDC', 'USDC.e', 'USDT', 'USDT.e'].includes(symbol)) {
          valueChange = activityType?.includes('Withdraw') || 
                       activityType?.includes('Burn') ||
                       (activityType?.includes('Transfer') && !activityType?.includes('Receive')) 
                       ? amount : -amount;
        } else if (symbol === 'MOVE') {
          valueChange = (activityType?.includes('Withdraw') || 
                        activityType?.includes('Burn') ||
                        (activityType?.includes('Transfer') && !activityType?.includes('Receive')) 
                        ? amount : -amount) * movePrice;
        }

        if (activityType?.includes('Deposit') || 
            activityType?.includes('Mint') ||
            (activityType?.includes('Transfer') && activityType?.includes('Receive'))) {
          workingBalances[assetType] -= amount;
          workingTotalValue -= valueChange;
        } else {
          workingBalances[assetType] += amount;
          workingTotalValue += valueChange;
        }

        if (workingBalances[assetType] < 0) {
          workingTotalValue += workingBalances[assetType] * (symbol === 'MOVE' ? movePrice : 1);
          workingBalances[assetType] = 0;
        }
      });
    }

    // Convert to chronological order with formatted dates
    const historicalData: PortfolioDataPoint[] = [];
    let lastValue = 0;

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayTimestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).getTime();

      const dayValue = dailyValues[dayTimestamp] || 0;
      const roundedValue = Math.round(dayValue * 100) / 100;
      const change = lastValue ? ((roundedValue - lastValue) / lastValue) * 100 : 0;

      historicalData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: dayTimestamp,
        value: roundedValue,
        change: Math.round(change * 100) / 100
      });

      lastValue = roundedValue;
    }

    return historicalData;
  };

  const generateHistoricalData = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;

      const [{ balances, totalValue }, activities] = await Promise.all([
        getCurrentBalances(walletAddress),
        getFungibleAssetActivities(walletAddress, days)
      ]);

      if (activities.length === 0) {
        // Create flat line with current value
        const flatData = Array.from({ length: days + 1 }, (_, i) => {
          const date = new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000);
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp: date.getTime(),
            value: Math.round(totalValue * 100) / 100,
            change: 0
          };
        });
        setPortfolioData(flatData);
        return;
      }

      const historicalData = await buildHistoricalBalances(activities, balances, days);
      setPortfolioData(historicalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) generateHistoricalData(address);
    else setPortfolioData([]);
  }, [address, timeframe]);

  return { portfolioData, loading, error, refetch: () => address && generateHistoricalData(address) };
};