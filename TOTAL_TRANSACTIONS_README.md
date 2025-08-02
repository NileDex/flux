# Total Transactions Feature Implementation

## Overview
This implementation adds a new "Total Transactions" feature to the Movement Network dashboard that displays the total number of transactions across the entire network.

## Components Created

### 1. `useTotalTransactions` Hook (`src/components/hooks/useTotalTransactions.ts`)
- **Purpose**: Fetches total transaction count from Movement Network GraphQL API
- **GraphQL Query**: 
  ```graphql
  query GetTotalTransactions {
    account_transactions_aggregate {
      aggregate {
        count
      }
    }
  }
  ```
- **Features**:
  - Real-time data fetching
  - Loading states
  - Error handling
  - Automatic retry functionality

### 2. `TotalTransactions` Component (`src/components/TotalTransactions.tsx`)
- **Purpose**: Displays network-wide transaction statistics
- **Features**:
  - Beautiful UI with network statistics
  - Number formatting (K, M suffixes)
  - Loading and error states
  - Responsive design
  - Network status indicators

### 3. Dashboard Integration
- **Location**: Transaction Blocks tab in the main dashboard
- **Features**:
  - Shows total transaction count in the card
  - Displays "network txs" subtitle
  - Integrates seamlessly with existing dashboard design
  - No wallet connection required (shows network-wide data)

## API Endpoint
- **URL**: `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`
- **Method**: POST
- **Content-Type**: application/json

## Usage
1. Navigate to the dashboard
2. Click on the "Transaction Blocks" card
3. View the total transactions across the Movement network
4. The component will automatically fetch and display real-time data

## Technical Details
- **Framework**: React with TypeScript
- **Styling**: CSS-in-JS with responsive design
- **Icons**: React Icons (FaExchangeAlt, FaNetworkWired, FaGlobe)
- **State Management**: React hooks with useState and useEffect
- **Error Handling**: Comprehensive error states with user-friendly messages

## Features
- ✅ Real-time data fetching
- ✅ Beautiful, modern UI
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Number formatting
- ✅ Network status indicators
- ✅ Seamless dashboard integration

## Files Modified
1. `src/components/hooks/useTotalTransactions.ts` - New hook
2. `src/components/TotalTransactions.tsx` - New component
3. `src/components/Dashboard.tsx` - Updated to include new feature

The implementation follows the existing codebase patterns and integrates seamlessly with the current dashboard design. 