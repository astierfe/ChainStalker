# backend/app/services/blockchain_listener.py - v1.0
import time
import logging
from datetime import datetime
from app.utils.web3_utils import web3_manager
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
        args = event['args']
        
        Stake.update_status(
            args['user'],
            args['stakeIndex'],
            'unstaked',
            unstake_amount=args['amount'],
            unstake_rewards=args['rewards'],
            unstaked_at=datetime.utcnow()
        )
        
        User.increment_field(args['user'], 'total_staked', -args['amount'])
        User.increment_field(args['user'], 'total_rewards_claimed', args['rewards'])
        User.increment_field(args['user'], 'active_stakes_count', -1)
        
        logger.info(f"Unstaked: user={args['user']}, amount={args['amount']}, rewards={args['rewards']}")
    
    def process_rewards_claimed(self, event):
        args = event['args']
        
        Stake.add_rewards(args['user'], args['stakeIndex'], args['rewards'])
        User.increment_field(args['user'], 'total_rewards_claimed', args['rewards'])
        
        logger.info(f"RewardsClaimed: user={args['user']}, rewards={args['rewards']}")
    
    def process_emergency_withdraw(self, event):
        args = event['args']
        
        Stake.update_status(
            args['user'],
            args['stakeIndex'],
            'emergency_withdrawn',
            emergency_amount=args['amount'],
            emergency_withdrawn_at=datetime.utcnow()
        )
        
        User.increment_field(args['user'], 'total_staked', -args['amount'])
        User.increment_field(args['user'], 'active_stakes_count', -1)
        
        logger.info(f"EmergencyWithdraw: user={args['user']}, amount={args['amount']}")
    
    def process_reward_pool_funded(self, event):
        args = event['args']
        logger.info(f"RewardPoolFunded: funder={args['funder']}, amount={args['amount']}")
    
    def store_raw_event(self, event):
        event_data = {
            'event_name': event['event'],
            'transaction_hash': event['transactionHash'].hex(),
            'block_number': event['blockNumber'],
            'log_index': event['logIndex'],
            'args': dict(event['args']),
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