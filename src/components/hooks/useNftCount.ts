import { useState, useEffect } from 'react';
import { useAccount } from "@razorlabs/razorkit";



export const useNftCount = () => {
  const { address } = useAccount();
  const [nftCount, setNftCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNftCount = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching NFT count for address:', walletAddress);
      
      const query = `
        query GetAccountNfts($address: String) {
          current_token_ownerships_v2(
            where: {owner_address: {_eq: $address}, amount: {_gt: "0"}}
          ) {
            current_token_data {
              collection_id
              largest_property_version_v1
              current_collection {
                collection_id
                collection_name
                description
                creator_address
                uri
              }
              description
              token_name
              token_data_id
              token_standard
              token_uri
            }
            owner_address
            amount
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
      console.log('📊 GraphQL Response:', result);

      if (result.errors) {
        console.error('❌ GraphQL Errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      const nftData = result.data.current_token_ownerships_v2 || [];
      console.log('🎨 NFT Data Length:', nftData.length);
      console.log('🎨 NFT Data Sample:', nftData.slice(0, 2));
      
      setNftCount(nftData.length);
      setLoading(false);

    } catch (err) {
      console.error('❌ Error fetching NFT count:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('👛 Wallet Address Changed:', address);
    if (address) {
      fetchNftCount(address);
    } else {
      console.log('👛 No wallet address, resetting count to 0');
      setNftCount(0);
      setLoading(false);
    }
  }, [address]);

  console.log('📈 Current NFT Count State:', { nftCount, loading, error, address });

  return {
    nftCount,
    loading,
    error,
    refetch: () => address && fetchNftCount(address)
  };
}; 