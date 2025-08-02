import { useState, useEffect } from 'react';

// These interfaces are used for type checking the GraphQL responses
interface TotalTransactionsData {
  account_transactions_aggregate: {
    aggregate: {
      count: number;
    };
  };
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

interface TransactionsData {
  transactions_aggregate: {
    aggregate: {
      count: number;
    };
  };
  user_transactions_aggregate?: {
    aggregate: {
      count: number;
    };
  };
}

export const useTotalTransactions = () => {
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = async () => {
    try {
      setError(null);
      
      console.log('📊 Fetching total transactions count...');
      
      // Skip schema introspection to speed up loading
      
      // Try different API endpoints
      const endpoints = [
        'https://indexer.mainnet.movementnetwork.xyz/v1/graphql',
       
      ];
      
      // Try the most likely queries first for faster loading
      const queries = [
        {
          name: 'user_transactions_aggregate',
          query: `
            query GetTotalTransactions {
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
            query GetTotalTransactions {
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
      let successfulQuery = '';
      let successfulEndpoint = '';

      for (const endpoint of endpoints) {
        console.log(`🌐 Trying endpoint: ${endpoint}`);
        
        for (const queryObj of queries) {
          try {
            console.log(`🔍 Trying query: ${queryObj.name} on ${endpoint}`);
            
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
            console.log(`📊 ${queryObj.name} Response from ${endpoint}:`, result);

            if (result.errors) {
              console.error(`❌ ${queryObj.name} GraphQL Errors from ${endpoint}:`, result.errors);
              continue; // Try next query
            }

            if (result.data) {
              const data = result.data as TotalTransactionsData | TransactionsData;
              let count = 0;
              
              if (data.user_transactions_aggregate?.aggregate?.count) {
                count = data.user_transactions_aggregate.aggregate.count;
              } else if (data.transactions_aggregate?.aggregate?.count) {
                count = data.transactions_aggregate.aggregate.count;
              }

              console.log(`✅ ${queryObj.name} Count from ${endpoint}:`, count);
              
              // More reasonable range check for a newer blockchain
              if (count > 0 && count < 1000000) { // Less than 1M transactions
                finalCount = count;
                successfulQuery = queryObj.name;
                successfulEndpoint = endpoint;
                break; // Exit inner loop
              } else if (count > 0) {
                console.log(`⚠️ Count ${count} seems too high, might be wrong metric`);
              }
            }
          } catch (err) {
            console.error(`❌ Error with ${queryObj.name} on ${endpoint}:`, err);
            continue;
          }
        }
        
        if (finalCount > 0) {
          break; // Exit outer loop
        }
      }

      // Quick REST API fallback if GraphQL fails
      if (finalCount === 0) {
        console.log('🔄 Trying REST API fallback...');
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
          
          const restResponse = await fetch('https://mainnet.movementnetwork.xyz/v1/', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (restResponse.ok) {
            const restData = await restResponse.json();
            console.log('📊 REST API Response:', restData);
            
            if (restData.ledger_version) {
              finalCount = parseInt(restData.ledger_version) || 0;
              successfulQuery = 'rest_api_ledger_version';
              successfulEndpoint = 'https://mainnet.movementnetwork.xyz/v1/';
            }
          }
        } catch (restErr) {
          console.error('❌ REST API error:', restErr);
        }
      }

      if (finalCount > 0) {
        console.log(`🎯 Final count from ${successfulQuery} on ${successfulEndpoint}:`, finalCount);
        setTotalTransactions(finalCount);
      } else {
        // Set a reasonable default or show error
        console.log('⚠️ No valid transaction count found, using default');
        setTotalTransactions(0);
        setError('Unable to fetch transaction count from available sources');
      }

    } catch (err) {
      console.error('❌ Error fetching total transactions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    console.log('🔄 Fetching total transactions on mount...');
    fetchTotalTransactions();
  }, []);

  console.log('📈 Current Total Transactions State:', { totalTransactions, error });

  return {
    totalTransactions,
    error,
    refetch: fetchTotalTransactions
  };
};