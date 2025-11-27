# ChainStaker - System Architecture

This document provides a comprehensive technical overview of the ChainStaker platform architecture, including detailed component interactions, data flow, and database schema.

## Table of Contents

1. [Complete System Architecture](#complete-system-architecture)
2. [Event Processing Flow](#event-processing-flow)
3. [MongoDB Data Schema](#mongodb-data-schema)
4. [Component Descriptions](#component-descriptions)
5. [Technology Choices](#technology-choices)
6. [Scalability Considerations](#scalability-considerations)

---

## Complete System Architecture

The following diagram shows the complete technical architecture of ChainStaker, including all components and their interactions:

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js 14 Application<br/>TypeScript]
        WAGMI[wagmi v2 + RainbowKit<br/>Wallet Connection]
        TANSTACK[TanStack Query<br/>Data Fetching]
        RECHARTS[Recharts<br/>Analytics Visualization]
    end

    subgraph "Backend Services (Docker)"
        API[Flask REST API<br/>:5000]
        MONGO[(MongoDB<br/>:27017<br/>users, stakes, metrics, raw_events)]
        REDIS[(Redis<br/>:6379<br/>Celery Broker)]
        WORKER[Celery Worker<br/>Task Execution]
        BEAT[Celery Beat<br/>Task Scheduler<br/>8 tasks: 5-15 min intervals]
        LISTENER[Blockchain Listener<br/>Web3.py<br/>Polls every 2s]
    end

    subgraph "Blockchain Layer (Sepolia)"
        POOL[StakingPool Contract<br/>0xa247e02...0c28]
        DAI[DAI Token<br/>0x2FA332...B71a]
        MOCK[MockDAI Provider<br/>0xB1547d...4e1c]
    end

    subgraph "External Services"
        ALCHEMY[Alchemy RPC<br/>Sepolia Endpoint]
    end

    UI --> WAGMI
    UI --> TANSTACK
    UI --> RECHARTS
    WAGMI --> ALCHEMY
    TANSTACK --> API

    API --> MONGO
    API --> REDIS
    WORKER --> MONGO
    WORKER --> REDIS
    BEAT --> REDIS

    LISTENER --> ALCHEMY
    LISTENER --> MONGO

    ALCHEMY --> POOL
    ALCHEMY --> DAI
    POOL --> DAI
    DAI --> MOCK

    style UI fill:#61dafb
    style API fill:#90EE90
    style MONGO fill:#47A248
    style REDIS fill:#DC382D
    style WORKER fill:#90EE90
    style BEAT fill:#FFA500
    style LISTENER fill:#FFD700
    style POOL fill:#627EEA
    style DAI fill:#627EEA
    style ALCHEMY fill:#0052FF
```

---

## Event Processing Flow

This diagram illustrates how blockchain events are captured, stored, and aggregated into analytics metrics:

```mermaid
flowchart TD
    A[Blockchain Listener<br/>Polls Sepolia every 2s<br/>From block 9662396] --> B{New Events?}
    B -->|No| A
    B -->|Yes| C[Detect Event Type]

    C --> D[StakeCreated]
    C --> E[Unstaked]
    C --> F[RewardsClaimed]
    C --> G[EmergencyWithdraw]
    C --> H[RewardPoolFunded]

    D --> I[Convert uint256<br/>for MongoDB<br/>int if < 2^63 else string]
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J[Store in raw_events<br/>Collection Schema:<br/>event_name, args,<br/>block_number, processed_at]

    J --> K{Event Type}
    K -->|StakeCreated| L[Create User<br/>Create Stake<br/>Increment active_stakes_count]
    K -->|Unstaked| M[Update Stake status<br/>Decrement active_stakes_count<br/>Add rewards to user]
    K -->|RewardsClaimed| N[Increment total_rewards_claimed<br/>Update last_reward_claim<br/>Add to stake.total_rewards_claimed]
    K -->|EmergencyWithdraw| O[Update Stake status<br/>Decrement active_stakes_count]
    K -->|RewardPoolFunded| P[Log event<br/>No DB updates]

    L --> Q[MongoDB Collections<br/>users, stakes]
    M --> Q
    N --> Q
    O --> Q

    Q --> R[Celery Beat Scheduler<br/>Triggers every 5-15 min]

    R --> S[8 Aggregation Tasks]
    S --> T[snapshot_tvl<br/>5 min]
    S --> U[snapshot_users<br/>5 min]
    S --> V[snapshot_tier_distribution<br/>10 min]
    S --> W[snapshot_top_users<br/>15 min]
    S --> X[calculate_effective_apy<br/>15 min]
    S --> Y[snapshot_rewards_timeline<br/>15 min]
    S --> Z[snapshot_activity_heatmap<br/>15 min]
    S --> AA[cleanup_old_metrics<br/>Daily 3 AM UTC]

    T --> AB[(metrics Collection<br/>type, value, metadata, timestamp)]
    U --> AB
    V --> AB
    W --> AB
    X --> AB
    Y --> AB
    Z --> AB

    AB --> AC[Flask REST API<br/>20+ Endpoints]
    AC --> AD[Frontend<br/>TanStack Query<br/>Refetch: 3s stakes, 30s analytics]

    style A fill:#FFD700
    style J fill:#47A248
    style Q fill:#47A248
    style R fill:#FFA500
    style AB fill:#47A248
    style AC fill:#90EE90
    style AD fill:#61dafb
```

---

## MongoDB Data Schema

This entity-relationship diagram shows the structure of MongoDB collections and their relationships:

```mermaid
erDiagram
    users ||--o{ stakes : "has"
    stakes }o--|| raw_events : "generated_by"

    users {
        string address PK "lowercase, unique"
        int_or_string total_staked "MongoDB-safe uint256"
        int_or_string total_rewards_claimed "MongoDB-safe uint256"
        int active_stakes_count
        datetime created_at
        datetime updated_at
    }

    stakes {
        string user_address FK "lowercase"
        int stake_index "composite key with user_address"
        int_or_string amount "MongoDB-safe uint256"
        int tier_id "0=7d, 1=30d, 2=90d"
        string status "active | unstaked | emergency_withdrawn"
        int_or_string total_rewards_claimed "MongoDB-safe uint256"
        int start_time "timestamp seconds"
        int last_reward_claim "timestamp seconds"
        string tx_hash
        int block_number
        datetime created_at
        datetime updated_at
    }

    raw_events {
        objectId _id PK
        string event_name "StakeCreated | Unstaked | RewardsClaimed | EmergencyWithdraw | RewardPoolFunded"
        object args "user, amount, stakeIndex, tierId, timestamp, etc."
        int block_number
        string transaction_hash
        int log_index
        datetime processed_at
    }

    metrics {
        objectId _id PK
        string type "tvl | users | tier_distribution | top_users | effective_apy | rewards_timeline | activity_heatmap"
        int_or_string value "primary metric value"
        object metadata "additional data: arrays for timeline, heatmap; nested objects for complex metrics"
        datetime timestamp "TTL: 30 days auto-cleanup"
    }

    listener_state {
        objectId _id PK
        int last_processed_block "for auto-resume"
        datetime updated_at
    }
```

**Key Schema Notes**:

- **uint256 Storage**: Values < 2^63 stored as MongoDB int, values >= 2^63 stored as string (via `convert_uint256_for_mongodb()`)
- **Aggregation Pattern**: Use `convert_to_double('$field')` in MongoDB aggregation pipelines to handle mixed int/string types
- **Composite Keys**: `stakes` uses (`user_address`, `stake_index`) as unique identifier
- **Indexes**: `users.address` (unique), `stakes` on (`user_address`, `stake_index`), `raw_events.timestamp`, `metrics.timestamp` (TTL 30 days)

---

## Component Descriptions

### Frontend Layer

**Next.js 14 Application**
- Server-side rendering (SSR) and static site generation (SSG) for optimal performance
- TypeScript for type safety across components, hooks, and API interactions
- TailwindCSS for responsive styling

**wagmi v2 + RainbowKit**
- wagmi provides React hooks for Ethereum interactions (`useAccount`, `useContractWrite`, `useContractRead`)
- RainbowKit handles wallet connection UI (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- Configured for Sepolia testnet (Chain ID: 11155111)

**TanStack Query (React Query)**
- Data fetching with automatic caching and refetching (3s for stakes, 30s for analytics)
- Optimistic updates for better UX during transactions
- Error handling and retry logic

**Recharts**
- Line charts for TVL sparkline and rewards timeline
- Heatmaps for hourly activity visualization
- Leaderboard tables for top stakers

### Backend Services

**Flask REST API**
- CORS-enabled for cross-origin requests from Next.js frontend
- 20+ endpoints organized into blueprints: users, stakes, analytics, TVL sparkline
- JWT authentication (planned for future admin features)

**MongoDB**
- Document database for flexible schema (handles Solidity uint256 with custom conversion)
- Time-series collections for metrics with TTL indexes (auto-cleanup after 30 days)
- Aggregation pipelines for complex analytics queries

**Redis**
- Message broker for Celery task queue
- Result backend for task status tracking
- AOF persistence enabled for durability

**Celery Worker**
- Asynchronous task execution for analytics aggregation
- Handles 8 scheduled tasks (TVL snapshots, user stats, tier distribution, etc.)
- Retry logic with exponential backoff for transient failures

**Celery Beat**
- Cron-like scheduler for periodic tasks
- Triggers tasks every 5-15 minutes (varies by task)
- Daily cleanup at 3 AM UTC for old metrics

**Blockchain Listener**
- Polls Sepolia RPC endpoint every 2 seconds for new blocks
- Processes blocks in batches (configurable `BATCH_SIZE`)
- Stores last processed block in `listener_state` collection for auto-resume after restart
- Converts uint256 values to MongoDB-safe format before storage

### Blockchain Layer

**StakingPool Contract**
- Main entry point for user interactions
- Inherits from StakingAdmin → StakingRewards → StakingCore
- Uses StakingMath library for gas-optimized calculations

**DAI Token**
- ERC20 token used for staking
- MockDAI implementation for Sepolia testnet (public `mint()` function)

**MockDAI Provider**
- Test utility for adjusting DAI price (for penalty calculation testing)
- Not used in production, but available for edge case testing

---

## Technology Choices

### Why MongoDB?

1. **Flexible Schema**: Handles Solidity uint256 values (up to 2^256) by storing as int (< 2^63) or string (>= 2^63)
2. **Time-Series Optimization**: Efficient storage and querying of historical metrics
3. **Aggregation Pipelines**: Complex analytics queries (TVL history, rewards timeline) in single database operations
4. **TTL Indexes**: Automatic cleanup of old metrics (30-day retention) without manual cron jobs

### Why Celery?

1. **Asynchronous Analytics**: Aggregation tasks run in background without blocking API requests
2. **Scheduled Tasks**: Built-in cron-like scheduler (Celery Beat) for periodic metric snapshots
3. **Scalability**: Can scale to multiple worker nodes if needed
4. **Retry Logic**: Automatic retry with exponential backoff for transient errors

### Why wagmi v2?

1. **Type-Safe**: End-to-end TypeScript typing from contract ABIs to React hooks
2. **React Hooks**: Idiomatic React patterns for Ethereum interactions
3. **Caching**: Automatic caching of contract reads with configurable refetch intervals
4. **RainbowKit Integration**: Seamless wallet connection UI with minimal configuration

### Why Foundry?

1. **Fast Tests**: Solidity tests run 10x faster than Hardhat (all tests in 2-3 seconds)
2. **Fuzzing**: Property-based testing with automatic fuzzing (`forge test --fuzz-runs 10000`)
3. **Gas Optimization**: Built-in gas profiling (`forge test --gas-report`)
4. **No JavaScript**: Pure Solidity development environment

---

## Scalability Considerations

### Current Architecture (Single-Server Deployment)

- All services run on single Docker host
- Suitable for testnet deployment and demonstration purposes
- MongoDB handles ~1,000 events/day with ease
- Celery tasks complete in < 1 second each

### Production Scaling Strategies

**1. Horizontal Scaling**
- Add multiple Celery workers for parallel task execution
- Use MongoDB replica set for read scalability (primary for writes, secondaries for reads)
- Deploy Flask API behind load balancer (multiple API instances)

**2. Caching Layer**
- Add Redis caching for frequently accessed data (TVL, user stats)
- Cache TTL: 30 seconds (matching Celery task frequency)
- Invalidate cache on write operations (new stake, claim, unstake)

**3. Event Processing Optimization**
- Batch event processing (current: 100 blocks/batch, can increase to 1,000)
- Parallel event handlers (use multiprocessing for heavy aggregations)
- Consider event streaming (Kafka/RabbitMQ) for high-throughput scenarios

**4. Database Sharding**
- Shard `stakes` collection by `user_address` for write scalability
- Keep `users` and `metrics` unsharded (smaller collections)
- Use MongoDB Atlas auto-sharding for managed solution

**5. Frontend Optimization**
- CDN for static assets (Vercel Edge Network)
- ISR (Incremental Static Regeneration) for dashboard pages
- WebSockets for real-time updates (alternative to polling)

### Security Considerations

**Smart Contracts**
- ReentrancyGuard on all state-changing functions
- Pausable pattern for emergency stops
- Ownable for admin-only functions (tier updates, fee changes)
- No private keys in backend (event listener is read-only)

**Backend**
- CORS restricted to frontend domain (not `*` in production)
- Environment variables for secrets (MongoDB URI, RPC URLs)
- Rate limiting on API endpoints (planned: Flask-Limiter)

**Frontend**
- Wallet signatures for all transactions (MetaMask, WalletConnect)
- No private key storage (wagmi uses browser wallet)
- HTTPS only in production (Vercel enforces TLS)

---

## Performance Metrics

**Current Testnet Performance**:
- Blockchain Listener: Processes 100 blocks in ~5 seconds
- Celery Tasks: Each task completes in 0.5-1 second
- API Response Times: < 100ms for most endpoints, < 500ms for complex analytics
- Frontend Load Time: ~1.5s initial load (Next.js SSR), < 100ms navigation (client-side routing)

**Database Size (After 1 Week)**:
- `raw_events`: ~5,000 documents (~2 MB)
- `stakes`: ~500 documents (~500 KB)
- `users`: ~100 documents (~50 KB)
- `metrics`: ~10,000 documents (30-day retention, ~5 MB)

---

For API details, see [API.md](../api/API.md).
For smart contract architecture, see [CONTRACTS.md](../smart-contracts/CONTRACTS.md).
For deployment instructions, see [SEPOLIA.md](../deployment/SEPOLIA.md).
