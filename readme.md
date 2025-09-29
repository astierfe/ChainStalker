# ChainStaker 🔗

Decentralized DAI staking platform with dynamic rewards, multi-tier APY, and comprehensive analytics.

## 🎯 Overview

ChainStaker is a community-driven staking platform built on Ethereum that allows users to stake DAI (stablecoin) and earn rewards through multiple tiers with different APY rates and lock periods.

### Key Features
- **Multi-tier Staking**: 3 tiers (7d/30d/90d) with progressive APY (5%/8%/12%)
- **Flexible Rewards**: Claim anytime or compound into existing stakes
- **Early Withdrawal**: Available with penalty based on tier
- **Protocol Fees**: Configurable fee collection on rewards
- **Emergency Mode**: Safe withdrawal during contract pause

## 📊 Project Status

### ✅ Phase 1: Smart Contracts (COMPLETED)
- Solidity contracts with Foundry framework
- Modular architecture (5 contracts)
- 28 passing unit tests
- Deployed on Anvil (local) and Sepolia testnet
- Features: stake/unstake, compound rewards, early penalties

**Location**: `contracts/`

### 🚧 Phase 2: Python Backend (IN PROGRESS)
- ✅ Docker Compose infrastructure (6 services)
- ✅ Blockchain event listener (Web3.py)
- ✅ MongoDB models (users, stakes)
- ✅ Flask API skeleton
- ⏳ REST API endpoints (users, stakes, analytics)
- ⏳ Celery workers for periodic analytics
- ⏳ Notification system

**Location**: `backend/`

### 📅 Phase 3: Frontend (PLANNED)
- Next.js + TypeScript
- wagmi + RainbowKit for wallet connection
- Real-time dashboard with analytics
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
# Edit .env with your contract addresses
docker-compose up -d
docker-compose logs -f blockchain-listener
```

### 3. Verify Setup
```bash
# Check Flask API
curl http://localhost:5000/health

# Check MongoDB data
docker-compose exec mongodb mongosh chainstaker --eval "db.stakes.find().limit(5)"
```

## 📁 Repository Structure

```
ChainStaker/
├── contracts/          # Solidity smart contracts
│   ├── src/
│   ├── test/
│   └── script/
├── backend/            # Python backend
│   ├── app/
│   │   ├── api/       # REST endpoints
│   │   ├── models/    # MongoDB schemas
│   │   ├── services/  # Blockchain listener, analytics
│   │   └── tasks/     # Celery workers
│   └── docker-compose.yml
└── frontend/           # Next.js app (Phase 3)
```

## 🔗 Deployed Contracts

**Anvil (Local)**
- StakingPool: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- MockDAI: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

**Sepolia Testnet**
- Coming soon

## 📝 Next Steps

1. Complete REST API endpoints (GET /stakes, /users, /analytics)
2. Implement Celery analytics tasks (APY calculations, TVL tracking)
3. Add notification system (stake milestones, APY boosts)
4. Build Next.js frontend with wallet integration
5. Deploy to Sepolia testnet
6. Comprehensive testing and security audit

## 📄 License

MIT

## 👤 Author

Felix Astier - [@astierfe](https://github.com/astierfe)