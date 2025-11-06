"use client"

import type React from "react"

import { useState } from "react"
import { MCNavbar } from "@/components/mc-navbar"
import { MemeGrid } from "@/components/meme-grid"
import { VoteCard } from "@/components/vote-card"
import { TrendingUp, Flame } from "lucide-react"

const mockMemes = [
  { id: 1, imageUrl: "Meme 1", creator: "0xAbC...", votes: 145, weight: "2,450.50" },
  { id: 2, imageUrl: "Meme 2", creator: "0xDef...", votes: 98, weight: "1,820.25" },
  { id: 3, imageUrl: "Meme 3", creator: "0xGhi...", votes: 203, weight: "3,200.75" },
  { id: 4, imageUrl: "Meme 4", creator: "0xJkl...", votes: 67, weight: "1,050.00" },
]

type SortType = "trending" | "top" | "new"

export default function VotePage() {
  const [selectedMeme, setSelectedMeme] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<SortType>("trending")

  const sortButtons: { id: SortType; label: string; icon: React.ReactNode }[] = [
    { id: "trending", label: "Rising", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "top", label: "Top Today", icon: <Flame className="w-4 h-4" /> },
    { id: "new", label: "New", icon: null },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            Vote Now
          </h1>
          <p className="text-mc-text/70 mb-8">Stake USDC on your favorite memes</p>

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
                        ? "bg-gradient-to-r from-primary to-primary-700 text-mc-bg"
                        : "bg-mc-panel border border-primary/20 text-mc-text hover:border-primary/40"
                    }`}
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Meme Grid */}
              <MemeGrid memes={mockMemes} isVoting onVote={setSelectedMeme} />
            </div>

            {/* Vote Card Sidebar */}
            <div>
              {selectedMeme && (
                <div className="sticky top-24 space-y-4">
                  <h3 className="font-bold text-mc-text">Quick Vote</h3>
                  <VoteCard
                    memeId={selectedMeme}
                    imageUrl="Meme Image"
                    creator="0xAbC..."
                    votes={145}
                    weight="2,450.50"
                    minStake="1.0"
                    onVote={(amount) => console.log("Voted with", amount)}
                  />
                </div>
              )}

              {!selectedMeme && (
                <div className="p-6 rounded-xl bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20 text-center">
                  <Flame className="w-12 h-12 text-warning/50 mx-auto mb-4" />
                  <p className="text-mc-text/60">Select a meme to vote</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
