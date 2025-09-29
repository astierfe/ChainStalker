// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

abstract contract StakingCore is ReentrancyGuard, Pausable {
    // ============ Structs ============
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lastRewardClaim;
        uint8 tierId;
        bool active;
    }
    
    // ============ State Variables ============
    IERC20 public immutable daiToken;
    uint256 public totalStaked;
    uint256 public rewardPoolBalance;
    
    mapping(address => Stake[]) public userStakes;
    
    // ============ Events ============
    event StakeCreated(address indexed user, uint256 indexed stakeIndex, uint256 amount, uint8 tierId, uint256 timestamp);
    event Unstaked(address indexed user, uint256 indexed stakeIndex, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 indexed stakeIndex, uint256 rewards);
    event EmergencyWithdraw(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event RewardPoolFunded(address indexed funder, uint256 amount);
    
    // ============ Constructor ============
    constructor(address _daiToken) {
        require(_daiToken != address(0), "Invalid DAI address");
        daiToken = IERC20(_daiToken);
    }
    
    // ============ View Functions ============
    function getUserStakeCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }
    
    function getUserStake(address user, uint256 stakeIndex) external view returns (Stake memory) {
        require(stakeIndex < userStakes[user].length, "Invalid stake index");
        return userStakes[user][stakeIndex];
    }
    
    function getContractBalance() external view returns (uint256) {
        return daiToken.balanceOf(address(this));
    }
    
    // ============ Internal Helpers ============
    function _validateStakeIndex(address user, uint256 stakeIndex) internal view returns (Stake storage) {
        require(stakeIndex < userStakes[user].length, "Invalid stake index");
        Stake storage userStake = userStakes[user][stakeIndex];
        require(userStake.active, "Stake not active");
        return userStake;
    }
    
    function _checkSolvency(uint256 rewardsNeeded) internal view {
        uint256 availableRewards = daiToken.balanceOf(address(this)) - totalStaked;
        require(availableRewards >= rewardsNeeded, "Insufficient reward pool");
    }
}