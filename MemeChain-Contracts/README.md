# MemeChain Smart Contracts

Decentralized meme battle platform smart contracts built with Solidity and Foundry.

## 📋 Overview

MemeChain is a decentralized platform where users can:
- Submit memes to themed battles
- Vote on memes by staking USDC
- Win prizes from prize pools
- Mint NFTs for winning memes

## 🏗️ Architecture

### Core Contracts

1. **BattleManager** - Controls battle lifecycle and state transitions
2. **MemeRegistry** - Manages meme submissions and metadata
3. **VotingEngine** - Handles voting, staking, and winner determination (with tie-breaker)
4. **RewardDistributor** - Distributes prizes to winners and mints NFTs
5. **WinningMemeNFT** - ERC721 NFT contract for winning memes

### Features

- ✅ **Pausable** - Emergency stop functionality
- ✅ **ReentrancyGuard** - Protection against reentrancy attacks
- ✅ **Tie-breaker Logic** - Earliest submission wins in case of tied votes
- ✅ **Automatic Withdrawals** - Voters can withdraw immediately after battle finalization
- ✅ **NFT Minting** - Automatic NFT minting for winners
- ✅ **Input Validation** - Comprehensive checks throughout
- ✅ **Event Logging** - Full event coverage for off-chain tracking

## 🚀 Quick Start

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd MemeChain-Contracts

# Install dependencies
forge install

# Build contracts
forge build
```

### Testing

```bash
# Run all tests
forge test

# Run tests with verbosity
forge test -vvv

# Run specific test file
forge test --match-path test/BattleManager.t.sol

# Gas report
forge test --gas-report
```

**Test Coverage: 81 tests, 100% passing ✅**

## 📦 Deployment

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your PRIVATE_KEY and other settings
```

### 2. Deploy to Local Testnet

```bash
# Start Anvil
anvil

# Deploy (in another terminal)
forge script script/DeployMemeChain.s.sol:DeployMemeChain \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

### 3. Deploy to Celo Alfajores (Testnet)

```bash
forge script script/DeployMemeChain.s.sol:DeployMemeChain \
  --rpc-url $CELO_ALFAJORES_RPC \
  --broadcast \
  --verify
```

### 4. Deploy to Celo Mainnet

```bash
forge script script/DeployMemeChain.s.sol:DeployMemeChain \
  --rpc-url $CELO_MAINNET_RPC \
  --broadcast \
  --verify
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📖 Contract Documentation

### BattleManager

Controls the entire battle lifecycle with state machine:

```
UPCOMING → SUBMISSION_OPEN → VOTING_OPEN → TALLYING → FINALIZED → ARCHIVED
```

**Key Functions:**
- `createBattle()` - Create a new battle with theme and timings
- `startSubmissionPhase()` - Open submissions
- `startVotingPhase()` - Open voting
- `finalizeBattle()` - Distribute prizes and enable withdrawals
- `pause()`/`unpause()` - Emergency controls

### MemeRegistry

Manages meme submissions and metadata.

**Key Functions:**
- `submitMeme()` - Submit a meme with IPFS hash
- `increaseVoteWeight()` / `decreaseVoteWeight()` - Called by VotingEngine

**Validations:**
- Non-empty IPFS hash
- Max 256 characters to prevent griefing
- Per-user submission limits
- Meme existence checks

### VotingEngine

Handles voting with USDC staking and winner determination.

**Key Functions:**
- `vote()` - Stake USDC to vote for a meme
- `withdraw()` - Withdraw staked USDC after battle
- `getTop3()` - Get top 3 memes with tie-breaker (earliest submission wins)
- `enableWithdrawalsFromBM()` - BattleManager triggers automatic withdrawals

**Features:**
- Tie-breaker: Earlier submissions win ties
- Automatic withdrawal enablement on finalization
- Flexible staking (can change vote)

### RewardDistributor

Distributes prizes and mints NFTs for winners.

**Prize Distribution:**
- 3 winners: 50% / 30% / 20%
- 2 winners: 62.5% / 37.5%
- 1 winner: 100%

**Key Functions:**
- `addToPrizePool()` - Anyone can fund battles
- `distributePrizes()` - Called by BattleManager
- `setWinnerNFT()` - Connect NFT contract

### WinningMemeNFT

ERC721 NFT contract for winning memes.

**Key Functions:**
- `mintWinner()` - Mint NFT to winner (minter only)
- `setMinter()` - Set RewardDistributor as minter
- `setBaseURI()` - Set metadata base URI

## 🔐 Security

- **Ownable** - Admin functions protected
- **ReentrancyGuard** - Critical paths protected
- **Pausable** - Emergency stop capability
- **Input Validation** - Comprehensive checks
- **Battle Existence** - ID validation throughout
- **Meme Existence** - Validation before operations

## 🧪 Testing

```bash
# Run full test suite
forge test

# Coverage report
forge coverage

# Gas snapshot
forge snapshot
```

### Test Suites

- `BattleManager.t.sol` - 24 tests ✅
- `MemeRegistry.t.sol` - 17 tests ✅
- `VotingEngine.t.sol` - 11 tests ✅
- `RewardDistributor.t.sol` - 15 tests ✅
- `WinningMemeNFT.t.sol` - 14 tests ✅

**Total: 81 tests, 100% passing**

## 📊 Gas Optimization

Contracts are optimized for gas efficiency:
- Batch operations where possible
- Efficient storage patterns
- Minimal external calls

## 🛠️ Development

```bash
# Format code
forge fmt

# Lint
forge fmt --check

# Update dependencies
forge update
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## ⚠️ Disclaimer

These contracts are provided as-is. Always audit smart contracts before deploying with real value.

## 📞 Support

- Issues: GitHub Issues
- Docs: See `/docs` folder
- Tests: See `/test` folder for usage examples
