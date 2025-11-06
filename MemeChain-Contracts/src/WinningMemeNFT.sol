// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WinningMemeNFT is ERC721, Ownable {
    uint256 public nextTokenId;
    string public baseURI; // e.g., "ipfs://"
    address public minter; // RewardDistributor address

    // memeId => tokenId (optional mapping for reference)
    mapping(uint256 => uint256) public tokenOfMeme;

    event WinnerNFTMinted(
        uint256 indexed battleId,
        uint256 indexed memeId,
        address indexed to,
        uint256 tokenId
    );

    modifier onlyMinter() {
        require(
            msg.sender == minter || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory uri
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        baseURI = uri;
    }

    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "addr zero");
        minter = _minter;
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function mintWinner(
        address to,
        uint256 battleId,
        uint256 memeId,
        string calldata metadataCID
    ) external onlyMinter returns (uint256 tokenId) {
        tokenId = ++nextTokenId;
        _mint(to, tokenId);
        tokenOfMeme[memeId] = tokenId;
        emit WinnerNFTMinted(battleId, memeId, to, tokenId);

        // OPTIONAL: if you want fully on-chain tokenURI pointer:
        // store per-token CID mapping and override tokenURI(tokenId).
        // For MVP, you can set baseURI="ipfs://" and pass "CID/json"
        // or just "CID" and compose off-chain.
    }
}
