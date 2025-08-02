import { useState, useEffect } from 'react';
import { useAccount } from "@razorlabs/razorkit";
import { FiChevronDown, FiSearch, FiChevronUp } from 'react-icons/fi';
import { PieChart } from '@mui/x-charts/PieChart';
import tokenMetadata from './tokenMetadata.json';

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

interface TokenData {
  symbol: string;
  name: string;
  wallet: string;
  amount: number;
  value: number;
  assetType?: string;
  price?: number | null;
}

interface AssetData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface PortfolioData {
  netWorth: number;
  assets: AssetData[];
  tokens: TokenData[];
  defiTokens: TokenData[];
}

const movementTokens = tokenMetadata as TokenMetadataMap;

const TokenLogo = ({ symbol, size = 24 }: {
  symbol: string;
  size?: number
}) => {
  const tokenData = Object.values(movementTokens).find(
    t => t.symbol.toLowerCase() === symbol.toLowerCase()
  );

  const logoUrl = tokenData?.logoUrl;
  const initials = symbol?.slice(0, 2).toUpperCase();

  return (
    <div className="pd-token-logo" style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: logoUrl ? 'transparent' : '#eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={symbol}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = '';
            target.style.display = 'none';
          }}
        />
      ) : (
        <span style={{
          fontSize: size * 0.5,
          fontWeight: 'bold',
          color: '#333'
        }}>
          {initials}
        </span>
      )}
    </div>
  );
};

