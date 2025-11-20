# backend/app/models/stake.py - v1.1
from datetime import datetime
from app.models import stakes_collection
from app.utils.mongodb_helpers import convert_uint256_for_mongodb

class Stake:
    @staticmethod
    def create(event_data):
        """
        Create a new stake record from blockchain event data.

        Uses convert_uint256_for_mongodb() to safely store large amounts.
        """
        stake_data = {
            'user_address': event_data['user'].lower(),
            'stake_index': int(event_data['stakeIndex']),
            'amount': convert_uint256_for_mongodb(event_data['amount']),
            'tier_id': int(event_data['tierId']),
            'start_time': int(event_data['timestamp']),
            'last_reward_claim': int(event_data['timestamp']),
            'status': 'active',
            'total_rewards_claimed': 0,
            'tx_hash': event_data['transactionHash'].hex(),
            'block_number': int(event_data['blockNumber']),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        stakes_collection.insert_one(stake_data)
        return stake_data
    
    @staticmethod
    def update_status(user_address, stake_index, status, **kwargs):
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        update_data.update(kwargs)
        
        stakes_collection.update_one(
            {
                'user_address': user_address.lower(),
                'stake_index': stake_index
            },
            {'$set': update_data}
        )
    
    @staticmethod
    def add_rewards(user_address, stake_index, rewards):
        """
        Add rewards to a stake and update last_reward_claim timestamp.

        Uses get_current_timestamp() from mongodb_helpers to store timestamp
        as integer (matching on-chain block.timestamp format).
        """
        from app.utils.mongodb_helpers import get_current_timestamp

        stakes_collection.update_one(
            {
                'user_address': user_address.lower(),
                'stake_index': stake_index
            },
            {
                '$inc': {'total_rewards_claimed': rewards},
                '$set': {
                    'last_reward_claim': get_current_timestamp(),
                    'updated_at': datetime.utcnow()
                }
            }
        )
    
    @staticmethod
    def get_by_user(user_address, status=None):
        query = {'user_address': user_address.lower()}
        if status:
            query['status'] = status
        return list(stakes_collection.find(query))
    
    @staticmethod
    def get_by_user_and_index(user_address, stake_index):
        return stakes_collection.find_one({
            'user_address': user_address.lower(),
            'stake_index': stake_index
        })
    
    @staticmethod
    def get_all_active():
        return list(stakes_collection.find({'status': 'active'}))
    
    @staticmethod
    def count_by_status(status=None):
        query = {'status': status} if status else {}
        return stakes_collection.count_documents(query)