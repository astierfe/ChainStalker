// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {StakingPool} from "src/StakingPool.sol";
import {MockDAI} from "test/mocks/MockDAI.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address feeCollector = vm.envAddress("FEE_COLLECTOR");
        uint256 maxStakePerUser = vm.envUint("MAX_STAKE_PER_USER");
        uint256 maxTotalStake = vm.envUint("MAX_TOTAL_STAKE");
        uint256 protocolFeeBps = vm.envUint("PROTOCOL_FEE_BPS");
        uint256 initialRewardPool = vm.envUint("INITIAL_REWARD_POOL");
        bool deployMockDAI = vm.envBool("DEPLOY_MOCK_DAI");
        
        vm.startBroadcast(deployerPrivateKey);
        
        address daiAddress;
        
        if (deployMockDAI) {
            console.log("Deploying MockDAI...");
            MockDAI dai = new MockDAI();
            daiAddress = address(dai);
            console.log("MockDAI deployed at:", daiAddress);
        } else {
            daiAddress = vm.envAddress("DAI_ADDRESS");
            console.log("Using existing DAI at:", daiAddress);
        }
        
        console.log("\nDeploying StakingPool...");
        StakingPool stakingPool = new StakingPool(
            daiAddress,
            maxStakePerUser,
            maxTotalStake,
            protocolFeeBps,
            feeCollector
        );
        
        console.log("StakingPool deployed at:", address(stakingPool));
        
        if (initialRewardPool > 0 && deployMockDAI) {
            console.log("\nFunding reward pool with", initialRewardPool, "DAI...");
            MockDAI(daiAddress).approve(address(stakingPool), initialRewardPool);
            stakingPool.fundRewardPool(initialRewardPool);
            console.log("Reward pool funded successfully");
        }
        
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("DAI Address:", daiAddress);
        console.log("StakingPool Address:", address(stakingPool));
        console.log("Fee Collector:", feeCollector);
        console.log("Max Stake Per User:", maxStakePerUser);
        console.log("Max Total Stake:", maxTotalStake);
        console.log("Protocol Fee (bps):", protocolFeeBps);
        console.log("========================");
        
        vm.stopBroadcast();
    }
}