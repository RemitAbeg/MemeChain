import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { BattleManagerABI } from "@/abi";

type PhaseAction = "startSubmission" | "startVoting" | "finalize";

type ManagePhaseStatus =
  | "idle"
  | "checking"
  | "signing"
  | "pending"
  | "success"
  | "error";

export function useManageBattlePhases() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: ownerAddress } = useReadContract({
    address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
    abi: CONTRACTS.BATTLE_MANAGER.abi,
    functionName: "owner",
  });

  const isOwnerConnected = useMemo(() => {
    if (!address || !ownerAddress) return false;
    return address.toLowerCase() === ownerAddress.toLowerCase();
  }, [address, ownerAddress]);

  const [status, setStatus] = useState<ManagePhaseStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [currentAction, setCurrentAction] = useState<PhaseAction | null>(null);
  const [currentBattleId, setCurrentBattleId] = useState<number | null>(null);

  const {
    data: receipt,
    isLoading: isWaitingForReceipt,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    query: {
      enabled: txHash !== null,
    },
  });

  // Handle transaction completion
  useEffect(() => {
    if (!receipt || status !== "pending") {
      return;
    }

    setStatus("success");
    setTxHash(null);
    setCurrentAction(null);
    setCurrentBattleId(null);
  }, [receipt, status]);

  // Handle transaction error
  useEffect(() => {
    if (!isReceiptError) {
      return;
    }

    const message =
      receiptError instanceof Error
        ? receiptError.message
        : "Transaction failed. Please try again.";
    setError(message);
    setStatus("error");
    setTxHash(null);
  }, [isReceiptError, receiptError]);

  const startSubmissionPhase = useCallback(
    async (battleId: number) => {
      if (!isConnected || !address) {
        setError("Connect your wallet to manage battle phases.");
        setStatus("error");
        return;
      }

      if (!isOwnerConnected) {
        setError("Only the contract owner can manage battle phases.");
        setStatus("error");
        return;
      }

      try {
        setStatus("signing");
        setError(null);
        setCurrentAction("startSubmission");
        setCurrentBattleId(battleId);

        // Directly call the contract - it will handle validation
        const hash = await writeContractAsync({
          address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
          abi: CONTRACTS.BATTLE_MANAGER.abi,
          functionName: "startSubmissionPhase",
          args: [BigInt(battleId)],
        });

        setTxHash(hash);
        setStatus("pending");
      } catch (phaseError) {
        console.error("Start submission phase failed:", phaseError);
        setError(
          phaseError instanceof Error
            ? phaseError.message
            : "Failed to start submission phase."
        );
        setStatus("error");
        setCurrentAction(null);
        setCurrentBattleId(null);
      }
    },
    [isConnected, address, isOwnerConnected, writeContractAsync]
  );

  const startVotingPhase = useCallback(
    async (battleId: number) => {
      if (!isConnected || !address) {
        setError("Connect your wallet to manage battle phases.");
        setStatus("error");
        return;
      }

      if (!isOwnerConnected) {
        setError("Only the contract owner can manage battle phases.");
        setStatus("error");
        return;
      }

      try {
        setStatus("signing");
        setError(null);
        setCurrentAction("startVoting");
        setCurrentBattleId(battleId);

        // Directly call the contract - it will handle validation
        const hash = await writeContractAsync({
          address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
          abi: CONTRACTS.BATTLE_MANAGER.abi,
          functionName: "startVotingPhase",
          args: [BigInt(battleId)],
        });

        setTxHash(hash);
        setStatus("pending");
      } catch (phaseError) {
        console.error("Start voting phase failed:", phaseError);
        setError(
          phaseError instanceof Error
            ? phaseError.message
            : "Failed to start voting phase."
        );
        setStatus("error");
        setCurrentAction(null);
        setCurrentBattleId(null);
      }
    },
    [isConnected, address, isOwnerConnected, writeContractAsync]
  );

  const finalizeBattle = useCallback(
    async (battleId: number) => {
      if (!isConnected || !address) {
        setError("Connect your wallet to manage battle phases.");
        setStatus("error");
        return;
      }

      if (!isOwnerConnected) {
        setError("Only the contract owner can manage battle phases.");
        setStatus("error");
        return;
      }

      try {
        setStatus("signing");
        setError(null);
        setCurrentAction("finalize");
        setCurrentBattleId(battleId);

        // Directly call the contract - it will handle validation
        const hash = await writeContractAsync({
          address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
          abi: CONTRACTS.BATTLE_MANAGER.abi,
          functionName: "finalizeBattle",
          args: [BigInt(battleId)],
        });

        setTxHash(hash);
        setStatus("pending");
      } catch (phaseError) {
        console.error("Finalize battle failed:", phaseError);
        setError(
          phaseError instanceof Error
            ? phaseError.message
            : "Failed to finalize battle."
        );
        setStatus("error");
        setCurrentAction(null);
        setCurrentBattleId(null);
      }
    },
    [isConnected, address, isOwnerConnected, writeContractAsync]
  );

  const resetState = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
    setCurrentAction(null);
    setCurrentBattleId(null);
  }, []);

  return {
    startSubmissionPhase,
    startVotingPhase,
    finalizeBattle,
    status,
    error,
    txHash,
    currentAction,
    currentBattleId,
    isWaitingForReceipt,
    isConnected,
    isOwnerConnected,
    ownerAddress: ownerAddress as `0x${string}` | undefined,
    resetState,
  };
}
