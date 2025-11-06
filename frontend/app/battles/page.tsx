"use client";

import { useState, useMemo } from "react";
import { MCNavbar } from "@/components/mc-navbar";
import { BattleCard } from "@/components/battle-card";
import { useBattles } from "@/hooks/useBattles";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import {
  Zap,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Flame,
  Wallet,
} from "lucide-react";
import Link from "next/link";

type TabType = "live" | "upcoming" | "past";

export default function BattlesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("live");
  const { battles, isLoading, error } = useBattles();
  const {
    formattedBalance,
    isLoading: isLoadingBalance,
    isConnected,
  } = useUSDCBalance();

  const filteredBattles = useMemo(() => {
    if (!battles) return [];

    return battles.filter((battle) => {
      if (activeTab === "live")
        return ["SUBMISSION_OPEN", "VOTING_OPEN"].includes(battle.state);
      if (activeTab === "upcoming") return battle.state === "UPCOMING";
      if (activeTab === "past")
        return ["FINALIZED", "ARCHIVED"].includes(battle.state);
      return true;
    });
  }, [battles, activeTab]);

  // Calculate stats from battles
  const stats = useMemo(() => {
    if (!battles) {
      return {
        totalBattles: 0,
        totalPrizePool: 0,
        totalMemes: 0,
        liveBattles: 0,
      };
    }

    const liveBattles = battles.filter((b) =>
      ["SUBMISSION_OPEN", "VOTING_OPEN"].includes(b.state)
    ).length;

    const totalPrizePool = battles.reduce((sum, battle) => {
      const prize = parseFloat(battle.prizePool.replace(/,/g, "")) || 0;
      return sum + prize;
    }, 0);

    const totalMemes = battles.reduce(
      (sum, battle) => sum + battle.memesCount,
      0
    );

    return {
      totalBattles: battles.length,
      totalPrizePool,
      totalMemes,
      liveBattles,
    };
  }, [battles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <Flame className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Live Arena
            </span>
            <Zap className="w-4 h-4 text-accent" />
          </div>

          <h1
            className="text-5xl md:text-7xl font-black mb-6 gradient-text"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            MEME BATTLES
          </h1>

          <p className="text-lg md:text-xl text-mc-text/70 max-w-2xl mx-auto mb-12">
            Enter the arena where memes clash, creators compete, and legends are
            born. Stake your USDC, submit your best work, and claim your
            victory.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 max-w-5xl mx-auto">
            <div className="card-glass p-6 text-center group hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-black text-primary mb-1">
                {stats.totalBattles}
              </div>
              <div className="text-xs text-mc-text/60 uppercase tracking-wide">
                Total Battles
              </div>
            </div>

            <div className="card-glass p-6 text-center group hover:shadow-lg hover:shadow-accent/30 transition-all hover:-translate-y-1">
              <Zap className="w-8 h-8 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-black text-accent mb-1">
                $
                {stats.totalPrizePool.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="text-xs text-mc-text/60 uppercase tracking-wide">
                Prize Pool
              </div>
            </div>

            <div className="card-glass p-6 text-center group hover:shadow-lg hover:shadow-positive/30 transition-all hover:-translate-y-1">
              <Users className="w-8 h-8 text-positive mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-black text-positive mb-1">
                {stats.totalMemes}
              </div>
              <div className="text-xs text-mc-text/60 uppercase tracking-wide">
                Total Memes
              </div>
            </div>

            <div className="card-glass p-6 text-center group hover:shadow-lg hover:shadow-warning/30 transition-all hover:-translate-y-1">
              <Flame className="w-8 h-8 text-warning mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-black text-warning mb-1">
                {stats.liveBattles}
              </div>
              <div className="text-xs text-mc-text/60 uppercase tracking-wide">
                Live Now
              </div>
            </div>

            {/* USDC Balance - Only show if connected */}
            {isConnected && (
              <div className="card-glass p-4 md:p-6 text-center group hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1 border-2 border-primary/30 min-w-0 overflow-hidden">
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-base md:text-lg lg:text-xl font-black text-primary mb-1 min-h-6 flex items-center justify-center">
                  {isLoadingBalance ? (
                    <span className="text-mc-text/40">...</span>
                  ) : (
                    <span
                      className="truncate max-w-full"
                      title={`$${formattedBalance}`}
                    >
                      ${formattedBalance}
                    </span>
                  )}
                </div>
                <div className="text-xs text-mc-text/60 uppercase tracking-wide">
                  Your USDC
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Battles Section */}
      <section className="px-4 md:px-6 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-4xl md:text-5xl font-black mb-4 gradient-text"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  ACTIVE BATTLES
                </h2>
                <p className="text-lg text-mc-text/70">
                  Join the fiercest meme battles happening right now
                </p>
              </div>
              <Link
                href="/submit"
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-bold uppercase text-sm hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                Create Battle
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 md:gap-4 mb-12 pb-4 border-b border-primary/20 overflow-x-auto">
            {(["live", "upcoming", "past"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-bold uppercase text-sm whitespace-nowrap transition-all relative ${
                  activeTab === tab
                    ? "text-primary"
                    : "text-mc-text/60 hover:text-mc-text/80"
                }`}
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Battles
                {activeTab === tab && (
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Battle Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-4 animate-pulse">⚔️</div>
              <p className="text-xl text-mc-text/60">Loading battles...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-4">⚠️</div>
              <p className="text-xl text-mc-text/60">Error loading battles</p>
              <p className="text-sm text-mc-text/40 mt-2">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : filteredBattles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBattles.map((battle) => (
                <BattleCard
                  key={battle.id}
                  id={battle.id}
                  theme={battle.theme}
                  state={battle.state}
                  prizePool={battle.prizePool}
                  memesCount={battle.memesCount}
                  submissionEnd={battle.submissionEnd}
                  votingEnd={battle.votingEnd}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-7xl mb-4">🏆</div>
              <p className="text-xl text-mc-text/60 mb-4">
                No battles yet in this category
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-bold uppercase text-sm hover:shadow-lg hover:shadow-primary/50 transition-all"
              >
                <Zap className="w-4 h-4" />
                Create First Battle
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 md:px-6 py-20 bg-mc-surface/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2
              className="text-4xl md:text-5xl font-black mb-4 gradient-text"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              HOW IT WORKS
            </h2>
            <p className="text-lg text-mc-text/70 max-w-2xl mx-auto">
              From submission to victory, here's how you dominate the arena
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Submit Your Meme",
                description:
                  "Choose a battle theme and submit your best meme. Stake USDC to enter and compete.",
                icon: Zap,
                color: "primary",
              },
              {
                step: "02",
                title: "Vote & Compete",
                description:
                  "Community members vote with their USDC stakes. Higher stakes = more voting power.",
                icon: TrendingUp,
                color: "accent",
              },
              {
                step: "03",
                title: "Claim Rewards",
                description:
                  "Winners take home the prize pool and mint exclusive NFTs. Losers get their stake back.",
                icon: Trophy,
                color: "positive",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              const colorClass =
                item.color === "primary"
                  ? "text-primary"
                  : item.color === "accent"
                  ? "text-accent"
                  : "text-positive";

              return (
                <div
                  key={i}
                  className="card-glass p-8 group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className={`w-8 h-8 ${colorClass}`} />
                      </div>
                      <div
                        className="text-4xl font-black text-mc-text/20"
                        style={{ fontFamily: "var(--font-orbitron)" }}
                      >
                        {item.step}
                      </div>
                    </div>

                    <h3
                      className="text-2xl font-bold mb-3 uppercase tracking-wide"
                      style={{ fontFamily: "var(--font-electrolize)" }}
                    >
                      {item.title}
                    </h3>

                    <p className="text-mc-text/70 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="card-glass p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"></div>
            <div className="relative z-10">
              <Trophy className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse" />
              <h2
                className="text-3xl md:text-4xl font-black mb-4 gradient-text"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                READY TO BATTLE?
              </h2>
              <p className="text-lg text-mc-text/70 mb-8 max-w-2xl mx-auto">
                Join thousands of creators competing for glory, rewards, and
                exclusive NFTs. The arena awaits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/submit"
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-bold uppercase text-sm hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Start Battling
                </Link>
                <Link
                  href="/gallery"
                  className="px-8 py-4 border-2 border-primary/50 text-primary rounded-lg font-bold uppercase text-sm hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all"
                >
                  View Gallery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
