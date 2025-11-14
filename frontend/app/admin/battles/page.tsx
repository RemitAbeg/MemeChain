"use client";

import { useMemo, useState } from "react";
import { MCNavbar } from "@/components/mc-navbar";
import { useAccount } from "wagmi";
import { useCreateBattle } from "@/hooks/useCreateBattle";
import { useManageBattlePhases } from "@/hooks/useManageBattlePhases";
import { useBattles } from "@/hooks/useBattles";
import { parseUnits } from "viem";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Play,
  Zap,
  Trophy,
} from "lucide-react";
import Link from "next/link";

interface FormState {
  theme: string;
  submissionDelayMinutes: number;
  submissionDurationHours: number;
  votingDurationHours: number;
  minStake: string;
  maxSubmissionsPerUser: number;
  autoStartSubmission: boolean;
}

const DEFAULT_FORM: FormState = {
  theme: "",
  submissionDelayMinutes: 0,
  submissionDurationHours: 24,
  votingDurationHours: 48,
  minStake: "1",
  maxSubmissionsPerUser: 3,
  autoStartSubmission: true,
};

export default function AdminBattlesPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [localError, setLocalError] = useState<string | null>(null);
  const { address } = useAccount();

  const {
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
    ownerAddress,
    warning,
  } = useCreateBattle();

  const {
    startSubmissionPhase,
    startVotingPhase,
    finalizeBattle,
    status: phaseStatus,
    error: phaseError,
    currentAction,
    currentBattleId,
    isOwnerConnected: isPhaseOwnerConnected,
    resetState: resetPhaseState,
  } = useManageBattlePhases();

  const {
    battles,
    isLoading: isLoadingBattles,
    error: battlesError,
  } = useBattles();

  const buttonLabel = useMemo(() => {
    switch (status) {
      case "creating":
        return "Confirm in Wallet...";
      case "pending-create":
        return "Waiting for Battle Creation...";
      case "starting-submission":
        return "Starting Submission Phase...";
      case "pending-start":
        return "Waiting for Submission Phase...";
      case "success":
        return "Battle Created!";
      case "error":
        return "Try Again";
      default:
        return "Create Battle";
    }
  }, [status]);

  const isAutoStartDisabled = form.submissionDelayMinutes > 0;

  const handleInputChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "submissionDelayMinutes" && value > 0) {
        next.autoStartSubmission = false;
      }
      return next;
    });
    setLocalError(null);
    if (status !== "idle") {
      reset();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!form.theme.trim()) {
      setLocalError("Battle theme is required.");
      return;
    }

    if (form.submissionDurationHours <= 0 || form.votingDurationHours <= 0) {
      setLocalError("Durations must be greater than zero.");
      return;
    }

    if (form.maxSubmissionsPerUser < 0) {
      setLocalError("Max submissions per user cannot be negative.");
      return;
    }

    let minStake: bigint;
    try {
      minStake = parseUnits(form.minStake || "0", 6);
    } catch {
      setLocalError("Invalid minimum stake format.");
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const submissionStart =
      now + Math.max(0, Math.floor(form.submissionDelayMinutes)) * 60;
    const submissionEnd =
      submissionStart + Math.max(1, form.submissionDurationHours) * 3600;
    const votingEnd =
      submissionEnd + Math.max(1, form.votingDurationHours) * 3600;

    if (!(submissionStart < submissionEnd && submissionEnd < votingEnd)) {
      setLocalError("Ensure submission and voting timelines are sequential.");
      return;
    }

    await createBattle({
      theme: form.theme.trim(),
      submissionStart,
      submissionEnd,
      votingEnd,
      minStake,
      maxSubmissionsPerUser: form.maxSubmissionsPerUser,
      autoStartSubmission: form.autoStartSubmission && !isAutoStartDisabled,
    });
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setLocalError(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />
      <section className="px-4 py-12">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
          <header>
            <h1 className="mb-2 text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
              Admin: Create Battle
            </h1>
            <p className="text-mc-text/70">
              Deploy new battles directly to the BattleManager contract. Only
              the contract owner can create battles.
            </p>
          </header>

          <div className="rounded-xl border border-primary/10 bg-mc-panel/60 p-6 shadow-lg shadow-primary/5 backdrop-blur">
            <div className="mb-6 grid gap-3 text-sm text-mc-text/80 sm:grid-cols-2">
              <div>
                <span className="font-semibold text-mc-text">Connected</span>
                <p className="break-all text-xs text-mc-text/60">
                  {isConnected && address ? address : "No wallet connected"}
                </p>
              </div>
              <div>
                <span className="font-semibold text-mc-text">
                  Contract Owner
                </span>
                <p className="break-all text-xs text-mc-text/60">
                  {ownerAddress ?? "—"}
                </p>
              </div>
              {!isOwnerConnected && (
                <div className="sm:col-span-2 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-warning text-xs">
                  Connect with the BattleManager owner wallet to create or
                  manage battles.
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-mc-text">
                  Battle Theme
                </label>
                <input
                  type="text"
                  value={form.theme}
                  onChange={(event) =>
                    handleInputChange("theme", event.target.value)
                  }
                  placeholder="e.g. Meme Wars: AI vs Humans"
                  className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-mc-text">
                    Submission Delay (minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.submissionDelayMinutes}
                    onChange={(event) =>
                      handleInputChange(
                        "submissionDelayMinutes",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-mc-text/60">
                    Start submissions immediately with 0 minutes.
                  </p>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-mc-text">
                    Max Submissions per User (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxSubmissionsPerUser}
                    onChange={(event) =>
                      handleInputChange(
                        "maxSubmissionsPerUser",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-mc-text">
                    Submission Window (hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.submissionDurationHours}
                    onChange={(event) =>
                      handleInputChange(
                        "submissionDurationHours",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isProcessing}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-mc-text">
                    Voting Window (hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.votingDurationHours}
                    onChange={(event) =>
                      handleInputChange(
                        "votingDurationHours",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-mc-text">
                    Minimum Stake (USDC)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.000001"
                    value={form.minStake}
                    onChange={(event) =>
                      handleInputChange("minStake", event.target.value)
                    }
                    className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-mc-text">
                    Auto-start Submission Phase
                  </label>
                  <select
                    value={
                      form.autoStartSubmission && !isAutoStartDisabled
                        ? "true"
                        : "false"
                    }
                    onChange={(event) =>
                      handleInputChange(
                        "autoStartSubmission",
                        event.target.value === "true"
                      )
                    }
                    className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isProcessing || isAutoStartDisabled}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                  {isAutoStartDisabled && (
                    <p className="text-xs text-warning">
                      Auto-start is disabled when submission delay is set.
                    </p>
                  )}
                </div>
              </div>

              {(localError || error) && (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{localError || error}</span>
                </div>
              )}

              {status === "success" && createdBattleId !== null && (
                <div className="flex flex-col gap-3 rounded-lg border border-positive/30 bg-positive/10 p-4 text-sm text-mc-text">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-positive" />
                    <span>Battle #{createdBattleId} created successfully!</span>
                  </div>
                  {createTxHash && (
                    <p className="break-all text-xs text-mc-text/60">
                      Creation Tx: {createTxHash}
                    </p>
                  )}
                  {startTxHash && (
                    <p className="break-all text-xs text-mc-text/60">
                      Submission Start Tx: {startTxHash}
                    </p>
                  )}
                </div>
              )}

              {warning && (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{warning}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={isProcessing || !isOwnerConnected}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-primary-700 px-6 py-3 font-semibold uppercase text-mc-bg transition-all hover:shadow-lg hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {buttonLabel}
                    </>
                  ) : (
                    buttonLabel
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="w-full rounded-lg border border-primary/20 px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Reset form
                </button>
              </div>
            </form>
          </div>

          {/* Battle Management Section */}
          <div className="rounded-xl border border-primary/10 bg-mc-panel/60 p-6 shadow-lg shadow-primary/5 backdrop-blur">
            <h2 className="mb-4 text-2xl font-bold text-mc-text">
              Manage Existing Battles
            </h2>
            <p className="mb-6 text-sm text-mc-text/70">
              Manage battle phases: start submission, start voting, or finalize
              battles.
            </p>

            {phaseError && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{phaseError}</span>
              </div>
            )}

            {phaseStatus === "success" && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-mc-text">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                <span>
                  Battle #{currentBattleId} phase updated successfully!
                </span>
              </div>
            )}

            {isLoadingBattles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : battlesError ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-warning text-sm">
                Error loading battles: {battlesError.message}
              </div>
            ) : battles.length === 0 ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center text-mc-text/70">
                No battles found. Create your first battle above!
              </div>
            ) : (
              <div className="space-y-4">
                {battles.map((battle) => {
                  const isManaging =
                    phaseStatus !== "idle" && currentBattleId === battle.id;
                  const canStartSubmission =
                    battle.state === "UPCOMING" && isPhaseOwnerConnected;
                  const canStartVoting =
                    battle.state === "SUBMISSION_OPEN" &&
                    isPhaseOwnerConnected &&
                    Date.now() / 1000 >= battle.submissionEnd;
                  const canFinalize =
                    battle.state === "VOTING_OPEN" &&
                    isPhaseOwnerConnected &&
                    Date.now() / 1000 >= battle.votingEnd;
                  const waitingForSubmissionEnd =
                    battle.state === "SUBMISSION_OPEN" &&
                    isPhaseOwnerConnected &&
                    Date.now() / 1000 < battle.submissionEnd;
                  const waitingForVotingEnd =
                    battle.state === "VOTING_OPEN" &&
                    isPhaseOwnerConnected &&
                    Date.now() / 1000 < battle.votingEnd;

                  return (
                    <div
                      key={battle.id}
                      className="rounded-lg border border-primary/20 bg-mc-surface/50 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-mc-text">
                              Battle #{battle.id}: {battle.theme}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                battle.state === "VOTING_OPEN"
                                  ? "bg-positive/20 text-positive"
                                  : battle.state === "SUBMISSION_OPEN"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-mc-text/20 text-mc-text/70"
                              }`}
                            >
                              {battle.state}
                            </span>
                          </div>
                          <Link
                            href={`/battles/${battle.id}`}
                            className="mt-1 text-sm text-primary hover:underline"
                          >
                            View Battle →
                          </Link>
                        </div>
                      </div>

                      <div className="mb-4 grid gap-2 text-sm text-mc-text/70 sm:grid-cols-2">
                        <div>
                          <span className="font-semibold text-mc-text">
                            Prize Pool:
                          </span>{" "}
                          ${battle.prizePool} USDC
                        </div>
                        <div>
                          <span className="font-semibold text-mc-text">
                            Min Stake:
                          </span>{" "}
                          ${battle.minStake} USDC
                        </div>
                        {battle.state === "SUBMISSION_OPEN" && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold text-mc-text">
                              Submission Ends:
                            </span>{" "}
                            {new Date(
                              battle.submissionEnd * 1000
                            ).toLocaleString()}
                            {Date.now() / 1000 < battle.submissionEnd && (
                              <span className="ml-2 text-warning">
                                (Voting can start after this time)
                              </span>
                            )}
                          </div>
                        )}
                        {battle.state === "VOTING_OPEN" && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold text-mc-text">
                              Voting Ends:
                            </span>{" "}
                            {new Date(battle.votingEnd * 1000).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {canStartSubmission && (
                          <button
                            onClick={() => startSubmissionPhase(battle.id)}
                            disabled={isManaging || phaseStatus !== "idle"}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-mc-bg transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isManaging &&
                            currentAction === "startSubmission" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Start Submission Phase
                              </>
                            )}
                          </button>
                        )}

                        {canStartVoting && (
                          <button
                            onClick={() => startVotingPhase(battle.id)}
                            disabled={isManaging || phaseStatus !== "idle"}
                            className="flex items-center gap-2 rounded-lg bg-positive px-4 py-2 text-sm font-semibold text-mc-bg transition-all hover:bg-positive/80 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isManaging && currentAction === "startVoting" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4" />
                                Start Voting Phase
                              </>
                            )}
                          </button>
                        )}

                        {waitingForSubmissionEnd && (
                          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              Waiting for submission phase to end (
                              {new Date(
                                battle.submissionEnd * 1000
                              ).toLocaleString()}
                              )
                            </span>
                          </div>
                        )}

                        {canFinalize && (
                          <button
                            onClick={() => finalizeBattle(battle.id)}
                            disabled={isManaging || phaseStatus !== "idle"}
                            className="flex items-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-mc-bg transition-all hover:bg-warning/80 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isManaging && currentAction === "finalize" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Finalizing...
                              </>
                            ) : (
                              <>
                                <Trophy className="h-4 w-4" />
                                Finalize Battle
                              </>
                            )}
                          </button>
                        )}

                        {waitingForVotingEnd && (
                          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              Waiting for voting phase to end (
                              {new Date(
                                battle.votingEnd * 1000
                              ).toLocaleString()}
                              )
                            </span>
                          </div>
                        )}

                        {!canStartSubmission &&
                          !canStartVoting &&
                          !canFinalize &&
                          !waitingForSubmissionEnd &&
                          !waitingForVotingEnd && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-mc-text/60">
                              No actions available for this battle state
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-primary/10 bg-mc-panel/40 p-6 text-sm text-mc-text/70">
            <h2 className="mb-3 text-lg font-bold text-mc-text">
              Battle Lifecycle
            </h2>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold text-mc-text">UPCOMING:</span>{" "}
                Newly created battles start here.
              </li>
              <li>
                <span className="font-semibold text-mc-text">
                  SUBMISSION_OPEN:
                </span>{" "}
                Triggered automatically if auto-start was enabled, or via
                `startSubmissionPhase`.
              </li>
              <li>
                <span className="font-semibold text-mc-text">VOTING_OPEN:</span>{" "}
                Call `startVotingPhase` after submissions close.
              </li>
              <li>
                <span className="font-semibold text-mc-text">
                  TALLYING & FINALIZED:
                </span>{" "}
                `finalizeBattle` distributes prizes and unlocks withdrawals.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
