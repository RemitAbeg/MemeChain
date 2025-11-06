"use client";

import { useState } from "react";
import { Heart, TrendingUp } from "lucide-react";

interface VoteCardProps {
  memeId: number;
  imageUrl: string;
  creator: string;
  votes: number;
  weight: string;
  minStake: string;
  onVote: (amount: string) => void;
}

export function VoteCard({
  memeId,
  imageUrl,
  creator,
  votes,
  weight,
  minStake,
  onVote,
}: VoteCardProps) {
  const [stakeAmount, setStakeAmount] = useState(minStake);
  const [isApproving, setIsApproving] = useState(false);

  const handleVote = async () => {
    setIsApproving(true);
    await new Promise((r) => setTimeout(r, 1500));
    onVote(stakeAmount);
    setIsApproving(false);
  };

  return (
    <div className="bg-gradient-to-br from-mc-panel to-mc-surface rounded-xl overflow-hidden border border-primary/20 hover:border-primary/40 transition-all">
      {/* Image */}
      <div className="relative aspect-video bg-mc-surface overflow-hidden">
        {imageUrl &&
        imageUrl !== "/placeholder.svg" &&
        !imageUrl.startsWith("Meme") ? (
          <img
            src={imageUrl}
            alt={`Meme ${memeId}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mc-text/60 text-sm">
            {imageUrl.startsWith("Meme") ? imageUrl : "No image"}
          </div>
        )}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-primary/20 border border-primary/50 rounded-full flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">{votes}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Creator */}
        <div>
          <div className="text-xs text-mc-text/60 mb-1">Created by</div>
          <div className="font-mono text-sm text-primary">{creator}</div>
        </div>

        {/* Vote Weight */}
        <div className="flex items-center justify-between p-3 bg-mc-surface/50 rounded-lg border border-primary/10">
          <span className="text-sm text-mc-text/70">Total Vote Weight</span>
          <div className="flex items-center gap-1.5 text-positive font-bold">
            <TrendingUp className="w-4 h-4" />${weight} USDC
          </div>
        </div>

        {/* Stake Input */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-mc-text">
              Stake Amount
            </label>
            <span className="text-xs text-mc-text/60">
              Min: {minStake} USDC
            </span>
          </div>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="w-full px-3 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text placeholder:text-mc-text/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="0.00"
            min={minStake}
            step="0.01"
          />
        </div>

        {/* Vote Button */}
        <button
          onClick={handleVote}
          disabled={isApproving}
          className="w-full py-3 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all disabled:opacity-50"
        >
          {isApproving ? "Approving..." : "Vote & Stake"}
        </button>
      </div>
    </div>
  );
}
