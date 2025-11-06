# MemeChain Deployment Guide

This guide explains how to deploy the MemeChain smart contracts to Celo or any EVM-compatible network.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- A wallet with sufficient native tokens for gas fees
- (Optional) USDC token address for your target network

## Setup

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env` file:**

   ```bash
   # Required: Add your private key
   PRIVATE_KEY=your_private_key_here

   # Optional: Add USDC address (or MockUSDC will be deployed)
   USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C  # Celo Mainnet
   ```

   **⚠️ Important:** Never commit your `.env` file or share your private key!

## Deployment

### Local Deployment (Anvil)

1. **Start Anvil (local testnet):**

   ```bash
   anvil
   ```

2. **Deploy contracts:**
   ```bash
   forge script script/DeployMemeChain.s.sol:DeployMemeChain \
     --rpc-url http://127.0.0.1:8545 \
     --broadcast \
     -vvvv
   ```

### Celo Alfajores (Testnet)

```bash
forge script script/DeployMemeChain.s.sol:DeployMemeChain \
  --rpc-url $CELO_ALFAJORES_RPC \
  --broadcast \
  --verify \
  -vvvv
```

### Celo Mainnet

```bash
forge script script/DeployMemeChain.s.sol:DeployMemeChain \
  --rpc-url $CELO_MAINNET_RPC \
  --broadcast \
  --verify \
  -vvvv
```

## Post-Deployment

After successful deployment:

1. **Contract addresses** will be saved to `deployments.env`
2. **Verification** (if enabled) will submit contract source code to the block explorer
3. **Setup is complete** - all contracts are connected and ready to use

### Deployment Addresses

Check `deployments.env` for deployed contract addresses:

```
USDC=0x...
BATTLE_MANAGER=0x...
MEME_REGISTRY=0x...
VOTING_ENGINE=0x...
REWARD_DISTRIBUTOR=0x...
WINNING_MEME_NFT=0x...
```

## Contract Architecture

```
┌─────────────────┐
│ BattleManager   │ ◄── Owner controls battle lifecycle
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │                         │
┌───▼────────┐         ┌──────▼──────┐
│MemeRegistry│         │VotingEngine │
└────────────┘         └──────┬──────┘
                              │
                       ┌──────▼──────────────┐
                       │ RewardDistributor   │
                       └──────┬──────────────┘
                              │
                       ┌──────▼──────────────┐
                       │ WinningMemeNFT      │
                       └─────────────────────┘
```

## Setup Verification

After deployment, verify the setup:

```bash
# Check BattleManager modules
cast call $BATTLE_MANAGER "memeRegistry()" --rpc-url $RPC_URL
cast call $BATTLE_MANAGER "votingEngine()" --rpc-url $RPC_URL
cast call $BATTLE_MANAGER "rewardDistributor()" --rpc-url $RPC_URL

# Check MemeRegistry
cast call $MEME_REGISTRY "votingEngine()" --rpc-url $RPC_URL

# Check RewardDistributor
cast call $REWARD_DISTRIBUTOR "winnerNFT()" --rpc-url $RPC_URL

# Check WinningMemeNFT
cast call $WINNING_MEME_NFT "minter()" --rpc-url $RPC_URL
```

## Known Addresses

### Celo Mainnet

- **USDC:** `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`

### Celo Alfajores Testnet

- **USDC:** `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

## Troubleshooting

### "Insufficient funds for gas"

- Ensure your wallet has enough CELO for gas fees
- Check your balance: `cast balance $YOUR_ADDRESS --rpc-url $RPC_URL`

### "Nonce too low"

- Clear pending transactions or wait for them to complete
- Or override: add `--with-gas-price <value>` flag

### "Contract verification failed"

- Ensure you have `ETHERSCAN_API_KEY` set in `.env`
- You can verify manually later:
  ```bash
  forge verify-contract $CONTRACT_ADDRESS \
    src/BattleManager.sol:BattleManager \
    --chain-id 44787 \
    --etherscan-api-key $ETHERSCAN_API_KEY
  ```

## Next Steps

1. **Fund the RewardDistributor** with USDC for prize pools
2. **Create your first battle** using `BattleManager.createBattle()`
3. **Integrate with your frontend** using the deployed addresses
4. **Set up monitoring** for events and state changes

## Security Notes

- ✅ All contracts are `Ownable` - only deployer can manage them initially
- ✅ `Pausable` functionality added to `BattleManager` for emergencies
- ✅ `ReentrancyGuard` protects critical functions
- ✅ Comprehensive input validation throughout
- ⚠️ Consider transferring ownership to a multisig for production
- ⚠️ Audit contracts before mainnet deployment with significant value

## Support

For issues or questions:

- Check the [test files](./test/) for usage examples
- Review [contract documentation](./src/)
- Open an issue on GitHub
