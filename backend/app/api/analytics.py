# backend/app/api/analytics.py - v3.0
from flask import Blueprint, jsonify, request
from app.models import stakes_collection, users_collection
from app.models.metric import Metric
from app.utils.web3_utils import web3_manager

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

def _get_tvl():
    pipeline = [
        {'$match': {'status': 'active'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]
    
    result = list(stakes_collection.aggregate(pipeline))
    tvl = result[0]['total'] if result else 0
    
    return {
        'total_value_locked': str(tvl),
        'tvl_formatted': f"{tvl} DAI"
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
    pipeline = [
        {
            '$group': {
                '_id': None,
                'total_claimed': {'$sum': '$total_rewards_claimed'},
                'avg_per_stake': {'$avg': '$total_rewards_claimed'}
            }
        }
    ]
    
    result = list(stakes_collection.aggregate(pipeline))
    
    return {
        'total_rewards_claimed': str(int(result[0]['total_claimed'])) if result else '0',
        'avg_rewards_per_stake': str(int(result[0]['avg_per_stake'])) if result else '0'
    }

def _get_tier_distribution():
    pipeline = [
        {
            '$match': {'status': 'active'}
        },
        {
            '$group': {
                '_id': '$tier_id',
                'count': {'$sum': 1},
                'total_amount': {'$sum': '$amount'},
                'avg_amount': {'$avg': '$amount'}
            }
        },
        {
            '$sort': {'_id': 1}
        }
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
                'total_staked': str(tier['total_amount']),
                'avg_stake_amount': str(int(tier['avg_amount']))
            }
            for tier in tiers
        ]
    }