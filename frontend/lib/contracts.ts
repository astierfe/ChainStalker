// frontend/lib/contracts.ts - v1.0
import { Address } from 'viem';

// Contract addresses from environment variables
export const STAKING_POOL_ADDRESS = process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS as Address;
export const DAI_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS as Address;

// ============ ERC20 ABI (DAI Token) ============
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Alias for clarity in staking context
export const DAI_TOKEN_ABI = ERC20_ABI;

// ============ Staking Pool ABI ============
export const STAKING_POOL_ABI = [
  // ===== Events =====
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'stakeIndex', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'tierId', type: 'uint8' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'StakeCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'stakeIndex', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'rewards', type: 'uint256' },
    ],
    name: 'Unstaked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'stakeIndex', type: 'uint256' },
      { indexed: false, name: 'rewards', type: 'uint256' },
    ],
    name: 'RewardsClaimed',
    type: 'event',
  },
  
  // ===== Write Functions =====
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'tierId', type: 'uint8' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeIndex', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeIndex', type: 'uint256' }],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeIndex', type: 'uint256' }],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // ===== Read Functions =====
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'stakeIndex', type: 'uint256' },
    ],
    name: 'calculateRewards',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'stakeIndex', type: 'uint256' },
    ],
    name: 'calculateRewardsWithPenalty',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tierId', type: 'uint8' }],
    name: 'getTier',
    outputs: [
      {
        components: [
          { name: 'minDuration', type: 'uint256' },
          { name: 'apy', type: 'uint256' },
          { name: 'earlyWithdrawPenalty', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStaked',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rewardPoolBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserStakeCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'stakeIndex', type: 'uint256' },
    ],
    name: 'getUserStake',
    outputs: [
      {
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'lastRewardClaim', type: 'uint256' },
          { name: 'tierId', type: 'uint8' },
          { name: 'active', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Admin functions
  {
    inputs: [
      { name: 'tierId', type: 'uint8' },
      { name: 'minDuration', type: 'uint256' },
      { name: 'apy', type: 'uint256' },
      { name: 'earlyWithdrawPenalty', type: 'uint256' },
    ],
    name: 'updateTier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;