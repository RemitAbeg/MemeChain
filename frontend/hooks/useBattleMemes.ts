import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useMemo } from "react";

// Meme struct from contract
interface MemeStruct {
  id: bigint;
  battleId: bigint;
  ipfsHash: string;
  creator: `0x${string}`;
  submittedAt: bigint;
  totalVoteWeight: bigint;
}

// Formatted meme for UI
export interface Meme {
  id: number;
  battleId: number;
  ipfsHash: string;
  imageUrl: string; // IPFS gateway URL
  creator: string;
  submittedAt: number;
  totalVoteWeight: string;
  votes: number; // Placeholder for vote count (can be enhanced later)
}

// Format USDC amount (6 decimals) to display string
const formatUSDC = (amount: bigint): string => {
  if (amount === 0n) return "0";

  const divisor = BigInt(1_000_000); // 6 decimals
  const whole = amount / divisor;
  const decimals = amount % divisor;

  if (decimals === 0n) {
    return whole.toString();
  }

  const decimalsStr = decimals.toString().padStart(6, "0");
  // Remove trailing zeros
  const trimmedDecimals = decimalsStr.replace(/0+$/, "");
  if (trimmedDecimals === "") {
    return whole.toString();
  }

  // Add commas for thousands
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${wholeStr}.${trimmedDecimals}`;
};

// Convert IPFS hash to gateway URL
const getIPFSImageUrl = (ipfsHash: string): string => {
  if (!ipfsHash) return "/placeholder.svg";

  // Remove 'ipfs://' prefix if present
  const hash = ipfsHash.replace(/^ipfs:\/\//, "");

  // Use public IPFS gateway (can be configured via env var later)
  return `https://ipfs.io/ipfs/${hash}`;
};

export function useBattleMemes(battleId: number | undefined) {
  // First, get all meme IDs for this battle
  const {
    data: memeIds,
    isLoading: isLoadingIds,
    error: idsError,
    refetch: refetchIds,
  } = useReadContract({
    address: CONTRACTS.MEME_REGISTRY.address as `0x${string}`,
    abi: CONTRACTS.MEME_REGISTRY.abi,
    functionName: "getBattleMemes",
    args: battleId !== undefined ? [BigInt(battleId)] : undefined,
    query: {
      enabled: battleId !== undefined,
    },
  });

  // Generate contracts array for fetching meme details
  const memeContracts = useMemo(() => {
    if (!memeIds || !Array.isArray(memeIds) || memeIds.length === 0) {
      return [];
    }

    return memeIds.map((memeId: bigint) => ({
      address: CONTRACTS.MEME_REGISTRY.address as `0x${string}`,
      abi: CONTRACTS.MEME_REGISTRY.abi,
      functionName: "getMeme",
      args: [memeId],
    }));
  }, [memeIds]);

  // Fetch all meme details in parallel
  const {
    data: memeData,
    isLoading: isLoadingMemes,
    error: memesError,
    refetch: refetchMemes,
  } = useReadContracts({
    contracts: memeContracts.length > 0 ? memeContracts : [],
  });

  // Process and format meme data
  const memes = useMemo((): Meme[] => {
    if (!memeData || memeData.length === 0) {
      return [];
    }

    return memeData
      .filter(
        (result) => result?.result !== null && result?.result !== undefined
      )
      .map((result) => {
        const memeStruct = result.result as MemeStruct;

        return {
          id: Number(memeStruct.id),
          battleId: Number(memeStruct.battleId),
          ipfsHash: memeStruct.ipfsHash,
          imageUrl: getIPFSImageUrl(memeStruct.ipfsHash),
          creator: memeStruct.creator,
          submittedAt: Number(memeStruct.submittedAt),
          totalVoteWeight: formatUSDC(memeStruct.totalVoteWeight),
          votes: 0, // Placeholder - can be enhanced with actual vote count later
        };
      });
  }, [memeData]);

  const refetch = async () => {
    await refetchIds();
    await refetchMemes();
  };

  return {
    memes,
    isLoading: isLoadingIds || isLoadingMemes,
    error: idsError || memesError,
    refetch,
  };
}
