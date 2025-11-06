"use client";

import { useState, useMemo } from "react";
import { MCNavbar } from "@/components/mc-navbar";
import { PhaseChip } from "@/components/phase-chip";
import { Countdown } from "@/components/countdown";
import { PrizeMeter } from "@/components/prime-meter";
import { MemeGrid } from "@/components/meme-grid";
import { VoteCard } from "@/components/vote-card";
import { useBattle } from "@/hooks/useBattle";
import { useBattleMemes } from "@/hooks/useBattleMemes";
import { formatAddress } from "@/lib/utils";
import { Upload, Users, Zap, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

export default function BattleDetailPage({ params }: PageProps) {
  const [selectedMeme, setSelectedMeme] = useState<number | null>(null);

  // Parse battle ID from params
  const battleId = useMemo(() => {
    const id = parseInt(params.id, 10);
    return isNaN(id) ? undefined : id;
  }, [params.id]);

  // Fetch battle data
  const {
    battle,
    isLoading: isLoadingBattle,
    error: battleError,
  } = useBattle(battleId);

  // Fetch memes for this battle
  const {
    memes,
    isLoading: isLoadingMemes,
    error: memesError,
  } = useBattleMemes(battleId);

  // Find selected meme details
  const selectedMemeData = useMemo(() => {
    if (!selectedMeme || !memes) return null;
    return memes.find((m) => m.id === selectedMeme);
  }, [selectedMeme, memes]);

  // Convert prize pool string to number for PrizeMeter
  const prizePoolNumber = useMemo(() => {
    if (!battle?.prizePool) return 0;
    return parseFloat(battle.prizePool.replace(/,/g, "")) || 0;
  }, [battle?.prizePool]);

  // Determine which countdown to show based on battle state
  const countdownEndTime = useMemo(() => {
    if (!battle) return 0;
    if (battle.state === "SUBMISSION_OPEN") return battle.submissionEnd;
    if (battle.state === "VOTING_OPEN") return battle.votingEnd;
    return battle.votingEnd;
  }, [battle]);

  // Loading state
  if (isLoadingBattle || isLoadingMemes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
        <MCNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-mc-text/70">Loading battle details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (battleError || memesError || !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
        <MCNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <p className="text-mc-text/70 mb-2">Error loading battle details</p>
            <p className="text-sm text-mc-text/50 mb-4">
              {battleError?.message ||
                memesError?.message ||
                "Battle not found"}
            </p>
            <Link
              href="/battles"
              className="px-4 py-2 bg-primary text-mc-bg rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Back to Battles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Map memes to format expected by MemeGrid
  const formattedMemes = useMemo(() => {
    return memes.map((meme) => ({
      id: meme.id,
      imageUrl: meme.imageUrl,
      creator: formatAddress(meme.creator),
      votes: meme.votes,
      weight: meme.totalVoteWeight,
    }));
  }, [memes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      {/* Header */}
      <section className="sticky top-16 z-40 bg-gradient-to-b from-mc-panel to-mc-surface/50 backdrop-blur-md border-b border-primary/20 px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                {battle.theme}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <PhaseChip phase={battle.state as any} />
                <div className="text-sm text-mc-text/70">ID: {params.id}</div>
              </div>
            </div>
            {countdownEndTime > 0 && (
              <div className="w-full sm:w-auto">
                <Countdown endTime={countdownEndTime} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Meme Grid */}
            <div className="lg:col-span-2 space-y-8">
              {/* Submission Section */}
              {battle.state === "SUBMISSION_OPEN" && (
                <div className="p-8 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-mc-text">
                        Submit Your Meme
                      </h3>
                      <p className="text-sm text-mc-text/60">
                        JPG, PNG, GIF, WebP (max 10MB)
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/submit?battleId=${battle.id}`}
                    className="block w-full py-3 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all text-center"
                  >
                    Upload Meme
                  </Link>
                </div>
              )}

              {/* Voting Grid */}
              <div>
                <h2 className="text-2xl font-bold text-mc-text mb-6 flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  Submitted Memes ({memes.length})
                </h2>
                {formattedMemes.length > 0 ? (
                  <MemeGrid
                    memes={formattedMemes}
                    isVoting={battle.state === "VOTING_OPEN"}
                    onVote={(memeId) => setSelectedMeme(memeId)}
                  />
                ) : (
                  <div className="p-12 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 text-center">
                    <Users className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                    <p className="text-mc-text/70 mb-2">
                      No memes submitted yet
                    </p>
                    <p className="text-sm text-mc-text/50">
                      {battle.state === "SUBMISSION_OPEN"
                        ? "Be the first to submit a meme!"
                        : "This battle hasn't started yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              {/* Prize Panel */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20">
                <h3 className="font-bold text-mc-text mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning" />
                  Prize Pool
                </h3>
                <PrizeMeter
                  current={prizePoolNumber}
                  target={prizePoolNumber || 1}
                  currency="USDC"
                />
                <button className="w-full mt-4 py-2 px-4 bg-mc-surface border border-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors text-sm">
                  Fund Prize
                </button>
              </div>

              {/* Vote Card for Desktop */}
              {selectedMeme && selectedMemeData && (
                <div>
                  <h3 className="font-bold text-mc-text mb-3">Quick Vote</h3>
                  <VoteCard
                    memeId={selectedMeme}
                    imageUrl={selectedMemeData.imageUrl}
                    creator={formatAddress(selectedMemeData.creator)}
                    votes={selectedMemeData.votes}
                    weight={selectedMemeData.totalVoteWeight}
                    minStake={battle.minStake}
                    onVote={(amount) => console.log("Voted with", amount)}
                  />
                </div>
              )}

              {/* Battle Info */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20 space-y-4">
                <h3 className="font-bold text-mc-text mb-4">Battle Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-mc-text/70">Min Stake</span>
                    <span className="text-primary font-bold">
                      ${battle.minStake}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-mc-text/70">Total Memes</span>
                    <span className="text-primary font-bold">
                      {memes.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-mc-text/70">Max Submissions</span>
                    <span className="text-primary font-bold">
                      {battle.maxSubmissionsPerUser}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-mc-text/70">Prize Distribution</span>
                    <span className="text-mc-text/60 text-xs">
                      50% / 30% / 20%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
