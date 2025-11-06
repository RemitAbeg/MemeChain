"use client"

import { useState } from "react"
import { MCNavbar } from "@/components/mc-navbar"
import { BattleCard } from "@/components/battle-card"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"

// Mock data
const mockBattles = [
  {
    id: 1,
    theme: "Doge vs Pepe: The Ultimate Roast",
    state: "VOTING_OPEN",
    prizePool: "5,000",
    memesCount: 42,
    submissionEnd: Math.floor(Date.now() / 1000) + 3600,
    votingEnd: Math.floor(Date.now() / 1000) + 7200,
  },
  {
    id: 2,
    theme: "Bull Market Drip Memes",
    state: "SUBMISSION_OPEN",
    prizePool: "3,500",
    memesCount: 28,
    submissionEnd: Math.floor(Date.now() / 1000) + 1800,
    votingEnd: Math.floor(Date.now() / 1000) + 7200,
  },
  {
    id: 3,
    theme: "AI vs Humans — Funniest Take",
    state: "UPCOMING",
    prizePool: "7,200",
    memesCount: 0,
    submissionEnd: Math.floor(Date.now() / 1000) + 86400,
    votingEnd: Math.floor(Date.now() / 1000) + 172800,
  },
  {
    id: 4,
    theme: "Web3 Summer Vibes",
    state: "FINALIZED",
    prizePool: "4,800",
    memesCount: 35,
    submissionEnd: Math.floor(Date.now() / 1000) - 86400,
    votingEnd: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: 5,
    theme: "Crypto Winter Survival Guides",
    state: "VOTING_OPEN",
    prizePool: "6,100",
    memesCount: 31,
    submissionEnd: Math.floor(Date.now() / 1000) + 2400,
    votingEnd: Math.floor(Date.now() / 1000) + 8400,
  },
  {
    id: 6,
    theme: "NFT PFP Chaos",
    state: "SUBMISSION_OPEN",
    prizePool: "4,200",
    memesCount: 19,
    submissionEnd: Math.floor(Date.now() / 1000) + 1200,
    votingEnd: Math.floor(Date.now() / 1000) + 5400,
  },
]

type TabType = "live" | "upcoming" | "past"

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("live")

  const filteredBattles = mockBattles.filter((battle) => {
    if (activeTab === "live") return ["SUBMISSION_OPEN", "VOTING_OPEN"].includes(battle.state)
    if (activeTab === "upcoming") return battle.state === "UPCOMING"
    if (activeTab === "past") return ["FINALIZED", "ARCHIVED"].includes(battle.state)
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      <HeroSection />

      <FeaturesSection />

      {/* Battles Section */}
      <section className="px-4 md:px-6 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-12">
            <h2
              className="text-4xl md:text-5xl font-black mb-4 gradient-text"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              ACTIVE BATTLES
            </h2>
            <p className="text-lg text-mc-text/70">Join the fiercest meme battles happening right now</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 md:gap-4 mb-12 pb-4 border-b border-primary/20 overflow-x-auto">
            {(["live", "upcoming", "past"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-bold uppercase text-sm whitespace-nowrap transition-all relative ${
                  activeTab === tab ? "text-primary" : "text-mc-text/60 hover:text-mc-text/80"
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
          {filteredBattles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBattles.map((battle) => (
                <BattleCard key={battle.id} {...battle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-7xl mb-4">🏆</div>
              <p className="text-xl text-mc-text/60">No battles yet in this category</p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-primary/10 mt-20 px-4 md:px-6 py-12 bg-mc-surface/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Product
              </h4>
              <ul className="space-y-2 text-sm text-mc-text/60">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Battles
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Gallery
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Community
              </h4>
              <ul className="space-y-2 text-sm text-mc-text/60">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Leaderboard
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-mc-text/60">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Network
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-positive rounded-full animate-pulse"></div>
                <span className="text-sm text-mc-text/60">Base Mainnet</span>
              </div>
            </div>
          </div>
          <div className="border-t border-primary/10 pt-8 text-center text-sm text-mc-text/40">
            © 2025 MemeChain. All rights reserved. | Built on Base | Power by Crypto
          </div>
        </div>
      </footer>
    </div>
  )
}
