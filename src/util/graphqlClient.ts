// src/utils/graphqlClient.ts
import { GraphQLClient } from 'graphql-request';

const API_URL = 'https://api.indexer.xyz/graphql';

// Get environment variables properly for React app
const API_USER = import.meta.env.VITE_API_USER || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export const createClient = () => {
  return new GraphQLClient(API_URL, {
    headers: {
      'x-api-user': API_USER,
      'x-api-key': API_KEY,
    },
  });
};