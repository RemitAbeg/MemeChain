import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useMemo } from "react";

// Format USDC amount (6 decimals) to display string
const formatUSDC = (amount: bigint | number | string): string => {
  let value: bigint;
  if (typeof amount === "bigint") {
    value = amount;
  } else if (typeof amount === "number") {
    value = BigInt(Math.trunc(amount));
  } else {
    try {
      value = BigInt(amount);
    } catch {
      return "0";
    }
  }

  if (value === 0n) return "0";

  const divisor = BigInt(1_000_000); // 6 decimals
  const whole = value / divisor;
  const decimals = value % divisor;

  if (decimals === 0n) {
    return whole.toString();
  }

  const decimalsStr = decimals.toString().padStart(6, "0");
  const trimmedDecimals = decimalsStr.replace(/0+$/, "");
  if (trimmedDecimals === "") {
    return whole.toString();
  }

  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${wholeStr}.${trimmedDecimals}`;
};

export interface UserVote {
  memeId: number;
  amount: bigint;
  formattedAmount: string;
  exists: boolean;
}

export function useUserVote(battleId: number | undefined) {
  const { address, isConnected } = useAccount();

  const {
    data: voteData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACTS.VOTING_ENGINE.address as `0x${string}`,
    abi: CONTRACTS.VOTING_ENGINE.abi,
    functionName: "votes",
    args:
      battleId !== undefined && address
        ? [BigInt(battleId), address]
        : undefined,
    query: {
      enabled: battleId !== undefined && isConnected && !!address,
    },
  });

  const userVote = useMemo<UserVote | null>(() => {
    if (!voteData || !Array.isArray(voteData) || voteData.length < 3) {
      return null;
    }

    const [memeId, amount, exists] = voteData as [bigint, bigint, boolean];

    if (!exists) {
      return null;
    }

    return {
      memeId: Number(memeId),
      amount: amount as bigint,
      formattedAmount: formatUSDC(amount as bigint),
      exists: true,
    };
  }, [voteData]);

  return {
    userVote,
    isLoading,
    error,
    refetch,
    isConnected,
  };
}
