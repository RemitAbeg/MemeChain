import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useMemo } from "react";

// Battle state enum from contract (0-5)
type BattleState = 0 | 1 | 2 | 3 | 4 | 5;

// UI state strings
type UIState =
  | "UPCOMING"
  | "SUBMISSION_OPEN"
  | "VOTING_OPEN"
  | "TALLYING"
  | "FINALIZED"
  | "ARCHIVED";

// Battle struct from contract
interface BattleStruct {
  id: bigint;
  theme: string;
  submissionStart: bigint;
  submissionEnd: bigint;
  votingEnd: bigint;
  minStake: bigint;
  maxSubmissionsPerUser: bigint;
  state: BattleState;
}

// Formatted battle for UI
export interface BattleDetail {
  id: number;
  theme: string;
  state: UIState;
  prizePool: string;
  currentPool: string;
  minStake: string;
  maxSubmissionsPerUser: number;
  submissionStart: number;
  submissionEnd: number;
  votingEnd: number;
}

// Map contract state enum to UI state string
const mapStateToUI = (state: BattleState): UIState => {
  const stateMap: Record<BattleState, UIState> = {
    0: "UPCOMING",
    1: "SUBMISSION_OPEN",
    2: "VOTING_OPEN",
    3: "TALLYING",
    4: "FINALIZED",
    5: "ARCHIVED",
  };
  return stateMap[state];
};

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

export function useBattle(battleId: number | undefined) {
  // Fetch battle data and prize pool in parallel
  const contracts = useMemo(() => {
    if (battleId === undefined) return [];

    return [
      // Battle data from BattleManager
      {
        address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
        abi: CONTRACTS.BATTLE_MANAGER.abi,
        functionName: "battles",
        args: [BigInt(battleId)],
      },
      // Prize pool from RewardDistributor
      {
        address: CONTRACTS.REWARD_DISTRIBUTOR.address as `0x${string}`,
        abi: CONTRACTS.REWARD_DISTRIBUTOR.abi,
        functionName: "prizePool",
        args: [BigInt(battleId)],
      },
    ];
  }, [battleId]);

  const {
    data: battleData,
    isLoading,
    error,
  } = useReadContracts({
    contracts: contracts.length > 0 ? contracts : [],
  });

  // Process and format battle data
  const battle = useMemo((): BattleDetail | null => {
    if (!battleData || battleData.length < 2 || !battleData[0]?.result) {
      return null;
    }

    const battleResult = battleData[0].result as BattleStruct;
    const prizePool = (battleData[1]?.result as bigint | undefined) ?? 0n;

    return {
      id: Number(battleResult.id),
      theme: battleResult.theme,
      state: mapStateToUI(battleResult.state),
      prizePool: formatUSDC(prizePool),
      currentPool: formatUSDC(prizePool), // Same as prize pool for now
      minStake: formatUSDC(battleResult.minStake),
      maxSubmissionsPerUser: Number(battleResult.maxSubmissionsPerUser),
      submissionStart: Number(battleResult.submissionStart),
      submissionEnd: Number(battleResult.submissionEnd),
      votingEnd: Number(battleResult.votingEnd),
    };
  }, [battleData]);

  return {
    battle,
    isLoading,
    error,
  };
}

