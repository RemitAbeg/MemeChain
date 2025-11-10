"use client";

import { Users } from "lucide-react";
import { PhaseChip } from "./phase-chip";
import Link from "next/link";

interface BattleCardProps {
  id: number;
  theme: string;
  state: string;
  prizePool: string;
  memesCount: number;
  minStake: string;
  submissionStart?: number;
  submissionEnd?: number;
  votingEnd?: number;
}

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) return "TBD";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function BattleCard({
  id,
  theme,
  state,
  prizePool,
  memesCount,
  minStake,
  submissionStart,
  submissionEnd,
  votingEnd,
}: BattleCardProps) {
  const nextMilestoneLabel =
    state === "UPCOMING"
      ? "Submissions Open"
      : state === "SUBMISSION_OPEN"
      ? "Submissions Close"
      : state === "VOTING_OPEN"
      ? "Voting Ends"
      : "Completed";

  const nextMilestoneDate =
    state === "UPCOMING"
      ? formatDateTime(submissionStart)
      : state === "SUBMISSION_OPEN"
      ? formatDateTime(submissionEnd)
      : state === "VOTING_OPEN"
      ? formatDateTime(votingEnd)
      : formatDateTime(votingEnd);

  return (
    <Link href={`/battles/${id}`}>
      <div className="group relative p-6 rounded-xl bg-linear-to-br from-mc-panel to-mc-surface border border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer overflow-hidden">
        <div className="absolute -top-1 -right-1 w-24 h-24 bg-linear-to-br from-primary/20 to-transparent rounded-full blur-3xl group-hover:from-primary/40 transition-all" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <p className="text-xs uppercase tracking-widest text-mc-text/60">
                Battle #{id}
              </p>
              <h3 className="text-xl font-bold text-mc-text group-hover:text-primary transition-colors line-clamp-2">
                {theme}
              </h3>
            </div>
            <PhaseChip phase={state as any} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-mc-surface/50 rounded-lg p-3 border border-primary/10">
              <div className="text-xs text-mc-text/70 uppercase tracking-wide mb-1">
                Prize Pool
              </div>
              <div className="text-lg font-bold text-primary">${prizePool}</div>
            </div>
            <div className="bg-mc-surface/50 rounded-lg p-3 border border-primary/10">
              <div className="flex items-center gap-2 text-xs text-mc-text/70 uppercase tracking-wide mb-1">
                <Users className="w-3 h-3" />
                Memes
              </div>
              <div className="text-lg font-bold text-positive">
                {memesCount}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-mc-surface/40 rounded-lg p-3 border border-primary/10">
              <p className="text-xs uppercase tracking-widest text-mc-text/60">
                Minimum Stake
              </p>
              <div className="text-sm font-semibold text-mc-text">
                {minStake === "0" ? "No minimum" : `${minStake} USDC`}
              </div>
            </div>
            <div className="bg-mc-surface/40 rounded-lg p-3 border border-primary/10">
              <p className="text-xs uppercase tracking-widest text-mc-text/60">
                {nextMilestoneLabel}
              </p>
              <div className="text-sm font-semibold text-mc-text">
                {nextMilestoneDate}
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 px-4 bg-linear-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase text-sm rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all group-hover:scale-105">
            Enter Battle
          </button>
        </div>
      </div>
    </Link>
  );
}
