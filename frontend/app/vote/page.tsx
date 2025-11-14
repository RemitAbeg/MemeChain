"use client";

import type React from "react";

import { useState, useMemo, useEffect } from "react";
import { MCNavbar } from "@/components/mc-navbar";
import { MemeGrid } from "@/components/meme-grid";
import { VoteCard } from "@/components/vote-card";
import { useBattles } from "@/hooks/useBattles";
import { useBattleMemes } from "@/hooks/useBattleMemes";
import { formatAddress } from "@/lib/utils";
import { TrendingUp, Flame, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

type SortType = "trending" | "top" | "new";

export default function VotePage() {
  const [selectedBattleId, setSelectedBattleId] = useState<number | null>(null);
  const [selectedMeme, setSelectedMeme] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortType>("trending");

  // Fetch all battles
  const {
    battles,
    isLoading: isLoadingBattles,
    error: battlesError,
  } = useBattles();

  // Filter battles that are in VOTING_OPEN state
  const votingBattles = useMemo(() => {
    return battles.filter((battle) => battle.state === "VOTING_OPEN");
  }, [battles]);

  // Auto-select first voting battle if available
  useEffect(() => {
    if (
      votingBattles.length > 0 &&
      (selectedBattleId === null ||
        !votingBattles.some((b) => b.id === selectedBattleId))
    ) {
      setSelectedBattleId(votingBattles[0].id);
    }
  }, [votingBattles, selectedBattleId]);

  // Fetch memes for selected battle
  const {
    memes,
    isLoading: isLoadingMemes,
    error: memesError,
    refetch: refetchMemes,
  } = useBattleMemes(selectedBattleId ?? undefined);

  // Format memes for MemeGrid
  const formattedMemes = useMemo(() => {
    return memes.map((meme) => ({
      id: meme.id,
      imageUrl: meme.imageUrl,
      creator: formatAddress(meme.creator),
      votes: meme.votes,
      weight: meme.totalVoteWeight,
    }));
  }, [memes]);

  // Find selected meme details
  const selectedMemeData = useMemo(() => {
    if (!selectedMeme) return null;
    return memes.find((m) => m.id === selectedMeme) ?? null;
  }, [selectedMeme, memes]);

  // Get selected battle details
  const selectedBattle = useMemo(() => {
    if (!selectedBattleId) return null;
    return votingBattles.find((b) => b.id === selectedBattleId) ?? null;
  }, [selectedBattleId, votingBattles]);

  const sortButtons: {
    id: SortType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "trending",
      label: "Rising",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    { id: "top", label: "Top Today", icon: <Flame className="w-4 h-4" /> },
    { id: "new", label: "New", icon: null },
  ];

  // Loading state
  if (isLoadingBattles) {
    return (
      <div className="min-h-screen bg-linear-to-br from-mc-bg via-mc-surface to-mc-bg">
        <MCNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-mc-text/70">Loading battles...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (battlesError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-mc-bg via-mc-surface to-mc-bg">
        <MCNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <p className="text-mc-text/70 mb-2">Error loading battles</p>
            <p className="text-sm text-mc-text/50">{battlesError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // No voting battles available
  if (votingBattles.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-mc-bg via-mc-surface to-mc-bg">
        <MCNavbar />
        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary to-accent mb-2">
              Vote Now
            </h1>
            <p className="text-mc-text/70 mb-8">
              Stake USDC on your favorite memes
            </p>
            <div className="p-12 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 text-center">
              <Flame className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <p className="text-mc-text/70 mb-2">No battles in voting phase</p>
              <p className="text-sm text-mc-text/50 mb-4">
                Check back later or browse other battles
              </p>
              <Link
                href="/battles"
                className="px-4 py-2 bg-primary text-mc-bg rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-block"
              >
                View All Battles
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary to-accent mb-2">
            Vote Now
          </h1>
          <p className="text-mc-text/70 mb-8">
            Stake USDC on your favorite memes
          </p>

          {/* Battle Selector */}
          {votingBattles.length > 1 && (
            <div className="mb-6">
              <label className="text-sm font-semibold text-mc-text mb-2 block">
                Select Battle
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {votingBattles.map((battle) => (
                  <button
                    key={battle.id}
                    onClick={() => {
                      setSelectedBattleId(battle.id);
                      setSelectedMeme(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      selectedBattleId === battle.id
                        ? "bg-linear-to-r from-primary to-primary-700 text-mc-bg"
                        : "bg-mc-panel border border-primary/20 text-mc-text hover:border-primary/40"
                    }`}
                  >
                    {battle.theme}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Meme List */}
            <div className="lg:col-span-2 space-y-8">
              {/* Sort */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {sortButtons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setSortBy(btn.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      sortBy === btn.id
                        ? "bg-linear-to-r from-primary to-primary-700 text-mc-bg"
                        : "bg-mc-panel border border-primary/20 text-mc-text hover:border-primary/40"
                    }`}
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Meme Grid */}
              {isLoadingMemes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : memesError ? (
                <div className="p-6 rounded-xl border border-warning/30 bg-warning/10 text-center">
                  <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
                  <p className="text-warning text-sm">
                    Error loading memes: {memesError.message}
                  </p>
                </div>
              ) : formattedMemes.length > 0 ? (
                <MemeGrid
                  memes={formattedMemes}
                  isVoting={true}
                  onVote={setSelectedMeme}
                />
              ) : (
                <div className="p-12 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 text-center">
                  <Flame className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                  <p className="text-mc-text/70 mb-2">
                    No memes submitted yet for this battle
                  </p>
                  <p className="text-sm text-mc-text/50">
                    Be the first to submit a meme!
                  </p>
                </div>
              )}
            </div>

            {/* Vote Card Sidebar */}
            <div>
              {selectedMeme && selectedMemeData && selectedBattle ? (
                <div className="sticky top-24 space-y-4">
                  <h3 className="font-bold text-mc-text">Quick Vote</h3>
                  <VoteCard
                    battleId={selectedBattle.id}
                    memeId={selectedMeme}
                    imageUrl={selectedMemeData.imageUrl}
                    creator={formatAddress(selectedMemeData.creator)}
                    votes={selectedMemeData.votes}
                    weight={selectedMemeData.totalVoteWeight}
                    minStake={selectedBattle.minStake}
                    onVoteSuccess={() => {
                      // Refetch memes to update vote weights
                      void refetchMemes();
                    }}
                  />
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-linear-to-br from-mc-panel to-mc-surface border border-primary/20 text-center">
                  <Flame className="w-12 h-12 text-warning/50 mx-auto mb-4" />
                  <p className="text-mc-text/60">Select a meme to vote</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
