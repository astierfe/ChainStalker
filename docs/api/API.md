# ChainStaker API Reference

Complete reference for ChainStaker REST API endpoints, Celery tasks, and frontend integration patterns.

**Base URL**: `http://localhost:5000` (development) | `https://api.chainstaker.com` (production - planned)

## Table of Contents

1. [Authentication](#authentication)
2. [Users API](#users-api)
3. [Stakes API](#stakes-api)
4. [Analytics API](#analytics-api)
5. [TVL Sparkline API](#tvl-sparkline-api)
6. [Celery Tasks](#celery-tasks)
7. [Frontend Integration](#frontend-integration)
8. [Error Handling](#error-handling)

---

## Authentication

Currently no authentication required (v1.2.0). All endpoints are public read-only.

**Planned**: JWT authentication for admin endpoints (tier updates, protocol fee changes).

---

## Users API

### List Users

```bash
GET /api/users?skip=0&limit=50
```

**Query Parameters**:
- `skip` (optional): Number of records to skip. Default: 0
- `limit` (optional): Max records to return. Default: 50, Max: 100

**Response**:
```json
{
  "users": [
    {
      "address": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "total_staked": "1000000000000000000000",
      "total_rewards_claimed": "50000000000000000000",
      "active_stakes_count": 2,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-20T14:45:00Z"
    }
  ],
  "total": 150,
  "skip": 0,
  "limit": 50
}
```

### Get User Details

```bash
GET /api/users/{address}
```

**Path Parameters**:
- `address`: Ethereum address (checksummed or lowercase)

**Response**: Single user object or 404 if not found.

### Get User Stakes

```bash
GET /api/users/{address}/stakes?status=active
```

**Query Parameters**:
- `status` (optional): Filter by stake status (`active`, `unstaked`, `emergency_withdrawn`)

**Response**:
```json
{
  "user_address": "0x...",
  "stakes": [
    {
      "user_address": "0x...",
      "stake_index": 0,
      "amount": "1000000000000000000000",
      "tier_id": 1,
      "status": "active",
      "total_rewards_claimed": "0",
      "start_time": 1705315200,
      "last_reward_claim": 1705315200,
      "tx_hash": "0x...",
      "block_number": 12345678,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total_stakes": 2
}
```

---

## Stakes API

### List Stakes

```bash
GET /api/stakes?status=active&tier_id=1&skip=0&limit=20
```

**Query Parameters**:
- `status` (optional): Filter by status
- `tier_id` (optional): Filter by tier (0, 1, or 2)
- `skip` (optional): Pagination skip
- `limit` (optional): Pagination limit (max: 100)

### Get Specific Stake

```bash
GET /api/stakes/{address}/{stake_index}
```

**Path Parameters**:
- `address`: User address
- `stake_index`: Stake index (0, 1, 2, ...)

### Get Active Stakes

```bash
GET /api/stakes/active
```

Returns all active stakes across all users (no pagination).

### Get Stakes Statistics

```bash
GET /api/stakes/stats
```

**Response**:
```json
{
  "by_status": [
    {
      "status": "active",
      "count": 300,
      "total_amount": "500000000000000000000000"
    }
  ],
  "by_tier": [
    {
      "tier_id": 0,
      "count": 100,
      "total_amount": "150000000000000000000000"
    }
  ]
}
```

---

## Analytics API

### Get All Analytics

```bash
GET /api/analytics
```

Returns complete analytics dashboard data (TVL, users, stakes, rewards, tiers).

**Response**:
```json
{
  "tvl": {
    "total_value_locked": "500000000000000000000000",
    "tvl_formatted": "500000.00 DAI",
    "active_stakes_count": 300
  },
  "users": {
    "total_users": 150,
    "active_users": 120,
    "inactive_users": 30,
    "avg_stake_per_user": "3333333333333333333333",
    "total_rewards_distributed": "25000000000000000000000"
  },
  "stakes": {
    "total_stakes": 500,
    "active_stakes": 300,
    "unstaked_stakes": 180,
    "emergency_withdrawals": 20
  },
  "rewards": {
    "total_rewards_claimed": "25000000000000000000000",
    "avg_rewards_per_stake": "50000000000000000000"
  },
  "tiers": {
    "tiers": [
      {
        "tier_id": 0,
        "tier_name": "7 days (5% APY)",
        "stake_count": 100,
        "total_staked": "150000000000000000000000"
      }
    ]
  }
}
```

### Get TVL

```bash
GET /api/analytics/tvl
```

Returns Total Value Locked (sum of all active stakes).

### Get User Analytics

```bash
GET /api/analytics/users
```

Returns user statistics (total, active, inactive, averages).

### Get Tier Distribution

```bash
GET /api/analytics/tiers
```

Returns stake distribution across 3 tiers.

### Get Contract Data (Real-Time)

```bash
GET /api/analytics/contract
```

Fetches data directly from blockchain (not from MongoDB). Useful for verifying on-chain state.

**Response**:
```json
{
  "reward_pool_balance": "500000000000000000000000",
  "protocol_fee_bps": 200,
  "fee_collector": "0x...",
  "tiers": [
    {
      "tier_id": 0,
      "min_duration": 604800,
      "apy": 500,
      "early_withdraw_penalty": 2000
    }
  ]
}
```

### Get Historical Metrics

```bash
GET /api/analytics/history?type=tvl&hours=168&limit=500
```

**Query Parameters**:
- `type` (required): Metric type (`tvl`, `users`, `tier_distribution`, `top_users`, `effective_apy`, `rewards_timeline`, `activity_heatmap`)
- `hours` (optional): Time window in hours. Default: 24, Max: 720 (30 days)
- `limit` (optional): Max records to return. Default: 100, Max: 500

**Response**:
```json
{
  "type": "tvl",
  "data": [
    {
      "value": "500000000000000000000000",
      "metadata": {
        "active_stakes_count": 300
      },
      "timestamp": "2025-01-20T14:45:00Z"
    }
  ],
  "count": 336,
  "time_window_hours": 168
}
```

### Get Available Metric Types

```bash
GET /api/analytics/history/types
```

Returns list of available metric types for history endpoint.

### Get Top Stakers

```bash
GET /api/analytics/top-stakers?limit=20&tier_id=1
```

**Query Parameters**:
- `limit` (optional): Number of stakers to return. Default: 3 (dashboard), Max: 100
- `tier_id` (optional): Filter by tier (0, 1, or 2)

**Response**:
```json
{
  "top_stakers": [
    {
      "user_address": "0x...",
      "total_staked_wei": "5000000000000000000000",
      "total_staked_dai": "5000.00",
      "active_stakes_count": 3,
      "tier_id": 1
    }
  ],
  "total_stakers": 150,
  "limit": 20,
  "tier_filter": 1
}
```

### Get Rewards Timeline

```bash
GET /api/analytics/rewards-timeline?days=30
```

**Query Parameters**:
- `days` (optional): Number of days to include. Default: 30, Max: 90

**Response**:
```json
{
  "timeline_data": [
    {
      "date": "2025-01-20",
      "rewards_wei": "500000000000000000000",
      "rewards_dai": "500.00",
      "claim_count": 15,
      "cumulative_rewards_wei": "25000000000000000000000"
    }
  ],
  "total_rewards_wei": "25000000000000000000000",
  "total_claims": 450,
  "days": 30
}
```

### Get Activity Heatmap

```bash
GET /api/analytics/activity-heatmap?days=7
```

**Query Parameters**:
- `days` (optional): Number of days to include. Default: 7, Max: 30

**Response**:
```json
{
  "heatmap_data": [
    {
      "date": "2025-01-20",
      "hour": 14,
      "stake_created": 5,
      "rewards_claimed": 10,
      "unstaked": 3,
      "emergency_withdraw": 0,
      "total_events": 18
    }
  ],
  "days": 7,
  "total_events": 1250
}
```

---

## TVL Sparkline API

### Get TVL Sparkline

```bash
GET /api/analytics/tvl/sparkline?hours=24&points=50
```

**Query Parameters**:
- `hours` (optional): Time window. Default: 24, Max: 720 (30 days)
- `points` (optional): Number of data points. Default: 50, Max: 500

**Response**:
```json
{
  "current_tvl_wei": "500000000000000000000000",
  "current_tvl_dai": "500000.00",
  "sparkline_data": [
    {
      "timestamp": "2025-01-20T14:45:00Z",
      "value_wei": "500000000000000000000000",
      "value_dai": "500000.00"
    }
  ],
  "change_24h": {
    "change_absolute_wei": "10000000000000000000000",
    "change_absolute_dai": "10000.00",
    "change_percent": 2.04
  },
  "time_window_hours": 24,
  "points": 50
}
```

### Get Current TVL Only

```bash
GET /api/analytics/tvl/sparkline/current
```

Lightweight endpoint that returns only current TVL (no historical data).

---

## Celery Tasks

ChainStaker uses Celery Beat for scheduled background tasks that aggregate metrics.

### Task Schedule

| Task Name | Schedule | Description |
|-----------|----------|-------------|
| `snapshot_tvl` | Every 5 minutes | Records TVL and active stakes count |
| `snapshot_users` | Every 5 minutes | Records user statistics (total, active, inactive) |
| `snapshot_tier_distribution` | Every 10 minutes | Records stake distribution by tier |
| `snapshot_top_users` | Every 15 minutes | Records top 10 stakers (extendable to 100) |
| `calculate_effective_apy` | Every 15 minutes | Calculates real-time APY from actual rewards |
| `snapshot_rewards_timeline` | Every 15 minutes | Aggregates daily rewards for last 90 days |
| `snapshot_activity_heatmap` | Every 15 minutes | Aggregates hourly event activity for last 30 days |
| `cleanup_old_metrics` | Daily at 3 AM UTC | Removes metrics older than 30 days |

### Task Execution

Tasks store results in the `metrics` collection with schema:
```json
{
  "type": "tvl",
  "value": "500000000000000000000000",
  "metadata": {
    "active_stakes_count": 300
  },
  "timestamp": "2025-01-20T14:45:00Z"
}
```

### Manual Task Execution

```bash
# Via Celery CLI
docker exec -it celery-worker celery -A app.tasks.celery_app call app.tasks.analytics_tasks.snapshot_tvl

# Via Python (faster for testing)
docker exec -it celery-worker python -c "
from app.tasks.analytics_tasks import snapshot_tvl
result = snapshot_tvl()
print(result)
"
```

### Monitoring Tasks

```bash
# View Celery logs
docker-compose logs -f celery-worker

# Check task status
docker exec -it celery-worker celery -A app.tasks.celery_app inspect active

# Restart workers after code changes
docker-compose restart celery-worker celery-beat
```

---

## Frontend Integration

### TanStack Query Patterns

**Dashboard Hook Example** (TVL Sparkline):
```typescript
import { useQuery } from '@tanstack/react-query'

export function useTVLSparkline(hours: number = 24, points: number = 50) {
  return useQuery({
    queryKey: ['tvl-sparkline', hours, points],
    queryFn: async () => {
      const res = await fetch(
        `http://localhost:5000/api/analytics/tvl/sparkline?hours=${hours}&points=${points}`
      )
      if (!res.ok) throw new Error('Failed to fetch TVL sparkline')
      return res.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  })
}
```

**Usage in Component**:
```tsx
function TVLSparklineCard() {
  const { data, isLoading, error } = useTVLSparkline(24, 50)

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <h3>TVL: {data.current_tvl_dai} DAI</h3>
      <p>24h change: {data.change_24h.change_percent}%</p>
      <LineChart data={data.sparkline_data} />
    </div>
  )
}
```

### Refetch Intervals

- **User Stakes**: 3 seconds (real-time updates during staking/claiming)
- **Analytics**: 30 seconds (matches Celery task frequency)
- **Historical Data**: 60 seconds (less frequent updates needed)

### Auto-Approval Staking Pattern

ChainStaker frontend uses a 5x buffer for DAI approvals to minimize transaction count:

```typescript
// 1. Check current allowance
const allowance = await daiContract.read.allowance([userAddress, stakingPoolAddress])

// 2. If insufficient, approve 5x the stake amount
if (allowance < stakeAmount) {
  const approvalAmount = stakeAmount * 5n // 5x buffer
  await daiContract.write.approve([stakingPoolAddress, approvalAmount])
}

// 3. Proceed with staking
await stakingPoolContract.write.stake([stakeAmount, tierId])
```

This pattern allows users to stake multiple times without re-approving DAI on each transaction.

---

## Error Handling

### Standard Error Responses

All API errors return this format:
```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 400 | Bad Request | Invalid query parameters (e.g., `limit` > 100) |
| 404 | Not Found | User or stake does not exist |
| 500 | Internal Server Error | Database connection failure, unexpected error |

### Frontend Error Handling

```typescript
const { data, error } = useQuery({
  queryKey: ['user-stakes', address],
  queryFn: async () => {
    const res = await fetch(`/api/users/${address}/stakes`)
    if (!res.ok) {
      if (res.status === 404) throw new Error('User not found')
      throw new Error('Failed to fetch user stakes')
    }
    return res.json()
  },
  retry: 3, // Retry 3 times on failure
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
})
```

---

## Testing Workflow

### 1. Start Services

```bash
cd backend
docker-compose up -d
```

### 2. Verify Health

```bash
curl http://localhost:5000/health
# Expected: {"status": "ok"}
```

### 3. Test Analytics Endpoint

```bash
curl http://localhost:5000/api/analytics | jq
```

### 4. Test TVL Sparkline

```bash
curl "http://localhost:5000/api/analytics/tvl/sparkline?hours=24&points=50" | jq
```

### 5. Test Top Stakers

```bash
curl "http://localhost:5000/api/analytics/top-stakers?limit=3" | jq
```

### 6. Test Historical Metrics

```bash
curl "http://localhost:5000/api/analytics/history?type=tvl&hours=168&limit=500" | jq
```

### 7. Monitor Celery Tasks

```bash
docker-compose logs -f celery-beat
# Should see: "Scheduled snapshot_tvl: every 5 minutes"
```

### 8. Check MongoDB

```bash
docker exec -it mongodb mongosh
> use chainstaker
> db.metrics.countDocuments()
> db.stakes.find().limit(5)
```

---

For architecture details, see [ARCHITECTURE.md](../architecture/ARCHITECTURE.md).
For smart contract integration, see [CONTRACTS.md](../smart-contracts/CONTRACTS.md).
For deployment instructions, see [SEPOLIA.md](../deployment/SEPOLIA.md).
