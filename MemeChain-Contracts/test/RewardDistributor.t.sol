// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// SUT
import {RewardDistributor, IBattleManagerRD, IVotingEngineRD, IMemeRegistryRD} from "../src/RewardDistributor.sol";
import {WinningMemeNFT} from "../src/WinningMemeNFT.sol";

// -----------------------------------------------------------------------------
// Mock ERC20 (USDC-like: 6 decimals)
// -----------------------------------------------------------------------------
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
        emit Transfer(address(0), to, amt);
    }

    function transfer(address to, uint256 amt) external returns (bool) {
        _transfer(msg.sender, to, amt);
        return true;
    }

    function approve(address spender, uint256 amt) external returns (bool) {
        allowance[msg.sender][spender] = amt;
        emit Approval(msg.sender, spender, amt);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amt
    ) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        require(a >= amt, "allowance");
        allowance[from][msg.sender] = a - amt;
        _transfer(from, to, amt);
        emit Approval(from, msg.sender, allowance[from][msg.sender]);
        return true;
    }

    function _transfer(address from, address to, uint256 amt) internal {
        require(balanceOf[from] >= amt, "balance");
        balanceOf[from] -= amt;
        balanceOf[to] += amt;
        emit Transfer(from, to, amt);
    }

    // IERC20 events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

// -----------------------------------------------------------------------------
// Mocks for interfaces
// -----------------------------------------------------------------------------
contract MockBattleManagerRD is IBattleManagerRD {
    BattleState public _state = BattleState.UPCOMING;

    function setState(BattleState s) external {
        _state = s;
    }

    function getBattleState(uint256) external view returns (BattleState) {
        return _state;
    }
}

contract MockVotingEngineRD is IVotingEngineRD {
    uint256[3] public _ids;
    uint256[3] public _weights;

    function setTop3(
        uint256[3] memory ids,
        uint256[3] memory weights
    ) external {
        _ids = ids;
        _weights = weights;
    }

    function getTop3(
        uint256
    )
        external
        view
        returns (uint256[3] memory topIds, uint256[3] memory weights)
    {
        return (_ids, _weights);
    }
}

