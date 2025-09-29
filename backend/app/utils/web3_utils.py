# backend/app/utils/web3_utils.py - v1.0
import json
import os
from web3 import Web3
from web3.middleware import geth_poa_middleware
from app.config import config

class Web3Manager:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(config.RPC_URL))
        
        if config.CHAIN_ID in [31337, 11155111]:
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to RPC: {config.RPC_URL}")
        
        self.staking_pool = self._load_contract(
            config.STAKING_POOL_ADDRESS,
            'StakingPool'
        )
        
        self.dai_token = self._load_contract(
            config.DAI_TOKEN_ADDRESS,
            'ERC20'
        )
    
    def _load_contract(self, address, contract_name):
        abi_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            'abi',
            f'{contract_name}.json'
        )
        
        if not os.path.exists(abi_path):
            raise FileNotFoundError(f"ABI file not found: {abi_path}")
        
        with open(abi_path, 'r') as f:
            abi = json.load(f)
        
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(address),
            abi=abi
        )
    
    def get_latest_block(self):
        return self.w3.eth.block_number
    
    def get_events(self, event_name, from_block, to_block):
        event = getattr(self.staking_pool.events, event_name)
        return event.get_logs(fromBlock=from_block, toBlock=to_block)

web3_manager = Web3Manager()