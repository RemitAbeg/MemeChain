"use client"

import type React from "react"

import { useState } from "react"
import { MCNavbar } from "@/components/mc-navbar"
import { Settings, Play, Pause, CheckCircle } from "lucide-react"

interface BattleForm {
  theme: string
  minStake: string
  maxSubmissions: string
  submissionHours: string
  votingHours: string
  prizePool: string
}

export default function AdminPage() {
  const [formData, setFormData] = useState<BattleForm>({
    theme: "",
    minStake: "1.0",
    maxSubmissions: "1",
    submissionHours: "24",
    votingHours: "24",
    prizePool: "0",
  })

  const [activeBattles] = useState([
    {
      id: 1,
      theme: "Doge vs Pepe: The Ultimate Roast",
      state: "VOTING_OPEN",
      prizePool: "5000",
      memesCount: 42,
    },
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateBattle = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating battle:", formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary">Admin Control</h1>
              <p className="text-mc-text/70">Manage battles and prize pools</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create Battle Form */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20">
              <h2 className="text-2xl font-bold text-mc-text mb-6">Create New Battle</h2>
              <form onSubmit={handleCreateBattle} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-mc-text mb-2">Battle Theme</label>
                  <input
                    type="text"
                    name="theme"
                    value={formData.theme}
                    onChange={handleInputChange}
                    placeholder="e.g., Doge vs Pepe"
                    className="w-full px-4 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text placeholder:text-mc-text/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-mc-text mb-2">Min Stake (USDC)</label>
                    <input
                      type="number"
                      name="minStake"
                      value={formData.minStake}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-4 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-mc-text mb-2">Max Submissions</label>
                    <input
                      type="number"
                      name="maxSubmissions"
                      value={formData.maxSubmissions}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-mc-text mb-2">Submission Period (hrs)</label>
                    <input
                      type="number"
                      name="submissionHours"
                      value={formData.submissionHours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-mc-text mb-2">Voting Period (hrs)</label>
                    <input
                      type="number"
                      name="votingHours"
                      value={formData.votingHours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mc-text mb-2">Initial Prize Pool (USDC)</label>
                  <input
                    type="number"
                    name="prizePool"
                    value={formData.prizePool}
                    onChange={handleInputChange}
                    step="100"
                    className="w-full px-4 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 py-3 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
                >
                  Create Battle
                </button>
              </form>
            </div>

            {/* Active Battles */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-mc-text">Active Battles</h2>
              {activeBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="p-6 rounded-xl bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-mc-text mb-1">{battle.theme}</h3>
                      <p className="text-sm text-mc-text/60">
                        Prize: ${battle.prizePool} • Memes: {battle.memesCount}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-primary/20 rounded-full">
                      <span className="text-xs font-bold text-primary">{battle.state}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                      <Play className="w-4 h-4" />
                      Phase
                    </button>
                    <button className="flex-1 py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button className="flex-1 py-2 px-3 bg-positive/10 hover:bg-positive/20 text-positive font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Finalize
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
