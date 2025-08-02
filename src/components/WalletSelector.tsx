import { WalletProvider, ConnectButton, ErrorCode, BaseError } from "@razorlabs/razorkit";

export function WalletSelector() {
  return (
    <WalletProvider>
      <ConnectButton
        onConnectError={(err: BaseError) => {
          if (err.code === ErrorCode.WALLET__CONNECT_ERROR__USER_REJECTED) {
            console.warn('User rejected the connection to ' + err.details?.wallet);
          } else {
            console.warn('Connection error: ', err);
          }
        }}
      >
        Connect Wallet
      </ConnectButton>
    </WalletProvider>
  );
}