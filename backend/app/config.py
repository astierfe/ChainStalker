# backend/app/config.py - v1.0
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Blockchain
    RPC_URL = os.getenv('RPC_URL', 'http://127.0.0.1:8545')
    CHAIN_ID = int(os.getenv('CHAIN_ID', '31337'))
    STAKING_POOL_ADDRESS = os.getenv('STAKING_POOL_ADDRESS')
    DAI_TOKEN_ADDRESS = os.getenv('DAI_TOKEN_ADDRESS')
    
    # Database
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/chainstaker')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'chainstaker')
    
    # Redis & Celery
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
    
    # Event Listener
    START_BLOCK = int(os.getenv('START_BLOCK', '0'))
    POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '5'))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', '1000'))
    
    # Notifications
    ENABLE_NOTIFICATIONS = os.getenv('ENABLE_NOTIFICATIONS', 'true').lower() == 'true'
    NOTIFICATION_WEBHOOK_URL = os.getenv('NOTIFICATION_WEBHOOK_URL', '')
    
    # Analytics
    ANALYTICS_UPDATE_INTERVAL = int(os.getenv('ANALYTICS_UPDATE_INTERVAL', '300'))
    CACHE_TTL = int(os.getenv('CACHE_TTL', '60'))
    
    @staticmethod
    def validate():
        required = [
            'STAKING_POOL_ADDRESS',
            'DAI_TOKEN_ADDRESS',
            'RPC_URL'
        ]
        missing = [var for var in required if not os.getenv(var)]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

config = Config()