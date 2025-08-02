import { useState } from "react";
import { FaExchangeAlt, FaChevronDown } from "react-icons/fa";
import SwapWidget from "@mosaicag/swap-widget";
import { useWallet, useAccount } from "@razorlabs/razorkit";
import type {
  AptosSignAndSubmitTransactionInput,
  AptosSignAndSubmitTransactionOutput,
  AptosSignTransactionOutput,
  UserResponse,
} from "@aptos-labs/wallet-standard";
import type { AnyRawTransaction } from "@aptos-labs/ts-sdk";
import NoWalletMessage from '../NoWalletMessage';
interface WalletStandard {
  account:
    | {
        address: string;
        publicKey: Uint8Array;
      }
    | undefined;
  signAndSubmitTransaction(
    input: AptosSignAndSubmitTransactionInput
  ): Promise<UserResponse<AptosSignAndSubmitTransactionOutput>>;
  signTransaction(
    transaction: AnyRawTransaction,
    asFeePayer?: boolean
  ): Promise<UserResponse<AptosSignTransactionOutput>>;
}

interface SwapComponentProps {
  isEmbedded?: boolean; // New prop to control rendering mode
  showHeader?: boolean; // New prop to control header visibility
}

export default function SwapComponent({ 
  isEmbedded = false, 
  showHeader = true 
}: SwapComponentProps) {
  const { signAndSubmitTransaction, signTransaction, connected, account } =
    useWallet();
  const { address } = useAccount();
  const [swapOpen, setSwapOpen] = useState(false);

  // Debug logging
  console.log("Wallet debug info:", {
    connected,
    address,
    account,
    hasSignFunction: !!signAndSubmitTransaction,
  });

  const walletStandard: WalletStandard | undefined =
    connected && address
      ? {
          account: {
            address,
            publicKey: account?.publicKey
              ? new Uint8Array(account.publicKey)
              : new Uint8Array(), // Convert ReadonlyUint8Array to Uint8Array
          },
          signAndSubmitTransaction: async (
            input: AptosSignAndSubmitTransactionInput
          ) => {
            try {
              console.log("Attempting to sign and submit transaction:", input);
              const response = await signAndSubmitTransaction(input);
              console.log("Transaction response:", response);
              return response;
            } catch (error) {
              console.error("Transaction failed:", error);
              throw error;
            }
          },
          signTransaction: async (
            transaction: AnyRawTransaction,
            asFeePayer?: boolean
          ) => {
            try {
              console.log(
                "Attempting to sign transaction:",
                transaction,
                "asFeePayer:",
                asFeePayer
              );
              const response = await signTransaction(transaction, asFeePayer);
              console.log("Sign transaction response:", response);
              return response;
            } catch (error) {
              console.error("Sign transaction failed:", error);
              throw error;
            }
          },
        }
      : undefined;

  const toggleSwap = () => setSwapOpen(!swapOpen);

  // Render the swap widget content
  const renderSwapContent = () => (
    <div className="swap-widget-container">
      {connected && walletStandard ? (
        <SwapWidget
          wallet={walletStandard}
          apiKey={import.meta.env.VITE_SWAP_API_KEY}
          chainId="126"
          defaultInputAmount="2"
          defaultSlippage={50}
          defaultTokenInAddress="0xa484a866e1bfcb76e8057939d6944539070b53c511813d7b21c76cae9e6a6e26"
          defaultTokenOutAddress="0xe161897670a0ee5a0e3c79c3b894a0c46e4ba54c6d2ca32e285ab4b01eb74b66"
          onChangeTokenIn={(l) => {
            console.log("swap onChangeTokenIn", l);
          }}
          onChangeTokenOut={(l) => {
            console.log("swap onChangeTokenOut", l);
          }}
          onTxFail={(l) => {
            console.log("swap failed", l);
          }}
          onTxSubmit={(l) => {
            console.log("swap onTxSubmit", l);
          }}
          onTxSuccess={(l) => {
            console.log("swap onTxSuccess", l);
          }}
          slippageOptions={[50, 100, 200, 300]}
          theme={{
            background: 'var(--card-bg)',
            baseContent: 'var(--text-primary)',
            border: 'var(--border-primary)',
            error: '#ef4444',
            neutralContent: 'var(--text-secondary)',
            primary: 'var(--accent-blue)',
            secondary: 'var(--border-accent)',
            secondaryBackground: 'var(--secondary-bg)',
          }}
          onConnectButtonClick={() => {
            // Handle wallet connection if needed
            console.log("Connect wallet clicked");
          }}
        />
      ) : (
        <div className="swap-connect-wallet">
          <p>Please connect your wallet to use the swap feature</p>
        </div>
      )}
    </div>
  );

  // If embedded, just return the content without the collapsible wrapper
  if (isEmbedded) {
    return renderSwapContent();
  }

  // If standalone, render with collapsible functionality
  return (
    <div className={`collapsible-section ${swapOpen ? "active" : ""}`}>
      {showHeader && (
        <div className="collapsible-header" onClick={toggleSwap}>
          <div className="collapsible-title">
            <FaExchangeAlt size={16} style={{ color: "#AAFF00" }} />
            <span>Swap Tokens</span>
          </div>
          <FaChevronDown
            className={`collapsible-icon ${swapOpen ? "open" : ""}`}
            size={14}
            style={{ color: "#E5EBED" }}
          />
        </div>
      )}
      {(swapOpen || !showHeader) && (
        <div className="collapsible-content">
          {renderSwapContent()}
          <NoWalletMessage />
          
        </div>
      )}
    </div>
  );
}