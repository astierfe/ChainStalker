// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {StakingPool} from "src/StakingPool.sol";
import {MockDAI} from "test/mocks/MockDAI.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address feeCollector = vm.envAddress("FEE_COLLECTOR");
        uint256 maxStakePerUser = vm.envUint("MAX_STAKE_PER_USER");
        uint256 maxTotalStake = vm.envUint("MAX_TOTAL_STAKE");
        uint256 protocolFeeBps = vm.envUint("PROTOCOL_FEE_BPS");
        uint256 initialRewardPool = vm.envUint("INITIAL_REWARD_POOL");
        bool deployMockDAI = vm.envBool("DEPLOY_MOCK_DAI");

        address deployer = vm.addr(deployerPrivateKey);

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

        // ========== IMPROVED FUNDING LOGIC ==========
        if (initialRewardPool > 0) {
            console.log("\n=== Funding Reward Pool ===");

            IERC20 dai = IERC20(daiAddress);
            uint256 balance = dai.balanceOf(deployer);
            console.log("Deployer DAI balance:", balance);
            console.log("Required for funding:", initialRewardPool);

            if (balance < initialRewardPool) {
                console.log("WARNING: Insufficient DAI balance!");
                console.log("Skipping reward pool funding.");
                console.log("You can fund it later using StakingPool.fundRewardPool()");
            } else {
                console.log("Approving StakingPool to spend", initialRewardPool, "DAI...");
                require(dai.approve(address(stakingPool), initialRewardPool), "Approve failed");

                console.log("Funding reward pool...");
                stakingPool.fundRewardPool(initialRewardPool);
                console.log("Reward pool funded successfully with", initialRewardPool, "DAI");
            }
        } else {
            console.log("\nINITIAL_REWARD_POOL = 0, skipping funding.");
        }
        // ============================================

        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("DAI Address:", daiAddress);
        console.log("StakingPool Address:", address(stakingPool));
        console.log("Fee Collector:", feeCollector);
        console.log("Max Stake Per User:", maxStakePerUser);
        console.log("Max Total Stake:", maxTotalStake);
        console.log("Protocol Fee (bps):", protocolFeeBps);
        console.log("Reward Pool Balance:", IERC20(daiAddress).balanceOf(address(stakingPool)));
        console.log("========================");
        
        vm.stopBroadcast();
    }
}