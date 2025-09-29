// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library StakingMath {
    uint256 constant YEAR_IN_SECONDS = 365 days;
    uint256 constant BASIS_POINTS = 10000;
    
    function calculateRewards(
        uint256 amount,
        uint256 apy,
        uint256 duration,
        uint256 apyMultiplier
    ) internal pure returns (uint256) {
        uint256 effectiveAPY = (apy * apyMultiplier) / BASIS_POINTS;
        return (amount * effectiveAPY * duration) / (YEAR_IN_SECONDS * BASIS_POINTS);
    }
    
    function applyPenalty(uint256 rewards, uint256 penaltyBps) internal pure returns (uint256) {
        uint256 penalty = (rewards * penaltyBps) / BASIS_POINTS;
        return rewards - penalty;
    }
    
    function calculateProtocolFee(uint256 rewards, uint256 feeBps) internal pure returns (uint256) {
        return (rewards * feeBps) / BASIS_POINTS;
    }
}