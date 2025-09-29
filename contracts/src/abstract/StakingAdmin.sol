// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {StakingRewards} from "./StakingRewards.sol";

abstract contract StakingAdmin is StakingRewards, Ownable {
    // ============ State Variables ============
    uint256 public maxStakePerUser;
    uint256 public maxTotalStake;
    
    mapping(address => uint256) public userTotalStaked;
    
    // ============ Events ============
    event MaxStakePerUserUpdated(uint256 oldMax, uint256 newMax);
    event MaxTotalStakeUpdated(uint256 oldMax, uint256 newMax);
    
    // ============ Constructor ============
    constructor(
        address _daiToken,
        uint256 _maxStakePerUser,
        uint256 _maxTotalStake
    ) StakingRewards(_daiToken) {
        maxStakePerUser = _maxStakePerUser;
        maxTotalStake = _maxTotalStake;
    }
    
    // ============ Admin Functions ============
    function updateTier(
        uint8 tierId,
        uint256 minDuration,
        uint256 apy,
        uint256 penalty
    ) external onlyOwner {
        require(tierId <= 2, "Invalid tier ID");
        require(apy > 0 && apy <= 10000, "APY must be 0-100%");
        require(penalty <= 5000, "Penalty cannot exceed 50%");
        
        tiers[tierId] = StakeTier({
            minDuration: minDuration,
            apy: apy,
            earlyWithdrawPenalty: penalty
        });
        
        emit TierUpdated(tierId, minDuration, apy, penalty);
    }
    
    function setProtocolFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Fee cannot exceed 10%");
        uint256 oldFee = protocolFeeBps;
        protocolFeeBps = feeBps;
        emit ProtocolFeeUpdated(oldFee, feeBps);
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid fee collector");
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }
    
    function setMaxStakePerUser(uint256 _maxStakePerUser) external onlyOwner {
        uint256 oldMax = maxStakePerUser;
        maxStakePerUser = _maxStakePerUser;
        emit MaxStakePerUserUpdated(oldMax, _maxStakePerUser);
    }
    
    function setMaxTotalStake(uint256 _maxTotalStake) external onlyOwner {
        uint256 oldMax = maxTotalStake;
        maxTotalStake = _maxTotalStake;
        emit MaxTotalStakeUpdated(oldMax, _maxTotalStake);
    }
    
    function fundRewardPool(uint256 amount) external onlyOwner {
        require(daiToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        rewardPoolBalance += amount;
        emit RewardPoolFunded(msg.sender, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Internal Helpers ============
    function _checkLimits(address user, uint256 amount) internal view {
        require(userTotalStaked[user] + amount <= maxStakePerUser, "Exceeds max stake per user");
        require(totalStaked + amount <= maxTotalStake, "Exceeds max total stake");
    }
}