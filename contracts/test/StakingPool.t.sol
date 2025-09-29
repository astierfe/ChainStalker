// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {StakingPool} from "../src/StakingPool.sol";
import {MockDAI} from "./mocks/MockDAI.sol";

contract StakingPoolTest is Test {
    StakingPool public pool;
    MockDAI public dai;
    
    address public owner = address(1);
    address public feeCollector = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    
    uint256 constant MAX_STAKE_PER_USER = 100_000 * 10**18;
    uint256 constant MAX_TOTAL_STAKE = 1_000_000 * 10**18;
    uint256 constant PROTOCOL_FEE = 100; // 1%
    uint256 constant STAKE_AMOUNT = 10_000 * 10**18;
    
    function setUp() public {
        vm.startPrank(owner);
        
        dai = new MockDAI();
        pool = new StakingPool(
            address(dai),
            MAX_STAKE_PER_USER,
            MAX_TOTAL_STAKE,
            PROTOCOL_FEE,
            feeCollector
        );
        
        dai.mint(user1, 200_000 * 10**18);
        dai.mint(user2, 200_000 * 10**18);
        dai.mint(owner, 500_000 * 10**18);
        
        dai.approve(address(pool), 500_000 * 10**18);
        pool.fundRewardPool(500_000 * 10**18);
        
        vm.stopPrank();
        
        vm.prank(user1);
        dai.approve(address(pool), type(uint256).max);
        
        vm.prank(user2);
        dai.approve(address(pool), type(uint256).max);
    }
    
    // ============ Initial State Tests ============
    function testInitialState() public view {
        assertEq(address(pool.daiToken()), address(dai));
        assertEq(pool.totalStaked(), 0);
        assertEq(pool.rewardPoolBalance(), 500_000 * 10**18);
        assertEq(pool.maxStakePerUser(), MAX_STAKE_PER_USER);
        assertEq(pool.protocolFeeBps(), PROTOCOL_FEE);
    }
    
    function testTiersInitialized() public view {
        (uint256 minDuration0, uint256 apy0, uint256 penalty0) = pool.tiers(0);
        assertEq(minDuration0, 7 days);
        assertEq(apy0, 500);
        assertEq(penalty0, 200);
        
        (uint256 minDuration2, uint256 apy2, uint256 penalty2) = pool.tiers(2);
        assertEq(minDuration2, 90 days);
        assertEq(apy2, 1200);
        assertEq(penalty2, 500);
    }
    
    // ============ Stake Tests ============
    function testStakeSuccess() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        assertEq(pool.totalStaked(), STAKE_AMOUNT);
        assertEq(pool.getUserStakeCount(user1), 1);
        assertEq(pool.userTotalStaked(user1), STAKE_AMOUNT);
        
        (uint256 amount, , , uint8 tierId, bool active) = pool.userStakes(user1, 0);
        assertEq(amount, STAKE_AMOUNT);
        assertEq(tierId, 0);
        assertTrue(active);
    }
    
    function testStakeMultipleTiers() public {
        vm.startPrank(user1);
        pool.stake(5_000 * 10**18, 0);
        pool.stake(5_000 * 10**18, 1);
        pool.stake(5_000 * 10**18, 2);
        vm.stopPrank();
        
        assertEq(pool.getUserStakeCount(user1), 3);
        assertEq(pool.totalStaked(), 15_000 * 10**18);
        
        (, , , uint8 tier0, ) = pool.userStakes(user1, 0);
        (, , , uint8 tier1, ) = pool.userStakes(user1, 1);
        (, , , uint8 tier2, ) = pool.userStakes(user1, 2);
        
        assertEq(tier0, 0);
        assertEq(tier1, 1);
        assertEq(tier2, 2);
    }
    
    function testStakeExceedsUserLimit() public {
        vm.prank(user1);
        vm.expectRevert("Exceeds max stake per user");
        pool.stake(MAX_STAKE_PER_USER + 1, 0);
    }
    
    function testStakeExceedsTotalLimit() public {
        vm.prank(user1);
        pool.stake(MAX_STAKE_PER_USER, 0);
        
        vm.prank(user2);
        pool.stake(MAX_STAKE_PER_USER, 0);
        
        vm.prank(owner);
        pool.setMaxTotalStake(MAX_STAKE_PER_USER * 2);
        
        address user3 = address(5);
        dai.mint(user3, 100_000 * 10**18);
        vm.startPrank(user3);
        dai.approve(address(pool), type(uint256).max);
        vm.expectRevert("Exceeds max total stake");
        pool.stake(1 * 10**18, 0);
        vm.stopPrank();
    }
    
    function testStakeZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        pool.stake(0, 0);
    }
    
    function testStakeInvalidTier() public {
        vm.prank(user1);
        vm.expectRevert("Invalid tier ID");
        pool.stake(STAKE_AMOUNT, 3);
    }
    
    // ============ Unstake Tests ============
    function testUnstakeSuccess() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.warp(block.timestamp + 7 days);
        
        uint256 balanceBefore = dai.balanceOf(user1);
        
        vm.prank(user1);
        pool.unstake(0);
        
        uint256 balanceAfter = dai.balanceOf(user1);
        assertTrue(balanceAfter > balanceBefore);
        assertEq(pool.totalStaked(), 0);
        
        (, , , , bool active) = pool.userStakes(user1, 0);
        assertFalse(active);
    }
    
    function testUnstakeWithPenalty() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.warp(block.timestamp + 3 days);
        
        uint256 rewardsWithPenalty = pool.calculateRewardsWithPenalty(user1, 0);
        uint256 rewardsNoPenalty = pool.calculateRewards(user1, 0);
        
        assertTrue(rewardsWithPenalty < rewardsNoPenalty);
        
        vm.prank(user1);
        pool.unstake(0);
    }
    
    function testUnstakeInvalidIndex() public {
        vm.prank(user1);
        vm.expectRevert("Invalid stake index");
        pool.unstake(0);
    }
    
    function testUnstakeAlreadyClosed() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.warp(block.timestamp + 7 days);
        
        vm.startPrank(user1);
        pool.unstake(0);
        
        vm.expectRevert("Stake not active");
        pool.unstake(0);
        vm.stopPrank();
    }
    
    // ============ Rewards Tests ============
    function testCalculateRewardsTier0() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 rewards = pool.calculateRewards(user1, 0);
        uint256 expectedRewards = (STAKE_AMOUNT * 500) / 10000;
        
        assertApproxEqRel(rewards, expectedRewards, 0.01e18);
    }
    
    function testCalculateRewardsTier2() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 2);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 rewards = pool.calculateRewards(user1, 0);
        uint256 expectedRewards = (STAKE_AMOUNT * 1200) / 10000;
        
        assertApproxEqRel(rewards, expectedRewards, 0.01e18);
    }
    
    function testClaimRewards() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.warp(block.timestamp + 30 days);
        
        uint256 rewardsBefore = pool.calculateRewards(user1, 0);
        uint256 balanceBefore = dai.balanceOf(user1);
        
        vm.prank(user1);
        pool.claimRewards(0);
        
        uint256 balanceAfter = dai.balanceOf(user1);
        uint256 received = balanceAfter - balanceBefore;
        
        assertTrue(received > 0);
        assertApproxEqRel(received, rewardsBefore * 99 / 100, 0.02e18);
        
        assertEq(pool.calculateRewards(user1, 0), 0);
    }
    
    function testClaimRewardsZero() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.prank(user1);
        vm.expectRevert("No rewards to claim");
        pool.claimRewards(0);
    }
    
    function testProtocolFeeCollection() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 feeBalanceBefore = dai.balanceOf(feeCollector);
        
        vm.prank(user1);
        pool.claimRewards(0);
        
        uint256 feeBalanceAfter = dai.balanceOf(feeCollector);
        uint256 feeCollected = feeBalanceAfter - feeBalanceBefore;
        
        assertTrue(feeCollected > 0);
    }
    
    function testRewardPoolInsolvency() public {
        vm.startPrank(owner);
        StakingPool smallPool = new StakingPool(
            address(dai),
            MAX_STAKE_PER_USER,
            MAX_TOTAL_STAKE,
            0,
            feeCollector
        );
        
        dai.approve(address(smallPool), 1_000 * 10**18);
        smallPool.fundRewardPool(1_000 * 10**18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        dai.approve(address(smallPool), type(uint256).max);
        smallPool.stake(MAX_STAKE_PER_USER, 2);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 365 days);
        
        vm.prank(user1);
        vm.expectRevert("Insufficient reward pool");
        smallPool.unstake(0);
    }
    
    // ============ Admin Tests ============
    function testUpdateTier() public {
        vm.prank(owner);
        pool.updateTier(0, 14 days, 600, 250);
        
        (uint256 minDuration, uint256 apy, uint256 penalty) = pool.tiers(0);
        assertEq(minDuration, 14 days);
        assertEq(apy, 600);
        assertEq(penalty, 250);
    }
    
    function testUpdateTierNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pool.updateTier(0, 14 days, 600, 250);
    }
    
    function testSetProtocolFee() public {
        vm.prank(owner);
        pool.setProtocolFee(200);
        
        assertEq(pool.protocolFeeBps(), 200);
    }
    
    function testSetProtocolFeeTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("Fee cannot exceed 10%");
        pool.setProtocolFee(1001);
    }
    
    function testFundRewardPool() public {
        uint256 poolBalanceBefore = pool.rewardPoolBalance();
        
        vm.startPrank(owner);
        dai.mint(owner, 100_000 * 10**18);
        dai.approve(address(pool), 100_000 * 10**18);
        pool.fundRewardPool(100_000 * 10**18);
        vm.stopPrank();
        
        assertEq(pool.rewardPoolBalance(), poolBalanceBefore + 100_000 * 10**18);
    }
    
    function testPauseUnpause() public {
        vm.prank(owner);
        pool.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.prank(owner);
        pool.unpause();
        
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
    }
    
    function testPauseNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pool.pause();
    }
    
    // ============ Emergency Tests ============
    function testEmergencyWithdraw() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.warp(block.timestamp + 30 days);
        
        vm.prank(owner);
        pool.pause();
        
        uint256 balanceBefore = dai.balanceOf(user1);
        
        vm.prank(user1);
        pool.emergencyWithdraw(0);
        
        uint256 balanceAfter = dai.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, STAKE_AMOUNT);
        
        (, , , , bool active) = pool.userStakes(user1, 0);
        assertFalse(active);
    }
    
    function testEmergencyWithdrawNotPaused() public {
        vm.prank(user1);
        pool.stake(STAKE_AMOUNT, 0);
        
        vm.prank(user1);
        vm.expectRevert("Only available when paused");
        pool.emergencyWithdraw(0);
    }
    
    // ============ Edge Cases ============
    function testMultipleStakesPerUser() public {
        vm.startPrank(user1);
        for (uint i = 0; i < 5; i++) {
            pool.stake(1_000 * 10**18, uint8(i % 3));
        }
        vm.stopPrank();
        
        assertEq(pool.getUserStakeCount(user1), 5);
        assertEq(pool.userTotalStaked(user1), 5_000 * 10**18);
    }
    
    function testSetMaxStakePerUser() public {
        vm.prank(owner);
        pool.setMaxStakePerUser(50_000 * 10**18);
        
        assertEq(pool.maxStakePerUser(), 50_000 * 10**18);
    }
    
    function testSetFeeCollector() public {
        address newCollector = address(99);
        
        vm.prank(owner);
        pool.setFeeCollector(newCollector);
        
        assertEq(pool.feeCollector(), newCollector);
    }
}