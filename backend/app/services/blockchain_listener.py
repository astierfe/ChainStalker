# backend/app/services/blockchain_listener.py - v1.1
import time
import logging
from datetime import datetime
from app.utils.web3_utils import web3_manager
from app.utils.mongodb_helpers import convert_uint256_for_mongodb
from app.models.user import User
from app.models.stake import Stake
from app.models import db
from app.config import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BlockchainListener:
    def __init__(self):
        self.w3 = web3_manager.w3
        self.contract = web3_manager.staking_pool
        self.poll_interval = config.POLL_INTERVAL
        self.batch_size = config.BATCH_SIZE
        
        self.state_collection = db['listener_state']
        self.events_collection = db['raw_events']
    
    def get_last_processed_block(self):
        state = self.state_collection.find_one({'_id': 'last_block'})
        return state['block_number'] if state else config.START_BLOCK
    
    def save_last_processed_block(self, block_number):
        self.state_collection.update_one(
            {'_id': 'last_block'},
            {'$set': {
                'block_number': block_number,
                'updated_at': datetime.utcnow()
            }},
            upsert=True
        )
    
    def process_stake_created(self, event):
        args = event['args']
        
        User.create_or_update(args['user'])
        
        Stake.create({
            'user': args['user'],
            'stakeIndex': args['stakeIndex'],
            'amount': args['amount'],
            'tierId': args['tierId'],
            'timestamp': args['timestamp'],
            'transactionHash': event['transactionHash'],
            'blockNumber': event['blockNumber']
        })
        
        User.increment_field(args['user'], 'total_staked', args['amount'])
        User.increment_field(args['user'], 'active_stakes_count', 1)
        
        logger.info(f"StakeCreated: user={args['user']}, amount={args['amount']}, tier={args['tierId']}")
    
    def process_unstaked(self, event):
        """
        Process Unstaked event with MongoDB-safe type conversion.

        Converts uint256 amount/rewards using convert_uint256_for_mongodb()
        to avoid overflow errors when storing in MongoDB.
        """
        args = event['args']

        # Convert uint256 to MongoDB-safe types (int or string)
        amount = int(args['amount'])
        rewards = int(args['rewards'])

        Stake.update_status(
            args['user'],
            args['stakeIndex'],
            'unstaked',
            unstake_amount=convert_uint256_for_mongodb(amount),
            unstake_rewards=convert_uint256_for_mongodb(rewards),
            unstaked_at=datetime.utcnow()
        )

        # User.increment_field handles large values internally
        User.increment_field(args['user'], 'total_staked', -amount)
        User.increment_field(args['user'], 'total_rewards_claimed', rewards)
        User.increment_field(args['user'], 'active_stakes_count', -1)

        logger.info(f"Unstaked: user={args['user']}, amount={amount}, rewards={rewards}")
    
    def process_rewards_claimed(self, event):
        """
        Process RewardsClaimed event with MongoDB-safe type conversion.
        """
        args = event['args']

        # Convert uint256 rewards to int (increment_field handles MongoDB conversion)
        rewards = int(args['rewards'])

        Stake.add_rewards(args['user'], args['stakeIndex'], rewards)
        User.increment_field(args['user'], 'total_rewards_claimed', rewards)

        logger.info(f"RewardsClaimed: user={args['user']}, rewards={rewards}")
    
    def process_emergency_withdraw(self, event):
        """
        Process EmergencyWithdraw event with MongoDB-safe type conversion.
        """
        args = event['args']

        # Convert uint256 amount to MongoDB-safe type
        amount = int(args['amount'])

        Stake.update_status(
            args['user'],
            args['stakeIndex'],
            'emergency_withdrawn',
            emergency_amount=convert_uint256_for_mongodb(amount),
            emergency_withdrawn_at=datetime.utcnow()
        )

        User.increment_field(args['user'], 'total_staked', -amount)
        User.increment_field(args['user'], 'active_stakes_count', -1)

        logger.info(f"EmergencyWithdraw: user={args['user']}, amount={amount}")
    
    def process_reward_pool_funded(self, event):
        args = event['args']
        logger.info(f"RewardPoolFunded: funder={args['funder']}, amount={args['amount']}")
    
    def store_raw_event(self, event):
        """
        Store raw blockchain event in MongoDB with proper type conversion.

        Converts all uint256 values using convert_uint256_for_mongodb()
        to ensure MongoDB compatibility.
        """
        # Convert all values to MongoDB-compatible types
        args_dict = {}
        for key, value in event['args'].items():
            # Handle all possible web3.py types
            if hasattr(value, 'hex'):  # bytes-like
                args_dict[key] = value.hex() if value else None
            elif isinstance(value, int):
                # Use centralized conversion function
                args_dict[key] = convert_uint256_for_mongodb(value)
            else:
                args_dict[key] = str(value)

        event_data = {
            'event_name': event['event'],
            'transaction_hash': event['transactionHash'].hex() if hasattr(event['transactionHash'], 'hex') else str(event['transactionHash']),
            'block_number': int(event['blockNumber']),
            'log_index': int(event['logIndex']),
            'args': args_dict,
            'processed_at': datetime.utcnow()
        }
        self.events_collection.insert_one(event_data)
    
    def process_events(self, from_block, to_block):
        event_handlers = {
            'StakeCreated': self.process_stake_created,
            'Unstaked': self.process_unstaked,
            'RewardsClaimed': self.process_rewards_claimed,
            'EmergencyWithdraw': self.process_emergency_withdraw,
            'RewardPoolFunded': self.process_reward_pool_funded
        }
        
        for event_name, handler in event_handlers.items():
            try:
                events = web3_manager.get_events(event_name, from_block, to_block)
                
                for event in events:
                    self.store_raw_event(event)
                    handler(event)
                
                if events:
                    logger.info(f"Processed {len(events)} {event_name} events")
            
            except Exception as e:
                logger.error(f"Error processing {event_name}: {str(e)}")
    
    def start(self):
        logger.info("Starting blockchain listener...")
        logger.info(f"RPC: {config.RPC_URL}")
        logger.info(f"Contract: {config.STAKING_POOL_ADDRESS}")
        
        last_block = self.get_last_processed_block()
        logger.info(f"Starting from block: {last_block}")
        
        while True:
            try:
                current_block = web3_manager.get_latest_block()
                
                if current_block > last_block:
                    to_block = min(last_block + self.batch_size, current_block)
                    
                    logger.info(f"Processing blocks {last_block + 1} to {to_block}")
                    self.process_events(last_block + 1, to_block)
                    
                    last_block = to_block
                    self.save_last_processed_block(last_block)
                
                time.sleep(self.poll_interval)
            
            except KeyboardInterrupt:
                logger.info("Listener stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in listener loop: {str(e)}")
                time.sleep(self.poll_interval * 2)

if __name__ == '__main__':
    listener = BlockchainListener()
    listener.start()