"use client"

import { Users } from "lucide-react"
import { PhaseChip } from "./phase-chip"
import Link from "next/link"

interface BattleCardProps {
  id: number
  theme: string
  state: string
  prizePool: string
  memesCount: number
  submissionEnd?: number
  votingEnd?: number
}

export function BattleCard({ id, theme, state, prizePool, memesCount, submissionEnd, votingEnd }: BattleCardProps) {
  const timeLeft =
    state === "SUBMISSION_OPEN" && submissionEnd
      ? new Date(submissionEnd * 1000).toLocaleTimeString()
      : state === "VOTING_OPEN" && votingEnd
        ? new Date(votingEnd * 1000).toLocaleTimeString()
        : undefined

  return (
    <Link href={`/battles/${id}`}>
      <div className="group relative p-6 rounded-xl bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer overflow-hidden">
        {/* Background accent */}
        <div className="absolute -top-1 -right-1 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl group-hover:from-primary/40 transition-all" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-mc-text group-hover:text-primary transition-colors line-clamp-2">
                {theme}
              </h3>
            </div>
            <PhaseChip phase={state as any} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-mc-surface/50 rounded-lg p-3 border border-primary/10">
              <div className="text-xs text-mc-text/70 uppercase tracking-wide mb-1">Prize Pool</div>
              <div className="text-lg font-bold text-primary">${prizePool}</div>
            </div>
            <div className="bg-mc-surface/50 rounded-lg p-3 border border-primary/10">
              <div className="flex items-center gap-2 text-xs text-mc-text/70 uppercase tracking-wide mb-1">
                <Users className="w-3 h-3" />
                Memes
              </div>
              <div className="text-lg font-bold text-positive">{memesCount}</div>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full py-2.5 px-4 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase text-sm rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all group-hover:scale-105">
            Enter Battle
          </button>
        </div>
      </div>
    </Link>
  )
}
