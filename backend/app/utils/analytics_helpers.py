# backend/app/utils/analytics_helpers.py
"""
Analytics helpers for ChainStalker.

Centralizes reusable analytics calculation logic to avoid duplication.
Follows WEB3 RULESET from CLAUDE.md (lines 3-8).
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """
    Calculate percentage change between two values.

    Args:
        old_value: The earlier/baseline value
        new_value: The current/comparison value

    Returns:
        Percentage change (e.g., 12.5 for +12.5%, -5.0 for -5%)
        Returns 0.0 if old_value is 0 or None

    Example:
        >>> calculate_percentage_change(100, 112.5)
        12.5
        >>> calculate_percentage_change(100, 95)
        -5.0
    """
    if not old_value or old_value == 0:
        return 0.0

    change = ((new_value - old_value) / old_value) * 100
    return round(change, 2)


def aggregate_metrics_to_points(
    metrics: List[Dict[str, Any]],
    target_points: int = 50
) -> List[Dict[str, Any]]:
    """
    Aggregate a list of metrics to a target number of data points.

    Used for downsampling large datasets for sparkline visualization.
    Takes evenly spaced samples from the metrics list.

    Args:
        metrics: List of metric documents from MongoDB
        target_points: Desired number of data points (default: 50)

    Returns:
        List of sampled metrics, evenly distributed

    Example:
        Input: 500 metrics, target_points=50
        Output: 50 metrics, sampled every 10th item
    """
    if not metrics:
        return []

    if len(metrics) <= target_points:
        return metrics

    # Calculate step size for even distribution
    step = len(metrics) / target_points
    sampled = []

    for i in range(target_points):
        index = int(i * step)
        if index < len(metrics):
            sampled.append(metrics[index])

    return sampled


def format_sparkline_data(
    metrics: List[Dict[str, Any]],
    value_key: str = 'value',
    convert_from_wei: bool = True
) -> List[Dict[str, Any]]:
    """
    Format MongoDB metrics for sparkline chart consumption.

    Converts metric documents to frontend-friendly format with:
    - ISO timestamp strings
    - Converted values (Wei → DAI if needed)
    - Consistent key naming

    Args:
        metrics: List of metric documents from MongoDB
        value_key: The key containing the numeric value (default: 'value')
        convert_from_wei: Whether to convert from Wei to DAI (default: True)

    Returns:
        List of formatted data points for recharts
        Format: [{timestamp: ISO_string, value_dai: float, value_wei: str}]

    Example:
        Input: {timestamp: datetime, value: 1500000000000000000000}
        Output: {timestamp: "2024-11-20T10:15:00Z", value_dai: 1500.0, value_wei: "1500000000000000000000"}
    """
    formatted = []

    for metric in metrics:
        value_wei = metric.get(value_key, 0)

        # Convert to int if stored as string (MongoDB large number handling)
        if isinstance(value_wei, str):
            value_wei = int(value_wei)

        # Convert Wei to DAI (divide by 10^18)
        value_dai = float(value_wei) / 1e18 if convert_from_wei else float(value_wei)

        # Format timestamp
        timestamp = metric.get('timestamp')
        if isinstance(timestamp, datetime):
            timestamp_str = timestamp.isoformat() + 'Z'
        else:
            timestamp_str = str(timestamp)

        formatted.append({
            'timestamp': timestamp_str,
            'value_dai': round(value_dai, 2),
            'value_wei': str(value_wei)
        })

    return formatted


def calculate_time_window(hours: int = 24) -> datetime:
    """
    Calculate the starting datetime for a time window.

    Args:
        hours: Number of hours to look back (default: 24)

    Returns:
        datetime object representing the start of the time window

    Example:
        >>> calculate_time_window(24)
        datetime(2024, 11, 19, 10, 15, 0)  # 24 hours ago
    """
    return datetime.utcnow() - timedelta(hours=hours)


def get_metric_change_data(
    current_value: float,
    history: List[Dict[str, Any]],
    value_key: str = 'value_dai'
) -> Dict[str, float]:
    """
    Calculate change metrics between current value and historical baseline.

    Args:
        current_value: The current metric value
        history: List of historical data points (sorted by time, oldest first)
        value_key: Key containing the comparison value (default: 'value_dai')

    Returns:
        Dict with keys: change_absolute, change_percent

    Example:
        >>> get_metric_change_data(1500.0, [{value_dai: 1350.0}, ...])
        {'change_absolute': 150.0, 'change_percent': 11.11}
    """
    if not history or len(history) == 0:
        return {
            'change_absolute': 0.0,
            'change_percent': 0.0
        }

    # Get oldest value (baseline)
    baseline_value = history[0].get(value_key, 0)

    # Calculate absolute change
    change_absolute = round(current_value - baseline_value, 2)

    # Calculate percentage change
    change_percent = calculate_percentage_change(baseline_value, current_value)

    return {
        'change_absolute': change_absolute,
        'change_percent': change_percent
    }


def calculate_user_total_staked_from_stakes(stakes_collection, user_address: str) -> int:
    """
    Calculate user's total staked amount by aggregating active stakes.

    This is the SOURCE OF TRUTH for total_staked, fixing the issue where
    increment_field() fails with large uint256 values (>2^63).

    Uses MongoDB aggregation to sum all active stake amounts for a user.
    Handles mixed int/string types from convert_uint256_for_mongodb().

    Args:
        stakes_collection: MongoDB collection instance
        user_address: User's Ethereum address (lowercase)

    Returns:
        Total staked amount in Wei (int)

    Example:
        >>> calculate_user_total_staked_from_stakes(stakes_collection, '0xabc...')
        1500000000000000000000  # 1500 DAI in Wei
    """
    from app.utils.mongodb_helpers import convert_to_double

    pipeline = [
        {'$match': {
            'user_address': user_address.lower(),
            'status': 'active'
        }},
        {'$group': {
            '_id': None,
            'total': {'$sum': convert_to_double('$amount')}
        }}
    ]

    result = list(stakes_collection.aggregate(pipeline))
    total_staked = int(result[0]['total']) if result else 0

    return total_staked
