"use client"

import { Trophy, Medal } from "lucide-react"

interface PodiumWinner {
  rank: 1 | 2 | 3
  creator: string
  votes: number
  weight: string
  imageUrl: string
}

interface PodiumProps {
  winners: PodiumWinner[]
}

export function Podium({ winners }: PodiumProps) {
  const sortedWinners = [...winners].sort((a, b) => a.rank - b.rank)

  const heights = {
    1: "h-32",
    2: "h-24",
    3: "h-20",
  }

  const colors = {
    1: "from-yellow-500 to-yellow-600",
    2: "from-slate-300 to-slate-400",
    3: "from-orange-600 to-orange-700",
  }

  const badges = {
    1: <Trophy className="w-6 h-6" />,
    2: <Medal className="w-6 h-6" />,
    3: <Medal className="w-6 h-6" />,
  }

  return (
    <div className="space-y-8">
      {/* Confetti background */}
      <div className="relative">
        <div className="flex items-flex-end justify-center gap-2 sm:gap-4 h-48">
          {sortedWinners.map((winner) => (
            <div key={winner.rank} className="flex flex-col items-center">
              {/* Medal */}
              <div
                className={`mb-4 p-3 bg-gradient-to-br ${colors[winner.rank]} rounded-full animate-bounce`}
                style={{ animationDelay: `${winner.rank * 0.2}s` }}
              >
                <div className="text-white">{badges[winner.rank]}</div>
              </div>

              {/* Podium */}
              <div
                className={`w-20 sm:w-24 ${heights[winner.rank]} bg-gradient-to-b ${colors[winner.rank]} rounded-t-lg border-2 border-opacity-50 flex items-center justify-center mb-2 relative`}
              >
                <div className="absolute -top-8 text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300">
                  {winner.rank}
                </div>
              </div>

              {/* Info */}
              <div className="text-center">
                <div className="font-mono text-xs text-mc-text/70 mb-1">{winner.creator}</div>
                <div className="text-lg font-bold text-primary">${winner.weight}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winner Details */}
      <div className="grid gap-4">
        {sortedWinners.map((winner) => (
          <div
            key={winner.rank}
            className="p-4 rounded-lg bg-gradient-to-r from-mc-panel to-mc-surface border border-primary/20 flex items-center gap-4"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="font-bold text-primary">#{winner.rank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-mc-text/80">{winner.creator}</div>
              <div className="text-xs text-mc-text/60">{winner.votes} votes</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-positive">${winner.weight} USDC</div>
              <button className="text-xs text-primary hover:text-primary-700 transition-colors mt-1">View NFT →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
