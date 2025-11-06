"use client"

import { MCNavbar } from "@/components/mc-navbar"
import { TrendingUp, Zap } from "lucide-react"

const tokens = [
  { symbol: "BASE", name: "Base Token", price: "$2.45", change: "+12.5%", battles: 8 },
  { symbol: "ARB", name: "Arbitrum", price: "$1.85", change: "+8.2%", battles: 6 },
  { symbol: "OPT", name: "Optimism", price: "$3.20", change: "+15.3%", battles: 5 },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", change: "+0.1%", battles: 12 },
]

const leaderboard = [
  { rank: 1, creator: "0xAbC...", battles: 24, wins: 18, avgStake: "$425.50" },
  { rank: 2, creator: "0xDef...", battles: 18, wins: 14, avgStake: "$380.25" },
  { rank: 3, creator: "0xGhi...", battles: 15, wins: 12, avgStake: "$415.75" },
]

export default function SentimentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      {/* Header */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-4">
            Sentiment Hub
          </h1>
          <p className="text-mc-text/70 mb-12">Token battles, community leaderboards, and market sentiment</p>
        </div>
      </section>

      {/* Token Battles */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-mc-text mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            Active Token Battles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {tokens.map((token) => (
              <div
                key={token.symbol}
                className="p-6 rounded-xl bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-mc-text group-hover:text-primary transition-colors">
                      {token.symbol}
                    </h3>
                    <p className="text-sm text-mc-text/60">{token.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{token.price}</div>
                    <div className="text-sm text-positive">{token.change}</div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-mc-surface/50 rounded-lg">
                  <div className="text-xs text-mc-text/70 mb-1">Active Battles</div>
                  <div className="text-2xl font-bold text-primary">{token.battles}</div>
                </div>

                <button className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase text-sm rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all">
                  Join Battle
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-mc-text mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            Top Voters
          </h2>

          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="p-4 rounded-lg bg-gradient-to-r from-mc-panel to-mc-surface border border-primary/20 flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-mc-bg text-lg">
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-mc-text/80 mb-1">{entry.creator}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-mc-text/60">
                    <div>Battles: {entry.battles}</div>
                    <div>Wins: {entry.wins}</div>
                    <div>Avg: ${entry.avgStake}</div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded font-semibold text-sm transition-colors">
                  Vote
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
