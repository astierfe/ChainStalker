# backend/app/utils/mongodb_helpers.py
"""
MongoDB helpers for handling Solidity uint256 types and aggregation.

ChainStalker stores large uint256 values as strings (when > int64 max)
to avoid MongoDB overflow. These helpers provide conversion utilities
for both storage and aggregation operations.
"""
from datetime import datetime


def convert_uint256_for_mongodb(value):
    """
    Convert Solidity uint256 to MongoDB-safe type (int or string).
    """
    # Convert to int if not already
    int_value = int(value)

    # Return int if within MongoDB int64 range, else string
    return int_value if -2**63 <= int_value < 2**63 else str(int_value)


def convert_to_double(field_name):
    """
    Create MongoDB $convert expression to safely convert field to double.

    Handles both int and string values in MongoDB, converting them to double
    for use in aggregation pipelines ($sum, $avg, etc).

    """
    return {
        '$convert': {
            'input': field_name,
            'to': 'double',
            'onError': 0,   # Return 0 if conversion fails
            'onNull': 0     # Return 0 if field is null
        }
    }


def get_current_timestamp():
    """
    Get current UTC timestamp as integer (seconds since epoch).

    Centralized function for consistent timestamp storage in MongoDB.
    All blockchain-related timestamps should use this format to match
    on-chain block.timestamp values.

    Returns:
        int: Current UTC timestamp in seconds
    """
    return int(datetime.utcnow().timestamp())


def normalize_timestamp_field(value):
    """
    Normalize a timestamp field to integer format.

    Handles both datetime objects (legacy data) and integer timestamps.
    This ensures backward compatibility with old data while enforcing
    integer storage going forward.

    Args:
        value: Can be datetime object, int, or None

    Returns:
        int or None: Timestamp in seconds, or None if input is None
    """
    if value is None:
        return None

    if isinstance(value, datetime):
        # Convert legacy datetime objects to timestamp
        return int(value.timestamp())

    # Already an integer timestamp
    return int(value)
