# ChainStaker Frontend

Next.js application for the ChainStaker DAI staking platform.

## 🎯 Features

### User Dashboard
- **Analytics Panel**: View TVL, total users, average APY, and tier distribution
- **Stake Form**: Create new stakes with tier selection (Bronze/Silver/Gold)
- **Stake List**: View all active stakes with real-time rewards
- **Stake Management**: Claim rewards or unstake with one click

### Admin Demo Tools (`/admin`)
- **Time Travel**: Fast-forward blockchain time for testing
- **APY Multiplier**: Multiply all tier APYs for faster reward accrual testing
- **Block Info**: View real-time blockchain information

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- **Sepolia testnet** OR Anvil local (`http://127.0.0.1:8545`)
- Backend API running on `http://localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your network configuration (see Network Configuration below)
```

### Network Configuration

**For Sepolia (Current Deployment)**:
```bash
# .env.local
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_STAKING_POOL_ADDRESS=0xa247e02E9309cCEB1D1b9b301607f067d0a70c28
NEXT_PUBLIC_DAI_TOKEN_ADDRESS=0x2FA332E8337642891885453Fd40a7a7Bb010B71a
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**For Anvil (Local Testing)**:
```bash
# .env.local
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_STAKING_POOL_ADDRESS=0x... # From your local deployment
NEXT_PUBLIC_DAI_TOKEN_ADDRESS=0x...    # From your local deployment
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Important**: After changing network, also update `lib/wagmi.ts`:
- For Sepolia: `import { sepolia } from 'wagmi/chains'` and `chains: [sepolia]`
- For Anvil: Use custom chain config with `id: 31337`

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Structure

```
frontend/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── admin/page.tsx        # Admin tools
│   ├── layout.tsx            # Root layout
│   ├── providers.tsx         # Wagmi, React Query, RainbowKit setup
│   └── globals.css           # Global styles
├── components/
│   ├── Dashboard.tsx         # Main user dashboard
│   ├── AnalyticsPanel.tsx    # TVL, users, APY stats
│   ├── StakeForm.tsx         # Create new stake
│   ├── StakeCard.tsx         # Individual stake display
│   ├── StakeList.tsx         # List of user stakes
│   ├── TierSelector.tsx      # Tier selection component
│   └── admin/
│       ├── AdminDashboard.tsx        # Admin page layout
│       ├── TimeTravelPanel.tsx       # Time manipulation
│       ├── APYMultiplierPanel.tsx    # APY testing
│       └── BlockInfoPanel.tsx        # Blockchain info
├── lib/
│   ├── contracts.ts          # Contract ABIs and addresses
│   ├── wagmi.ts              # Wagmi configuration
│   ├── hooks/
│   │   ├── useApproveDAI.ts          # Approve DAI
│   │   ├── useStake.ts               # Create stake
│   │   ├── useUnstake.ts             # Unstake
│   │   ├── useClaimRewards.ts        # Claim rewards
│   │   ├── useUserStakes.ts          # Fetch user stakes
│   │   ├── useAnalytics.ts           # Fetch analytics
│   │   ├── useTimeTravel.ts          # Time manipulation
│   │   ├── useUpdateTier.ts          # Update tier APYs
│   │   └── useBlockTime.ts           # Get block time
│   └── utils/
│       └── anvil-rpc.ts      # Anvil RPC utilities
└── types/
    └── index.ts              # TypeScript types
```

## 🔧 Environment Variables

**Current Sepolia Deployment**:
```bash
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_STAKING_POOL_ADDRESS=0xa247e02E9309cCEB1D1b9b301607f067d0a70c28
NEXT_PUBLIC_DAI_TOKEN_ADDRESS=0x2FA332E8337642891885453Fd40a7a7Bb010B71a
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

See "Network Configuration" section above for Anvil setup.

## 🎮 Usage

### User Flow

1. **Connect Wallet**: Click "Connect Wallet" button
2. **View Analytics**: See platform-wide stats (TVL, users, APY)
3. **Create Stake**:
   - Enter amount in DAI
   - Select tier (Bronze/Silver/Gold)
   - Click "Approve DAI"
   - Wait for confirmation
   - Click "Stake DAI"
4. **View Stakes**: See all active stakes in the right panel
5. **Manage Stakes**:
   - Click "Claim Rewards" to collect rewards
   - Click "Unstake" to withdraw principal + rewards

### Admin Testing Flow

1. Navigate to `/admin`
2. **Test Reward Accrual**:
   - Create a stake on main dashboard
   - Go to `/admin`
   - Click "+7 Days" to fast-forward time
   - Return to dashboard
   - See accrued rewards
3. **Test High APY**:
   - Click "×100" to multiply APYs
   - Create a new stake
   - Fast-forward +1 hour
   - See rewards as if 100 hours passed
   - Click "Reset to Normal APYs" when done

## 🛠️ Technologies

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Wallet**: Wagmi + RainbowKit
- **State**: TanStack Query (React Query)
- **Blockchain**: Viem
- **Notifications**: React Hot Toast
- **Date**: date-fns

## 📝 Key Features

### Real-Time Updates
- Stakes refetch every 10 seconds
- Analytics refetch every 30 seconds
- Rewards recalculate every 10 seconds

### Error Handling
- Toast notifications for all transactions
- Clear error messages
- Loading states for all async operations

### Responsive Design
- Mobile-friendly layout
- Grid-based responsive design
- Optimized for all screen sizes

## 🐛 Troubleshooting

### "Wrong network" or wallet won't connect
- **Sepolia**: Ensure `lib/wagmi.ts` imports and uses `sepolia` from `wagmi/chains`
- **Anvil**: Ensure `lib/wagmi.ts` uses custom chain config with `id: 31337`
- Check `NEXT_PUBLIC_RPC_URL` matches your network in `.env.local`
- After changing network, restart dev server (`npm run dev`)

### "Failed to connect to RPC"
- **Sepolia**: Verify Alchemy/Infura API key is valid
- **Anvil**: Ensure Anvil is running on `http://127.0.0.1:8545`
- Check `NEXT_PUBLIC_RPC_URL` in `.env.local`

### "Failed to fetch analytics" (500 error)
- **Known Issue on Sepolia**: Analytics API has a bug with large stake amounts
- See CLAUDE.md for bug details and planned fix
- Backend API must be running on `http://localhost:5000`

### Stakes don't update immediately after unstake
- **Known Issue on Sepolia**: Race condition between tx confirm and event processing
- UI updates within 10 seconds
- See CLAUDE.md for bug details and planned fix

### "Only contract owner can update tiers"
- Admin functions require wallet to be contract owner
- Use the deployer wallet address

### Time Travel not working
- Time manipulation only works with Anvil
- **Disabled on Sepolia and other public testnets**

## 📚 Documentation

- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
