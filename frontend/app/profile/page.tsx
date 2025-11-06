"use client"

import { useState } from "react"
import { MCNavbar } from "@/components/mc-navbar"
import { Flame, Award, ImageIcon, History } from "lucide-react"

type TabType = "submitted" | "votes" | "nfts" | "rewards"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>("submitted")

  const tabs = [
    { id: "submitted", label: "Submitted", icon: ImageIcon },
    { id: "votes", label: "Voting History", icon: History },
    { id: "nfts", label: "Owned NFTs", icon: Award },
    { id: "rewards", label: "Rewards", icon: ImageIcon },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      {/* Profile Header */}
      <section className="px-4 py-12 bg-gradient-to-b from-mc-panel/50 to-transparent">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary mb-2">0xAbC...1234</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-warning" />
                  <span className="font-bold text-warning">12 Win Streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Wins", value: "24", color: "positive" },
              { label: "NFTs Minted", value: "24", color: "primary" },
              { label: "Total Staked", value: "$42.5K", color: "warning" },
              { label: "Rewards Earned", value: "$8.2K", color: "accent" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-lg bg-mc-surface border border-primary/20">
                <div className="text-xs text-mc-text/70 mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-4 mb-8 border-b border-primary/20 pb-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary -mb-4 pb-6"
                      : "text-mc-text/60 hover:text-mc-text"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === "submitted" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-mc-surface border border-primary/20 overflow-hidden group cursor-pointer"
                  >
                    <div className="aspect-square bg-primary/10 flex items-center justify-center text-mc-text/40 group-hover:bg-primary/20 transition-colors">
                      Meme {i}
                    </div>
                    <div className="p-3 text-xs text-mc-text/70">Battle #{Math.ceil(i / 2)}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "votes" && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-mc-surface border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-mc-text">Battle #{i}</span>
                      <span className="text-xs text-mc-text/60">2 days ago</span>
                    </div>
                    <div className="text-sm text-mc-text/70 mb-2">Staked: $50 USDC</div>
                    <div className="text-sm font-bold text-positive">Reward: $12.50</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "nfts" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20 overflow-hidden group cursor-pointer"
                  >
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-mc-text/40 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                      NFT #{i}
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-bold text-primary mb-1">Rank #{i}</div>
                      <div className="text-xs text-mc-text/60">Battle #{Math.ceil(i / 2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "rewards" && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-mc-surface border border-positive/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-mc-text">Reward Claim #{i}</span>
                      <span className={`text-xs font-bold ${i === 1 ? "text-mc-text/40" : "text-positive"}`}>
                        {i === 1 ? "Pending" : "Claimed"}
                      </span>
                    </div>
                    <div className="text-sm text-mc-text/70 mb-3">Amount: $25.00 USDC</div>
                    {i === 1 && (
                      <button className="w-full py-2 bg-positive text-mc-bg font-bold rounded text-sm hover:shadow-lg hover:shadow-positive/50 transition-all">
                        Claim Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
