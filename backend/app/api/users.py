# backend/app/api/users.py - v2.0
from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.stake import Stake

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def list_users():
    try:
        skip = int(request.args.get('skip', 0))
        limit = int(request.args.get('limit', 50))
        
        if limit > 100:
            return jsonify({'error': 'Limit cannot exceed 100'}), 400
        
        users = User.get_all(skip=skip, limit=limit)
        total = User.count()
        
        return jsonify({
            'users': [_format_user(u) for u in users],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid pagination parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<address>', methods=['GET'])
def get_user(address):
    try:
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({'error': 'Invalid address format'}), 400
        
        user = User.get_by_address(address)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(_format_user(user)), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<address>/stakes', methods=['GET'])
def get_user_stakes(address):
    try:
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({'error': 'Invalid address format'}), 400
        
        status = request.args.get('status')
        
        user = User.get_by_address(address)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        stakes = Stake.get_by_user(address, status=status)
        
        return jsonify({
            'user_address': address.lower(),
            'stakes': [_format_stake(s) for s in stakes],
            'total_stakes': len(stakes)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _format_user(user):
    return {
        'address': user['address'],
        'total_staked': str(user.get('total_staked', 0)),
        'total_rewards_claimed': str(user.get('total_rewards_claimed', 0)),
        'active_stakes_count': user.get('active_stakes_count', 0),
        'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
        'updated_at': user.get('updated_at').isoformat() if user.get('updated_at') else None
    }

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
        'created_at': stake.get('created_at').isoformat() if stake.get('created_at') else None
    }