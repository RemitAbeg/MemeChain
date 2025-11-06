// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IMemeRegistry {
    function getBattleMemes(
        uint256 battleId
    ) external view returns (uint256[] memory);
}

interface IVotingEngine {
    function isVotingEnded(uint256 battleId) external view returns (bool);

    function enableWithdrawalsFromBM(uint256 battleId) external;
}

interface IRewardDistributor {
    function distributePrizes(uint256 battleId) external;

    function addToPrizePool(uint256 battleId, uint256 amount) external;
}

contract BattleManager is Ownable, Pausable {
    enum BattleState {
        UPCOMING,
        SUBMISSION_OPEN,
        VOTING_OPEN,
        TALLYING,
        FINALIZED,
        ARCHIVED
    }

    struct Battle {
        uint256 id;
        string theme;
        uint64 submissionStart;
        uint64 submissionEnd;
        uint64 votingEnd;
        uint256 minStake; // min stake to vote (anti-dust)
        uint256 maxSubmissionsPerUser; // 0 = unlimited
        BattleState state;
    }

    mapping(uint256 => Battle) public battles;
    uint256 public battleCounter;

    IMemeRegistry public memeRegistry;
    IVotingEngine public votingEngine;
    IRewardDistributor public rewardDistributor;

    event BattleCreated(
        uint256 indexed battleId,
        string theme,
        uint256 submissionEnd,
        uint256 votingEnd
    );
    event BattleStateChanged(uint256 indexed battleId, BattleState newState);
    event BattleArchived(uint256 indexed battleId);

    constructor() Ownable(msg.sender) {}

    function setModules(
        address _memeRegistry,
        address _votingEngine,
        address _rewardDistributor
    ) external onlyOwner {
        require(
            _memeRegistry != address(0) &&
                _votingEngine != address(0) &&
                _rewardDistributor != address(0),
            "addr zero"
        );
        memeRegistry = IMemeRegistry(_memeRegistry);
        votingEngine = IVotingEngine(_votingEngine);
        rewardDistributor = IRewardDistributor(_rewardDistributor);
    }

    function createBattle(
        string calldata theme,
        uint64 submissionStart,
        uint64 submissionEnd,
        uint64 votingEnd,
        uint256 minStake,
        uint256 _maxSubmissionsPerUser // Added underscore prefix
    ) external onlyOwner whenNotPaused returns (uint256 battleId) {
        require(bytes(theme).length > 0, "empty theme");
        require(
            submissionStart < submissionEnd && submissionEnd < votingEnd,
            "Bad times"
        );
        battleId = ++battleCounter;
        battles[battleId] = Battle({
            id: battleId,
            theme: theme,
            submissionStart: submissionStart,
            submissionEnd: submissionEnd,
            votingEnd: votingEnd,
            minStake: minStake,
            maxSubmissionsPerUser: _maxSubmissionsPerUser, // Use the renamed parameter
            state: BattleState.UPCOMING
        });
        emit BattleCreated(battleId, theme, submissionEnd, votingEnd);
    }

    // Manual phase transitions (simple + explicit for MVP)
    function startSubmissionPhase(
        uint256 battleId
    ) external onlyOwner whenNotPaused {
        Battle storage b = battles[battleId];
        require(b.id != 0, "battle not found");
        require(b.state == BattleState.UPCOMING, "Wrong state");
        require(block.timestamp >= b.submissionStart, "Too early");
        b.state = BattleState.SUBMISSION_OPEN;
        emit BattleStateChanged(battleId, b.state);
    }

    function startVotingPhase(
        uint256 battleId
    ) external onlyOwner whenNotPaused {
        Battle storage b = battles[battleId];
        require(b.id != 0, "battle not found");
        require(b.state == BattleState.SUBMISSION_OPEN, "Wrong state");
        require(block.timestamp >= b.submissionEnd, "Too early");
        b.state = BattleState.VOTING_OPEN;
        emit BattleStateChanged(battleId, b.state);
    }

    function finalizeBattle(uint256 battleId) external onlyOwner whenNotPaused {
        Battle storage b = battles[battleId];
        require(b.id != 0, "battle not found");
        require(b.state == BattleState.VOTING_OPEN, "Wrong state");
        require(block.timestamp >= b.votingEnd, "Voting not ended");
        b.state = BattleState.TALLYING;
        emit BattleStateChanged(battleId, b.state);

        // Trigger prize distribution (also computes winners via VotingEngine)
        rewardDistributor.distributePrizes(battleId);

        // Let voters unstake immediately
        votingEngine.enableWithdrawalsFromBM(battleId);

        b.state = BattleState.FINALIZED;
        emit BattleStateChanged(battleId, b.state);
    }

    function archiveBattle(uint256 battleId) external onlyOwner {
        Battle storage b = battles[battleId];
        require(b.id != 0, "battle not found");
        require(b.state == BattleState.FINALIZED, "Not finalized");
        b.state = BattleState.ARCHIVED;
        emit BattleStateChanged(battleId, b.state);
        emit BattleArchived(battleId);
    }

    // Emergency pause/unpause functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Exposed params used by other modules
    function getBattleState(
        uint256 battleId
    ) external view returns (BattleState) {
        return battles[battleId].state;
    }

    function maxSubmissionsPerUser(
        uint256 battleId
    ) external view returns (uint256) {
        return battles[battleId].maxSubmissionsPerUser;
    }

    function minStakeForVoting(
        uint256 battleId
    ) external view returns (uint256) {
        return battles[battleId].minStake;
    }
}
