# ANO_002: Unstake UI Race Condition

**ID**: ANO_002
**Title**: Unstake doesn't update UI status immediately
**Status**: open
**Created**: 2025-11-20
**Network**: Sepolia Testnet (Chain ID: 11155111)

## Symptom

After successful unstake transaction:
- Transaction confirms on-chain
- Stake remains "active" in UI for 5-10 seconds
- User confused, thinks unstake failed

## Root Cause

Race condition between transaction confirmation and blockchain event processing.

Frontend refetches after tx confirmation, but backend listener hasn't polled for Unstaked event yet.

## Timing Breakdown

```
T+0s:  unstake() tx sent to Sepolia
T+3s:  Transaction confirms on-chain
T+3s:  Frontend onUpdate() fires → API refetch
T+3s:  MongoDB still shows status='active' (listener hasn't polled)
T+5s:  Listener polls for events (POLL_INTERVAL=5s)
T+6s:  Unstaked event processed → MongoDB updated
T+10s: Frontend refetch interval → UI updates
```

**Gap**: 7-second delay between tx confirmation and UI update.

## Affected Files

**Backend**:
- `backend/app/services/blockchain_listener.py:171` - Polling loop with 5s POLL_INTERVAL
- `backend/app/services/blockchain_listener.py:58-74` - `process_unstaked()` handler (works correctly)

**Frontend**:
- `frontend/lib/hooks/useUserStakes.ts:42` - `refetchInterval: 10000` (10 seconds)
- `frontend/components/StakeCard.tsx:41` - `useEffect` calls `onUpdate?.()` but doesn't force immediate refetch

## Configuration Values

**.env**:
- `POLL_INTERVAL=5` (seconds)
- `START_BLOCK=9662396`

**Frontend**:
- `useUserStakes` refetchInterval: 10000ms
- `StakeCard` onUpdate: calls normal refetch cycle

## Impact

- Poor UX - users think transaction failed
- Severity: **HIGH**
