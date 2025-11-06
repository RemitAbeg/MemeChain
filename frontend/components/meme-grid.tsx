"use client"

import { useState } from "react"
import { Heart, TrendingUp } from "lucide-react"

interface MemeProps {
  id: number
  imageUrl: string
  creator: string
  votes: number
  weight: string
}

interface MemeGridProps {
  memes: MemeProps[]
  isVoting?: boolean
  onVote?: (memeId: number) => void
}

export function MemeGrid({ memes, isVoting, onVote }: MemeGridProps) {
  const [selectedMeme, setSelectedMeme] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {memes.map((meme) => (
        <div
          key={meme.id}
          className="group relative rounded-lg overflow-hidden cursor-pointer bg-mc-surface border border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20"
          onClick={() => setSelectedMeme(selectedMeme === meme.id ? null : meme.id)}
        >
          {/* Image */}
          <div className="relative aspect-square bg-mc-surface">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-transparent to-primary/10" />
            <div className="w-full h-full bg-mc-surface flex items-center justify-center">
              <span className="text-center text-sm text-mc-text/60 p-4">{meme.imageUrl}</span>
            </div>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-mc-bg/80 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-3">
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-mc-text/80 font-mono text-xs truncate">{meme.creator}</span>
                <div className="flex items-center gap-1 text-primary font-bold">
                  <Heart className="w-4 h-4" />
                  {meme.votes}
                </div>
              </div>
              {isVoting && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onVote?.(meme.id)
                  }}
                  className="w-full py-1.5 bg-gradient-to-r from-primary to-primary-700 text-mc-bg text-xs font-bold rounded transition-all hover:shadow-lg hover:shadow-primary/50"
                >
                  Vote
                </button>
              )}
            </div>
          </div>

          {/* Vote weight badge */}
          {meme.weight !== "0" && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-primary/20 border border-primary/50 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary">${meme.weight}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
