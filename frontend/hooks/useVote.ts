import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { decodeEventLog } from "viem";
import { VotingEngineABI } from "@/abi";

type VoteStatus =
  | "idle"
  | "checking"
  | "approving"
  | "voting"
  | "pending"
  | "success"
  | "error";

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

// Convert USDC string (e.g., "10.5") to bigint (6 decimals)
const parseUSDC = (amount: string): bigint => {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) {
    return 0n;
  }
  // Multiply by 1,000,000 to get 6 decimals
  return BigInt(Math.floor(num * 1_000_000));
};

export function useVote(battleId: number | undefined) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<VoteStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | null>(
    null
  );
  const [voteTxHash, setVoteTxHash] = useState<`0x${string}` | null>(null);
  const [pendingVote, setPendingVote] = useState<{
    memeId: number;
    amount: string;
  } | null>(null);

  // Fetch USDC balance
  const {
    data: balanceData,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: CONTRACTS.MOCK_USDC.address as `0x${string}`,
    abi: CONTRACTS.MOCK_USDC.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  const balance = balanceData as bigint | undefined;
  const formattedBalance = useMemo(
    () => (balance ? formatUSDC(balance) : "0"),
    [balance]
  );

  // Fetch min stake requirement
  const { data: minStakeData, isLoading: isLoadingMinStake } = useReadContract({
    address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
    abi: CONTRACTS.BATTLE_MANAGER.abi,
    functionName: "minStakeForVoting",
    args: battleId !== undefined ? [BigInt(battleId)] : undefined,
    query: {
      enabled: battleId !== undefined,
    },
  });

  const minStake = minStakeData as bigint | undefined;
  const formattedMinStake = useMemo(
    () => (minStake ? formatUSDC(minStake) : "0"),
    [minStake]
  );

  // Fetch current user vote and allowance
  const contracts = useMemo(() => {
    if (!battleId || !address) return [];
    return [
      {
        address: CONTRACTS.VOTING_ENGINE.address as `0x${string}`,
        abi: CONTRACTS.VOTING_ENGINE.abi,
        functionName: "votes" as const,
        args: [BigInt(battleId), address],
      },
      {
        address: CONTRACTS.MOCK_USDC.address as `0x${string}`,
        abi: CONTRACTS.MOCK_USDC.abi,
        functionName: "allowance" as const,
        args: [address, CONTRACTS.VOTING_ENGINE.address as `0x${string}`],
      },
    ];
  }, [battleId, address]);

  const {
    data: voteAndAllowanceData,
    isLoading: isLoadingVoteData,
    refetch: refetchVoteData,
  } = useReadContracts({
    contracts: contracts.length > 0 ? contracts : undefined,
    query: {
      enabled: contracts.length > 0 && isConnected,
    },
  });

  const currentVote = useMemo(() => {
    if (!voteAndAllowanceData || !Array.isArray(voteAndAllowanceData)) {
      return null;
    }
    const voteData = voteAndAllowanceData[0]?.result;
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
    };
  }, [voteAndAllowanceData]);

  const allowance = useMemo(() => {
    if (!voteAndAllowanceData || !Array.isArray(voteAndAllowanceData)) {
      return 0n;
    }
    const allowanceData = voteAndAllowanceData[1]?.result;
    return (allowanceData as bigint) ?? 0n;
  }, [voteAndAllowanceData]);

  // Wait for approval transaction
  const {
    data: approvalReceipt,
    isLoading: isWaitingApproval,
    isError: isApprovalError,
    error: approvalError,
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash ?? undefined,
    query: {
      enabled: approvalTxHash !== null,
    },
  });

  // Wait for vote transaction
  const {
    data: voteReceipt,
    isLoading: isWaitingVote,
    isError: isVoteError,
    error: voteError,
  } = useWaitForTransactionReceipt({
    hash: voteTxHash ?? undefined,
    query: {
      enabled: voteTxHash !== null,
    },
  });

  // Handle approval transaction completion - automatically continue with vote
  useEffect(() => {
    if (!approvalReceipt || !approvalTxHash || !pendingVote) {
      return;
    }
    // Approval successful, clear the hash (auto-continue effect will handle the vote)
    setApprovalTxHash(null);
  }, [approvalReceipt, approvalTxHash, pendingVote]);

  // Handle vote transaction completion
  useEffect(() => {
    if (!voteReceipt || status !== "pending") {
      return;
    }

    try {
      // Decode VoteCast event
      for (const log of voteReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: VotingEngineABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "VoteCast") {
            setStatus("success");
            void refetchVoteData();
            void refetchBalance();
            setVoteTxHash(null);
            return;
          }
        } catch {
          // Skip logs that do not match the event
        }
      }

      // If no event found, still mark as success
      setStatus("success");
      void refetchVoteData();
      void refetchBalance();
      setVoteTxHash(null);
    } catch (parseError) {
      console.error("Failed to parse VoteCast event:", parseError);
      setStatus("success");
      void refetchVoteData();
      void refetchBalance();
      setVoteTxHash(null);
    }
  }, [voteReceipt, status, refetchVoteData, refetchBalance]);

  // Handle approval error
  useEffect(() => {
    if (!isApprovalError) {
      return;
    }
    const message =
      approvalError instanceof Error
        ? approvalError.message
        : "Approval transaction failed. Please try again.";
    setError(message);
    setStatus("error");
    setApprovalTxHash(null);
  }, [isApprovalError, approvalError]);

  // Handle vote error
  useEffect(() => {
    if (!isVoteError) {
      return;
    }
    const message =
      voteError instanceof Error
        ? voteError.message
        : "Vote transaction failed. Please try again.";
    setError(message);
    setStatus("error");
    setVoteTxHash(null);
  }, [isVoteError, voteError]);

  const vote = useCallback(
    async (memeId: number, amount: string) => {
      if (!battleId) {
        setError("Battle ID is required.");
        setStatus("error");
        return;
      }

      if (!isConnected || !address) {
        setError("Connect your wallet to vote.");
        setStatus("error");
        return;
      }

      if (!minStake) {
        setError("Loading minimum stake requirement...");
        setStatus("error");
        return;
      }

      const amountBigInt = parseUSDC(amount);
      if (amountBigInt < minStake) {
        setError(
          `Vote amount must be at least ${formattedMinStake} USDC (minimum stake).`
        );
        setStatus("error");
        return;
      }

      if (!balance || amountBigInt > balance) {
        setError("Insufficient USDC balance.");
        setStatus("error");
        return;
      }

      try {
        setStatus("checking");
        setError(null);

        // Calculate how much USDC we need to transfer
        // If user already voted, we only need to transfer the difference
        const currentAmount = currentVote?.amount ?? 0n;
        const neededAmount =
          amountBigInt > currentAmount ? amountBigInt - currentAmount : 0n;

        // Check if we need approval
        if (neededAmount > 0n && allowance < neededAmount) {
          setStatus("approving");
          setPendingVote({ memeId, amount });

          const approvalHash = await writeContractAsync({
            address: CONTRACTS.MOCK_USDC.address as `0x${string}`,
            abi: CONTRACTS.MOCK_USDC.abi,
            functionName: "approve",
            // Approve a large amount to avoid repeated approvals
            args: [
              CONTRACTS.VOTING_ENGINE.address as `0x${string}`,
              BigInt("1000000000000000"), // 1 billion USDC (should be enough)
            ],
          });

          setApprovalTxHash(approvalHash);
          // Wait for approval to complete, then auto-continue with vote
          return;
        }

        setStatus("voting");

        const voteHash = await writeContractAsync({
          address: CONTRACTS.VOTING_ENGINE.address as `0x${string}`,
          abi: CONTRACTS.VOTING_ENGINE.abi,
          functionName: "vote",
          args: [BigInt(battleId), BigInt(memeId), amountBigInt],
        });

        setVoteTxHash(voteHash);
        setStatus("pending");
      } catch (voteError) {
        console.error("Vote failed:", voteError);
        setError(
          voteError instanceof Error
            ? voteError.message
            : "Failed to vote. Please try again."
        );
        setStatus("error");
      }
    },
    [
      battleId,
      isConnected,
      address,
      minStake,
      formattedMinStake,
      balance,
      currentVote,
      allowance,
      status,
      approvalReceipt,
      writeContractAsync,
    ]
  );

  // Auto-continue vote after approval completes
  useEffect(() => {
    if (
      approvalReceipt &&
      pendingVote &&
      !approvalTxHash && // Approval transaction hash cleared (completed)
      voteTxHash === null && // Vote hasn't started yet
      (status === "approving" || status === "checking") // In approval-related state
    ) {
      // Approval completed, automatically continue with vote
      const executeVote = async () => {
        if (!battleId || !minStake) return;

        try {
          setStatus("voting");
          const amountBigInt = parseUSDC(pendingVote.amount);

          const voteHash = await writeContractAsync({
            address: CONTRACTS.VOTING_ENGINE.address as `0x${string}`,
            abi: CONTRACTS.VOTING_ENGINE.abi,
            functionName: "vote",
            args: [BigInt(battleId), BigInt(pendingVote.memeId), amountBigInt],
          });

          setVoteTxHash(voteHash);
          setStatus("pending");
          setPendingVote(null);
        } catch (voteError) {
          console.error("Auto-vote after approval failed:", voteError);
          setError(
            voteError instanceof Error
              ? voteError.message
              : "Failed to vote after approval. Please try again."
          );
          setStatus("error");
          setPendingVote(null);
        }
      };

      void executeVote();
    }
  }, [
    approvalReceipt,
    pendingVote,
    status,
    voteTxHash,
    battleId,
    minStake,
    writeContractAsync,
  ]);

  const resetState = useCallback(() => {
    setStatus("idle");
    setError(null);
    setApprovalTxHash(null);
    setVoteTxHash(null);
    setPendingVote(null);
  }, []);

  return {
    vote,
    status,
    error,
    balance,
    formattedBalance,
    minStake,
    formattedMinStake,
    currentVote,
    allowance,
    isLoadingBalance,
    isLoadingMinStake,
    isLoadingVoteData,
    isWaitingApproval,
    isWaitingVote,
    isConnected,
    refetchVoteData,
    resetState,
    approvalTxHash,
    voteTxHash,
  };
}
