import { useEffect, useRef, useState } from "react";
import {
  FaWallet,
  FaGlobe,
  FaCoins,
  FaChevronDown,
  FaPlug,
  FaPaperPlane,
  FaCopy,
  FaExchangeAlt,
} from "react-icons/fa";
import { useWallet, useAccount, useAccountBalance } from "@razorlabs/razorkit";
import QRCode from "react-qr-code";
import SwapComponent from "./SwapComponent";
import "./AccountInfoCard.css";

export default function AccountInfoCard({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const { disconnect, signAndSubmitTransaction } = useWallet();
  const { address, chain } = useAccount();
  const { balance } = useAccountBalance();
  const cardRef = useRef<HTMLDivElement>(null);

  // State management for accordion behavior
  const [activeSection, setActiveSection] = useState<
    "wallet" | "transfer" | "swap" | null
  >("wallet");
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const formatBalance = (rawBalance: string | undefined): number => {
    return rawBalance ? Number(rawBalance) / 100000000 : 0;
  };

  const moveBalance = formatBalance(balance?.toString());
  const formattedAddress = address
    ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
    : "0x5463...491b";

  const validateAddress = (addr: string): boolean => {
    return addr.startsWith("0x") && addr.length === 66;
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = show ? "translateX(0)" : "translateX(100%)";
    card.style.opacity = show ? "1" : "0";
  }, [show]);

  // Accordion handler - only one section open at a time
  const handleSectionToggle = (section: "wallet" | "transfer" | "swap") => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const copyToClipboard = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMove = async () => {
    if (!address || !recipient || !amount) {
      setTransferError("All fields are required");
      return;
    }

    if (!validateAddress(recipient)) {
      setTransferError("Invalid address (must be 0x + 64 characters)");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError("Amount must be greater than 0");
      return;
    }

    if (amountNum > moveBalance) {
      setTransferError("Amount exceeds balance");
      return;
    }

    setIsTransferring(true);
    setTransferError(null);
    setTransferSuccess(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(amountNum * 100000000);

      const response = await signAndSubmitTransaction({
        payload: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [recipient, amountInOctas.toString()],
        },
      });

      console.log("Transaction response:", response);
      console.log("Response type:", typeof response);

      if (response) {
        let transactionHash: string | null = null;

        if (typeof response === "string") {
          transactionHash = response;
        } else if (typeof response === "object") {
          console.log("Response keys:", Object.keys(response));
          console.log("Full response:", JSON.stringify(response, null, 2));

          if ("hash" in response && typeof response.hash === "string") {
            transactionHash = response.hash;
          } else if (
            "transactionHash" in response &&
            typeof response.transactionHash === "string"
          ) {
            transactionHash = response.transactionHash;
          } else if (
            "txHash" in response &&
            typeof response.txHash === "string"
          ) {
            transactionHash = response.txHash;
          } else if (
            "transaction_hash" in response &&
            typeof response.transaction_hash === "string"
          ) {
            transactionHash = response.transaction_hash;
          } else if (
            "result" in response &&
            response.result &&
            typeof response.result === "object"
          ) {
            const result = response.result as any;
            if ("hash" in result && typeof result.hash === "string") {
              transactionHash = result.hash;
            } else if (
              "transactionHash" in result &&
              typeof result.transactionHash === "string"
            ) {
              transactionHash = result.transactionHash;
            }
          } else if (
            "data" in response &&
            response.data &&
            typeof response.data === "object"
          ) {
            const data = response.data as any;
            if ("hash" in data && typeof data.hash === "string") {
              transactionHash = data.hash;
            } else if (
              "transactionHash" in data &&
              typeof data.transactionHash === "string"
            ) {
              transactionHash = data.transactionHash;
            }
          }
        }

        if (transactionHash) {
          console.log("Found transaction hash:", transactionHash);
          setTxHash(transactionHash);
          setTransferSuccess(true);
          setAmount("");
          setRecipient("");
        } else {
          console.warn("Could not find transaction hash in response");
          setTransferError(
            "Transaction may have been submitted. Please check your wallet and transaction history."
          );
        }
      } else {
        setTransferError("No response received from wallet");
      }
    } catch (error: any) {
      console.error("Transfer failed:", error);

      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("rejected")
      ) {
        setTransferError("Transaction was rejected by user");
      } else if (error.message?.includes("Insufficient")) {
        setTransferError("Insufficient balance for transaction");
      } else if (error.message?.includes("Invalid")) {
        setTransferError("Invalid transaction parameters");
      } else if (error.code === 4001) {
        setTransferError("Transaction rejected by user");
      } else {
        setTransferError(
          `Transfer failed: ${error.message || "Unknown error"}`
        );
      }
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="account-info-card"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="account-info-header">
        <div className="account-header-details">
          <div className="account-address">{formattedAddress}</div>
          <button className="disconnect-button" onClick={handleDisconnect}>
            Disconnect
            <FaPlug size={16} />
          </button>
        </div>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="account-info-content">
        {/* Account Info Section */}
        <div
          className={`collapsible-section ${
            activeSection === "wallet" ? "active" : ""
          }`}
        >
          <div
            className="collapsible-header"
            onClick={() => handleSectionToggle("wallet")}
          >
            <div className="collapsible-title">
              <FaWallet size={16} style={{ color: "#AAFF00" }} />
              <span>Wallet Details</span>
            </div>
            <FaChevronDown
              className={`collapsible-icon ${
                activeSection === "wallet" ? "open" : ""
              }`}
              size={14}
            />
          </div>
          {activeSection === "wallet" && (
            <div className="collapsible-content">
              <div className="info-item">
                <FaWallet size={16} style={{ color: "#AAFF00" }} />
                <div className="info-text">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{formattedAddress}</span>
                </div>
              </div>
              <div className="info-item">
                <FaGlobe size={16} style={{ color: "#AAFF00" }} />
                <div className="info-text">
                  <span className="info-label">Network:</span>
                  <span className="info-value">
                    {chain?.name || "Movement Mainnet"}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <FaCoins size={16} style={{ color: "#AAFF00" }} />
                <div className="info-text">
                  <span className="info-label">Balance:</span>
                  <span className="info-value">
                    {moveBalance.toFixed(8)} MOVE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transfer Section */}
        <div
          className={`collapsible-section ${
            activeSection === "transfer" ? "active" : ""
          }`}
        >
          <div
            className="collapsible-header"
            onClick={() => handleSectionToggle("transfer")}
          >
            <div className="collapsible-title">
              <FaPaperPlane size={16} style={{ color: "#AAFF00" }} />
              <span>Transfer Tokens</span>
            </div>
            <FaChevronDown
              className={`collapsible-icon ${
                activeSection === "transfer" ? "open" : ""
              }`}
              size={14}
            />
          </div>
          {activeSection === "transfer" && (
            <div className="collapsible-content">
              <div className="transfer-container">
                <div className="transfer-tabs">
                  <button
                    className={`transfer-tab ${
                      activeTab === "send" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("send")}
                  >
                    Send
                  </button>
                  <button
                    className={`transfer-tab ${
                      activeTab === "receive" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("receive")}
                  >
                    Receive
                  </button>
                </div>

                {activeTab === "send" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMove();
                    }}
                  >
                    <div className="form-group">
                      <label>Recipient Address</label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        pattern="^0x[a-fA-F0-9]{64}$"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Amount (MOVE)</label>
                      <div className="amount-input-container">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          min="0"
                          step="0.00000001"
                          required
                        />
                        <div className="amount-shortcuts">
                          <button
                            type="button"
                            onClick={() =>
                              setAmount((moveBalance / 2).toFixed(8))
                            }
                          >
                            HALF
                          </button>
                          <button
                            type="button"
                            onClick={() => setAmount(moveBalance.toFixed(8))}
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      <div className="balance-display">
                        Available: {moveBalance.toFixed(8)} MOVE
                      </div>
                    </div>

                    {transferError && (
                      <div className="transfer-error">
                        {transferError}
                        <button type="button" onClick={sendMove}>
                          Retry
                        </button>
                      </div>
                    )}

                    {transferSuccess && txHash && (
                      <div className="transfer-success">
                        Success!{" "}
                        <a
                          href={`https://movementscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Transaction
                        </a>
                      </div>
                    )}

                    {transferSuccess && !txHash && (
                      <div className="transfer-success">
                        Transaction submitted successfully! Please check your
                        wallet for confirmation.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isTransferring || !amount || !recipient}
                    >
                      {isTransferring ? (
                        <>
                          <span className="spinner"></span>
                          Processing...
                        </>
                      ) : (
                        "Send Tokens"
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="receive-section">
                    <div className="form-group">
                      <label>Your Wallet Address</label>
                      <div
                        className="wallet-address-container"
                        onClick={copyToClipboard}
                      >
                        <span style={{ wordBreak: "break-all" }}>
                          {address}
                        </span>
                        <FaCopy size={14} />
                      </div>
                      {copied && (
                        <span className="copy-notification">Copied!</span>
                      )}
                    </div>
                    <div className="qr-code-container">
                      <div className="qr-code-wrapper">
                        {address && <QRCode value={address} size={128} />}
                      </div>
                      <p>Scan to receive tokens</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Swap Section */}
        <div
          className={`collapsible-section ${
            activeSection === "swap" ? "active" : ""
          }`}
        >
          <div
            className="collapsible-header"
            onClick={() => handleSectionToggle("swap")}
          >
            <div className="collapsible-title">
              <FaExchangeAlt size={16} style={{ color: "#AAFF00" }} />
              <span>Swap Tokens</span>
            </div>
            <FaChevronDown
              className={`collapsible-icon ${
                activeSection === "swap" ? "open" : ""
              }`}
              size={14}
            />
          </div>
          {activeSection === "swap" && (
            <div className="collapsible-content">
              <SwapComponent isEmbedded={true} showHeader={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
