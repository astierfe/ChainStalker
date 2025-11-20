# backend/app/utils/api_formatters.py
"""
API response formatters for ChainStalker.

Centralizes formatting logic for consistent API responses across all endpoints.
"""
from app.utils.mongodb_helpers import normalize_timestamp_field


def format_stake_for_api(stake):
    """
    Format stake document for API response.

    Converts blockchain timestamps (seconds) to JavaScript milliseconds.
    Ensures all numeric fields are properly stringified for JSON compatibility.

    Uses normalize_timestamp_field() to handle both legacy datetime objects
    and new integer timestamps for backward compatibility.
    """
    # Normalize last_reward_claim (handles both int and datetime)
    last_reward_claim = stake.get('last_reward_claim')
    last_reward_claim_ms = None
    if last_reward_claim is not None:
        normalized = normalize_timestamp_field(last_reward_claim)
        last_reward_claim_ms = normalized * 1000 if normalized else None

    return {
        'user_address': stake['user_address'],
        'stake_index': stake['stake_index'],
        'amount': str(stake['amount']),
        'tier_id': stake['tier_id'],
        'status': stake['status'],
        'total_rewards_claimed': str(stake.get('total_rewards_claimed', 0)),
        'start_time': stake['start_time'] * 1000,  # Convert seconds to milliseconds for JavaScript
        'last_reward_claim': last_reward_claim_ms,
        'tx_hash': stake.get('tx_hash'),
        'block_number': stake.get('block_number'),
        'created_at': stake.get('created_at').isoformat() if stake.get('created_at') else None,
        'updated_at': stake.get('updated_at').isoformat() if stake.get('updated_at') else None
    }


def format_user_for_api(user):
    """
    Format user document for API response.
    """
    return {
        'address': user['address'],
        'total_staked': str(user.get('total_staked', 0)),
        'total_rewards_claimed': str(user.get('total_rewards_claimed', 0)),
        'active_stakes_count': user.get('active_stakes_count', 0),
        'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
        'updated_at': user.get('updated_at').isoformat() if user.get('updated_at') else None
    }
