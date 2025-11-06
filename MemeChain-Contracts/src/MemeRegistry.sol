// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IBattleManager {
    enum BattleState {
        UPCOMING,
        SUBMISSION_OPEN,
        VOTING_OPEN,
        TALLYING,
        FINALIZED,
        ARCHIVED
    }

    function getBattleState(
        uint256 battleId
    ) external view returns (BattleState);

    function maxSubmissionsPerUser(
        uint256 battleId
    ) external view returns (uint256);
}

contract MemeRegistry is Ownable {
    struct Meme {
        uint256 id;
        uint256 battleId;
        string ipfsHash; // CID (e.g., "ipfs://...") per PRD
        address creator;
        uint64 submittedAt;
        uint256 totalVoteWeight; // maintained by VotingEngine
    }

    IBattleManager public battleManager;
    address public votingEngine; // allowed to mutate vote weights

    uint256 private _memeCounter;
    mapping(uint256 => Meme) public memes; // memeId => Meme
    mapping(uint256 => uint256[]) public battleMemes; // battleId => memeIds
    mapping(uint256 => mapping(address => uint256)) public submissionsPerUser; // battleId => (user => count)

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

    modifier onlyVotingEngine() {
        require(msg.sender == votingEngine, "Not VotingEngine");
        _;
    }

    constructor(address _battleManager) Ownable(msg.sender) {
        require(_battleManager != address(0), "BM addr zero");
        battleManager = IBattleManager(_battleManager);
    }

    function setVotingEngine(address _votingEngine) external onlyOwner {
        require(_votingEngine != address(0), "VE addr zero");
        votingEngine = _votingEngine;
    }

    function submitMeme(
        uint256 battleId,
        string calldata ipfsHash
    ) external returns (uint256 memeId) {
        require(
            battleManager.getBattleState(battleId) ==
                IBattleManager.BattleState.SUBMISSION_OPEN,
            "Submissions closed"
        );
        require(bytes(ipfsHash).length > 0, "Empty ipfsHash");
        require(bytes(ipfsHash).length < 256, "ipfsHash too long"); // prevent griefing
        uint256 maxPerUser = battleManager.maxSubmissionsPerUser(battleId);
        require(
            maxPerUser == 0 ||
                submissionsPerUser[battleId][msg.sender] < maxPerUser,
            "User submissions limit"
        );

        memeId = ++_memeCounter;
        memes[memeId] = Meme({
            id: memeId,
            battleId: battleId,
            ipfsHash: ipfsHash,
            creator: msg.sender,
            submittedAt: uint64(block.timestamp),
            totalVoteWeight: 0
        });
        battleMemes[battleId].push(memeId);
        submissionsPerUser[battleId][msg.sender] += 1;

        emit MemeSubmitted(memeId, battleId, msg.sender, ipfsHash);
    }

    // --- VotingEngine hooks ---

    function increaseVoteWeight(
        uint256 memeId,
        uint256 amount
    ) external onlyVotingEngine {
        require(memes[memeId].id != 0, "Meme does not exist");
        memes[memeId].totalVoteWeight += amount;
        emit MemeVoteWeightUpdated(memeId, memes[memeId].totalVoteWeight);
    }

    function decreaseVoteWeight(
        uint256 memeId,
        uint256 amount
    ) external onlyVotingEngine {
        require(memes[memeId].id != 0, "Meme does not exist");
        uint256 current = memes[memeId].totalVoteWeight;
        require(current >= amount, "Underflow");
        memes[memeId].totalVoteWeight = current - amount;
        emit MemeVoteWeightUpdated(memeId, memes[memeId].totalVoteWeight);
    }

    // Helpers
    function getBattleMemes(
        uint256 battleId
    ) external view returns (uint256[] memory) {
        return battleMemes[battleId];
    }

    function getMeme(uint256 memeId) external view returns (Meme memory) {
        return memes[memeId];
    }
}
