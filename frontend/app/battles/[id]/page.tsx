"use client"

import { useState } from "react"
import { MCNavbar } from "@/components/mc-navbar"
import { PhaseChip } from "@/components/phase-chip"
import { Countdown } from "@/components/countdown"
import { PrizeMeter } from "@/components/prime-meter"
import { MemeGrid } from "@/components/meme-grid"
import { VoteCard } from "@/components/vote-card"
import { Upload, Users, Zap } from "lucide-react"

// Mock data
const mockBattle = {
  id: 1,
  theme: "Doge vs Pepe: The Ultimate Roast",
  state: "VOTING_OPEN",
  prizePool: 5000,
  currentPool: 4200,
  minStake: "1.0",
  submissionEnd: Math.floor(Date.now() / 1000) + 7200,
  votingEnd: Math.floor(Date.now() / 1000) + 14400,
}

const mockMemes = [
  { id: 1, imageUrl: "Meme 1", creator: "0xAbC...", votes: 145, weight: "2,450.50" },
  { id: 2, imageUrl: "Meme 2", creator: "0xDef...", votes: 98, weight: "1,820.25" },
  { id: 3, imageUrl: "Meme 3", creator: "0xGhi...", votes: 203, weight: "3,200.75" },
  { id: 4, imageUrl: "Meme 4", creator: "0xJkl...", votes: 67, weight: "1,050.00" },
  { id: 5, imageUrl: "Meme 5", creator: "0xMno...", votes: 112, weight: "1,875.50" },
  { id: 6, imageUrl: "Meme 6", creator: "0xPqr...", votes: 89, weight: "1,425.25" },
]

interface PageProps {
  params: {
    id: string
  }
}

export default function BattleDetailPage({ params }: PageProps) {
  const [selectedMeme, setSelectedMeme] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      {/* Header */}
      <section className="sticky top-16 z-40 bg-gradient-to-b from-mc-panel to-mc-surface/50 backdrop-blur-md border-b border-primary/20 px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                {mockBattle.theme}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <PhaseChip phase={mockBattle.state as any} />
                <div className="text-sm text-mc-text/70">ID: {params.id}</div>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <Countdown endTime={mockBattle.votingEnd} />
            </div>
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
              {mockBattle.state === "SUBMISSION_OPEN" && (
                <div className="p-8 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-mc-text">Submit Your Meme</h3>
                      <p className="text-sm text-mc-text/60">JPG, PNG, GIF, WebP (max 10MB)</p>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all">
                    Upload Meme
                  </button>
                </div>
              )}

              {/* Voting Grid */}
              <div>
                <h2 className="text-2xl font-bold text-mc-text mb-6 flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  Submitted Memes
                </h2>
                <MemeGrid memes={mockMemes} isVoting={mockBattle.state === "VOTING_OPEN"} />
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
                <PrizeMeter current={mockBattle.currentPool} target={mockBattle.prizePool} currency="USDC" />
                <button className="w-full mt-4 py-2 px-4 bg-mc-surface border border-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors text-sm">
                  Fund Prize
                </button>
              </div>

              {/* Vote Card for Desktop */}
              {selectedMeme && (
                <div>
                  <h3 className="font-bold text-mc-text mb-3">Quick Vote</h3>
                  <VoteCard
                    memeId={selectedMeme}
                    imageUrl="Meme Image"
                    creator="0xAbC..."
                    votes={145}
                    weight="2,450.50"
                    minStake={mockBattle.minStake}
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
                    <span className="text-primary font-bold">${mockBattle.minStake}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-mc-text/70">Total Memes</span>
                    <span className="text-primary font-bold">{mockMemes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-mc-text/70">Prize Distribution</span>
                    <span className="text-mc-text/60 text-xs">50% / 30% / 20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