contract MockMemeRegistryRD is IMemeRegistryRD {
    struct M {
        uint256 battleId;
        address creator;
        string cid;
        uint64 ts;
        uint256 w;
    }
    mapping(uint256 => M) public data; // memeId => M

    function seed(
        uint256 memeId,
        uint256 battleId,
        address creator,
        string memory cid,
        uint64 ts,
        uint256 totalW
    ) external {
        data[memeId] = M({
            battleId: battleId,
            creator: creator,
            cid: cid,
            ts: ts,
            w: totalW
        });
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
        M memory m = data[memeId];
        return (memeId, m.battleId, m.cid, m.creator, m.ts, m.w);
    }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------
contract RewardDistributorTest is Test {
    MockUSDC usdc;
    MockBattleManagerRD bm;
    MockVotingEngineRD ve;
    MockMemeRegistryRD reg;
    RewardDistributor rd;
    WinningMemeNFT nft;

    address OWNER = makeAddr("owner");
    address SPONSOR = makeAddr("sponsor");
    address CREATOR1 = makeAddr("creator1");
    address CREATOR2 = makeAddr("creator2");
    address CREATOR3 = makeAddr("creator3");

    uint256 constant BATTLE_ID = 1;
    uint256 constant ONE_M = 1_000_000; // 1 USDC with 6 decimals

    event PrizePoolFunded(
        uint256 indexed battleId,
        address indexed from,
        uint256 amount
    );
    event RewardDistributed(
        uint256 indexed battleId,
        address indexed recipient,
        uint256 amount
    );
    event WinnersDeclared(uint256 indexed battleId, uint256[3] memeIds);
    event WinnerNFTMinted(
        uint256 indexed battleId,
        uint256 indexed memeId,
        address indexed to,
        uint256 tokenId
    );

    function setUp() public {
        vm.prank(OWNER);
        usdc = new MockUSDC();

        bm = new MockBattleManagerRD();
        ve = new MockVotingEngineRD();
        reg = new MockMemeRegistryRD();

        vm.prank(OWNER);
        rd = new RewardDistributor(
            address(usdc),
            address(bm),
            address(ve),
            address(reg)
        );
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function testConstructor_RevertOnZeroAddr() public {
        vm.expectRevert(bytes("addr zero"));
        new RewardDistributor(
            address(0),
            address(bm),
            address(ve),
            address(reg)
        );

        vm.expectRevert(bytes("addr zero"));
        new RewardDistributor(
            address(usdc),
            address(0),
            address(ve),
            address(reg)
        );

        vm.expectRevert(bytes("addr zero"));
        new RewardDistributor(
            address(usdc),
            address(bm),
            address(0),
            address(reg)
        );

        vm.expectRevert(bytes("addr zero"));
        new RewardDistributor(
            address(usdc),
            address(bm),
            address(ve),
            address(0)
        );
    }

    // -------------------------------------------------------------------------
    // addToPrizePool
    // -------------------------------------------------------------------------
    function testAddToPrizePool_IncrementsPoolAndTransfers() public {
        uint256 amount = 1_000 * ONE_M; // 1,000 USDC
        usdc.mint(SPONSOR, amount);
        vm.prank(SPONSOR);
        usdc.approve(address(rd), amount);

        vm.expectEmit(true, true, false, true);
        emit PrizePoolFunded(BATTLE_ID, SPONSOR, amount);

        vm.prank(SPONSOR);
        rd.addToPrizePool(BATTLE_ID, amount);

        assertEq(usdc.balanceOf(address(rd)), amount);
        assertEq(rd.prizePool(BATTLE_ID), amount);
    }

    function testAddToPrizePool_RevertsOnZeroAmount() public {
        vm.prank(SPONSOR);
        vm.expectRevert(bytes("Zero amount"));
        rd.addToPrizePool(BATTLE_ID, 0);
    }

    // -------------------------------------------------------------------------
    // distributePrizes
    // -------------------------------------------------------------------------
    function testDistribute_RevertsIfNotBattleManager() public {
        bm.setState(IBattleManagerRD.BattleState.TALLYING);
        vm.expectRevert(bytes("Only BattleManager"));
        rd.distributePrizes(BATTLE_ID);
    }

    function testDistribute_RevertsIfNotTallying() public {
        // fund first
        _fund(500 * ONE_M);
        // call from BM but wrong state
        vm.prank(address(bm));
        vm.expectRevert(bytes("Not tallying"));
        rd.distributePrizes(BATTLE_ID);
    }

    function testDistribute_ZeroPoolEmitsWinnersDeclaredAndReturns() public {
        // no prize funded; set tallying and call from BM
        bm.setState(IBattleManagerRD.BattleState.TALLYING);

        vm.expectEmit(true, false, false, true);
        emit WinnersDeclared(BATTLE_ID, [uint256(0), uint256(0), uint256(0)]);

        vm.prank(address(bm));
        rd.distributePrizes(BATTLE_ID);

        assertEq(rd.prizePool(BATTLE_ID), 0);
        // no RewardDistributed events expected
    }

    function testDistribute_ThreeWinners_50_30_20_split() public {
        _fund(1_000 * ONE_M); // 1000 USDC

        // seed registry creators for memeIds 1,2,3
        reg.seed(
            1,
            BATTLE_ID,
            CREATOR1,
            "ipfs://a",
            uint64(block.timestamp),
            0
        );
        reg.seed(
            2,
            BATTLE_ID,
            CREATOR2,
            "ipfs://b",
            uint64(block.timestamp),
            0
        );
        reg.seed(
            3,
            BATTLE_ID,
            CREATOR3,
            "ipfs://c",
            uint64(block.timestamp),
            0
        );

        // set top3
        ve.setTop3([uint256(1), 2, 3], [uint256(100), 50, 10]);

        bm.setState(IBattleManagerRD.BattleState.TALLYING);

        // Expect winners declared
        vm.expectEmit(true, false, false, true);
        emit WinnersDeclared(BATTLE_ID, [uint256(1), 2, 3]);

        // Expect exact payouts: 500 / 300 / 200 USDC
        vm.expectEmit(true, true, false, true);
        emit RewardDistributed(BATTLE_ID, CREATOR1, 500 * ONE_M);
        vm.expectEmit(true, true, false, true);
        emit RewardDistributed(BATTLE_ID, CREATOR2, 300 * ONE_M);
        vm.expectEmit(true, true, false, true);
        emit RewardDistributed(BATTLE_ID, CREATOR3, 200 * ONE_M);

        vm.prank(address(bm));
        rd.distributePrizes(BATTLE_ID);

        assertEq(usdc.balanceOf(CREATOR1), 500 * ONE_M);
        assertEq(usdc.balanceOf(CREATOR2), 300 * ONE_M);
        assertEq(usdc.balanceOf(CREATOR3), 200 * ONE_M);
        assertEq(rd.prizePool(BATTLE_ID), 0);
    }

    function testDistribute_TwoWinners_Normalized() public {
        _fund(1_000 * ONE_M);

        reg.seed(
            10,
            BATTLE_ID,
            CREATOR1,
            "ipfs://x",
            uint64(block.timestamp),
            0
        );
        reg.seed(
            20,
            BATTLE_ID,
            CREATOR2,
            "ipfs://y",
            uint64(block.timestamp),
            0
        );

        // third has zero weight -> ignored
        ve.setTop3([uint256(10), 20, 30], [uint256(999), 100, 0]);

        bm.setState(IBattleManagerRD.BattleState.TALLYING);

        // Payout basis for 2 winners: 50 and 30 => denom 80
        // -> 1000 * 50 / 80 = 625 ; 1000 * 30 / 80 = 375
        vm.prank(address(bm));
        rd.distributePrizes(BATTLE_ID);

        assertEq(usdc.balanceOf(CREATOR1), 625 * ONE_M);
        assertEq(usdc.balanceOf(CREATOR2), 375 * ONE_M);
        assertEq(usdc.balanceOf(CREATOR3), 0);
        assertEq(rd.prizePool(BATTLE_ID), 0);
    }

    function testDistribute_OneWinner_AllFunds() public {
        _fund(777 * ONE_M); // non-round

        reg.seed(
            5,
            BATTLE_ID,
            CREATOR1,
            "ipfs://z",
            uint64(block.timestamp),
            0
        );
        ve.setTop3([uint256(5), 0, 0], [uint256(10), 0, 0]);

        bm.setState(IBattleManagerRD.BattleState.TALLYING);

        vm.prank(address(bm));
        rd.distributePrizes(BATTLE_ID);

        // denom = 50 -> 777 * 50 / 50 = 777
        assertEq(usdc.balanceOf(CREATOR1), 777 * ONE_M);
        assertEq(rd.prizePool(BATTLE_ID), 0);
    }

    function testDistribute_SkipsZeroIdOrZeroWeight() public {
        _fund(900 * ONE_M);

        // Seed only memeId 42 -> creator1; others zero id or zero weight
        reg.seed(
            42,
            BATTLE_ID,
            CREATOR1,
            "ipfs://only",
            uint64(block.timestamp),
            0
        );
        ve.setTop3([uint256(42), 0, 123], [uint256(1), 0, 0]);

        bm.setState(IBattleManagerRD.BattleState.TALLYING);

        vm.prank(address(bm));
        rd.distributePrizes(BATTLE_ID);

        // Only one valid winner => gets all 900
        assertEq(usdc.balanceOf(CREATOR1), 900 * ONE_M);
        assertEq(usdc.balanceOf(CREATOR2), 0);
        assertEq(usdc.balanceOf(CREATOR3), 0);
        assertEq(rd.prizePool(BATTLE_ID), 0);
    }

    // -------------------------------------------------------------------------
    // NFT minting
    // -------------------------------------------------------------------------
    function testSetWinnerNFT() public {
        vm.prank(OWNER);
        nft = new WinningMemeNFT("Winner Meme", "WMEME", "ipfs://");

        vm.prank(OWNER);
        rd.setWinnerNFT(address(nft));

        assertEq(address(rd.winnerNFT()), address(nft));
    }

    function testSetWinnerNFT_RevertsOnZeroAddress() public {
        vm.prank(OWNER);
        vm.expectRevert(bytes("addr zero"));
        rd.setWinnerNFT(address(0));
    }

    function testSetWinnerNFT_OnlyOwner() public {
        vm.prank(OWNER);
        nft = new WinningMemeNFT("Winner Meme", "WMEME", "ipfs://");

        vm.prank(CREATOR1);
        vm.expectRevert();
        rd.setWinnerNFT(address(nft));
    }

    function testDistribute_MintsNFTsForWinners() public {
        // Setup NFT
        vm.prank(OWNER);
        nft = new WinningMemeNFT("Winner Meme", "WMEME", "ipfs://");

        vm.prank(OWNER);
        nft.setMinter(address(rd));

        vm.prank(OWNER);
        rd.setWinnerNFT(address(nft));

        _fund(1_000 * ONE_M);

        // Seed registry creators for memeIds 1,2,3
        reg.seed(
            1,
            BATTLE_ID,
            CREATOR1,
            "ipfs://a",
            uint64(block.timestamp),
            0
        );
        reg.seed(
            2,
            BATTLE_ID,
            CREATOR2,
            "ipfs://b",
            uint64(block.timestamp),
            0
        );
        reg.seed(
            3,
            BATTLE_ID,
            CREATOR3,
            "ipfs://c",
            uint64(block.timestamp),
            0
        );

        // set top3
        ve.setTop3([uint256(1), 2, 3], [uint256(100), 50, 10]);

        bm.setState(IBattleManagerRD.BattleState.TALLYING);

        // Expect NFTs to be minted
        vm.expectEmit(true, true, true, false);
        emit WinnerNFTMinted(BATTLE_ID, 1, CREATOR1, 1);

        vm.expectEmit(true, true, true, false);
        emit WinnerNFTMinted(BATTLE_ID, 2, CREATOR2, 2);

        vm.expectEmit(true, true, true, false);
        emit WinnerNFTMinted(BATTLE_ID, 3, CREATOR3, 3);

        vm.prank(address(bm));
        rd.distributePrizes(BATTLE_ID);

        // Verify NFTs were minted
        assertEq(nft.ownerOf(1), CREATOR1);
        assertEq(nft.ownerOf(2), CREATOR2);
        assertEq(nft.ownerOf(3), CREATOR3);
        assertEq(nft.nextTokenId(), 3);
    }

    function testDistribute_WorksWithoutNFTSet() public {
        _fund(1_000 * ONE_M);

        reg.seed(
            1,
            BATTLE_ID,
            CREATOR1,
            "ipfs://a",
            uint64(block.timestamp),
            0
        );
        ve.setTop3([uint256(1), 0, 0], [uint256(100), 0, 0]);

        bm.setState(IBattleManagerRD.BattleState.TALLYING);

        // Should not revert even without NFT set
        vm.prank(address(bm));
        rd.distributePrizes(BATTLE_ID);

        assertEq(usdc.balanceOf(CREATOR1), 1_000 * ONE_M);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    function _fund(uint256 amount) internal {
        // sponsor mints & approves to fund prize pool
        usdc.mint(SPONSOR, amount);
        vm.prank(SPONSOR);
        usdc.approve(address(rd), amount);

        vm.expectEmit(true, true, false, true);
        emit PrizePoolFunded(BATTLE_ID, SPONSOR, amount);

        vm.prank(SPONSOR);
        rd.addToPrizePool(BATTLE_ID, amount);

        assertEq(usdc.balanceOf(address(rd)), amount);
        assertEq(rd.prizePool(BATTLE_ID), amount);
    }
}
