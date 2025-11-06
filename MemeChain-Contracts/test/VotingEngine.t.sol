// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VotingEngine, IBattleManagerVE, IMemeRegistryVE} from "../src/VotingEngine.sol";

// Mock ERC20 (USDC-like: 6 decimals)
contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "mUSDC";
    uint8 public decimals = 6;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amt) external {
        totalSupply += amt;
        balanceOf[to] += amt;
    }

    function transfer(address to, uint256 amt) external returns (bool) {
        balanceOf[msg.sender] -= amt;
        balanceOf[to] += amt;
        return true;
    }

    function approve(address spender, uint256 amt) external returns (bool) {
        allowance[msg.sender][spender] = amt;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amt
    ) external returns (bool) {
        require(allowance[from][msg.sender] >= amt, "allowance");
        require(balanceOf[from] >= amt, "balance");
        allowance[from][msg.sender] -= amt;
        balanceOf[from] -= amt;
        balanceOf[to] += amt;
        return true;
    }
}

// Mocks
contract MockBattleManagerVE is IBattleManagerVE {
    BattleState public _state = BattleState.UPCOMING;
    uint256 public _minStake = 10e6;

    function setState(BattleState s) external {
        _state = s;
    }

    function setMinStake(uint256 m) external {
        _minStake = m;
    }

    function getBattleState(uint256) external view returns (BattleState) {
        return _state;
    }

    function minStakeForVoting(uint256) external view returns (uint256) {
        return _minStake;
    }

    function startVotingPhase(uint256) external pure {}
}

contract MockMemeRegistryVE is IMemeRegistryVE {
    struct MemeData {
        uint256 battleId;
        address creator;
        uint64 submittedAt;
        uint256 totalVoteWeight;
    }

    mapping(uint256 => MemeData) public memes;
    mapping(uint256 => uint256[]) public battleMemes;

    function seed(
        uint256 memeId,
        uint256 battleId,
        address creator,
        uint64 submittedAt
    ) external {
        memes[memeId] = MemeData({
            battleId: battleId,
            creator: creator,
            submittedAt: submittedAt,
            totalVoteWeight: 0
        });
        battleMemes[battleId].push(memeId);
    }

    function increaseVoteWeight(uint256 memeId, uint256 amount) external {
        memes[memeId].totalVoteWeight += amount;
    }

    function decreaseVoteWeight(uint256 memeId, uint256 amount) external {
        memes[memeId].totalVoteWeight -= amount;
    }

    function getMeme(
        uint256 memeId
    )
        external
        view
        returns (
            uint256 id,
            uint256 battleId,
            string memory ipfsHash,
            address creator,
            uint64 submittedAt,
            uint256 totalVoteWeight
        )
    {
        MemeData memory m = memes[memeId];
        return (
            memeId,
            m.battleId,
            "",
            m.creator,
            m.submittedAt,
            m.totalVoteWeight
        );
    }

    function getBattleMemes(
        uint256 battleId
    ) external view returns (uint256[] memory) {
        return battleMemes[battleId];
    }
}

