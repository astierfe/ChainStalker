// frontend/lib/wagmi.ts - v2.0 (Sepolia)
import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Wagmi configuration for Sepolia
export const config = getDefaultConfig({
  appName: 'ChainStaker',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
  },
  ssr: true, // Enable server-side rendering
});