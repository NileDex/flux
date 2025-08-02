import { useState, useEffect } from 'react';
import { useAccount } from "@razorlabs/razorkit";

interface NftData {
  collection_id: string;
  largest_property_version_v1: string;
  current_collection: {
    collection_id: string;
    collection_name: string;
    description: string;
    creator_address: string;
    uri: string;
  };
  description: string;
  token_name: string;
  token_data_id: string;
  token_standard: string;
  token_uri: string;
}

interface NftOwnership {
  current_token_data: NftData;
  owner_address: string;
  amount: string;
}

export const useCollectionsCount = () => {
  const { address } = useAccount();
  const [collectionsCount, setCollectionsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollectionsCount = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏛️ Fetching collections count for address:', walletAddress);
      
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
      console.log('📊 Collections GraphQL Response:', result);

      if (result.errors) {
        console.error('❌ Collections GraphQL Errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      const nftData = result.data.current_token_ownerships_v2 || [];
      
      // Count unique collections
      const uniqueCollections = new Set(nftData.map((nft: NftOwnership) => nft.current_token_data.collection_id));
      const collectionsCount = uniqueCollections.size;
      
      console.log('🏛️ Collections Count:', collectionsCount);
      setCollectionsCount(collectionsCount);
      setLoading(false);

    } catch (err) {
      console.error('❌ Error fetching collections count:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('👛 Collections Wallet Address Changed:', address);
    if (address) {
      fetchCollectionsCount(address);
    } else {
      console.log('👛 No wallet address, resetting collections to 0');
      setCollectionsCount(0);
      setLoading(false);
    }
  }, [address]);

  console.log('📈 Current Collections Count State:', { collectionsCount, loading, error, address });

  return {
    collectionsCount,
    loading,
    error,
    refetch: () => address && fetchCollectionsCount(address)
  };
}; 