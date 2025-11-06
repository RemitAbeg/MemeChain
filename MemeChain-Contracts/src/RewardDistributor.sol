// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBattleManagerRD {
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
}

interface IVotingEngineRD {
    function getTop3(
        uint256 battleId
    )
        external
        view
        returns (uint256[3] memory topIds, uint256[3] memory weights);
}

interface IMemeRegistryRD {
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

interface IWinningMemeNFT {
    function mintWinner(
        address to,
        uint256 battleId,
        uint256 memeId,
        string calldata metadataCID
    ) external returns (uint256);
}

contract RewardDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;
    IBattleManagerRD public battleManager;
    IVotingEngineRD public votingEngine;
    IMemeRegistryRD public memeRegistry;
    IWinningMemeNFT public winnerNFT;

    mapping(uint256 => uint256) public prizePool; // battleId => USDC amount

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

    constructor(
        address usdc,
        address _battleManager,
        address _votingEngine,
        address _memeRegistry
    ) Ownable(msg.sender) {
        require(
            usdc != address(0) &&
                _battleManager != address(0) &&
                _votingEngine != address(0) &&
                _memeRegistry != address(0),
            "addr zero"
        );
        USDC = IERC20(usdc);
        battleManager = IBattleManagerRD(_battleManager);
        votingEngine = IVotingEngineRD(_votingEngine);
        memeRegistry = IMemeRegistryRD(_memeRegistry);
    }

    function setWinnerNFT(address _nft) external onlyOwner {
        require(_nft != address(0), "addr zero");
        winnerNFT = IWinningMemeNFT(_nft);
    }

    // anyone can fund the prize pool for a battle (sponsors, community, admin)
    function addToPrizePool(
        uint256 battleId,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "Zero amount");
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        prizePool[battleId] += amount;
        emit PrizePoolFunded(battleId, msg.sender, amount);
    }

    // invoked by BattleManager during finalize stage
    function distributePrizes(uint256 battleId) external nonReentrant {
        require(msg.sender == address(battleManager), "Only BattleManager");
        IBattleManagerRD.BattleState st = battleManager.getBattleState(
            battleId
        );
        require(st == IBattleManagerRD.BattleState.TALLYING, "Not tallying");

        uint256 pool = prizePool[battleId];
        if (pool == 0) {
            emit WinnersDeclared(
                battleId,
                [uint256(0), uint256(0), uint256(0)]
            );
            return;
        }

        (uint256[3] memory ids, uint256[3] memory weights) = votingEngine
            .getTop3(battleId);
        emit WinnersDeclared(battleId, ids);

        // Determine actual winners list (ignore zero-weight entries)
        address[3] memory recipients;
        uint256 winnerCount = 0;

        for (uint256 i = 0; i < 3; i++) {
            if (ids[i] == 0 || weights[i] == 0) continue;
            (, , , address creator, , ) = memeRegistry.getMeme(ids[i]);
            recipients[winnerCount] = creator;
            winnerCount++;
        }

        // Payout scheme: 50/30/20 for 1/2/3 winners; if fewer winners, normalize
        uint256[3] memory basis = [uint256(50), uint256(30), uint256(20)];
        uint256 denom = 0;
        for (uint256 i = 0; i < winnerCount; i++) denom += basis[i];
        if (denom == 0) return; // no winners

        for (uint256 i = 0; i < winnerCount; i++) {
            uint256 amount = (pool * basis[i]) / denom;
            if (amount > 0) {
                USDC.safeTransfer(recipients[i], amount);
                emit RewardDistributed(battleId, recipients[i], amount);
            }
        }

        // Mint NFTs for winners (if NFT is set)
        if (address(winnerNFT) != address(0)) {
            for (uint256 i = 0; i < winnerCount; i++) {
                // You can assemble a per-winner metadata CID off-chain and pass here.
                // For MVP pass empty string or a basic CID if available.
                winnerNFT.mintWinner(recipients[i], battleId, ids[i], "");
            }
        }

        prizePool[battleId] = 0; // consumed
    }
}
