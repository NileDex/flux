import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from "@razorlabs/razorkit";
import { FiSearch, FiGrid, FiEye, FiEyeOff } from 'react-icons/fi';
import { HiViewGrid, HiViewGridAdd } from 'react-icons/hi';
import TokenLogo from '../assets/TokenLogo.png';

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

type LayoutSize = 'small' | 'medium' | 'large';

// Storage key for hidden NFTs
const HIDDEN_NFTS_KEY = 'movedao_hidden_nfts';

// Helper functions for managing hidden NFTs
const getHiddenNfts = (address: string): Set<string> => {
  try {
    const stored = localStorage.getItem(`${HIDDEN_NFTS_KEY}_${address}`);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

const saveHiddenNfts = (address: string, hiddenNfts: Set<string>) => {
  try {
    localStorage.setItem(`${HIDDEN_NFTS_KEY}_${address}`, JSON.stringify([...hiddenNfts]));
  } catch (error) {
    console.error('Failed to save hidden NFTs:', error);
  }
};

// Global cache for metadata to persist across component remounts
const globalMetadataCache = new Map<string, Promise<string | null>>();
const globalImageCache = new Map<string, string>();

// Enhanced helper function to convert IPFS URI to HTTP URL with prioritized gateways
const convertIpfsToHttp = (ipfsUri: string): string[] => {
  if (!ipfsUri) return [];
  
  if (ipfsUri.startsWith('ipfs://')) {
    const hash = ipfsUri.replace('ipfs://', '');
    // Prioritized gateways - fastest first
    return [
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`
    ];
  }
  
  if (ipfsUri.startsWith('http')) {
    return [ipfsUri];
  }
  
  return [];
};

// Optimized metadata fetching with caching and faster timeout
const fetchNftMetadata = async (uri: string): Promise<string | null> => {
  if (!uri) return null;
  
  // Check global cache first
  if (globalImageCache.has(uri)) {
    return globalImageCache.get(uri)!;
  }
  
  // Check if we already have a pending request
  if (globalMetadataCache.has(uri)) {
    return globalMetadataCache.get(uri)!;
  }
  
  const fetchPromise = (async () => {
    try {
      const urls = convertIpfsToHttp(uri);
      
      // Use Promise.allSettled with shorter timeout for faster fallback
      const fetchPromises = urls.map(async (url) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const metadata = await response.json();
          
          // Extract image URL from various possible fields
          const imageUri = metadata.image || metadata.image_uri || metadata.imageUri || metadata.animation_url;
          if (imageUri) {
            const imageUrls = convertIpfsToHttp(imageUri);
            const finalImageUrl = imageUrls[0];
            if (finalImageUrl) {
              globalImageCache.set(uri, finalImageUrl);
              return finalImageUrl;
            }
          }
          return null;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });
      
      // Return the first successful result
      const results = await Promise.allSettled(fetchPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error fetching NFT metadata:', error);
      return null;
    }
  })();
  
  globalMetadataCache.set(uri, fetchPromise);
  return fetchPromise;
};

// Batch metadata fetching for better performance
const batchFetchMetadata = async (nfts: NftOwnership[]): Promise<Map<string, string>> => {
  const imageMap = new Map<string, string>();
  
  // Filter out already cached items
  const uncachedNfts = nfts.filter(nft => 
    !globalImageCache.has(nft.current_token_data.token_uri)
  );
  
  if (uncachedNfts.length === 0) {
    // Return cached results
    nfts.forEach(nft => {
      const cached = globalImageCache.get(nft.current_token_data.token_uri);
      if (cached) {
        imageMap.set(nft.current_token_data.token_data_id, cached);
      }
    });
    return imageMap;
  }
  
  // Batch fetch with concurrency limit
  const BATCH_SIZE = 10;
  const batches = [];
  
  for (let i = 0; i < uncachedNfts.length; i += BATCH_SIZE) {
    batches.push(uncachedNfts.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    const promises = batch.map(async (nft) => {
      const imageUrl = await fetchNftMetadata(nft.current_token_data.token_uri);
      if (imageUrl) {
        imageMap.set(nft.current_token_data.token_data_id, imageUrl);
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  // Also add already cached items
  nfts.forEach(nft => {
    if (!imageMap.has(nft.current_token_data.token_data_id)) {
      const cached = globalImageCache.get(nft.current_token_data.token_uri);
      if (cached) {
        imageMap.set(nft.current_token_data.token_data_id, cached);
      }
    }
  });
  
  return imageMap;
};

interface NFTImageProps {
  nft: NftOwnership;
  imageUrl?: string;
}

// Simplified NFT image component with eager loading
const NFTImage = ({ nft, imageUrl }: NFTImageProps) => {
  const [hasError, setHasError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  
  const allUrls = useMemo(() => {
    const urls = [];
    if (imageUrl) urls.push(imageUrl);
    
    // Add direct token_uri as fallback
    const directUrls = convertIpfsToHttp(nft.current_token_data.token_uri);
    urls.push(...directUrls);
    
    return [...new Set(urls)]; // Remove duplicates
  }, [imageUrl, nft.current_token_data.token_uri]);

  const handleImageError = useCallback(() => {
    if (currentUrlIndex < allUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setHasError(false);
    } else {
      setHasError(true);
    }
  }, [currentUrlIndex, allUrls.length]);

  if (hasError || !allUrls[currentUrlIndex]) {
    return (
      <div className="nft-image-placeholder">
        <img src={TokenLogo} alt="Placeholder" width={48} height={48} />
      </div>
    );
  }

  return (
    <img
      src={allUrls[currentUrlIndex]}
      alt={nft.current_token_data.token_name}
      className="nft-image"
      onError={handleImageError}
      // Remove lazy loading for faster display
      loading="eager"
      // Add preload hint for better performance
      decoding="async"
    />
  );
};

const AccountNfts = () => {
  const { address } = useAccount();
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NftOwnership[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [layoutSize, setLayoutSize] = useState<LayoutSize>('medium');
  const [, setMetadataLoading] = useState(false);
  const [hiddenNfts, setHiddenNfts] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);

  // Load hidden NFTs from localStorage when address changes
  useEffect(() => {
    if (address) {
      const hidden = getHiddenNfts(address);
      setHiddenNfts(hidden);
    }
  }, [address]);

  // Toggle NFT visibility
  const toggleNftVisibility = useCallback((tokenId: string) => {
    if (!address) return;
    
    setHiddenNfts(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(tokenId)) {
        newHidden.delete(tokenId);
      } else {
        newHidden.add(tokenId);
      }
      saveHiddenNfts(address, newHidden);
      return newHidden;
    });
  }, [address]);

  // Show all hidden NFTs
  const showAllNfts = useCallback(() => {
    if (!address) return;
    
    setHiddenNfts(new Set());
    saveHiddenNfts(address, new Set());
  }, [address]);

  const fetchAccountNfts = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
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

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const nftData = result.data.current_token_ownerships_v2 || [];
      setNfts(nftData);
      setLoading(false);

      // Batch fetch metadata after NFTs are loaded and displayed
      if (nftData.length > 0) {
        setMetadataLoading(true);
        try {
          const imageMap = await batchFetchMetadata(nftData);
          setImageUrls(imageMap);
        } catch (err) {
          console.warn('Error batch fetching metadata:', err);
        } finally {
          setMetadataLoading(false);
        }
      }

    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchAccountNfts(address);
    } else {
      setLoading(false);
    }
  }, [address]);

  // Memoize filtered NFTs for better performance
  const filteredNfts = useMemo(() => {
    const searchFiltered = nfts.filter(nft => 
      nft.current_token_data.token_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.current_token_data.current_collection?.collection_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by visibility
    if (showHidden) {
      return searchFiltered.filter(nft => hiddenNfts.has(nft.current_token_data.token_data_id));
    } else {
      return searchFiltered.filter(nft => !hiddenNfts.has(nft.current_token_data.token_data_id));
    }
  }, [nfts, searchQuery, hiddenNfts, showHidden]);

  // Memoize grid class
  const gridClass = useMemo(() => {
    switch (layoutSize) {
      case 'small':
        return 'nft-grid nft-grid-small';
      case 'large':
        return 'nft-grid nft-grid-large';
      default:
        return 'nft-grid nft-grid-medium';
    }
  }, [layoutSize]);

  // Count stats
  const visibleCount = nfts.filter(nft => !hiddenNfts.has(nft.current_token_data.token_data_id)).length;
  const hiddenCount = hiddenNfts.size;

  if (error) return <div className="nft-container">Error: {error}</div>;

  return (
    <div className="nft-container">
      <div className="nft-header">
        <div className="nft-title-section">
          <h1 className="nft-title">NFT Collection</h1>
          <div className="nft-stats">
            <span className="nft-stat">
              {visibleCount} visible
            </span>
            {hiddenCount > 0 && (
              <span className="nft-stat hidden">
                {hiddenCount} hidden
              </span>
            )}
          </div>
        </div>
        
        <div className="nft-header-controls">
          <div className="nft-search-container">
            <div className="nft-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search NFTs or collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          <div className="controls-row">
            <div className="visibility-controls">
              <button
                className={`visibility-btn ${!showHidden ? 'active' : ''}`}
                onClick={() => setShowHidden(false)}
                title="Show visible NFTs"
              >
                <FiEye className="visibility-icon" />
                <span className="visibility-text">Visible</span>
              </button>
              {hiddenCount > 0 && (
                <>
                  <button
                    className={`visibility-btn ${showHidden ? 'active' : ''}`}
                    onClick={() => setShowHidden(true)}
                    title="Show hidden NFTs"
                  >
                    <FiEyeOff className="visibility-icon" />
                    <span className="visibility-text">Hidden</span>
                    <span className="visibility-count">({hiddenCount})</span>
                  </button>
                  <button
                    className="show-all-btn"
                    onClick={showAllNfts}
                    title="Show all NFTs"
                  >
                    <span className="show-all-text">Show All</span>
                  </button>
                </>
              )}
            </div>

            <div className="layout-selector">
              <button
                className={`layout-btn ${layoutSize === 'small' ? 'active' : ''}`}
                onClick={() => setLayoutSize('small')}
                title="Small grid"
              >
                <HiViewGridAdd className="layout-icon" />
              </button>
              <button
                className={`layout-btn ${layoutSize === 'medium' ? 'active' : ''}`}
                onClick={() => setLayoutSize('medium')}
                title="Medium grid"
              >
                <HiViewGrid className="layout-icon" />
              </button>
              <button
                className={`layout-btn ${layoutSize === 'large' ? 'active' : ''}`}
                onClick={() => setLayoutSize('large')}
                title="Large grid"
              >
                <FiGrid className="layout-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredNfts.length === 0 ? (
        <div className="nft-empty">
          {showHidden 
            ? 'No hidden NFTs found' 
            : searchQuery 
              ? 'No matching NFTs found' 
              : 'No NFTs in your collection'
          }
        </div>
      ) : (
        <div className={gridClass}>
          {filteredNfts.map((nft, index) => {
            const tokenId = nft.current_token_data.token_data_id;
            const imageUrl = imageUrls.get(tokenId);
            const isHidden = hiddenNfts.has(tokenId);
            
            return (
              <div key={`${tokenId}-${index}`} className={`nft-card ${isHidden ? 'nft-card-hidden' : ''}`}>
                <div className="nft-image-container">
                  <NFTImage
                    nft={nft}
                    imageUrl={imageUrl}
                  />
                  <div className="nft-actions">
                    <button
                      className={`hide-btn ${isHidden ? 'hidden' : 'visible'}`}
                      onClick={() => toggleNftVisibility(tokenId)}
                      title={isHidden ? 'Show NFT' : 'Hide NFT'}
                    >
                      {isHidden ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                    </button>
                  </div>
                </div>
                <div className="nft-info">
                  <h3 className="nft-name">{nft.current_token_data.token_name}</h3>
                  <p className="nft-collection">
                    {nft.current_token_data.current_collection?.collection_name || 'Unnamed Collection'}
                  </p>
                  <div className="nft-meta">
                    <span className="nft-standard">{nft.current_token_data.token_standard}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .nft-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .nft-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 32px;
        }

        .nft-title-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .nft-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          line-height: 1.3;
        }

        .nft-stats {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .nft-stat {
          font-size: 0.875rem;
          color: #64748b;
          padding: 4px 12px;
          border-radius: 12px;
          background: rgba(100, 116, 139, 0.1);
          border: 1px solid rgba(100, 116, 139, 0.15);
          font-weight: 500;
          white-space: nowrap;
        }

        .nft-stat.hidden {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.2);
        }

        .nft-header-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-end;
          min-width: 0;
        }

        .nft-search-container {
          width: 100%;
          max-width: 380px;
        }

        .nft-search {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: #64748b;
          font-size: 16px;
          z-index: 1;
          transition: color 0.2s ease;
        }

        .search-input {
          width: 100%;
          padding: 12px 44px 12px 44px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          background: rgba(26, 31, 46, 0.5);
          backdrop-filter: blur(10px);
          color: #ffffff;
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s ease;
        }

        .search-input::placeholder {
          color: #64748b;
          font-weight: 400;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(26, 31, 46, 0.7);
        }

        .search-input:focus + .search-icon {
          color: #3b82f6;
        }

        .search-clear {
          position: absolute;
          right: 12px;
          width: 20px;
          height: 20px;
          border: none;
          background: rgba(100, 116, 139, 0.2);
          color: #64748b;
          border-radius: 50%;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .search-clear:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .controls-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .visibility-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          background: rgba(26, 31, 46, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        .visibility-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: none;
          border: none;
          border-radius: 8px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .visibility-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .visibility-btn.active {
          background: #3b82f6;
          color: #ffffff;
        }

        .visibility-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .visibility-text {
          font-weight: 500;
        }

        .visibility-count {
          font-size: 12px;
          opacity: 0.8;
        }

        .show-all-btn {
          padding: 8px 12px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 8px;
          color: #22c55e;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .show-all-btn:hover {
          background: rgba(34, 197, 94, 0.15);
        }

        .show-all-text {
          font-weight: 500;
        }

        .layout-selector {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px;
          background: rgba(26, 31, 46, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        .layout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: none;
          border: none;
          border-radius: 8px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .layout-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .layout-btn.active {
          background: #3b82f6;
          color: #ffffff;
        }

        .layout-icon {
          font-size: 16px;
        }

        .nft-grid {
          display: grid;
          gap: 24px;
        }

        .nft-grid-small {
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }

        .nft-grid-medium {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }

        .nft-grid-large {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 32px;
        }

        .nft-card {
          background: rgba(26, 31, 46, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
          position: relative;
        }

        .nft-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .nft-card-hidden {
          opacity: 0.6;
          border-color: rgba(245, 158, 11, 0.3);
        }

        .nft-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
          background: rgba(0, 0, 0, 0.2);
        }

        .nft-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }

        .nft-card:hover .nft-image {
          transform: scale(1.05);
        }

        .nft-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(64, 64, 64, 0.5);
          border-radius: 8px;
        }

        .nft-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .nft-card:hover .nft-actions {
          opacity: 1;
        }

        .hide-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(0, 0, 0, 0.8);
          border: none;
          border-radius: 50%;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .hide-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .hide-btn.hidden {
          background: rgba(245, 158, 11, 0.9);
        }

        .hide-btn.hidden:hover {
          background: rgba(245, 158, 11, 1);
        }

        .nft-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nft-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          line-height: 1.3;
        }

        .nft-collection {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .nft-meta {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 4px;
        }

        .nft-standard {
          font-size: 0.75rem;
          color: #64748b;
          padding: 2px 6px;
          background: rgba(100, 116, 139, 0.1);
          border-radius: 4px;
        }

        .nft-empty {
          text-align: center;
          padding: 64px 24px;
          color: #64748b;
          font-size: 1.1rem;
        }

        @media (max-width: 1024px) {
          .nft-container {
            padding: 16px;
          }

          .nft-header {
            gap: 24px;
          }

          .nft-title {
            font-size: 1.4rem;
          }

          .controls-row {
            gap: 12px;
          }

          .nft-search-container {
            max-width: 320px;
          }
        }

        @media (max-width: 768px) {
          .nft-container {
            padding: 12px;
          }

          .nft-header {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
          }

          .nft-title-section {
            align-items: flex-start;
          }

          .nft-title {
            font-size: 1.3rem;
          }

          .nft-header-controls {
            align-items: stretch;
            gap: 16px;
          }

          .nft-search-container {
            max-width: none;
            width: 100%;
          }

          .controls-row {
            flex-direction: row;
            gap: 12px;
            justify-content: space-between;
          }

          .visibility-controls {
            flex: 1;
            justify-content: center;
          }

          .layout-selector {
            flex-shrink: 0;
          }

          .nft-grid-small {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .nft-grid-medium {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          }

          .nft-grid-large {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }

          .nft-actions {
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .nft-title {
            font-size: 1.2rem;
          }

          .search-input {
            padding: 10px 40px 10px 40px;
            font-size: 14px;
          }

          .search-icon {
            left: 12px;
            font-size: 15px;
          }

          .controls-row {
            flex-direction: column;
            gap: 12px;
          }

          .visibility-controls {
            justify-content: center;
          }

          .visibility-btn {
            padding: 6px 10px;
            font-size: 13px;
          }

          .visibility-text {
            display: none;
          }

          .show-all-btn {
            padding: 6px 10px;
            font-size: 13px;
          }

          .show-all-text {
            display: none;
          }

          .show-all-btn::after {
            content: "Show All";
          }

          .layout-btn {
            width: 32px;
            height: 32px;
          }

          .layout-icon {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .nft-container {
            padding: 8px;
          }

          .nft-header {
            gap: 16px;
            margin-bottom: 24px;
          }

          .nft-title {
            font-size: 1.1rem;
          }

          .nft-stats {
            flex-wrap: wrap;
            gap: 8px;
          }

          .nft-stat {
            font-size: 0.75rem;
            padding: 3px 8px;
          }

          .search-input {
            padding: 8px 36px 8px 36px;
            border-radius: 10px;
          }

          .controls-row {
            gap: 8px;
          }

          .visibility-controls {
            gap: 2px;
            padding: 3px;
          }

          .visibility-btn {
            padding: 5px 8px;
            gap: 4px;
          }

          .visibility-icon {
            font-size: 14px;
          }

          .show-all-btn {
            padding: 5px 8px;
          }

          .layout-selector {
            gap: 1px;
            padding: 3px;
          }

          .layout-btn {
            width: 28px;
            height: 28px;
          }

          .layout-icon {
            font-size: 12px;
          }

          .nft-grid-small {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }

          .nft-grid-medium {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 16px;
          }

          .nft-grid-large {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          }

          .nft-card {
            padding: 10px;
          }
        }

        @media (max-width: 320px) {
          .nft-title {
            font-size: 1rem;
          }

          .nft-grid-small {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 8px;
          }

          .nft-grid-medium {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
          }

          .nft-grid-large {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          }

          .nft-card {
            padding: 8px;
          }

          .nft-name {
            font-size: 0.9rem;
          }

          .nft-collection {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountNfts;