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
  state: bigint;
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

const toBigInt = (
  value: bigint | number | string | null | undefined,
  fallback: bigint = 0n
): bigint => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string") {
    try {
      return BigInt(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// Map contract state enum to UI state string
const mapStateToUI = (state: BattleState | bigint | number): UIState => {
  const normalized = typeof state === "bigint" ? Number(state) : Number(state);

  const stateMap: Record<number, UIState> = {
    0: "UPCOMING",
    1: "SUBMISSION_OPEN",
    2: "VOTING_OPEN",
    3: "TALLYING",
    4: "FINALIZED",
    5: "ARCHIVED",
  };
  return stateMap[normalized] ?? "UPCOMING";
};

// Format USDC amount (6 decimals) to display string
const formatUSDC = (amount: bigint | number | string | null | undefined): string => {
  const value = toBigInt(amount);
  if (value === 0n) return "0";

  const divisor = BigInt(1_000_000); // 6 decimals
  const whole = value / divisor;
  const decimals = value % divisor;

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

const parseBattleStruct = (raw: any): BattleStruct | null => {
  if (!raw) return null;

  const get = (key: string, index: number) =>
    raw?.[key as keyof typeof raw] ?? raw?.[index];

  const id = get("id", 0);
  const theme = get("theme", 1);

  if (id === undefined || theme === undefined) return null;

  return {
    id: toBigInt(id),
    theme: String(theme),
    submissionStart: toBigInt(get("submissionStart", 2)),
    submissionEnd: toBigInt(get("submissionEnd", 3)),
    votingEnd: toBigInt(get("votingEnd", 4)),
    minStake: toBigInt(get("minStake", 5)),
    maxSubmissionsPerUser: toBigInt(get("maxSubmissionsPerUser", 6)),
    state: toBigInt(get("state", 7)),
  };
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

    const battleResult = parseBattleStruct(battleData[0].result);
    const prizePool = (battleData[1]?.result as bigint | undefined) ?? 0n;

    if (!battleResult) {
      return null;
    }

    const stateValue = Number(battleResult.state ?? 0n);

    return {
      id: Number(battleResult.id),
      theme: battleResult.theme,
      state: mapStateToUI(stateValue),
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

