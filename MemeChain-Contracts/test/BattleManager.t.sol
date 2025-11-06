// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BattleManager.sol";

contract MockMemeRegistry {
    function getBattleMemes(uint256) external pure returns (uint256[] memory) {
        uint256[] memory memes = new uint256[](0);
        return memes;
    }
}

contract MockVotingEngine {
    bool public enableWithdrawalsFromBMCalled;
    uint256 public lastBattleIdForWithdrawals;
    
    function isVotingEnded(uint256) external pure returns (bool) {
        return true;
    }
    
    function enableWithdrawalsFromBM(uint256 battleId) external {
        enableWithdrawalsFromBMCalled = true;
        lastBattleIdForWithdrawals = battleId;
    }
}

contract MockRewardDistributor {
    bool public distributePrizesCalled;
    uint256 public lastBattleId;
    
    function distributePrizes(uint256 battleId) external {
        distributePrizesCalled = true;
        lastBattleId = battleId;
    }
    
    function addToPrizePool(uint256, uint256) external {}
}

contract BattleManagerTest is Test {
    BattleManager public battleManager;
    MockMemeRegistry public memeRegistry;
    MockVotingEngine public votingEngine;
    MockRewardDistributor public rewardDistributor;
    
    address public owner;
    address public user1;
    
    uint64 public constant SUBMISSION_START = 1000;
    uint64 public constant SUBMISSION_END = 2000;
    uint64 public constant VOTING_END = 3000;
    uint256 public constant MIN_STAKE = 10e6; // 10 USDC
    uint256 public constant MAX_SUBMISSIONS = 3;
    
    event BattleCreated(uint256 indexed battleId, string theme, uint256 submissionEnd, uint256 votingEnd);
    event BattleStateChanged(uint256 indexed battleId, BattleManager.BattleState newState);
    event BattleArchived(uint256 indexed battleId);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        
        battleManager = new BattleManager();
        memeRegistry = new MockMemeRegistry();
        votingEngine = new MockVotingEngine();
        rewardDistributor = new MockRewardDistributor();
        
        battleManager.setModules(
            address(memeRegistry),
            address(votingEngine),
            address(rewardDistributor)
        );
    }
    
    function testSetModules() public {
        BattleManager newManager = new BattleManager();
        
        newManager.setModules(
            address(memeRegistry),
            address(votingEngine),
            address(rewardDistributor)
        );
        
        assertEq(address(newManager.memeRegistry()), address(memeRegistry));
        assertEq(address(newManager.votingEngine()), address(votingEngine));
        assertEq(address(newManager.rewardDistributor()), address(rewardDistributor));
    }
    
    function testSetModulesRevertsOnZeroAddress() public {
        BattleManager newManager = new BattleManager();
        
        vm.expectRevert("addr zero");
        newManager.setModules(address(0), address(votingEngine), address(rewardDistributor));
        
        vm.expectRevert("addr zero");
        newManager.setModules(address(memeRegistry), address(0), address(rewardDistributor));
        
        vm.expectRevert("addr zero");
        newManager.setModules(address(memeRegistry), address(votingEngine), address(0));
    }
    
    function testSetModulesOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        battleManager.setModules(
            address(memeRegistry),
            address(votingEngine),
            address(rewardDistributor)
        );
    }
    
    function testCreateBattle() public {
        vm.expectEmit(true, false, false, true);
        emit BattleCreated(1, "Epic Memes", SUBMISSION_END, VOTING_END);
        
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        assertEq(battleId, 1);
        assertEq(battleManager.battleCounter(), 1);
        
        (
            uint256 id,
            string memory theme,
            uint64 submissionStart,
            uint64 submissionEnd,
            uint64 votingEnd,
            uint256 minStake,
            uint256 maxSubmissions,
            BattleManager.BattleState state
        ) = battleManager.battles(battleId);
        
        assertEq(id, 1);
        assertEq(theme, "Epic Memes");
        assertEq(submissionStart, SUBMISSION_START);
        assertEq(submissionEnd, SUBMISSION_END);
        assertEq(votingEnd, VOTING_END);
        assertEq(minStake, MIN_STAKE);
        assertEq(maxSubmissions, MAX_SUBMISSIONS);
        assertEq(uint256(state), uint256(BattleManager.BattleState.UPCOMING));
    }
    
    function testCreateBattleRevertsOnEmptyTheme() public {
        vm.expectRevert("empty theme");
        battleManager.createBattle(
            "",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
    }
    
    function testCreateBattleRevertsOnBadTimes() public {
        // submissionEnd before submissionStart
        vm.expectRevert("Bad times");
        battleManager.createBattle(
            "Bad Battle",
            SUBMISSION_END,
            SUBMISSION_START,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        // votingEnd before submissionEnd
        vm.expectRevert("Bad times");
        battleManager.createBattle(
            "Bad Battle",
            SUBMISSION_START,
            VOTING_END,
            SUBMISSION_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
    }
    
    function testCreateBattleOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
    }
    
    function testStartSubmissionPhase() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_START);
        
        vm.expectEmit(true, false, false, true);
        emit BattleStateChanged(battleId, BattleManager.BattleState.SUBMISSION_OPEN);
        
        battleManager.startSubmissionPhase(battleId);
        
        assertEq(
            uint256(battleManager.getBattleState(battleId)),
            uint256(BattleManager.BattleState.SUBMISSION_OPEN)
        );
    }
    
    function testStartSubmissionPhaseRevertsWrongState() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_START);
        battleManager.startSubmissionPhase(battleId);
        
        // Try to start again
        vm.expectRevert("Wrong state");
        battleManager.startSubmissionPhase(battleId);
    }
    
    function testStartSubmissionPhaseRevertsTooEarly() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_START - 1);
        
        vm.expectRevert("Too early");
        battleManager.startSubmissionPhase(battleId);
    }
    
    function testStartSubmissionPhaseRevertsBattleNotFound() public {
        vm.warp(SUBMISSION_START);
        vm.expectRevert("battle not found");
        battleManager.startSubmissionPhase(999);
    }
    
    function testStartVotingPhase() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_START);
        battleManager.startSubmissionPhase(battleId);
        
        vm.warp(SUBMISSION_END);
        
        vm.expectEmit(true, false, false, true);
        emit BattleStateChanged(battleId, BattleManager.BattleState.VOTING_OPEN);
        
        battleManager.startVotingPhase(battleId);
        
        assertEq(
            uint256(battleManager.getBattleState(battleId)),
            uint256(BattleManager.BattleState.VOTING_OPEN)
        );
    }
    
    function testStartVotingPhaseRevertsWrongState() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_END);
        
        vm.expectRevert("Wrong state");
        battleManager.startVotingPhase(battleId);
    }
    
    function testFinalizeBattle() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_START);
        battleManager.startSubmissionPhase(battleId);
        
        vm.warp(SUBMISSION_END);
        battleManager.startVotingPhase(battleId);
        
        vm.warp(VOTING_END);
        
        vm.expectEmit(true, false, false, true);
        emit BattleStateChanged(battleId, BattleManager.BattleState.TALLYING);
        
        battleManager.finalizeBattle(battleId);
        
        assertEq(
            uint256(battleManager.getBattleState(battleId)),
            uint256(BattleManager.BattleState.FINALIZED)
        );
        assertTrue(rewardDistributor.distributePrizesCalled());
        assertEq(rewardDistributor.lastBattleId(), battleId);
        
        // Verify withdrawals were enabled automatically
        assertTrue(votingEngine.enableWithdrawalsFromBMCalled());
        assertEq(votingEngine.lastBattleIdForWithdrawals(), battleId);
    }
    
    function testFinalizeBattleRevertsVotingNotEnded() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_START);
        battleManager.startSubmissionPhase(battleId);
        
        vm.warp(SUBMISSION_END);
        battleManager.startVotingPhase(battleId);
        
        vm.warp(VOTING_END - 1);
        
        vm.expectRevert("Voting not ended");
        battleManager.finalizeBattle(battleId);
    }
    
    function testArchiveBattle() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.warp(SUBMISSION_START);
        battleManager.startSubmissionPhase(battleId);
        
        vm.warp(SUBMISSION_END);
        battleManager.startVotingPhase(battleId);
        
        vm.warp(VOTING_END);
        battleManager.finalizeBattle(battleId);
        
        vm.expectEmit(true, false, false, true);
        emit BattleStateChanged(battleId, BattleManager.BattleState.ARCHIVED);
        
        vm.expectEmit(true, false, false, false);
        emit BattleArchived(battleId);
        
        battleManager.archiveBattle(battleId);
        
        assertEq(
            uint256(battleManager.getBattleState(battleId)),
            uint256(BattleManager.BattleState.ARCHIVED)
        );
    }
    
    function testArchiveBattleRevertsNotFinalized() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        vm.expectRevert("Not finalized");
        battleManager.archiveBattle(battleId);
    }
    
    function testGetBattleState() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        assertEq(
            uint256(battleManager.getBattleState(battleId)),
            uint256(BattleManager.BattleState.UPCOMING)
        );
    }
    
    function testMaxSubmissionsPerUser() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        assertEq(battleManager.maxSubmissionsPerUser(battleId), MAX_SUBMISSIONS);
    }
    
    function testMinStakeForVoting() public {
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        assertEq(battleManager.minStakeForVoting(battleId), MIN_STAKE);
    }
    
    function testMultipleBattles() public {
        uint256 battleId1 = battleManager.createBattle(
            "Battle 1",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        uint256 battleId2 = battleManager.createBattle(
            "Battle 2",
            SUBMISSION_START + 1000,
            SUBMISSION_END + 1000,
            VOTING_END + 1000,
            MIN_STAKE * 2,
            MAX_SUBMISSIONS + 1
        );
        
        assertEq(battleId1, 1);
        assertEq(battleId2, 2);
        assertEq(battleManager.battleCounter(), 2);
        
        assertEq(battleManager.minStakeForVoting(battleId1), MIN_STAKE);
        assertEq(battleManager.minStakeForVoting(battleId2), MIN_STAKE * 2);
    }
    
    function testPauseUnpause() public {
        // Pause the contract
        battleManager.pause();
        
        // Cannot create battle when paused
        vm.expectRevert();
        battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        
        // Unpause
        battleManager.unpause();
        
        // Can create battle now
        uint256 battleId = battleManager.createBattle(
            "Epic Memes",
            SUBMISSION_START,
            SUBMISSION_END,
            VOTING_END,
            MIN_STAKE,
            MAX_SUBMISSIONS
        );
        assertEq(battleId, 1);
    }
    
    function testPauseOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        battleManager.pause();
    }
    
    function testUnpauseOnlyOwner() public {
        battleManager.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        battleManager.unpause();
    }
}