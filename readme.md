# ChainStaker 🔗

Decentralized DAI staking platform with dynamic rewards, multi-tier APY, and comprehensive analytics.

## 🎯 Overview

ChainStaker is a community-driven staking platform built on Ethereum that allows users to stake DAI (stablecoin) and earn rewards through multiple tiers with different APY rates and lock periods.

### Key Features
- **Multi-tier Staking**: 3 tiers (7d/30d/90d) with progressive APY (5%/8%/12%)
- **Flexible Rewards**: Claim anytime or compound into existing stakes
- **Early Withdrawal**: Available with penalty based on tier
- **Protocol Fees**: Configurable fee collection on rewards
- **Real-time Analytics**: Historical metrics and live dashboard
- **Emergency Mode**: Safe withdrawal during contract pause

## 📊 Project Status

### ✅ Phase 1: Smart Contracts (COMPLETED)
- Solidity contracts with Foundry framework
- Modular architecture (5 contracts)
- 28 passing unit tests
- Deployed on Anvil (local) and Sepolia testnet
- Features: stake/unstake, compound rewards, early penalties

**Location**: `contracts/`

### ✅ Phase 2: Python Backend (COMPLETED)
- ✅ Docker Compose infrastructure (6 services)
- ✅ Blockchain event listener (Web3.py) - captures 5 event types
- ✅ MongoDB models (users, stakes, metrics)
- ✅ REST API (14 endpoints for users/stakes/analytics)
- ✅ Celery workers with 6 scheduled tasks
- ✅ Historical metrics with time-series storage
- ✅ Analytics: TVL, APY, tier distribution, top users

**Location**: `backend/`

### 📅 Phase 3: Frontend (PLANNED)
- Next.js + TypeScript
- wagmi + RainbowKit for wallet connection
- Real-time dashboard with analytics charts
- User profile and stake management

**Location**: `frontend/` (coming soon)

## 🛠️ Tech Stack

**Smart Contracts**
- Solidity 0.8.20
- Foundry (forge, anvil)
- OpenZeppelin v4.9.4

**Backend**
- Python 3.11
- Flask + Flask-CORS
- Web3.py
- MongoDB
- Redis + Celery
- Docker Compose

**Frontend** (Phase 3)
- Next.js 14
- wagmi v2
- RainbowKit
- TailwindCSS

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Foundry (for contracts)
- Node.js 18+ (for frontend - Phase 3)
- MongoDB Compass (optional, for database visualization)

### 1. Smart Contracts
```bash
cd contracts
forge install
forge test
anvil  # Start local blockchain
forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your contract addresses from deployment
docker-compose up -d

# Verify services
docker-compose ps
docker-compose logs -f blockchain-listener
```

### 3. Verify Setup
```bash
# Check Flask API
curl http://localhost:5000/health

# Check analytics
curl http://localhost:5000/api/analytics | jq

# View metrics in MongoDB Compass
# Connect to: mongodb://localhost:27017/chainstaker
```

## 📁 Repository Structure

```
ChainStaker/
├── contracts/          # Solidity smart contracts (Phase 1 ✅)
│   ├── src/
│   ├── test/
│   └── script/
├── backend/            # Python backend (Phase 2 ✅)
│   ├── app/
│   │   ├── api/       # REST endpoints (14 routes)
│   │   ├── models/    # MongoDB schemas (User, Stake, Metric)
│   │   ├── services/  # Blockchain listener
│   │   ├── tasks/     # Celery workers (6 scheduled tasks)
│   │   └── utils/     # Web3 utilities
│   ├── docker-compose.yml
│   ├── API_DOCS.md
│   └── CELERY_TASKS.md
└── frontend/           # Next.js app (Phase 3 📅)
```

## 🔗 Deployed Contracts

**Anvil (Local)**
- StakingPool: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- MockDAI: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

**Sepolia Testnet**
- Coming soon

## 📈 Backend Features

### Event Listener
- Captures 5 blockchain events: StakeCreated, Unstaked, RewardsClaimed, EmergencyWithdraw, RewardPoolFunded
- Stores in MongoDB with full transaction history
- Auto-resume from last processed block after restart

### REST API (14 Endpoints)
- Users: List, details, user stakes
- Stakes: List with filters, details, stats
- Analytics: TVL, users, tiers, contract data, historical metrics

### Celery Tasks (6 Scheduled)
- `snapshot_tvl`: Every 5 minutes
- `snapshot_users`: Every 5 minutes
- `snapshot_tier_distribution`: Every 10 minutes
- `snapshot_top_users`: Every 15 minutes
- `calculate_effective_apy`: Every 15 minutes
- `cleanup_old_metrics`: Daily at 3 AM UTC

### Metrics Time-Series
- Historical data for charting
- API endpoint: `GET /api/analytics/history?type=tvl&hours=24`
- Supported types: tvl, users, tier_distribution, top_users, effective_apy

## 📝 Next Steps

1. ✅ ~~Complete Phase 2 Backend~~ **DONE!**
2. Build Next.js frontend with wallet integration
3. Integrate charts for historical metrics (Recharts)
4. Add notification system (WebSocket or Server-Sent Events)
5. Deploy to Sepolia testnet
6. Comprehensive E2E testing
7. Security audit

## 📚 Documentation

- [API Documentation](backend/API_DOCS.md) - REST endpoints and examples
- [Celery Tasks](backend/CELERY_TASKS.md) - Scheduled tasks and monitoring
- [Backend Structure](backend/STRUCTURE.md) - File organization

## 📄 License

MIT

## 👤 Author

Felix Astier - [@astierfe](https://github.com/astierfe)