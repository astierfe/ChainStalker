// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StakingCore} from "./StakingCore.sol";
import {StakingMath} from "../libraries/StakingMath.sol";

abstract contract StakingRewards is StakingCore {
    // ============ Structs ============
    struct StakeTier {
        uint256 minDuration;
        uint256 apy;
        uint256 earlyWithdrawPenalty;
    }
    
    // ============ State Variables ============
    mapping(uint8 => StakeTier) public tiers;
    uint256 public protocolFeeBps;
    address public feeCollector;
    
    // ============ Events ============
    event TierUpdated(uint8 indexed tierId, uint256 minDuration, uint256 apy, uint256 penalty);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event ProtocolFeeCollected(uint256 amount);
    
    // ============ Constructor ============
    constructor(address _daiToken) StakingCore(_daiToken) {}
    
    // ============ Internal Functions ============
    function _initializeTiers() internal {
        tiers[0] = StakeTier({
            minDuration: 7 days,
            apy: 500,
            earlyWithdrawPenalty: 200
        });
        
        tiers[1] = StakeTier({
            minDuration: 30 days,
            apy: 800,
            earlyWithdrawPenalty: 300
        });
        
        tiers[2] = StakeTier({
            minDuration: 90 days,
            apy: 1200,
            earlyWithdrawPenalty: 500
        });
        
        emit TierUpdated(0, 7 days, 500, 200);
        emit TierUpdated(1, 30 days, 800, 300);
        emit TierUpdated(2, 90 days, 1200, 500);
    }
    
    function _calculateRewards(address user, uint256 stakeIndex) internal view returns (uint256) {
        Stake memory userStake = userStakes[user][stakeIndex];
        
        if (!userStake.active) {
            return 0;
        }
        
        StakeTier memory tier = tiers[userStake.tierId];
        uint256 duration = block.timestamp - userStake.lastRewardClaim;
        uint256 apyMultiplier = _getAPYMultiplier();
        
        return StakingMath.calculateRewards(userStake.amount, tier.apy, duration, apyMultiplier);
    }
    
    function _calculateRewardsWithPenalty(address user, uint256 stakeIndex) internal view returns (uint256) {
        Stake memory userStake = userStakes[user][stakeIndex];
        StakeTier memory tier = tiers[userStake.tierId];
        
        uint256 rewards = _calculateRewards(user, stakeIndex);
        uint256 stakeDuration = block.timestamp - userStake.startTime;
        
        if (stakeDuration < tier.minDuration) {
            rewards = StakingMath.applyPenalty(rewards, tier.earlyWithdrawPenalty);
        }
        
        return rewards;
    }
    
    function _collectProtocolFee(uint256 rewards) internal returns (uint256) {
        if (protocolFeeBps == 0 || feeCollector == address(0)) {
            return rewards;
        }
        
        uint256 fee = StakingMath.calculateProtocolFee(rewards, protocolFeeBps);
        uint256 netRewards = rewards - fee;
        
        if (fee > 0) {
            require(daiToken.transfer(feeCollector, fee), "Fee transfer failed");
            emit ProtocolFeeCollected(fee);
        }
        
        return netRewards;
    }
    
    function _getAPYMultiplier() internal view virtual returns (uint256) {
        return 10000;
    }
}