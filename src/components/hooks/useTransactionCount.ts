import { useState, useEffect } from 'react';

interface TransactionCountData {
  user_transactions_aggregate?: {
    aggregate: {
      count: number;
    };
  };
  transactions_aggregate?: {
    aggregate: {
      count: number;
    };
  };
}

export const useTransactionCount = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionCount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching transaction count...');
      
      const endpoint = 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql';
      
      const queries = [
        {
          name: 'user_transactions_aggregate',
          query: `
            query GetTransactionCount {
              user_transactions_aggregate {
                aggregate {
                  count
                }
              }
            }
          `
        },
        {
          name: 'transactions_aggregate',
          query: `
            query GetTransactionCount {
              transactions_aggregate {
                aggregate {
                  count
                }
              }
            }
          `
        }
      ];

      let finalCount = 0;

      for (const queryObj of queries) {
        try {
          console.log(`🔍 Trying query: ${queryObj.name}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: queryObj.query
            })
          });

          const result = await response.json();
          console.log(`📊 ${queryObj.name} Response:`, result);

          if (result.errors) {
            console.error(`❌ ${queryObj.name} GraphQL Errors:`, result.errors);
            continue;
          }

          if (result.data) {
            const data = result.data as TransactionCountData;
            let count = 0;
            
            if (data.user_transactions_aggregate?.aggregate?.count) {
              count = data.user_transactions_aggregate.aggregate.count;
            } else if (data.transactions_aggregate?.aggregate?.count) {
              count = data.transactions_aggregate.aggregate.count;
            }

            console.log(`✅ ${queryObj.name} Count:`, count);
            
            if (count > 0 && count < 1000000) {
              finalCount = count;
              break;
            }
          }
        } catch (err) {
          console.error(`❌ Error with ${queryObj.name}:`, err);
          continue;
        }
      }

      // REST API fallback
      if (finalCount === 0) {
        console.log('🔄 Trying REST API fallback...');
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const restResponse = await fetch('https://mainnet.movementnetwork.xyz/v1/', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (restResponse.ok) {
            const restData = await restResponse.json();
            console.log('📊 REST API Response:', restData);
            
            if (restData.ledger_version) {
              finalCount = parseInt(restData.ledger_version) || 0;
            }
          }
        } catch (restErr) {
          console.error('❌ REST API error:', restErr);
        }
      }

      if (finalCount > 0) {
        console.log(`🎯 Final count:`, finalCount);
        setCount(finalCount);
      } else {
        console.log('⚠️ No valid count found, using default');
        setCount(0);
        setError('Unable to fetch transaction count');
      }

      setLoading(false);

    } catch (err) {
      console.error('❌ Error fetching transaction count:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Fetching transaction count on mount...');
    fetchTransactionCount();
  }, []);

  console.log('📈 Current Transaction Count State:', { count, loading, error });

  return {
    count,
    loading,
    error,
    refetch: fetchTransactionCount
  };
}; 