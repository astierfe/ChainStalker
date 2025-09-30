# backend/app/api/stakes.py - v2.0
from flask import Blueprint, request, jsonify
from app.models.stake import Stake

stakes_bp = Blueprint('stakes', __name__)

@stakes_bp.route('/', methods=['GET'])
def list_stakes():
    try:
        skip = int(request.args.get('skip', 0))
        limit = int(request.args.get('limit', 50))
        status = request.args.get('status')
        tier_id = request.args.get('tier_id')
        
        if limit > 100:
            return jsonify({'error': 'Limit cannot exceed 100'}), 400
        
        query = {}
        if status:
            query['status'] = status
        if tier_id is not None:
            try:
                query['tier_id'] = int(tier_id)
            except ValueError:
                return jsonify({'error': 'Invalid tier_id'}), 400
        
        from app.models import stakes_collection
        stakes = list(stakes_collection.find(query).skip(skip).limit(limit).sort('created_at', -1))
        total = stakes_collection.count_documents(query)
        
        return jsonify({
            'stakes': [_format_stake(s) for s in stakes],
            'total': total,
            'skip': skip,
            'limit': limit,
            'filters': {
                'status': status,
                'tier_id': tier_id
            }
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stakes_bp.route('/<address>/<int:stake_index>', methods=['GET'])
def get_stake(address, stake_index):
    try:
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({'error': 'Invalid address format'}), 400
        
        stake = Stake.get_by_user_and_index(address, stake_index)
        
        if not stake:
            return jsonify({'error': 'Stake not found'}), 404
        
        return jsonify(_format_stake(stake)), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stakes_bp.route('/active', methods=['GET'])
def get_active_stakes():
    try:
        stakes = Stake.get_all_active()
        
        return jsonify({
            'stakes': [_format_stake(s) for s in stakes],
            'total': len(stakes)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stakes_bp.route('/stats', methods=['GET'])
def get_stakes_stats():
    try:
        from app.models import stakes_collection
        
        pipeline = [
            {
                '$group': {
                    '_id': '$status',
                    'count': {'$sum': 1},
                    'total_amount': {'$sum': '$amount'}
                }
            }
        ]
        
        stats_by_status = list(stakes_collection.aggregate(pipeline))
        
        tier_pipeline = [
            {
                '$match': {'status': 'active'}
            },
            {
                '$group': {
                    '_id': '$tier_id',
                    'count': {'$sum': 1},
                    'total_amount': {'$sum': '$amount'}
                }
            }
        ]
        
        stats_by_tier = list(stakes_collection.aggregate(tier_pipeline))
        
        return jsonify({
            'by_status': [
                {
                    'status': stat['_id'],
                    'count': stat['count'],
                    'total_amount': str(stat['total_amount'])
                }
                for stat in stats_by_status
            ],
            'by_tier': [
                {
                    'tier_id': stat['_id'],
                    'count': stat['count'],
                    'total_amount': str(stat['total_amount'])
                }
                for stat in stats_by_tier
            ]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _format_stake(stake):
    return {
        'user_address': stake['user_address'],
        'stake_index': stake['stake_index'],
        'amount': str(stake['amount']),
        'tier_id': stake['tier_id'],
        'status': stake['status'],
        'total_rewards_claimed': str(stake.get('total_rewards_claimed', 0)),
        'start_time': stake['start_time'],
        'last_reward_claim': stake.get('last_reward_claim'),
        'tx_hash': stake.get('tx_hash'),
        'block_number': stake.get('block_number'),
        'created_at': stake.get('created_at').isoformat() if stake.get('created_at') else None,
        'updated_at': stake.get('updated_at').isoformat() if stake.get('updated_at') else None
    }