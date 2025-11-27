# ChainStaker API Documentation - v1.2

Base URL: `http://localhost:5000`

## Health Check

```bash
# Check API status
curl http://localhost:5000/health
```

---

## Users API (`/api/users`)

### List Users
```bash
# Get all users (paginated)
curl http://localhost:5000/api/users

# With pagination
curl "http://localhost:5000/api/users?skip=0&limit=10"
```

**Response:**
```json
{
  "users": [
    {
      "address": "0x...",
      "total_staked": "1000000000000000000000",
      "total_rewards_claimed": "50000000000000000000",
      "active_stakes_count": 2,
      "created_at": "2025-01-15T10:30:00",
      "updated_at": "2025-01-20T14:45:00"
    }
  ],
  "total": 150,
  "skip": 0,
  "limit": 50
}
```

### Get User Details
```bash
# Get specific user
curl http://localhost:5000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### Get User Stakes
```bash
# Get all stakes for a user
curl http://localhost:5000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/stakes

# Filter by status
curl "http://localhost:5000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/stakes?status=active"
```

**Response:**
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
      "tx_hash": "0x...",
      "block_number": 12345
    }
  ],
  "total_stakes": 2
}
```

---

## Stakes API (`/api/stakes`)

### List Stakes
```bash
# Get all stakes (paginated)
curl http://localhost:5000/api/stakes

# With pagination
curl "http://localhost:5000/api/stakes?skip=0&limit=20"

# Filter by status
curl "http://localhost:5000/api/stakes?status=active"

# Filter by tier
curl "http://localhost:5000/api/stakes?tier_id=1"

# Combined filters
curl "http://localhost:5000/api/stakes?status=active&tier_id=2&limit=10"
```

**Response:**
```json
{
  "stakes": [...],
  "total": 500,
  "skip": 0,
  "limit": 50,
  "filters": {
    "status": "active",
    "tier_id": null
  }
}
```

### Get Specific Stake
```bash
# Get stake by address and index
curl http://localhost:5000/api/stakes/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/0
```

### Get Active Stakes
```bash
# Get all active stakes
curl http://localhost:5000/api/stakes/active
```

### Get Stakes Statistics
```bash
# Get stake stats by status and tier
curl http://localhost:5000/api/stakes/stats
```

**Response:**
```json
{
  "by_status": [
    {
      "status": "active",
      "count": 300,
      "total_amount": "500000000000000000000000"
    },
    {
      "status": "unstaked",
      "count": 150,
      "total_amount": "200000000000000000000000"
    }
  ],
  "by_tier": [
    {
      "tier_id": 0,
      "count": 100,
      "total_amount": "150000000000000000000000"
    },
    {
      "tier_id": 1,
      "count": 120,
      "total_amount": "200000000000000000000000"
    },
    {
      "tier_id": 2,
      "count": 80,
      "total_amount": "150000000000000000000000"
    }
  ]
}
```

---

## Analytics API (`/api/analytics`)

### Get All Analytics
```bash
# Get complete analytics dashboard
curl http://localhost:5000/api/analytics
```

**Response:**
```json
{
  "tvl": {
    "total_value_locked": "500000000000000000000000",
    "tvl_formatted": "500000.00 DAI"
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
    "tiers": [...]
  }
}
```

### Get TVL (Total Value Locked)
```bash
curl http://localhost:5000/api/analytics/tvl
```

### Get User Analytics
```bash
curl http://localhost:5000/api/analytics/users
```

### Get Tier Distribution
```bash
curl http://localhost:5000/api/analytics/tiers
```

**Response:**
```json
{
  "tiers": [
    {
      "tier_id": 0,
      "tier_name": "7 days (5% APY)",
      "stake_count": 100,
      "total_staked": "150000000000000000000000",
      "avg_stake_amount": "1500000000000000000000"
    },
    {
      "tier_id": 1,
      "tier_name": "30 days (8% APY)",
      "stake_count": 120,
      "total_staked": "200000000000000000000000",
      "avg_stake_amount": "1666666666666666666666"
    },
    {
      "tier_id": 2,
      "tier_name": "90 days (12% APY)",
      "stake_count": 80,
      "total_staked": "150000000000000000000000",
      "avg_stake_amount": "1875000000000000000000"
    }
  ]
}
```

### Get Contract Info
```bash
# Get real-time contract data from blockchain
curl http://localhost:5000/api/analytics/contract
```

**Response:**
```json
{
  "total_staked": "500000000000000000000000",
  "reward_pool_balance": "100000000000000000000000",
  "contract_balance": "600000000000000000000000",
  "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
}
```

### Get Metrics History
```bash
# Get historical metrics (generic endpoint)
curl "http://localhost:5000/api/analytics/history?type=tvl&hours=168&limit=500"

# Get available metric types
curl http://localhost:5000/api/analytics/history/types
```

**Response:**
```json
{
  "type": "tvl",
  "hours": 168,
  "data_points": 336,
  "history": [
    {
      "value": "500000000000000000000000",
      "metadata": {
        "active_stakes": 300,
        "tvl_formatted": "500000.00 DAI"
      },
      "timestamp": "2025-01-20T10:30:00"
    }
  ]
}
```

