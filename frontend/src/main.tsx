import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { UserProvider } from './contexts/UserContext'
import { ToastProvider } from './contexts/ToastContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

const EXTENSION_BRIDGE_ERROR =
  'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received';

const isKnownBridgeNoise = (value: unknown) => {
  if (typeof value === 'string') {
    return value.includes(EXTENSION_BRIDGE_ERROR);
  }
  if (value && typeof value === 'object' && 'message' in value && typeof (value as any).message === 'string') {
    return (value as any).message.includes(EXTENSION_BRIDGE_ERROR);
  }
  return false;
};

if (typeof window !== 'undefined' && !(window as any).__corridorBridgeNoiseFilterInstalled) {
  (window as any).__corridorBridgeNoiseFilterInstalled = true;

  window.addEventListener('unhandledrejection', (event) => {
    if (isKnownBridgeNoise(event.reason)) {
      event.preventDefault();
      console.debug('Suppressed browser extension bridge noise');
    }
  });

  window.addEventListener('error', (event) => {
    if (isKnownBridgeNoise(event.error) || isKnownBridgeNoise(event.message)) {
      event.preventDefault();
      console.debug('Suppressed browser extension bridge noise');
    }
  });
}

// Early validation of environment variables
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  // We throw here so the ErrorBoundary can catch it and show a helpful message
  // instead of the app failing later with cryptic network errors.
  console.error("Environment Configuration Error: VITE_API_URL is not defined.");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasValidGoogleClientId =
  GOOGLE_CLIENT_ID.length > 0 && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';

const solanaEndpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConnectionProvider endpoint={solanaEndpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {hasValidGoogleClientId ? (
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <ToastProvider>
                  <NotificationProvider>
                    <UserProvider>
                      <QueryClientProvider client={queryClient}>
                        <App />
                      </QueryClientProvider>
                    </UserProvider>
                  </NotificationProvider>
                </ToastProvider>
              </GoogleOAuthProvider>
            ) : (
              <ToastProvider>
                <NotificationProvider>
                  <UserProvider>
                    <QueryClientProvider client={queryClient}>
                      <App />
                    </QueryClientProvider>
                  </UserProvider>
                </NotificationProvider>
              </ToastProvider>
            )}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
