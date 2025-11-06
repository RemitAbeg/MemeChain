// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {WinningMemeNFT} from "../src/WinningMemeNFT.sol";

contract WinningMemeNFTTest is Test {
    WinningMemeNFT public nft;

    address public owner;
    address public minter;
    address public creator1;
    address public creator2;
    address public user;

    uint256 constant BATTLE_ID = 1;
    uint256 constant MEME_ID_1 = 10;
    uint256 constant MEME_ID_2 = 20;

    event WinnerNFTMinted(uint256 indexed battleId, uint256 indexed memeId, address indexed to, uint256 tokenId);

    function setUp() public {
        owner = address(this);
        minter = makeAddr("minter");
        creator1 = makeAddr("creator1");
        creator2 = makeAddr("creator2");
        user = makeAddr("user");

        nft = new WinningMemeNFT("Winning Meme", "WMEME", "ipfs://base/");
    }

    // -------------------------------------------------------------------------
    // Constructor tests
    // -------------------------------------------------------------------------
    function testConstructor() public {
        assertEq(nft.name(), "Winning Meme");
        assertEq(nft.symbol(), "WMEME");
        assertEq(nft.baseURI(), "ipfs://base/");
        assertEq(nft.nextTokenId(), 0);
        assertEq(nft.owner(), owner);
    }

    // -------------------------------------------------------------------------
    // setMinter tests
    // -------------------------------------------------------------------------
    function testSetMinter() public {
        nft.setMinter(minter);
        assertEq(nft.minter(), minter);
    }

    function testSetMinter_RevertsOnZeroAddress() public {
        vm.expectRevert(bytes("addr zero"));
        nft.setMinter(address(0));
    }

    function testSetMinter_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        nft.setMinter(minter);
    }

    // -------------------------------------------------------------------------
    // setBaseURI tests
    // -------------------------------------------------------------------------
    function testSetBaseURI() public {
        nft.setBaseURI("https://newbase/");
        assertEq(nft.baseURI(), "https://newbase/");
    }

    function testSetBaseURI_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        nft.setBaseURI("https://newbase/");
    }

    // -------------------------------------------------------------------------
    // mintWinner tests
    // -------------------------------------------------------------------------
    function testMintWinner_ByOwner() public {
        vm.expectEmit(true, true, true, false);
        emit WinnerNFTMinted(BATTLE_ID, MEME_ID_1, creator1, 1);

        uint256 tokenId = nft.mintWinner(creator1, BATTLE_ID, MEME_ID_1, "metadata.json");

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), creator1);
        assertEq(nft.nextTokenId(), 1);
        assertEq(nft.tokenOfMeme(MEME_ID_1), tokenId);
    }

    function testMintWinner_ByMinter() public {
        nft.setMinter(minter);

        vm.expectEmit(true, true, true, false);
        emit WinnerNFTMinted(BATTLE_ID, MEME_ID_1, creator1, 1);

        vm.prank(minter);
        uint256 tokenId = nft.mintWinner(creator1, BATTLE_ID, MEME_ID_1, "metadata.json");

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), creator1);
        assertEq(nft.nextTokenId(), 1);
    }

    function testMintWinner_NotAuthorized() public {
        vm.prank(user);
        vm.expectRevert(bytes("Not authorized"));
        nft.mintWinner(creator1, BATTLE_ID, MEME_ID_1, "metadata.json");
    }

    function testMintWinner_Multiple() public {
        nft.setMinter(minter);

        vm.startPrank(minter);
        uint256 token1 = nft.mintWinner(creator1, BATTLE_ID, MEME_ID_1, "");
        uint256 token2 = nft.mintWinner(creator2, BATTLE_ID, MEME_ID_2, "");
        vm.stopPrank();

        assertEq(token1, 1);
        assertEq(token2, 2);
        assertEq(nft.ownerOf(1), creator1);
        assertEq(nft.ownerOf(2), creator2);
        assertEq(nft.nextTokenId(), 2);
        assertEq(nft.tokenOfMeme(MEME_ID_1), token1);
        assertEq(nft.tokenOfMeme(MEME_ID_2), token2);
    }

    function testMintWinner_EmptyMetadataCID() public {
        // Should work fine with empty metadata CID (for MVP)
        uint256 tokenId = nft.mintWinner(creator1, BATTLE_ID, MEME_ID_1, "");
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), creator1);
    }

    // -------------------------------------------------------------------------
    // Token tracking tests
    // -------------------------------------------------------------------------
    function testTokenOfMeme_MultipleTokens() public {
        nft.setMinter(minter);

        vm.startPrank(minter);
        nft.mintWinner(creator1, 1, 10, "");
        nft.mintWinner(creator2, 1, 20, "");
        nft.mintWinner(creator1, 2, 30, "");
        vm.stopPrank();

        assertEq(nft.tokenOfMeme(10), 1);
        assertEq(nft.tokenOfMeme(20), 2);
        assertEq(nft.tokenOfMeme(30), 3);
    }

    // -------------------------------------------------------------------------
    // Ownership transfer tests
    // -------------------------------------------------------------------------
    function testTransferNFT() public {
        nft.setMinter(minter);

        vm.prank(minter);
        uint256 tokenId = nft.mintWinner(creator1, BATTLE_ID, MEME_ID_1, "");

        // Creator can transfer their NFT
        vm.prank(creator1);
        nft.transferFrom(creator1, creator2, tokenId);

        assertEq(nft.ownerOf(tokenId), creator2);
    }

    // -------------------------------------------------------------------------
    // Integration test
    // -------------------------------------------------------------------------
    function testFullFlow() public {
        // Simulate RewardDistributor scenario
        address rewardDistributor = makeAddr("rewardDistributor");
        nft.setMinter(rewardDistributor);

        // Mint NFTs for 3 winners
        vm.startPrank(rewardDistributor);
        nft.mintWinner(creator1, 1, 101, "ipfs://winner1.json");
        nft.mintWinner(creator2, 1, 102, "ipfs://winner2.json");
        nft.mintWinner(creator1, 1, 103, "ipfs://winner3.json");
        vm.stopPrank();

        // Verify all mints
        assertEq(nft.balanceOf(creator1), 2); // creator1 won twice
        assertEq(nft.balanceOf(creator2), 1);
        assertEq(nft.nextTokenId(), 3);

        // Verify token mappings
        assertEq(nft.tokenOfMeme(101), 1);
        assertEq(nft.tokenOfMeme(102), 2);
        assertEq(nft.tokenOfMeme(103), 3);

        // Verify ownership
        assertEq(nft.ownerOf(1), creator1);
        assertEq(nft.ownerOf(2), creator2);
        assertEq(nft.ownerOf(3), creator1);
    }
}

