// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StakingAdmin} from "./abstract/StakingAdmin.sol";

contract StakingPool is StakingAdmin {
    constructor(
        address _daiToken,
        uint256 _maxStakePerUser,
        uint256 _maxTotalStake,
        uint256 _protocolFeeBps,
        address _feeCollector
    ) 
        StakingAdmin(_daiToken, _maxStakePerUser, _maxTotalStake) 
    {
        require(_protocolFeeBps <= 1000, "Fee cannot exceed 10%");
        require(_feeCollector != address(0), "Invalid fee collector");
        
        protocolFeeBps = _protocolFeeBps;
        feeCollector = _feeCollector;
        
        _initializeTiers();
    }
    
    // ============ Public Functions ============
    function stake(uint256 amount, uint8 tierId) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(tierId <= 2, "Invalid tier ID");
        
        _checkLimits(msg.sender, amount);
        
        require(daiToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        userStakes[msg.sender].push(Stake({
            amount: amount,
            startTime: block.timestamp,
            lastRewardClaim: block.timestamp,
            tierId: tierId,
            active: true
        }));
        
        totalStaked += amount;
        userTotalStaked[msg.sender] += amount;
        
        uint256 stakeIndex = userStakes[msg.sender].length - 1;
        emit StakeCreated(msg.sender, stakeIndex, amount, tierId, block.timestamp);
    }
    
    function unstake(uint256 stakeIndex) external nonReentrant whenNotPaused {
        Stake storage userStake = _validateStakeIndex(msg.sender, stakeIndex);
        
        uint256 stakedAmount = userStake.amount;
        uint256 grossRewards = _calculateRewardsWithPenalty(msg.sender, stakeIndex);
        uint256 netRewards = _collectProtocolFee(grossRewards);
        uint256 totalAmount = stakedAmount + netRewards;
        
        _checkSolvency(netRewards);
        
        userStake.active = false;
        totalStaked -= stakedAmount;
        userTotalStaked[msg.sender] -= stakedAmount;
        rewardPoolBalance -= netRewards;
        
        require(daiToken.transfer(msg.sender, totalAmount), "Transfer failed");
        
        emit Unstaked(msg.sender, stakeIndex, stakedAmount, netRewards);
    }
    
    function claimRewards(uint256 stakeIndex) external nonReentrant whenNotPaused {
        Stake storage userStake = _validateStakeIndex(msg.sender, stakeIndex);
        
        uint256 grossRewards = _calculateRewards(msg.sender, stakeIndex);
        require(grossRewards > 0, "No rewards to claim");
        
        uint256 netRewards = _collectProtocolFee(grossRewards);
        _checkSolvency(netRewards);
        
        userStake.lastRewardClaim = block.timestamp;
        rewardPoolBalance -= netRewards;
        
        require(daiToken.transfer(msg.sender, netRewards), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, stakeIndex, netRewards);
    }
    
    function emergencyWithdraw(uint256 stakeIndex) external nonReentrant {
        require(paused(), "Only available when paused");
        
        Stake storage userStake = _validateStakeIndex(msg.sender, stakeIndex);
        uint256 stakedAmount = userStake.amount;
        
        userStake.active = false;
        totalStaked -= stakedAmount;
        userTotalStaked[msg.sender] -= stakedAmount;
        
        require(daiToken.transfer(msg.sender, stakedAmount), "Transfer failed");
        
        emit EmergencyWithdraw(msg.sender, stakeIndex, stakedAmount);
    }
    
    // ============ View Functions ============
    function calculateRewards(address user, uint256 stakeIndex) external view returns (uint256) {
        return _calculateRewards(user, stakeIndex);
    }
    
    function calculateRewardsWithPenalty(address user, uint256 stakeIndex) external view returns (uint256) {
        return _calculateRewardsWithPenalty(user, stakeIndex);
    }
    
    function getTier(uint8 tierId) external view returns (StakeTier memory) {
        require(tierId <= 2, "Invalid tier ID");
        return tiers[tierId];
    }
}