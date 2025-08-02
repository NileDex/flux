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

const movementTokens = tokenMetadata as TokenMetadataMap;

export const usePortfolioTotal = () => {
  const { address } = useAccount();
  const [portfolioTotal, setPortfolioTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovePrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=movement&vs_currencies=usd"
      );
      const data = await response.json();
      return data.movement?.usd || null;
    } catch (error) {
      console.error("Error fetching MOVE price:", error);
      return null;
    }
  };

  const fetchPortfolioTotal = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching portfolio total for address:', walletAddress);
      
      const currentMovePrice = await fetchMovePrice();
      
      const query = `
        query GetFungibleAssetBalances($owner: String!) {
          current_fungible_asset_balances(where: { owner_address: { _eq: $owner } }) {
            asset_type
            amount
            metadata {
              name
              symbol
              decimals
            }
          }
        }
      `;

      const response = await fetch('https://indexer.mainnet.movementnetwork.xyz/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { owner: walletAddress }
        })
      });

      const result = await response.json();
      console.log('📊 Portfolio GraphQL Response:', result);

      if (result.errors) {
        console.error('❌ Portfolio GraphQL Errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      const balances = result.data.current_fungible_asset_balances;
      let totalValue = 0;
      
      balances.forEach((balance: any) => {
        const tokenMeta = movementTokens[balance.asset_type] || {};
        const decimals = balance.metadata?.decimals || tokenMeta.decimals || 0;
        const amount = parseFloat(balance.amount) / (10 ** decimals);
        const symbol = balance.metadata?.symbol || tokenMeta.symbol || 'UNKNOWN';
        
        let value = 0;
        
        if (symbol === 'USDC' || symbol === 'USDC.e' || symbol === 'USDT' || symbol === 'USDT.e') {
          value = amount;
        } else if (symbol === 'MOVE') {
          value = currentMovePrice ? amount * currentMovePrice : 0;
        }
        // Other tokens have no price data, so value = 0
        
        totalValue += value;
      });

      console.log('💰 Total Portfolio Value:', totalValue);
      setPortfolioTotal(totalValue);
      setLoading(false);

    } catch (err) {
      console.error('❌ Error fetching portfolio total:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('👛 Portfolio Wallet Address Changed:', address);
    if (address) {
      fetchPortfolioTotal(address);
    } else {
      console.log('👛 No wallet address, resetting portfolio to 0');
      setPortfolioTotal(0);
      setLoading(false);
    }
  }, [address]);

  console.log('📈 Current Portfolio Total State:', { portfolioTotal, loading, error, address });

  return {
    portfolioTotal,
    loading,
    error,
    refetch: () => address && fetchPortfolioTotal(address)
  };
}; 