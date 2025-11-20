# ANO_001: Analytics API 500 Error

**ID**: ANO_001
**Title**: Analytics API returns 500 error after first stake
**Status**: open
**Created**: 2025-11-20
**Network**: Sepolia Testnet (Chain ID: 11155111)

## Symptom

GET `/api/analytics/` returns 500 INTERNAL SERVER ERROR after creating first stake.
- Before first stake: returns 200 OK with empty data
- After first stake: crashes with 500 error

## Root Cause

MongoDB aggregation `$sum` fails with mixed int/string types in `amount` field.

Stakes store amounts conditionally (`backend/app/models/stake.py:14`):
```python
'amount': amount if -2**63 <= amount < 2**63 else str(amount)
```

MongoDB `$sum` cannot handle mixed types in same collection.

## Affected Files

- `backend/app/api/analytics.py:112` - `_get_tvl()`
- `backend/app/api/analytics.py:187` - `_get_tier_distribution()`
- `backend/app/api/analytics.py:165` - `_get_reward_stats()`

All use `$sum` on `amount` or `total_rewards_claimed` fields.

## Aggregation Pipeline Example

```python
pipeline = [
    {'$match': {'status': 'active'}},
    {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
]
# Fails if collection has both int and string amounts
```

## Impact

- Analytics endpoint unusable after first stake
- Frontend shows "Failed to load analytics"
- Severity: **CRITICAL**

## Related Context

MongoDB uint256 overflow protection (ALREADY FIXED in `stake.py:14`, `user.py:43`, `blockchain_listener.py:104-125`) causes the mixed types. This is a SEPARATE issue with aggregation queries.
