# backend/app/utils/mongodb_helpers.py
"""
MongoDB helpers for handling Solidity uint256 types and aggregation.

ChainStalker stores large uint256 values as strings (when > int64 max)
to avoid MongoDB overflow. These helpers provide conversion utilities
for both storage and aggregation operations.
"""

def convert_uint256_for_mongodb(value):
    """
    Convert Solidity uint256 to MongoDB-safe type (int or string).

    MongoDB's int64 type has a range of -2^63 to 2^63-1. Values exceeding
    this range must be stored as strings to avoid overflow errors.

    Args:
        value: uint256 value from blockchain (int, HexBytes, or string)

    Returns:
        int | str: int if value fits in MongoDB int64 range, else string

    Example:
        amount = convert_uint256_for_mongodb(event['args']['amount'])
        # Small values: 1000 (int)
        # Large values: "1000000000000000000000" (string)
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

    Args:
        field_name: MongoDB field name (e.g., '$amount', '$total_rewards_claimed')

    Returns:
        dict: MongoDB $convert expression with error handling

    Example:
        pipeline = [
            {'$group': {
                '_id': None,
                'total': {'$sum': convert_to_double('$amount')}
            }}
        ]
    """
    return {
        '$convert': {
            'input': field_name,
            'to': 'double',
            'onError': 0,   # Return 0 if conversion fails
            'onNull': 0     # Return 0 if field is null
        }
    }