contract VotingEngineTest is Test {
    VotingEngine public ve;
    MockUSDC public usdc;
    MockBattleManagerVE public bm;
    MockMemeRegistryVE public reg;

    address public owner;
    address public voter1;
    address public voter2;

    uint256 constant BATTLE_ID = 1;
    uint256 constant ONE_M = 1_000_000; // 1 USDC with 6 decimals

    event VoteCast(
        uint256 indexed battleId,
        uint256 indexed memeId,
        address indexed voter,
        uint256 amount
    );
    event Withdrawn(
        uint256 indexed battleId,
        address indexed voter,
        uint256 amount
    );
    event WithdrawalsEnabled(uint256 indexed battleId);

    function setUp() public {
        owner = address(this);
        voter1 = makeAddr("voter1");
        voter2 = makeAddr("voter2");

        usdc = new MockUSDC();
        bm = new MockBattleManagerVE();
        reg = new MockMemeRegistryVE();

        ve = new VotingEngine(address(usdc), address(bm), address(reg));
    }

    // -------------------------------------------------------------------------
    // Vote tests
    // -------------------------------------------------------------------------
    function testVote_RevertsOnInvalidMemeId() public {
        bm.setState(IBattleManagerVE.BattleState.VOTING_OPEN);

        vm.expectRevert(bytes("Invalid meme ID"));
        ve.vote(BATTLE_ID, 0, 100 * ONE_M);
    }

    function testVote_RevertsOnWrongBattle() public {
        // Seed meme in battle 1
        reg.seed(1, BATTLE_ID, owner, uint64(block.timestamp));
        bm.setState(IBattleManagerVE.BattleState.VOTING_OPEN);

        // Try to vote for it in battle 2
        vm.expectRevert(bytes("Meme not in battle"));
        ve.vote(2, 1, 100 * ONE_M);
    }

    function testVote_Success() public {
        reg.seed(1, BATTLE_ID, owner, uint64(block.timestamp));
        bm.setState(IBattleManagerVE.BattleState.VOTING_OPEN);

        usdc.mint(voter1, 100 * ONE_M);
        vm.startPrank(voter1);
        usdc.approve(address(ve), 100 * ONE_M);

        vm.expectEmit(true, true, true, true);
        emit VoteCast(BATTLE_ID, 1, voter1, 100 * ONE_M);

        ve.vote(BATTLE_ID, 1, 100 * ONE_M);
        vm.stopPrank();

        (uint256 memeId, uint256 amount, bool exists) = ve.votes(
            BATTLE_ID,
            voter1
        );
        assertEq(memeId, 1);
        assertEq(amount, 100 * ONE_M);
        assertTrue(exists);
    }

    // -------------------------------------------------------------------------
    // Withdrawals
    // -------------------------------------------------------------------------
    function testEnableWithdrawalsFromBM() public {
        // Only BM can call this
        vm.expectEmit(true, false, false, false);
        emit WithdrawalsEnabled(BATTLE_ID);

        vm.prank(address(bm));
        ve.enableWithdrawalsFromBM(BATTLE_ID);

        assertTrue(ve.withdrawalsEnabled(BATTLE_ID));
    }

    function testEnableWithdrawalsFromBM_OnlyBM() public {
        vm.expectRevert(bytes("only BM"));
        ve.enableWithdrawalsFromBM(BATTLE_ID);
    }

    function testWithdraw_AfterBMEnables() public {
        // Setup: voter casts vote
        reg.seed(1, BATTLE_ID, owner, uint64(block.timestamp));
        bm.setState(IBattleManagerVE.BattleState.VOTING_OPEN);

        usdc.mint(voter1, 100 * ONE_M);
        vm.startPrank(voter1);
        usdc.approve(address(ve), 100 * ONE_M);
        ve.vote(BATTLE_ID, 1, 100 * ONE_M);
        vm.stopPrank();

        // BM enables withdrawals
        vm.prank(address(bm));
        ve.enableWithdrawalsFromBM(BATTLE_ID);

        // Voter can withdraw
        vm.expectEmit(true, true, false, true);
        emit Withdrawn(BATTLE_ID, voter1, 100 * ONE_M);

        vm.prank(voter1);
        ve.withdraw(BATTLE_ID);

        assertEq(usdc.balanceOf(voter1), 100 * ONE_M);
    }

    // -------------------------------------------------------------------------
    // getTop3 with tie-breaker
    // -------------------------------------------------------------------------
    function testGetTop3_TieBreakerEarliestWins() public {
        uint64 currentTime = uint64(block.timestamp);

        // Meme 1: weight 100, submitted at currentTime
        // Meme 2: weight 100, submitted at currentTime + 10 (later)
        // Meme 3: weight 50
        reg.seed(1, BATTLE_ID, owner, currentTime);
        reg.seed(2, BATTLE_ID, voter1, currentTime + 10);
        reg.seed(3, BATTLE_ID, voter2, currentTime + 20);

        vm.startPrank(address(ve));
        reg.increaseVoteWeight(1, 100);
        reg.increaseVoteWeight(2, 100);
        reg.increaseVoteWeight(3, 50);
        vm.stopPrank();

        (uint256[3] memory topIds, uint256[3] memory weights) = ve.getTop3(
            BATTLE_ID
        );

        // Both meme 1 and 2 have weight 100, but meme 1 was submitted earlier
        // So expected order: 1 (100, earlier), 2 (100, later), 3 (50)
        assertEq(topIds[0], 1);
        assertEq(topIds[1], 2);
        assertEq(topIds[2], 3);
        assertEq(weights[0], 100);
        assertEq(weights[1], 100);
        assertEq(weights[2], 50);
    }

    function testGetTop3_ByWeightDescending() public {
        uint64 currentTime = uint64(block.timestamp);

        reg.seed(1, BATTLE_ID, owner, currentTime);
        reg.seed(2, BATTLE_ID, voter1, currentTime);
        reg.seed(3, BATTLE_ID, voter2, currentTime);

        vm.startPrank(address(ve));
        reg.increaseVoteWeight(1, 50);
        reg.increaseVoteWeight(2, 200);
        reg.increaseVoteWeight(3, 100);
        vm.stopPrank();

        (uint256[3] memory topIds, uint256[3] memory weights) = ve.getTop3(
            BATTLE_ID
        );

        assertEq(topIds[0], 2); // 200
        assertEq(topIds[1], 3); // 100
        assertEq(topIds[2], 1); // 50
    }

    function testGetTop3_ComplexTieBreaker() public {
        uint64 currentTime = uint64(block.timestamp);

        // Create 5 memes with various weights and times
        reg.seed(1, BATTLE_ID, owner, currentTime); // weight 100, time currentTime
        reg.seed(2, BATTLE_ID, voter1, currentTime + 5); // weight 100, time currentTime+5
        reg.seed(3, BATTLE_ID, voter2, currentTime + 10); // weight 100, time currentTime+10
        reg.seed(4, BATTLE_ID, owner, currentTime + 2); // weight 50
        reg.seed(5, BATTLE_ID, voter1, currentTime + 1); // weight 150

        vm.startPrank(address(ve));
        reg.increaseVoteWeight(1, 100);
        reg.increaseVoteWeight(2, 100);
        reg.increaseVoteWeight(3, 100);
        reg.increaseVoteWeight(4, 50);
        reg.increaseVoteWeight(5, 150);
        vm.stopPrank();

        (uint256[3] memory topIds, uint256[3] memory weights) = ve.getTop3(
            BATTLE_ID
        );

        // Expected: 5 (150), 1 (100, earliest), 2 (100, middle)
        assertEq(topIds[0], 5);
        assertEq(weights[0], 150);
        assertEq(topIds[1], 1);
        assertEq(weights[1], 100);
        assertEq(topIds[2], 2);
        assertEq(weights[2], 100);
    }

    // -------------------------------------------------------------------------
    // BattleManager address management
    // -------------------------------------------------------------------------
    function testSetBattleManager() public {
        address newBM = makeAddr("newBM");

        // Only current BM can change to new BM
        vm.prank(address(bm));
        ve.setBattleManager(newBM);
        assertEq(ve.battleManagerAddr(), newBM);
    }

    function testSetBattleManager_OnlyAuthorized() public {
        vm.prank(voter1);
        vm.expectRevert(bytes("Unauthorized"));
        ve.setBattleManager(makeAddr("newBM"));
    }
}
