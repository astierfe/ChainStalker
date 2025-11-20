// frontend/types/index.ts - v1.0

// ============ User Types ============
export interface User {
  address: string;
  total_staked: string;
  total_rewards_claimed: string;
  active_stakes_count: number;
  created_at: string;
  updated_at: string;
}

// ============ Stake Types ============
export interface Stake {
  user_address: string;
  stake_index: number;
  amount: string;
  tier_id: number;
  status: 'active' | 'unstaked' | 'emergency_withdrawn';
  total_rewards_claimed: string;
  start_time: number;
  last_reward_claim: number;
  tx_hash: string;
  block_number: number;
  created_at: string;
  updated_at?: string;
}

// ============ Tier Types ============
export interface StakeTier {
  tier_id: number;
  tier_name: string;
  stake_count: number;
  total_staked: string;
  avg_stake_amount: string;
}

export interface TierInfo {
  minDuration: number; // seconds
  apy: number; // basis points (500 = 5%)
  earlyWithdrawPenalty: number; // basis points (200 = 2%)
  name: string;
  durationLabel: string;
}

export const TIER_INFO: Record<number, TierInfo> = {
  0: {
    minDuration: 7 * 24 * 60 * 60, // 7 days
    apy: 500, // 5%
    earlyWithdrawPenalty: 200, // 2%
    name: 'Bronze',
    durationLabel: '7 days'
  },
  1: {
    minDuration: 30 * 24 * 60 * 60, // 30 days
    apy: 800, // 8%
    earlyWithdrawPenalty: 300, // 3%
    name: 'Silver',
    durationLabel: '30 days'
  },
  2: {
    minDuration: 90 * 24 * 60 * 60, // 90 days
    apy: 1200, // 12%
    earlyWithdrawPenalty: 500, // 5%
    name: 'Gold',
    durationLabel: '90 days'
  }
};

// ============ Analytics Types ============
export interface TVLData {
  total_value_locked: string;
  tvl_formatted: string;
}

// TVL Sparkline Types
export interface TVLSparklineDataPoint {
  timestamp: string;
  value_dai: number;
  value_wei: string;
}

export interface TVLSparklineData {
  current_tvl: string;
  current_tvl_wei: string;
  change_24h: number;
  change_percent_24h: number;
  data_points: TVLSparklineDataPoint[];
  period_hours: number;
  points_returned: number;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  avg_stake_per_user: string;
  total_rewards_distributed: string;
}

export interface StakeStats {
  total_stakes: number;
  active_stakes: number;
  unstaked_stakes: number;
  emergency_withdrawals: number;
}

export interface RewardStats {
  total_rewards_claimed: string;
  avg_rewards_per_stake: string;
}

export interface TierDistribution {
  tiers: StakeTier[];
}

export interface AnalyticsData {
  tvl: TVLData;
  users: UserStats;
  stakes: StakeStats;
  rewards: RewardStats;
  tiers: TierDistribution;
}

// ============ Metrics History Types ============
export interface MetricDataPoint {
  value: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface MetricsHistory {
  type: string;
  hours: number;
  data_points: number;
  history: MetricDataPoint[];
}

// ============ Contract Info Types ============
export interface ContractInfo {
  total_staked: string;
  reward_pool_balance: string;
  contract_balance: string;
  contract_address: string;
}

// ============ API Response Types ============
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiError {
  error: string;
}