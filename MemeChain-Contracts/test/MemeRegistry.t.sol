// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Foundry
import "forge-std/Test.sol";
import "forge-std/StdUtils.sol";

// SUT
import {MemeRegistry, IBattleManager} from "../src/MemeRegistry.sol";

// -----------------------------------------------------------------------------
// Mock BattleManager
// -----------------------------------------------------------------------------
contract MockBattleManager is IBattleManager {
    BattleState public state;
    mapping(uint256 => uint256) internal _maxPerUser;

    function setState(BattleState s) external {
        state = s;
    }

    function setMax(uint256 battleId, uint256 v) external {
        _maxPerUser[battleId] = v;
    }

    function getBattleState(
        uint256 /*battleId*/
    ) external view override returns (BattleState) {
        return state;
    }

    function maxSubmissionsPerUser(
        uint256 battleId
    ) external view override returns (uint256) {
        return _maxPerUser[battleId];
    }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------
contract MemeRegistryTest is Test {
    MockBattleManager bm;
    MemeRegistry registry;

    address OWNER = makeAddr("owner");
    address VE = makeAddr("votingEngine");
    address ALICE = makeAddr("alice");
    address BOB = makeAddr("bob");

    uint256 constant BATTLE_ID = 1;

    event MemeSubmitted(
        uint256 indexed memeId,
        uint256 indexed battleId,
        address indexed creator,
        string ipfsHash
    );
    event MemeVoteWeightUpdated(
        uint256 indexed memeId,
        uint256 totalVoteWeight
    );

    function setUp() public {
        vm.startPrank(OWNER);
        bm = new MockBattleManager();
        registry = new MemeRegistry(address(bm)); // Ownable(msg.sender) => OWNER
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Constructor / config
    // -------------------------------------------------------------------------
    function testConstructor_RevertsOnZeroBM() public {
        vm.startPrank(OWNER);
        vm.expectRevert(bytes("BM addr zero"));
        new MemeRegistry(address(0));
        vm.stopPrank();
    }

    function testSetVotingEngine_OnlyOwner() public {
        // non-owner cannot set
        vm.prank(ALICE);
        vm.expectRevert(); // OZ Ownable revert (selector varies by OZ version), keep generic
        registry.setVotingEngine(VE);

        // owner sets ok
        vm.prank(OWNER);
        registry.setVotingEngine(VE);

        // Create a meme first
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 5);
        vm.prank(ALICE);
        uint256 memeId = registry.submitMeme(BATTLE_ID, "ipfs://test");

        // quick sanity via calling a VE-guarded fn from VE later
        vm.prank(VE);
        registry.increaseVoteWeight(memeId, 1);
    }

    function testSetVotingEngine_ZeroAddrReverts() public {
        vm.prank(OWNER);
        vm.expectRevert(bytes("VE addr zero"));
        registry.setVotingEngine(address(0));
    }

    // -------------------------------------------------------------------------
    // submitMeme
    // -------------------------------------------------------------------------
    function testSubmitMeme_RevertsWhenNotSubmissionOpen() public {
        // default bm.state == UPCOMING
        vm.prank(ALICE);
        vm.expectRevert(bytes("Submissions closed"));
        registry.submitMeme(BATTLE_ID, "ipfs://meme1");
    }

    function testSubmitMeme_SucceedsAndStoresData() public {
        // Enable submissions and allow 2 per user
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 2);

        // Expect event on first submission
        vm.startPrank(ALICE);
        vm.expectEmit(true, true, true, true);
        emit MemeSubmitted(1, BATTLE_ID, ALICE, "ipfs://meme1");
        uint256 id1 = registry.submitMeme(BATTLE_ID, "ipfs://meme1");

        // Second submission ok
        uint256 id2 = registry.submitMeme(BATTLE_ID, "ipfs://meme2");
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);

        // Validate stored struct for id1
        MemeRegistry.Meme memory m1 = registry.getMeme(id1);
        assertEq(m1.id, id1);
        assertEq(m1.battleId, BATTLE_ID);
        assertEq(m1.ipfsHash, "ipfs://meme1");
        assertEq(m1.creator, ALICE);
        assertGt(m1.submittedAt, 0);
        assertEq(m1.totalVoteWeight, 0);

        // Validate battleMemes
        uint256[] memory list = registry.getBattleMemes(BATTLE_ID);
        assertEq(list.length, 2);
        assertEq(list[0], id1);
        assertEq(list[1], id2);
    }

    function testSubmitMeme_EnforcesPerUserLimit() public {
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 1);

        vm.startPrank(ALICE);
        registry.submitMeme(BATTLE_ID, "ipfs://one");
        vm.expectRevert(bytes("User submissions limit"));
        registry.submitMeme(BATTLE_ID, "ipfs://two");
        vm.stopPrank();

        // Another user can still submit their one
        vm.prank(BOB);
        registry.submitMeme(BATTLE_ID, "ipfs://bob-one");

        uint256[] memory list = registry.getBattleMemes(BATTLE_ID);
        assertEq(list.length, 2);
    }

    function testSubmitMeme_UnlimitedWhenZeroLimit() public {
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 0); // unlimited

        vm.startPrank(ALICE);
        for (uint256 i = 0; i < 5; i++) {
            registry.submitMeme(
                BATTLE_ID,
                string(abi.encodePacked("ipfs://", vm.toString(i)))
            );
        }
        vm.stopPrank();

        assertEq(registry.getBattleMemes(BATTLE_ID).length, 5);
    }

    function testSubmitMeme_RevertsOnEmptyIpfsHash() public {
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 5);

        vm.prank(ALICE);
        vm.expectRevert(bytes("Empty ipfsHash"));
        registry.submitMeme(BATTLE_ID, "");
    }

    function testSubmitMeme_RevertsOnTooLongIpfsHash() public {
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 5);

        // Create a string longer than 256 chars
        string memory longHash = "";
        for (uint256 i = 0; i < 26; i++) {
            longHash = string(abi.encodePacked(longHash, "0123456789"));
        }
        // longHash is now 260 chars

        vm.prank(ALICE);
        vm.expectRevert(bytes("ipfsHash too long"));
        registry.submitMeme(BATTLE_ID, longHash);
    }

    // -------------------------------------------------------------------------
    // VotingEngine hooks: onlyVotingEngine + weight math
    // -------------------------------------------------------------------------
    function testIncreaseVoteWeight_RevertsWhenNotVotingEngine() public {
        vm.expectRevert(bytes("Not VotingEngine"));
        registry.increaseVoteWeight(42, 10);
    }

    function testDecreaseVoteWeight_RevertsWhenNotVotingEngine() public {
        vm.expectRevert(bytes("Not VotingEngine"));
        registry.decreaseVoteWeight(42, 10);
    }

    function testIncreaseDecreaseVoteWeight_UpdatesAndEmits() public {
        // set voting engine
        vm.prank(OWNER);
        registry.setVotingEngine(VE);

        // Prepare a submitted meme (not strictly required for weight mutations, but realistic)
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 5);
        vm.prank(ALICE);
        uint256 memeId = registry.submitMeme(BATTLE_ID, "ipfs://meme");

        // increase by VE
        vm.prank(VE);
        vm.expectEmit(true, true, false, true);
        emit MemeVoteWeightUpdated(memeId, 5);
        registry.increaseVoteWeight(memeId, 5);

        MemeRegistry.Meme memory m = registry.getMeme(memeId);
        assertEq(m.totalVoteWeight, 5);

        // decrease by VE
        vm.prank(VE);
        vm.expectEmit(true, true, false, true);
        emit MemeVoteWeightUpdated(memeId, 2);
        registry.decreaseVoteWeight(memeId, 3);

        m = registry.getMeme(memeId);
        assertEq(m.totalVoteWeight, 2);
    }

    function testDecreaseVoteWeight_RevertsOnUnderflow() public {
        vm.prank(OWNER);
        registry.setVotingEngine(VE);

        // Create a meme first
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 5);
        vm.prank(ALICE);
        uint256 memeId = registry.submitMeme(BATTLE_ID, "ipfs://test");

        // Set some weight then try to decrease more than existing
        vm.prank(VE);
        registry.increaseVoteWeight(memeId, 5);

        vm.prank(VE);
        vm.expectRevert(bytes("Underflow"));
        registry.decreaseVoteWeight(memeId, 6);
    }

    function testIncreaseVoteWeight_RevertsOnNonExistentMeme() public {
        vm.prank(OWNER);
        registry.setVotingEngine(VE);

        // Try to increase weight for non-existent meme
        vm.prank(VE);
        vm.expectRevert(bytes("Meme does not exist"));
        registry.increaseVoteWeight(999, 1);
    }

    function testDecreaseVoteWeight_RevertsOnNonExistentMeme() public {
        vm.prank(OWNER);
        registry.setVotingEngine(VE);

        // Try to decrease weight for non-existent meme
        vm.prank(VE);
        vm.expectRevert(bytes("Meme does not exist"));
        registry.decreaseVoteWeight(999, 1);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------
    function testGetBattleMemes_ReturnsIdsInSubmissionOrder() public {
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 10);

        vm.startPrank(ALICE);
        uint256 id1 = registry.submitMeme(BATTLE_ID, "ipfs://a");
        uint256 id2 = registry.submitMeme(BATTLE_ID, "ipfs://b");
        uint256 id3 = registry.submitMeme(BATTLE_ID, "ipfs://c");
        vm.stopPrank();

        uint256[] memory list = registry.getBattleMemes(BATTLE_ID);
        assertEq(list.length, 3);
        assertEq(list[0], id1);
        assertEq(list[1], id2);
        assertEq(list[2], id3);
    }

    function testGetMeme_ReturnsStruct() public {
        bm.setState(IBattleManager.BattleState.SUBMISSION_OPEN);
        bm.setMax(BATTLE_ID, 10);

        vm.prank(ALICE);
        uint256 id = registry.submitMeme(BATTLE_ID, "ipfs://cid123");

        MemeRegistry.Meme memory m = registry.getMeme(id);
        assertEq(m.id, id);
        assertEq(m.battleId, BATTLE_ID);
        assertEq(m.ipfsHash, "ipfs://cid123");
        assertEq(m.creator, ALICE);
        assertGt(m.submittedAt, 0);
        assertEq(m.totalVoteWeight, 0);
    }
}
