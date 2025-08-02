export interface TokenMetadata {
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

export interface TokenMetadataMap {
  [key: string]: TokenMetadata;
}