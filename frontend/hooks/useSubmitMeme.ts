import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { decodeEventLog } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { MemeRegistryABI } from "@/abi";
import { useBattles, type Battle } from "./useBattles";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

type SubmitStatus =
  | "idle"
  | "uploading"
  | "signing"
  | "pending"
  | "success"
  | "error";

interface SubmitResult {
  cid: string;
  ipfsUri: string;
  gatewayUrl: string;
}

export function useSubmitMeme() {
  const {
    battles,
    isLoading: isLoadingBattles,
    error: battlesError,
  } = useBattles();
  const submissionBattles = useMemo(
    () => battles.filter((battle) => battle.state === "SUBMISSION_OPEN"),
    [battles]
  );

  const [selectedBattleId, setSelectedBattleId] = useState<number | undefined>(
    () => submissionBattles[0]?.id
  );

  useEffect(() => {
    if (submissionBattles.length === 0) {
      setSelectedBattleId(undefined);
      return;
    }

    if (
      selectedBattleId === undefined ||
      !submissionBattles.some((battle) => battle.id === selectedBattleId)
    ) {
      setSelectedBattleId(submissionBattles[0]?.id);
    }
  }, [submissionBattles, selectedBattleId]);

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [memeId, setMemeId] = useState<number | null>(null);

  const {
    data: submissionCountData,
    refetch: refetchSubmissionCount,
    isLoading: isLoadingSubmissionCount,
  } = useReadContract({
    address: CONTRACTS.MEME_REGISTRY.address as `0x${string}`,
    abi: CONTRACTS.MEME_REGISTRY.abi,
    functionName: "submissionsPerUser",
    args:
      selectedBattleId !== undefined && address
        ? [BigInt(selectedBattleId), address]
        : undefined,
    query: {
      enabled: selectedBattleId !== undefined && Boolean(address),
    },
  });

  const submissionCount = submissionCountData ? Number(submissionCountData) : 0;

  const { data: maxSubmissionsData, isLoading: isLoadingMaxSubmissions } =
    useReadContract({
      address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
      abi: CONTRACTS.BATTLE_MANAGER.abi,
      functionName: "maxSubmissionsPerUser",
      args:
        selectedBattleId !== undefined ? [BigInt(selectedBattleId)] : undefined,
      query: {
        enabled: selectedBattleId !== undefined,
      },
    });

  const maxSubmissions = maxSubmissionsData ? Number(maxSubmissionsData) : null;

  const {
    data: battleStateData,
    refetch: refetchBattleState,
    isLoading: isLoadingBattleState,
  } = useReadContract({
    address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
    abi: CONTRACTS.BATTLE_MANAGER.abi,
    functionName: "getBattleState",
    args:
      selectedBattleId !== undefined ? [BigInt(selectedBattleId)] : undefined,
    query: {
      enabled: selectedBattleId !== undefined,
    },
  });

  const battleState =
    battleStateData !== undefined ? Number(battleStateData) : null;

  const hasReachedLimit =
    maxSubmissions !== null && submissionCount >= maxSubmissions;
  const isSubmissionOpen = battleState === 1;

  const resetState = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
    setCid(null);
    setGatewayUrl(null);
    setMemeId(null);
  }, []);

  const submitMeme = useCallback(
    async (file: File) => {
      if (!selectedBattleId) {
        setError("Please select a battle to submit your meme.");
        setStatus("error");
        return;
      }

      if (!isConnected || !address) {
        setError("Connect your wallet to submit a meme.");
        setStatus("error");
        return;
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        setError("Unsupported file type. Use JPG, PNG, GIF, or WebP.");
        setStatus("error");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("File exceeds 10MB limit.");
        setStatus("error");
        return;
      }

      if (hasReachedLimit) {
        setError("You have reached the submission limit for this battle.");
        setStatus("error");
        return;
      }

      const latestState = await refetchBattleState();
      const latestStateValue =
        latestState.data !== undefined ? Number(latestState.data) : null;
      if (latestStateValue !== 1) {
        setError("Submissions are closed for this battle.");
        setStatus("error");
        return;
      }

      try {
        setStatus("uploading");
        setError(null);
        setCid(null);
        setGatewayUrl(null);
        setMemeId(null);

        const formData = new FormData();
        formData.set("file", file);

        const response = await fetch("/api/ipfs-upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error ?? "Unable to upload file to IPFS.");
        }

        const {
          cid: uploadedCid,
          ipfsUri,
          gatewayUrl: uploadedGatewayUrl,
        } = (await response.json()) as SubmitResult;

        setCid(uploadedCid ?? null);
        setGatewayUrl(uploadedGatewayUrl ?? null);

        setStatus("signing");

        const hash = await writeContractAsync({
          address: CONTRACTS.MEME_REGISTRY.address as `0x${string}`,
          abi: CONTRACTS.MEME_REGISTRY.abi,
          functionName: "submitMeme",
          args: [BigInt(selectedBattleId), ipfsUri],
        });

        setTxHash(hash);
        setStatus("pending");
      } catch (submissionError) {
        console.error("Submit meme failed:", submissionError);
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to submit meme."
        );
        setStatus("error");
      }
    },
    [
      selectedBattleId,
      isConnected,
      address,
      hasReachedLimit,
      refetchBattleState,
      writeContractAsync,
    ]
  );

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

  useEffect(() => {
    if (!receipt || status !== "pending") {
      return;
    }

    try {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: MemeRegistryABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "MemeSubmitted") {
            const memeIdBigInt = decoded.args.memeId as bigint;
            setMemeId(Number(memeIdBigInt));
            break;
          }
        } catch {
          // Skip logs that do not match the event
        }
      }

      setStatus("success");
      void refetchSubmissionCount();
    } catch (parseError) {
      console.error("Failed to parse MemeSubmitted event:", parseError);
      setStatus("success");
    }
  }, [receipt, status, refetchSubmissionCount]);

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
  }, [isReceiptError, receiptError]);

  return {
    battles: submissionBattles as Battle[],
    isLoadingBattles,
    battlesError,
    selectedBattleId,
    setSelectedBattleId,
    status,
    error,
    submissionCount,
    maxSubmissions,
    hasReachedLimit,
    isSubmissionOpen,
    isConnected,
    address,
    submitMeme,
    resetState,
    txHash,
    cid,
    gatewayUrl,
    memeId,
    isLoadingSubmissionCount,
    isLoadingMaxSubmissions,
    isLoadingBattleState,
    isWaitingForReceipt,
  };
}