const NetworthDistribution = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    netWorth: 0,
    assets: [
      { name: 'Defi', value: 0, color: '#10B981', percentage: 0 },
      { name: 'Tokens', value: 0, color: '#3B82F6', percentage: 0 },
      { name: 'NFTs', value: 0, color: '#8B5CF6', percentage: 0 },
      { name: 'Staked', value: 0, color: '#EC4899', percentage: 0 }
    ],
    tokens: [],
    defiTokens: []
  });
  const [nftCount, setNftCount] = useState(0);
  const [tokensCollapsed, setTokensCollapsed] = useState(false);
  const [defiTokensCollapsed, setDefiTokensCollapsed] = useState(false);

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

  const fetchNftStats = async (walletAddress: string) => {
    try {
      const query = `
        query GetAccountNfts($address: String) {
          current_token_ownerships_v2(
            where: {owner_address: {_eq: $address}, amount: {_gt: "0"}}
          ) {
            current_token_data {
              collection_id
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
          variables: { address: walletAddress }
        })
      });

      const result = await response.json();
      const nftData = result.data?.current_token_ownerships_v2 || [];
      setNftCount(nftData.length);
    } catch (err) {
      console.error('Error fetching NFT stats:', err);
    }
  };

  const fetchTokenBalances = async (walletAddress: string) => {
    try {
      setLoading(true);

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

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const balances = result.data.current_fungible_asset_balances;
      let totalTokenValue = 0;
      let totalDefiValue = 0;

      const tokens: TokenData[] = [];
      const defiTokens: TokenData[] = [];

      balances.forEach((balance: any) => {
        const tokenMeta = movementTokens[balance.asset_type] || {};
        const decimals = balance.metadata?.decimals || tokenMeta.decimals || 0;
        const amount = parseFloat(balance.amount) / (10 ** decimals);
        const symbol = balance.metadata?.symbol || tokenMeta.symbol || 'UNKNOWN';

        let price: number | null = null;
        let value = 0;

        if (symbol === 'USDC' || symbol === 'USDC.e' || symbol === 'USDT' || symbol === 'USDT.e') {
          price = 1;
          value = amount;
        } else if (symbol === 'MOVE') {
          price = currentMovePrice;
          value = currentMovePrice ? amount * currentMovePrice : 0;
        } else {
          price = null;
          value = 0;
        }

        const tokenData = {
          symbol,
          name: balance.metadata?.name || tokenMeta.name || 'Unknown Token',
          wallet: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
          amount,
          value,
          price,
          assetType: balance.asset_type
        };

        if (symbol.startsWith('cv') || symbol.includes('LP')) {
          defiTokens.push(tokenData);
          totalDefiValue += value;
        } else {
          tokens.push(tokenData);
          totalTokenValue += value;
        }
      });

      setPortfolioData({
        netWorth: totalTokenValue + totalDefiValue,
        assets: [
          {
            name: 'Defi',
            value: totalDefiValue,
            color: '#10B981',
            percentage: totalDefiValue > 0 ? (totalDefiValue / (totalTokenValue + totalDefiValue)) * 100 : 0
          },
          {
            name: 'Tokens',
            value: totalTokenValue,
            color: '#3B82F6',
            percentage: totalTokenValue > 0 ? (totalTokenValue / (totalTokenValue + totalDefiValue)) * 100 : 0
          },
          {
            name: 'NFTs',
            value: 0,
            color: '#8B5CF6',
            percentage: 0
          },
          {
            name: 'Staked',
            value: 0,
            color: '#EC4899',
            percentage: 0
          }
        ],
        tokens,
        defiTokens
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchTokenBalances(address);
      fetchNftStats(address);
    }
  }, [address]);

  const chartData = portfolioData.assets
    .filter(asset => asset.value > 0 ||
      (asset.name === 'Defi' && portfolioData.defiTokens.length > 0) ||
      (asset.name === 'Tokens' && portfolioData.tokens.length > 0) ||
      (asset.name === 'NFTs' && nftCount > 0)
    )
    .map((asset, index) => {
      const count = index === 0
        ? portfolioData.defiTokens.length
        : index === 1
          ? portfolioData.tokens.length
          : nftCount;
      // Mix value and count by using a weighted average
      const mixedValue = asset.value + (count * 0.1); // Add count as a small weight
      return {
        id: index,
        value: mixedValue,
        color: asset.color,
        stroke: 'none'
      };
    });


  if (loading) return <div className="pd-container">Loading...</div>;
  if (error) return <div className="pd-container">Error: {error}</div>;

  return (
    <div className="pd-container">
      <div className="pd-header">
        <div>
          <h1 className="pd-title">Net Worth</h1>
          <div className="pd-net-worth">${portfolioData.netWorth.toFixed(2)}</div>
        </div>
      </div>

      <div className="pd-main-content">
        <div className="pd-left-panel">
          <div className="pd-section-header">
            <h2 className="pd-section-title">Asset Distribution</h2>
          </div>

          <div className="pd-asset-list">
            {portfolioData.assets.map((asset, index) => (
              <div key={index} className="pd-asset-item">
                <div className="pd-asset-info">
                  <div
                    className="pd-color-dot"
                    style={{ backgroundColor: asset.color }}
                  ></div>
                  <span className="pd-asset-value">
                    {asset.name === 'Staked'
                      ? '-'
                      : index === 0
                        ? `${portfolioData.defiTokens.length} | $${asset.value.toFixed(2)}`
                        : index === 1
                          ? `${portfolioData.tokens.length} | $${asset.value.toFixed(2)}`
                          : `${nftCount} | $${asset.value.toFixed(2)}`}
                  </span>
                </div>
                <span className="pd-asset-name">{asset.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pd-right-panel">
          <div className="pd-chart-header">
            <h2 className="pd-section-title">Asset Breakdown</h2>
          </div>

          <div className="pd-chart-container">
            {chartData.length > 0 ? (
              <div className="pie-chart-no-stroke">
                <PieChart
                  series={[{
                    data: chartData,
                    innerRadius: 83,
                    outerRadius: 130,
                    paddingAngle: 2,
                    cornerRadius: 15,
                    startAngle: -45,
                    endAngle: 225,
                    cx: 150,
                    cy: 150,
                  }]}
                  width={300}
                  height={300}
                />
              </div>
            ) : (
              <div>No data to display</div>
            )}

            <div className="pd-legend">
              {portfolioData.assets.map((asset, index) => {
                const count = index === 0
                  ? portfolioData.defiTokens.length
                  : index === 1
                    ? portfolioData.tokens.length
                    : nftCount;

                return (
                  <div key={index} className="pd-legend-item">
                    <div
                      className="pd-legend-dot"
                      style={{ backgroundColor: asset.color }}
                    ></div>
                    <span className="pd-legend-text">
                      {asset.name} ({asset.name === 'Staked' ? '0' : count} | ${asset.name === 'Staked' ? '0' : asset.value.toFixed(2)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {portfolioData.tokens.length > 0 && (
        <div className="pd-section">
          <div className="pd-tokens-header">
            <div className="pd-section-header">
              <h2 className="pd-section-title">Tokens</h2>
              <button
                className="pd-collapse-button"
                onClick={() => setTokensCollapsed(!tokensCollapsed)}
              >
                {tokensCollapsed ? <FiChevronDown /> : <FiChevronUp />}
              </button>
            </div>
            <div className="pd-tokens-value">${portfolioData.assets[1].value.toFixed(2)}</div>
          </div>

          {!tokensCollapsed && (
            <div className="pd-table-container">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <FiSearch size={16} className="pd-search-icon" />
                        <span>Asset</span>
                      </div>
                    </th>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <span>Wallet</span>
                      </div>
                    </th>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <span>Amount</span>
                      </div>
                    </th>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <span>Value</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.tokens.map((token, index) => (
                    <tr key={index} className="pd-token-row">
                      <td className="pd-token-cell">
                        <div className="pd-token-info">
                          <TokenLogo symbol={token.symbol} size={24} />
                          <div className="pd-token-details">
                            <span className="pd-token-symbol">{token.symbol}</span>
                            <span className="pd-token-name">{token.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="pd-wallet-cell">{token.wallet}</td>
                      <td className="pd-amount-cell">{token.amount.toFixed(6)}</td>
                      <td className="pd-value-cell">
                        {token.price !== null ? `$${token.value.toFixed(2)}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {portfolioData.defiTokens.length > 0 && (
        <div className="pd-section">
          <div className="pd-tokens-header">
            <div className="pd-section-header">
              <h2 className="pd-section-title">DeFi Tokens</h2>
              <button
                className="pd-collapse-button"
                onClick={() => setDefiTokensCollapsed(!defiTokensCollapsed)}
              >
                {defiTokensCollapsed ? <FiChevronDown /> : <FiChevronUp />}
              </button>
            </div>
            <div className="pd-tokens-value">${portfolioData.assets[0].value.toFixed(2)}</div>
          </div>

          {!defiTokensCollapsed && (
            <div className="pd-table-container">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <FiSearch size={16} className="pd-search-icon" />
                        <span>Asset</span>
                      </div>
                    </th>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <span>Wallet</span>
                      </div>
                    </th>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <span>Amount</span>
                      </div>
                    </th>
                    <th className="pd-table-header-cell">
                      <div className="pd-table-header-content">
                        <span>Value</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.defiTokens.map((token, index) => (
                    <tr key={index} className="pd-token-row">
                      <td className="pd-token-cell">
                        <div className="pd-token-info">
                          <TokenLogo symbol={token.symbol} size={24} />
                          <div className="pd-token-details">
                            <span className="pd-token-symbol">{token.symbol}</span>
                            <span className="pd-token-name">{token.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="pd-wallet-cell">{token.wallet}</td>
                      <td className="pd-amount-cell">{token.amount.toFixed(6)}</td>
                      <td className="pd-value-cell">
                        {token.price !== null ? `$${token.value.toFixed(2)}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworthDistribution;