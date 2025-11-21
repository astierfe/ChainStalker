# backend/app/models/__init__.py - v1.0
from pymongo import MongoClient
from app.config import config

client = MongoClient(config.MONGODB_URI)
db = client[config.MONGODB_DB_NAME]

# Collections
users_collection = db['users']
stakes_collection = db['stakes']
metrics_collection = db['metrics']
notifications_collection = db['notifications']
raw_events_collection = db['raw_events']

# Indexes
users_collection.create_index('address', unique=True)
stakes_collection.create_index([('user_address', 1), ('stake_index', 1)])
stakes_collection.create_index('timestamp')
metrics_collection.create_index('timestamp')
raw_events_collection.create_index('timestamp')
raw_events_collection.create_index('event')