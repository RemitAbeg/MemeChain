import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useMemo } from "react";

// Battle state enum from contract (0-5)
// UPCOMING = 0, SUBMISSION_OPEN = 1, VOTING_OPEN = 2, TALLYING = 3, FINALIZED = 4, ARCHIVED = 5
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
export interface Battle {
  id: number;
  theme: string;
  state: UIState;
  prizePool: string;
  memesCount: number;
  submissionStart: number;
  submissionEnd: number;
  votingEnd: number;
  minStake: string;
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

export function useBattles() {
  // First, get the battle counter
  const {
    data: battleCounter,
    isLoading: isLoadingCounter,
    error: counterError,
  } = useReadContract({
    address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
    abi: CONTRACTS.BATTLE_MANAGER.abi,
    functionName: "battleCounter",
  });

  // Generate array of battle IDs (1 to battleCounter)
  const battleIds = useMemo(() => {
    if (!battleCounter || battleCounter === 0n) return [];
    const count = Number(battleCounter);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [battleCounter]);

  // Prepare contracts to read for all battles
  const battleContracts = useMemo(() => {
    if (battleIds.length === 0) return [];

    return battleIds.flatMap((battleId) => [
      // Battle data from BattleManager
      {
        address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
        abi: CONTRACTS.BATTLE_MANAGER.abi,
        functionName: "battles" as const,
        args: [BigInt(battleId)],
      },
      // Prize pool from RewardDistributor
      {
        address: CONTRACTS.REWARD_DISTRIBUTOR.address as `0x${string}`,
        abi: CONTRACTS.REWARD_DISTRIBUTOR.abi,
        functionName: "prizePool" as const,
        args: [BigInt(battleId)],
      },
      // Meme count from MemeRegistry
      {
        address: CONTRACTS.MEME_REGISTRY.address as `0x${string}`,
        abi: CONTRACTS.MEME_REGISTRY.abi,
        functionName: "getBattleMemes" as const,
        args: [BigInt(battleId)],
      },
    ]);
  }, [battleIds]);

  // Fetch all battle data in parallel
  // Only fetch if we have contracts to read
  const shouldFetch = battleContracts.length > 0;
  const {
    data: battleData,
    isLoading: isLoadingBattles,
    error: battlesError,
  } = useReadContracts({
    contracts: shouldFetch ? battleContracts : [],
  });

  // Process and format battle data
  const battles = useMemo((): Battle[] => {
    if (
      !battleData ||
      battleIds.length === 0 ||
      battleContracts.length === 0 ||
      !battleData.length
    )
      return [];

    const formattedBattles: Battle[] = [];

    for (let i = 0; i < battleIds.length; i++) {
      const battleIndex = i * 3;
      const battleResult = battleData[battleIndex];
      const prizePoolResult = battleData[battleIndex + 1];
      const memeIdsResult = battleData[battleIndex + 2];

      // Skip if battle data is not available
      if (!battleResult?.result) continue;

      const battleStruct = battleResult.result as BattleStruct;
      const prizePool = (prizePoolResult?.result as bigint | undefined) ?? 0n;
      const memeIds = (memeIdsResult?.result as bigint[] | undefined) ?? [];

      const formattedBattle: Battle = {
        id: Number(battleStruct.id),
        theme: battleStruct.theme,
        state: mapStateToUI(battleStruct.state),
        prizePool: formatUSDC(prizePool),
        memesCount: memeIds.length,
        submissionStart: Number(battleStruct.submissionStart),
        submissionEnd: Number(battleStruct.submissionEnd),
        votingEnd: Number(battleStruct.votingEnd),
        minStake: formatUSDC(battleStruct.minStake),
      };

      formattedBattles.push(formattedBattle);
    }

    return formattedBattles;
  }, [battleData, battleIds, battleContracts.length]);

  return {
    battles,
    isLoading: isLoadingCounter || isLoadingBattles,
    error: counterError || battlesError,
  };
}
