# backend/app/models/user.py - v1.0
from datetime import datetime
from app.models import users_collection

class User:
    @staticmethod
    def create_or_update(address):
        user = users_collection.find_one({'address': address.lower()})
        
        if not user:
            user_data = {
                'address': address.lower(),
                'total_staked': 0,
                'total_rewards_claimed': 0,
                'active_stakes_count': 0,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            users_collection.insert_one(user_data)
            return user_data
        
        return user
    
    @staticmethod
    def update_stats(address, **kwargs):
        update_data = {'updated_at': datetime.utcnow()}
        update_data.update(kwargs)
        
        users_collection.update_one(
            {'address': address.lower()},
            {'$set': update_data}
        )
    
    @staticmethod
    def increment_field(address, field, value):
        users_collection.update_one(
            {'address': address.lower()},
            {
                '$inc': {field: value},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
    
    @staticmethod
    def get_by_address(address):
        return users_collection.find_one({'address': address.lower()})
    
    @staticmethod
    def get_all(skip=0, limit=50):
        return list(users_collection.find().skip(skip).limit(limit))
    
    @staticmethod
    def count():
        return users_collection.count_documents({})