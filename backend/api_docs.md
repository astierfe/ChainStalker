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

# 3. List users
curl http://localhost:5000/api/users

# 4. Get user details and stakes
curl http://localhost:5000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8
curl http://localhost:5000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/stakes

# 5. Filter stakes by tier
curl "http://localhost:5000/api/stakes?tier_id=1&status=active"

# 6. Get tier distribution
curl http://localhost:5000/api/analytics/tiers

# 7. Check contract state
curl http://localhost:5000/api/analytics/contract
```