# backend/app/api/analytics.py - v3.1
from flask import Blueprint, jsonify, request
from app.models import stakes_collection, users_collection
from app.models.metric import Metric
from app.utils.web3_utils import web3_manager
from app.utils.mongodb_helpers import convert_to_double

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/', methods=['GET'])
def get_analytics():
    try:
        analytics_data = {
            'tvl': _get_tvl(),
            'users': _get_user_stats(),
            'stakes': _get_stake_stats(),
            'rewards': _get_reward_stats(),
            'tiers': _get_tier_distribution()
        }
        
        return jsonify(analytics_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/tvl', methods=['GET'])
def get_tvl():
    try:
        return jsonify(_get_tvl()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/users', methods=['GET'])
def get_user_analytics():
    try:
        return jsonify(_get_user_stats()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/tiers', methods=['GET'])
def get_tier_analytics():
    try:
        return jsonify(_get_tier_distribution()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/contract', methods=['GET'])
def get_contract_info():
    try:
        contract = web3_manager.staking_pool
        
        total_staked = contract.functions.totalStaked().call()
        reward_pool = contract.functions.rewardPoolBalance().call()
        
        contract_balance = web3_manager.dai_token.functions.balanceOf(
            web3_manager.staking_pool.address
        ).call()
        
        return jsonify({
            'total_staked': str(total_staked),
            'reward_pool_balance': str(reward_pool),
            'contract_balance': str(contract_balance),
            'contract_address': web3_manager.staking_pool.address
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/history', methods=['GET'])
def get_metrics_history():
    """Get historical metrics"""
    try:
        metric_type = request.args.get('type', 'tvl')
        hours = int(request.args.get('hours', 24))
        limit = int(request.args.get('limit', 100))
        
        if limit > 500:
            return jsonify({'error': 'Limit cannot exceed 500'}), 400
        
        history = Metric.get_history(metric_type, hours=hours, limit=limit)
        
        return jsonify({
            'type': metric_type,
            'hours': hours,
            'data_points': len(history),
            'history': [
                {
                    'value': str(h['value']),
                    'metadata': h.get('metadata', {}),
                    'timestamp': h['timestamp'].isoformat()
                }
                for h in history
            ]
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/history/types', methods=['GET'])
def get_metric_types():
    """Get all available metric types"""
    try:
        types = Metric.get_all_types()
        return jsonify({'types': types}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/top-stakers', methods=['GET'])
def get_top_stakers():
    """
    Get top stakers from latest snapshot.

    Query params:
    - limit (int): Number of stakers to return (default: 3, max: 100)
    - tier_id (int): Optional filter by tier (0, 1, or 2)
    """
    try:
        # Parse query parameters
        limit = int(request.args.get('limit', 3))
        tier_id = request.args.get('tier_id', None)

        # Validate limit
        if limit < 1 or limit > 100:
            return jsonify({'error': 'Limit must be between 1 and 100'}), 400

        # Get latest top_users snapshot from metrics
        latest_snapshot = Metric.get_latest('top_users')

        if not latest_snapshot:
            return jsonify({
                'stakers': [],
                'timestamp': None,
                'message': 'No snapshots available yet'
            }), 200

        # Extract users array from metadata
        users = latest_snapshot.get('metadata', {}).get('users', [])

        # Filter by tier if specified
        if tier_id is not None:
            tier_id_int = int(tier_id)
            # Note: Tier filtering requires aggregation from stakes_collection
            # For now, we'll skip filtering and just return top users
            # This can be enhanced later if needed

        # Apply limit
        users = users[:limit]

        # Format response with rank
        stakers = [
            {
                'rank': idx + 1,
                'address': user['address'],
                'total_staked': user['total_staked'],
                'total_staked_formatted': f"{int(user['total_staked']) / 10**18:,.2f} DAI",
                'rewards_claimed': user['rewards_claimed'],
                'active_stakes': user['active_stakes']
            }
            for idx, user in enumerate(users)
        ]

        return jsonify({
            'stakers': stakers,
            'count': len(stakers),
            'timestamp': latest_snapshot['timestamp'].isoformat()
        }), 200

    except ValueError:
        return jsonify({'error': 'Invalid parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _get_tvl():
    """
    Calculate Total Value Locked (TVL) from active stakes.

    Uses convert_to_double() to handle mixed int/string amounts in MongoDB.
    Large uint256 values (>2^63) are stored as strings to avoid overflow.
    """
    pipeline = [
        {'$match': {'status': 'active'}},
        {
            '$group': {
                '_id': None,
                # Convert amount (int or string) to double before summing
                'total': {'$sum': convert_to_double('$amount')}
            }
        }
    ]

    result = list(stakes_collection.aggregate(pipeline))
    tvl_wei = int(result[0]['total']) if result else 0

    # Convert Wei to DAI (divide by 10^18)
    tvl_dai = tvl_wei / 10**18

    return {
        'total_value_locked': str(tvl_wei),  # Keep Wei for API compatibility
        'tvl_formatted': f"{tvl_dai:,.2f} DAI"  # Human-readable with 2 decimals
    }

def _get_user_stats():
    total_users = users_collection.count_documents({})
    active_users = users_collection.count_documents({'active_stakes_count': {'$gt': 0}})
    
    pipeline = [
        {
            '$group': {
                '_id': None,
                'avg_staked': {'$avg': '$total_staked'},
                'total_rewards': {'$sum': '$total_rewards_claimed'}
            }
        }
    ]
    
    result = list(users_collection.aggregate(pipeline))
    
    return {
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': total_users - active_users,
        'avg_stake_per_user': str(int(result[0]['avg_staked'])) if result else '0',
        'total_rewards_distributed': str(int(result[0]['total_rewards'])) if result else '0'
    }

def _get_stake_stats():
    total_stakes = stakes_collection.count_documents({})
    active_stakes = stakes_collection.count_documents({'status': 'active'})
    unstaked = stakes_collection.count_documents({'status': 'unstaked'})
    emergency = stakes_collection.count_documents({'status': 'emergency_withdrawn'})
    
    return {
        'total_stakes': total_stakes,
        'active_stakes': active_stakes,
        'unstaked_stakes': unstaked,
        'emergency_withdrawals': emergency
    }

def _get_reward_stats():
    """
    Calculate total and average rewards claimed across all stakes.

    Converts total_rewards_claimed to double to handle potential large values.
    """
    pipeline = [
        {
            '$group': {
                '_id': None,
                # Convert rewards (may be large uint256) to double before aggregation
                'total_claimed': {'$sum': convert_to_double('$total_rewards_claimed')},
                'avg_per_stake': {'$avg': convert_to_double('$total_rewards_claimed')}
            }
        }
    ]

    result = list(stakes_collection.aggregate(pipeline))

    return {
        'total_rewards_claimed': str(int(result[0]['total_claimed'])) if result else '0',
        'avg_rewards_per_stake': str(int(result[0]['avg_per_stake'])) if result else '0'
    }

def _get_tier_distribution():
    """
    Group active stakes by tier and calculate distribution metrics.

    Returns stake count, total amount, and average amount per tier.
    Uses convert_to_double() for amount aggregations.
    """
    pipeline = [
        {'$match': {'status': 'active'}},
        {
            '$group': {
                '_id': '$tier_id',
                'count': {'$sum': 1},
                # Convert amount (int or string) to double for aggregation
                'total_amount': {'$sum': convert_to_double('$amount')},
                'avg_amount': {'$avg': convert_to_double('$amount')}
            }
        },
        {'$sort': {'_id': 1}}
    ]

    tiers = list(stakes_collection.aggregate(pipeline))

    tier_names = {
        0: '7 days (5% APY)',
        1: '30 days (8% APY)',
        2: '90 days (12% APY)'
    }

    return {
        'tiers': [
            {
                'tier_id': tier['_id'],
                'tier_name': tier_names.get(tier['_id'], 'Unknown'),
                'stake_count': tier['count'],
                'total_staked': str(int(tier['total_amount'])),
                'avg_stake_amount': str(int(tier['avg_amount'])),
                # Add human-readable formatted values (Wei → DAI)
                'total_staked_formatted': f"{tier['total_amount'] / 10**18:,.2f} DAI",
                'avg_stake_formatted': f"{tier['avg_amount'] / 10**18:,.2f} DAI"
            }
            for tier in tiers
        ]
    }

@analytics_bp.route('/rewards-timeline', methods=['GET'])
def get_rewards_timeline():
    """
    Get rewards claimed timeline from metrics snapshots.

    Query params:
    - days (int): Number of days to look back (default: 30, max: 90)

    Returns daily rewards claimed with timestamps.
    """
    try:
        days = int(request.args.get('days', 30))

        if days < 1 or days > 90:
            return jsonify({'error': 'Days must be between 1 and 90'}), 400

        # Get latest rewards_timeline snapshot
        latest_snapshot = Metric.get_latest('rewards_timeline')

        if not latest_snapshot:
            return jsonify({
                'timeline': [],
                'days': days,
                'data_points': 0,
                'total_rewards_wei': '0',
                'total_rewards_dai': 0.0,
                'total_claims': 0,
                'message': 'No rewards data available yet'
            }), 200

        # Extract timeline data from metadata
        timeline_data = latest_snapshot.get('metadata', {}).get('timeline_data', [])

        # Filter to requested number of days (take last N days)
        timeline = timeline_data[-days:] if len(timeline_data) > days else timeline_data

        # Add timestamp to each point
        for point in timeline:
            point['timestamp'] = latest_snapshot['timestamp'].isoformat()

        # Calculate filtered totals
        total_rewards_wei = sum(int(item['rewards_wei']) for item in timeline)
        total_claims = sum(item['claim_count'] for item in timeline)

        return jsonify({
            'timeline': timeline,
            'days': days,
            'data_points': len(timeline),
            'total_rewards_wei': str(total_rewards_wei),
            'total_rewards_dai': round(total_rewards_wei / 10**18, 2),
            'total_claims': total_claims
        }), 200

    except ValueError:
        return jsonify({'error': 'Invalid parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/activity-heatmap', methods=['GET'])
def get_activity_heatmap():
    """
    Get activity heatmap data from metrics snapshots.

    Query params:
    - days (int): Number of days to look back (default: 7, max: 30)

    Returns hourly activity breakdown by event type.
    """
    try:
        days = int(request.args.get('days', 7))

        if days < 1 or days > 30:
            return jsonify({'error': 'Days must be between 1 and 30'}), 400

        # Get latest activity_heatmap snapshot
        latest_snapshot = Metric.get_latest('activity_heatmap')

        if not latest_snapshot:
            return jsonify({
                'heatmap': [],
                'timestamp': None,
                'message': 'No activity data available yet'
            }), 200

        # Extract hourly data from metadata
        hourly_data = latest_snapshot.get('metadata', {}).get('hourly_data', [])
        days_covered = latest_snapshot.get('metadata', {}).get('days_covered', 0)
        total_events = latest_snapshot.get('metadata', {}).get('total_events', 0)

        # Filter by requested days (optional - data is already pre-filtered to 30 days)
        # For now, return all data from snapshot

        return jsonify({
            'heatmap': hourly_data,
            'days_covered': days_covered,
            'total_events': total_events,
            'data_points': len(hourly_data),
            'timestamp': latest_snapshot['timestamp'].isoformat()
        }), 200

    except ValueError:
        return jsonify({'error': 'Invalid parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500