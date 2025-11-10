import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { decodeEventLog } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { BattleManagerABI } from "@/abi";

type CreateBattleStatus =
  | "idle"
  | "creating"
  | "pending-create"
  | "starting-submission"
  | "pending-start"
  | "success"
  | "error";

export interface CreateBattleArgs {
  theme: string;
  submissionStart: number;
  submissionEnd: number;
  votingEnd: number;
  minStake: bigint;
  maxSubmissionsPerUser: number;
  autoStartSubmission: boolean;
}

export function useCreateBattle() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const { data: ownerAddress } = useReadContract({
    address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
    abi: CONTRACTS.BATTLE_MANAGER.abi,
    functionName: "owner",
  });

  const isOwnerConnected = useMemo(() => {
    if (!address || !ownerAddress) return false;
    return address.toLowerCase() === ownerAddress.toLowerCase();
  }, [address, ownerAddress]);

  const [status, setStatus] = useState<CreateBattleStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [createdBattleId, setCreatedBattleId] = useState<number | null>(null);
  const [createTxHash, setCreateTxHash] = useState<`0x${string}` | null>(null);
  const [startTxHash, setStartTxHash] = useState<`0x${string}` | null>(null);
  const [shouldStartSubmission, setShouldStartSubmission] = useState(false);
  const [pendingSubmissionStart, setPendingSubmissionStart] = useState<
    number | null
  >(null);
  const [warning, setWarning] = useState<string | null>(null);

  const {
    data: createReceipt,
    isLoading: isWaitingCreateReceipt,
    isError: isCreateReceiptError,
    error: createReceiptError,
  } = useWaitForTransactionReceipt({
    hash: createTxHash ?? undefined,
    query: {
      enabled: createTxHash !== null,
    },
  });

  const {
    data: startReceipt,
    isLoading: isWaitingStartReceipt,
    isError: isStartReceiptError,
    error: startReceiptError,
  } = useWaitForTransactionReceipt({
    hash: startTxHash ?? undefined,
    query: {
      enabled: startTxHash !== null,
    },
  });

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setCreatedBattleId(null);
    setCreateTxHash(null);
    setStartTxHash(null);
    setShouldStartSubmission(false);
    setPendingSubmissionStart(null);
    setWarning(null);
  }, []);

  const createBattle = useCallback(
    async ({
      theme,
      submissionStart,
      submissionEnd,
      votingEnd,
      minStake,
      maxSubmissionsPerUser,
      autoStartSubmission,
    }: CreateBattleArgs) => {
      if (!isConnected) {
        setError("Connect your wallet to create a battle.");
        setStatus("error");
        return;
      }

      if (!isOwnerConnected) {
        setError("Only the contract owner can create battles.");
        setStatus("error");
        return;
      }

      try {
        setStatus("creating");
        setError(null);
        setCreatedBattleId(null);
        setCreateTxHash(null);
        setStartTxHash(null);
        setShouldStartSubmission(autoStartSubmission);
        setPendingSubmissionStart(autoStartSubmission ? submissionStart : null);
        setWarning(null);

        const hash = await writeContractAsync({
          address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
          abi: CONTRACTS.BATTLE_MANAGER.abi,
          functionName: "createBattle",
          args: [
            theme,
            BigInt(submissionStart),
            BigInt(submissionEnd),
            BigInt(votingEnd),
            minStake,
            BigInt(maxSubmissionsPerUser),
          ],
        });

        setCreateTxHash(hash);
        setStatus("pending-create");
      } catch (creationError) {
        console.error("Create battle failed:", creationError);
        setError(
          creationError instanceof Error
            ? creationError.message
            : "Failed to create battle."
        );
        setStatus("error");
      }
    },
    [isConnected, isOwnerConnected, writeContractAsync]
  );

  useEffect(() => {
    if (!createReceipt || status !== "pending-create") {
      return;
    }

    if (createReceipt.status !== "success") {
      setError("Battle creation transaction failed.");
      setStatus("error");
      return;
    }

    try {
      for (const log of createReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: BattleManagerABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "BattleCreated") {
            const newBattleId = Number(decoded.args.battleId as bigint);
            setCreatedBattleId(newBattleId);

            if (shouldStartSubmission) {
              setStatus("starting-submission");
              void (async () => {
                try {
                  if (
                    pendingSubmissionStart !== null &&
                    publicClient !== undefined
                  ) {
                    const maxWaitMs = 30_000;
                    const pollIntervalMs = 1_000;
                    const deadline = Date.now() + maxWaitMs;
                    let ready = false;

                    while (Date.now() < deadline) {
                      const latestBlock = await publicClient.getBlock({
                        blockTag: "latest",
                      });
                      const latestTimestamp = Number(latestBlock.timestamp);
                      if (latestTimestamp >= pendingSubmissionStart) {
                        ready = true;
                        break;
                      }
                      await new Promise((resolve) =>
                        setTimeout(resolve, pollIntervalMs)
                      );
                    }

                    if (!ready) {
                      throw new Error("submission_start_not_reached");
                    }
                  }

                  const hash = await writeContractAsync({
                    address: CONTRACTS.BATTLE_MANAGER.address as `0x${string}`,
                    abi: CONTRACTS.BATTLE_MANAGER.abi,
                    functionName: "startSubmissionPhase",
                    args: [BigInt(newBattleId)],
                  });
                  setStartTxHash(hash);
                  setStatus("pending-start");
                } catch (startError) {
                  if (
                    startError instanceof Error &&
                    startError.message === "submission_start_not_reached"
                  ) {
                    setWarning(
                      "Battle created. Submission phase will open at the scheduled start time. Start it manually from this page if it does not update automatically."
                    );
                    setStatus("success");
                  } else {
                    console.error(
                      "Failed to start submission phase:",
                      startError
                    );
                    setWarning(null);
                    setError(
                      startError instanceof Error
                        ? startError.message
                        : "Failed to start submission phase."
                    );
                    setStatus("error");
                  }
                } finally {
                  setShouldStartSubmission(false);
                  setPendingSubmissionStart(null);
                }
              })();
            } else {
              setStatus("success");
            }
            return;
          }
        } catch {
          // ignore unrelated logs
        }
      }

      // If no BattleCreated event found
      setError("Unable to determine battle ID from transaction logs.");
      setStatus("error");
    } catch (parseError) {
      console.error("Failed to parse BattleCreated event:", parseError);
      setError("Failed to parse battle creation result.");
      setStatus("error");
    }
  }, [
    createReceipt,
    status,
    shouldStartSubmission,
    writeContractAsync,
    pendingSubmissionStart,
    publicClient,
  ]);

  useEffect(() => {
    if (!startReceipt || status !== "pending-start") {
      return;
    }

    if (startReceipt.status !== "success") {
      setError("Starting submission phase failed.");
      setStatus("error");
      return;
    }

    setStatus("success");
  }, [startReceipt, status]);

  useEffect(() => {
    if (!isCreateReceiptError || !createReceiptError) {
      return;
    }
    setError(
      createReceiptError instanceof Error
        ? createReceiptError.message
        : "Battle creation failed."
    );
    setStatus("error");
  }, [isCreateReceiptError, createReceiptError]);

  useEffect(() => {
    if (!isStartReceiptError || !startReceiptError) {
      return;
    }
    setError(
      startReceiptError instanceof Error
        ? startReceiptError.message
        : "Failed to start submission phase."
    );
    setStatus("error");
  }, [isStartReceiptError, startReceiptError]);

  const isProcessing =
    status === "creating" ||
    status === "pending-create" ||
    status === "starting-submission" ||
    status === "pending-start" ||
    isWaitingCreateReceipt ||
    isWaitingStartReceipt;

  return {
    createBattle,
    reset,
    status,
    error,
    createdBattleId,
    createTxHash,
    startTxHash,
    isProcessing,
    isConnected,
    isOwnerConnected,
    ownerAddress: ownerAddress ?? null,
    warning,
  };
}
