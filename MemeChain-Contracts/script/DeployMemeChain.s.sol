// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BattleManager.sol";
import "../src/MemeRegistry.sol";
import "../src/VotingEngine.sol";
import "../src/RewardDistributor.sol";
import "../src/WinningMemeNFT.sol";
import "../src/MockUSDC.sol";

contract DeployMemeChain is Script {
    // Deployed contract instances
    MockUSDC public mockUSDC;
    BattleManager public battleManager;
    MemeRegistry public memeRegistry;
    VotingEngine public votingEngine;
    RewardDistributor public rewardDistributor;
    WinningMemeNFT public winningMemeNFT;

    // Configuration
    string public nftName = "Winning Meme";
    string public nftSymbol = "WMEME";
    string public nftBaseURI = "ipfs://";

    function run() external {
        // Load deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying MemeChain contracts...");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockUSDC
        console.log("\n1. Deploying MockUSDC...");
        mockUSDC = new MockUSDC();
        console.log("MockUSDC deployed at:", address(mockUSDC));
        console.log("Initial supply minted to deployer: 1,000,000 USDC");

        // 2. Deploy BattleManager
        console.log("\n1. Deploying BattleManager...");
        battleManager = new BattleManager();
        console.log("BattleManager deployed at:", address(battleManager));

        // 2. Deploy MemeRegistry
        console.log("\n2. Deploying MemeRegistry...");
        memeRegistry = new MemeRegistry(address(battleManager));
        console.log("MemeRegistry deployed at:", address(memeRegistry));

        // 3. Deploy VotingEngine
        console.log("\n3. Deploying VotingEngine...");
        votingEngine = new VotingEngine(
            address(mockUSDC),
            address(battleManager),
            address(memeRegistry)
        );
        console.log("VotingEngine deployed at:", address(votingEngine));

        // 4. Deploy RewardDistributor
        console.log("\n4. Deploying RewardDistributor...");
        rewardDistributor = new RewardDistributor(
            address(mockUSDC),
            address(battleManager),
            address(votingEngine),
            address(memeRegistry)
        );
        console.log(
            "RewardDistributor deployed at:",
            address(rewardDistributor)
        );

        // 5. Deploy WinningMemeNFT
        console.log("\n5. Deploying WinningMemeNFT...");
        winningMemeNFT = new WinningMemeNFT(nftName, nftSymbol, nftBaseURI);
        console.log("WinningMemeNFT deployed at:", address(winningMemeNFT));

        // 6. Setup connections
        console.log("\n6. Setting up contract connections...");

        // Set modules in BattleManager
        console.log("Setting modules in BattleManager...");
        battleManager.setModules(
            address(memeRegistry),
            address(votingEngine),
            address(rewardDistributor)
        );

        // Set VotingEngine in MemeRegistry
        console.log("Setting VotingEngine in MemeRegistry...");
        memeRegistry.setVotingEngine(address(votingEngine));

        // Set WinnerNFT in RewardDistributor
        console.log("Setting WinnerNFT in RewardDistributor...");
        rewardDistributor.setWinnerNFT(address(winningMemeNFT));

        // Set RewardDistributor as minter in WinningMemeNFT
        console.log("Setting RewardDistributor as minter in WinningMemeNFT...");
        winningMemeNFT.setMinter(address(rewardDistributor));

        vm.stopBroadcast();

        // 7. Print deployment summary
        console.log("\n===========================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("MockUSDC:", address(mockUSDC));
        console.log("BattleManager:", address(battleManager));
        console.log("MemeRegistry:", address(memeRegistry));
        console.log("VotingEngine:", address(votingEngine));
        console.log("RewardDistributor:", address(rewardDistributor));
        console.log("WinningMemeNFT:", address(winningMemeNFT));
        console.log("===========================================");

        // Save deployment addresses to file
        string memory deploymentData = string(
            abi.encodePacked(
                "MOCK_USDC=",
                vm.toString(address(mockUSDC)),
                "\n",
                "BATTLE_MANAGER=",
                vm.toString(address(battleManager)),
                "\n",
                "MEME_REGISTRY=",
                vm.toString(address(memeRegistry)),
                "\n",
                "VOTING_ENGINE=",
                vm.toString(address(votingEngine)),
                "\n",
                "REWARD_DISTRIBUTOR=",
                vm.toString(address(rewardDistributor)),
                "\n",
                "WINNING_MEME_NFT=",
                vm.toString(address(winningMemeNFT)),
                "\n"
            )
        );

        vm.writeFile("deployments.env", deploymentData);
        console.log("\nDeployment addresses saved to deployments.env");
    }
}
