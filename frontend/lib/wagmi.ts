// frontend/lib/wagmi.ts - v1.0
import { http, createConfig } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Custom Anvil chain configuration
export const anvilChain = {
  ...localhost,
  id: 31337,
  name: 'Anvil Local',
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'],
    },
  },
} as const;

// Wagmi configuration
export const config = getDefaultConfig({
  appName: 'ChainStaker',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [anvilChain],
  transports: {
    [anvilChain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'),
  },
  ssr: true, // Enable server-side rendering
});