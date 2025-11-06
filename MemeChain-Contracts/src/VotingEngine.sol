// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBattleManagerVE {
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

    function minStakeForVoting(
        uint256 battleId
    ) external view returns (uint256);

    function startVotingPhase(uint256 battleId) external;
}

interface IMemeRegistryVE {
    function increaseVoteWeight(uint256 memeId, uint256 amount) external;

    function decreaseVoteWeight(uint256 memeId, uint256 amount) external;

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
        );
}

contract VotingEngine is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct VoteInfo {
        uint256 memeId;
        uint256 amount; // staked USDC
        bool exists;
    }

    IERC20 public immutable USDC;
    IBattleManagerVE public battleManager;
    IMemeRegistryVE public memeRegistry;
    address public battleManagerAddr;

    // battleId => voter => VoteInfo
    mapping(uint256 => mapping(address => VoteInfo)) public votes;
    // battleId => whether withdrawals are enabled
    mapping(uint256 => bool) public withdrawalsEnabled;

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

    modifier onlyBM() {
        require(msg.sender == battleManagerAddr, "only BM");
        _;
    }

    constructor(address usdc, address _battleManager, address _memeRegistry) {
        require(
            usdc != address(0) &&
                _battleManager != address(0) &&
                _memeRegistry != address(0),
            "addr zero"
        );
        USDC = IERC20(usdc);
        battleManager = IBattleManagerVE(_battleManager);
        memeRegistry = IMemeRegistryVE(_memeRegistry);
        battleManagerAddr = _battleManager;
    }

    function setBattleManager(address a) external {
        require(
            battleManagerAddr == address(0) || msg.sender == battleManagerAddr,
            "Unauthorized"
        );
        require(a != address(0), "addr zero");
        battleManagerAddr = a;
    }

    // user sets (or changes) the staked amount backing their vote on a meme
    function vote(
        uint256 battleId,
        uint256 memeId,
        uint256 newAmount
    ) external nonReentrant {
        require(
            battleManager.getBattleState(battleId) ==
                IBattleManagerVE.BattleState.VOTING_OPEN,
            "Voting closed"
        );
        require(memeId != 0, "Invalid meme ID");
        (, uint256 mBattleId, , , , ) = memeRegistry.getMeme(memeId);
        require(mBattleId == battleId, "Meme not in battle");

        uint256 minStake = battleManager.minStakeForVoting(battleId);
        require(newAmount >= minStake, "Below min stake");

        VoteInfo storage v = votes[battleId][msg.sender];

        // Adjust aggregate weights
        if (v.exists) {
            // move weight from old meme to new when memeId changes
            if (v.memeId != memeId) {
                memeRegistry.decreaseVoteWeight(v.memeId, v.amount);
                memeRegistry.increaseVoteWeight(memeId, newAmount);
            } else {
                // same meme, adjust delta only
                if (newAmount > v.amount) {
                    memeRegistry.increaseVoteWeight(
                        memeId,
                        newAmount - v.amount
                    );
                } else if (newAmount < v.amount) {
                    memeRegistry.decreaseVoteWeight(
                        memeId,
                        v.amount - newAmount
                    );
                }
            }
        } else {
            memeRegistry.increaseVoteWeight(memeId, newAmount);
        }

        // Handle funds: pull in or refund deltas
        if (newAmount > v.amount) {
            USDC.safeTransferFrom(
                msg.sender,
                address(this),
                newAmount - v.amount
            );
        } else if (newAmount < v.amount) {
            USDC.safeTransfer(msg.sender, v.amount - newAmount);
        }

        v.memeId = memeId;
        v.amount = newAmount;
        v.exists = true;

        emit VoteCast(battleId, memeId, msg.sender, newAmount);
    }

    // called by BattleManager during finalization
    function enableWithdrawalsFromBM(uint256 battleId) external onlyBM {
        withdrawalsEnabled[battleId] = true;
        emit WithdrawalsEnabled(battleId);
    }

    // called by BattleManager indirectly (once voting period is over and finalized)
    function enableWithdrawals(uint256 battleId) external {
        // Anyone can enable withdrawals after the battle has moved past VOTING_OPEN.
        IBattleManagerVE.BattleState st = battleManager.getBattleState(
            battleId
        );
        require(
            st == IBattleManagerVE.BattleState.TALLYING ||
                st == IBattleManagerVE.BattleState.FINALIZED ||
                st == IBattleManagerVE.BattleState.ARCHIVED,
            "Too early"
        );
        withdrawalsEnabled[battleId] = true;
        emit WithdrawalsEnabled(battleId);
    }

    // user withdraws staked USDC (after voting window)
    function withdraw(uint256 battleId) external nonReentrant {
        require(withdrawalsEnabled[battleId], "Withdrawals disabled");
        VoteInfo storage v = votes[battleId][msg.sender];
        uint256 amt = v.amount;
        require(amt > 0, "Nothing to withdraw");
        v.amount = 0;
        USDC.safeTransfer(msg.sender, amt);
        emit Withdrawn(battleId, msg.sender, amt);
    }

    // utility: compute top 3 memeIds for a battle by scanning registry (MVP-friendly)
    // includes tie-breaker: earliest submission wins
    function getTop3(
        uint256 battleId
    )
        public
        view
        returns (uint256[3] memory topIds, uint256[3] memory weights)
    {
        // Pull all memes for the battle from the registry
        (bool ok, bytes memory data) = address(memeRegistry).staticcall(
            abi.encodeWithSignature("getBattleMemes(uint256)", battleId)
        );
        require(ok, "Registry call failed");
        uint256[] memory ids = abi.decode(data, (uint256[]));

        uint64[3] memory times; // submittedAt for tie-break

        for (uint256 i = 0; i < ids.length; i++) {
            (, , , , uint64 submittedAt, uint256 w) = memeRegistry.getMeme(
                ids[i]
            );

            // insert by weight desc, then submittedAt asc (tie-breaker)
            for (uint256 k = 0; k < 3; k++) {
                if (
                    w > weights[k] ||
                    (w == weights[k] && submittedAt < times[k])
                ) {
                    // shift down
                    for (uint256 s = 2; s > k; s--) {
                        weights[s] = weights[s - 1];
                        topIds[s] = topIds[s - 1];
                        times[s] = times[s - 1];
                    }
                    weights[k] = w;
                    topIds[k] = ids[i];
                    times[k] = submittedAt;
                    break;
                }
            }
        }
    }

    // View helper
    function isVotingEnded(uint256 battleId) external view returns (bool) {
        IBattleManagerVE.BattleState st = battleManager.getBattleState(
            battleId
        );
        return (st != IBattleManagerVE.BattleState.VOTING_OPEN &&
            st != IBattleManagerVE.BattleState.SUBMISSION_OPEN);
    }
}
