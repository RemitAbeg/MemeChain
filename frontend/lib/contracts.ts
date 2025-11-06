/**
 * Contract configuration combining ABIs and addresses
 * This file provides everything needed to interact with MemeChain contracts
 */

import { CONTRACT_ADDRESSES } from "./constants";
import {
  BattleManagerABI,
  MemeRegistryABI,
  MockUSDCABI,
  VotingEngineABI,
  RewardDistributorABI,
  WinningMemeNFTABI,
} from "../abi";

export const CONTRACTS = {
  MOCK_USDC: {
    address: CONTRACT_ADDRESSES.MOCK_USDC,
    abi: MockUSDCABI,
  },
  BATTLE_MANAGER: {
    address: CONTRACT_ADDRESSES.BATTLE_MANAGER,
    abi: BattleManagerABI,
  },
  MEME_REGISTRY: {
    address: CONTRACT_ADDRESSES.MEME_REGISTRY,
    abi: MemeRegistryABI,
  },
  VOTING_ENGINE: {
    address: CONTRACT_ADDRESSES.VOTING_ENGINE,
    abi: VotingEngineABI,
  },
  REWARD_DISTRIBUTOR: {
    address: CONTRACT_ADDRESSES.REWARD_DISTRIBUTOR,
    abi: RewardDistributorABI,
  },
  WINNING_MEME_NFT: {
    address: CONTRACT_ADDRESSES.WINNING_MEME_NFT,
    abi: WinningMemeNFTABI,
  },
} as const;

// Re-export addresses and ABIs for convenience
export { CONTRACT_ADDRESSES } from "./constants";
export * from "../abi";
