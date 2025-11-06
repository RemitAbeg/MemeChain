"use client"

import { MCNavbar } from "@/components/mc-navbar"
import { PhaseChip } from "@/components/phase-chip"
import { Podium } from "@/components/podium"
import { Share2, Trophy } from "lucide-react"

const mockWinners = [
  { rank: 1 as const, creator: "0xAbC...", votes: 203, weight: "3,200.75", imageUrl: "Winner 1" },
  { rank: 2 as const, creator: "0xDef...", votes: 145, weight: "2,450.50", imageUrl: "Winner 2" },
  { rank: 3 as const, creator: "0xGhi...", votes: 112, weight: "1,875.50", imageUrl: "Winner 3" },
]

interface PageProps {
  params: {
    id: string
  }
}

export default function BattleResultsPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      {/* Header */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <PhaseChip phase="FINALIZED" />
          <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary my-6 text-balance">
            Victory Royale!
          </h1>
          <p className="text-xl text-mc-text/70 mb-8">Doge vs Pepe: The Ultimate Roast</p>
        </div>
      </section>

      {/* Podium */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-mc-panel to-mc-surface rounded-2xl p-8 sm:p-12 border border-primary/20 mb-8">
            <Podium winners={mockWinners} />
          </div>

          {/* Share Section */}
          <div className="bg-gradient-to-br from-mc-panel to-mc-surface rounded-xl p-6 border border-primary/20">
            <h3 className="font-bold text-mc-text mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Your Victory
            </h3>
            <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all">
              Share on Twitter
            </button>
          </div>

          {/* Claim Info */}
          <div className="mt-8 p-6 rounded-xl bg-positive/10 border border-positive/30 text-center">
            <Trophy className="w-8 h-8 text-positive mx-auto mb-3" />
            <p className="text-sm text-mc-text mb-3">
              Winners can claim their NFT badges and withdraw rewards starting now.
            </p>
            <button className="px-6 py-2 bg-positive text-mc-bg font-bold rounded-lg hover:shadow-lg hover:shadow-positive/50 transition-all text-sm">
              Claim NFT & Reward
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