### Get TVL Sparkline
```bash
# Get TVL sparkline data for dashboard (24h, 50 points)
curl "http://localhost:5000/api/analytics/tvl/sparkline?hours=24&points=50"

# Get current TVL only
curl http://localhost:5000/api/analytics/tvl/sparkline/current
```

**Response:**
```json
{
  "current_tvl": "500000.00",
  "current_tvl_wei": "500000000000000000000000",
  "change_24h": 5000.50,
  "change_percent_24h": 1.01,
  "data_points": [
    {
      "timestamp": "2025-01-20T10:30:00Z",
      "value_dai": 495000.00,
      "value_wei": "495000000000000000000000"
    }
  ],
  "period_hours": 24,
  "points_returned": 50
}
```

### Get Top Stakers
```bash
# Get top 3 stakers (default for dashboard)
curl http://localhost:5000/api/analytics/top-stakers

# Get top 20 stakers (for leaderboard)
curl "http://localhost:5000/api/analytics/top-stakers?limit=20"

# Filter by tier (optional)
curl "http://localhost:5000/api/analytics/top-stakers?limit=10&tier_id=2"
```

**Response:**
```json
{
  "stakers": [
    {
      "rank": 1,
      "address": "0x...",
      "total_staked": "100000000000000000000000",
      "total_staked_formatted": "100,000.00 DAI",
      "rewards_claimed": "5000000000000000000000",
      "active_stakes": 5
    }
  ],
  "count": 3,
  "timestamp": "2025-01-20T14:30:00"
}
```

### Get Rewards Timeline
```bash
# Get rewards timeline (default: 30 days)
curl http://localhost:5000/api/analytics/rewards-timeline

# Get 90 days history
curl "http://localhost:5000/api/analytics/rewards-timeline?days=90"
```

**Response:**
```json
{
  "timeline": [
    {
      "date": "2025-01-20",
      "rewards_wei": "1000000000000000000000",
      "rewards_dai": 1000.00,
      "claim_count": 15,
      "timestamp": "2025-01-20T15:00:00"
    }
  ],
  "days": 30,
  "data_points": 30,
  "total_rewards_wei": "30000000000000000000000",
  "total_rewards_dai": 30000.00,
  "total_claims": 450
}
```

### Get Activity Heatmap
```bash
# Get activity heatmap (default: 7 days)
curl http://localhost:5000/api/analytics/activity-heatmap

# Get 30 days heatmap
curl "http://localhost:5000/api/analytics/activity-heatmap?days=30"
```

**Response:**
```json
{
  "heatmap": [
    {
      "date": "2025-01-20",
      "hour": 14,
      "StakeCreated": 5,
      "RewardsClaimed": 10,
      "Unstaked": 2,
      "total": 17
    }
  ],
  "days_covered": 7,
  "total_events": 500,
  "data_points": 168,
  "timestamp": "2025-01-20T15:00:00"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Testing Workflow

```bash
# 1. Check API health
curl http://localhost:5000/health

# 2. Get analytics overview
curl http://localhost:5000/api/analytics

# 3. Get TVL sparkline (dashboard)
curl "http://localhost:5000/api/analytics/tvl/sparkline?hours=24&points=50"

# 4. Get top 3 stakers (dashboard)
curl http://localhost:5000/api/analytics/top-stakers

# 5. Get full TVL history (History page)
curl "http://localhost:5000/api/analytics/history?type=tvl&hours=168&limit=500"

# 6. Get rewards timeline (History page)
curl "http://localhost:5000/api/analytics/rewards-timeline?days=30"

# 7. Get activity heatmap (History page)
curl "http://localhost:5000/api/analytics/activity-heatmap?days=7"

# 8. Get top 20 stakers leaderboard (History page)
curl "http://localhost:5000/api/analytics/top-stakers?limit=20"

# 9. List users with stakes
curl http://localhost:5000/api/users
curl http://localhost:5000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/stakes

# 10. Filter stakes by tier
curl "http://localhost:5000/api/stakes?tier_id=1&status=active"
```

---

## Celery Tasks

Analytics metrics are updated automatically by Celery Beat scheduler:

| Task | Schedule | Description |
|------|----------|-------------|
| `snapshot_tvl` | Every 5 min | Records TVL and active stakes count |
| `snapshot_users` | Every 5 min | Records user statistics |
| `snapshot_tier_distribution` | Every 10 min | Records stake distribution by tier |
| `snapshot_top_users` | Every 15 min | Records top 10 stakers |
| `calculate_effective_apy` | Every 15 min | Calculates effective APY |
| `snapshot_rewards_timeline` | Every 15 min | Aggregates daily rewards claimed (90 days) |
| `snapshot_activity_heatmap` | Every 15 min | Aggregates hourly event activity (30 days) |
| `cleanup_old_metrics` | Daily 3 AM | Removes metrics older than 30 days |

**Manual Task Execution:**
```bash
# Via Celery call
docker exec -it <celery-worker> celery -A app.tasks.celery_app call tasks.snapshot_rewards_timeline

# Via Python directly (see results immediately)
docker exec -it <celery-worker> python -c "
from app.tasks.analytics_tasks import snapshot_rewards_timeline
result = snapshot_rewards_timeline()
print(result)
"
```