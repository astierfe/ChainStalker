# backend/app/api/users.py - v2.1
from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.stake import Stake
from app.utils.api_formatters import format_stake_for_api, format_user_for_api

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
            'users': [format_user_for_api(u) for u in users],
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

        return jsonify(format_user_for_api(user)), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<address>/stakes', methods=['GET'])
def get_user_stakes(address):
    try:
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({'error': 'Invalid address format'}), 400

        status = request.args.get('status')

        user = User.get_by_address(address)
        # Return empty stakes array if user doesn't exist yet (hasn't interacted with contract)
        if not user:
            return jsonify({
                'user_address': address.lower(),
                'stakes': [],
                'total': 0
            }), 200

        stakes = Stake.get_by_user(address, status=status)

        return jsonify({
            'user_address': address.lower(),
            'stakes': [format_stake_for_api(s) for s in stakes],
            'total_stakes': len(stakes)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500