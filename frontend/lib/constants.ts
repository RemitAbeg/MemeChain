/**
 * Contract addresses for MemeChain
 * These addresses are deployed on the network specified in your environment
 */

export const CONTRACT_ADDRESSES = {
  MOCK_USDC: "0x25a55219711875C81445F30BE44725900B4d5ea3" as const,
  BATTLE_MANAGER: "0x61B45999173dCBf1aA38c9cd24a375be1CcB1089" as const,
  MEME_REGISTRY: "0xB06F35DDd2328E459D0aFaACdB009f58A76E89c6" as const,
  VOTING_ENGINE: "0x734215936637C524aEF6EE33eE1e51b7a288515C" as const,
  REWARD_DISTRIBUTOR: "0xfd76f5fE3799F3dD6878a009881b385801903a9f" as const,
  WINNING_MEME_NFT: "0x4C94B7D83bCc6Ba4984459D7D942012CdB0d2eBD" as const,
} as const;

// Type-safe contract address getter
export type ContractName = keyof typeof CONTRACT_ADDRESSES;

export const getContractAddress = (name: ContractName): string => {
  return CONTRACT_ADDRESSES[name];
};
