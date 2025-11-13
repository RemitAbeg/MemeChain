"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Heart,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useVote } from "@/hooks/useVote";
import { useUserVote } from "@/hooks/useUserVote";

interface VoteCardProps {
  battleId: number;
  memeId: number;
  imageUrl: string;
  creator: string;
  votes: number;
  weight: string;
  minStake: string;
  onVoteSuccess?: () => void;
}

export function VoteCard({
  battleId,
  memeId,
  imageUrl,
  creator,
  votes,
  weight,
  minStake,
  onVoteSuccess,
}: VoteCardProps) {
  const [stakeAmount, setStakeAmount] = useState(minStake);
  const {
    vote,
    status,
    error,
    formattedBalance,
    formattedMinStake,
    currentVote,
    isLoadingBalance,
    isLoadingMinStake,
    isWaitingApproval,
    isWaitingVote,
    isConnected,
    resetState,
  } = useVote(battleId);

  const { userVote, refetch: refetchUserVote } = useUserVote(battleId);

  // Update stake amount when min stake loads
  useEffect(() => {
    if (formattedMinStake && formattedMinStake !== "0" && stakeAmount === "0") {
      setStakeAmount(formattedMinStake);
    }
  }, [formattedMinStake, stakeAmount]);

  // Check if user has already voted for this meme
  const hasVotedForThisMeme = useMemo(() => {
    return userVote?.memeId === memeId;
  }, [userVote, memeId]);

  // Show current vote amount if user voted for this meme
  const currentVoteAmount = useMemo(() => {
    if (hasVotedForThisMeme && userVote) {
      return userVote.formattedAmount;
    }
    return null;
  }, [hasVotedForThisMeme, userVote]);

  // Handle vote success
  useEffect(() => {
    if (status === "success") {
      void refetchUserVote();
      if (onVoteSuccess) {
        onVoteSuccess();
      }
      // Reset after a delay to show success message
      setTimeout(() => {
        resetState();
      }, 2000);
    }
  }, [status, refetchUserVote, onVoteSuccess, resetState]);

  const handleVote = async () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    if (
      parseFloat(formattedMinStake) > 0 &&
      amount < parseFloat(formattedMinStake)
    ) {
      return;
    }

    await vote(memeId, stakeAmount);
  };

  const isVoting =
    status === "checking" ||
    status === "approving" ||
    status === "voting" ||
    status === "pending";
  const isLoading =
    isLoadingBalance || isLoadingMinStake || isWaitingApproval || isWaitingVote;

  return (
    <div className="bg-linear-to-br from-mc-panel to-mc-surface rounded-xl overflow-hidden border border-primary/20 hover:border-primary/40 transition-all">
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

        {/* User's Current Vote */}
        {hasVotedForThisMeme && currentVoteAmount && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="text-xs text-mc-text/60 mb-1">Your Vote</div>
            <div className="text-sm font-bold text-primary">
              ${currentVoteAmount} USDC
            </div>
          </div>
        )}

        {/* Balance Info */}
        {isConnected && (
          <div className="text-xs text-mc-text/60">
            Balance:{" "}
            {isLoadingBalance ? (
              <span className="text-mc-text/40">...</span>
            ) : (
              <span className="text-primary font-semibold">
                ${formattedBalance} USDC
              </span>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {status === "success" && (
          <div className="p-3 bg-positive/10 border border-positive/30 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
            <p className="text-xs text-positive">
              Vote submitted successfully!
            </p>
          </div>
        )}

        {/* Stake Input */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-mc-text">
              Stake Amount
            </label>
            <span className="text-xs text-mc-text/60">
              Min:{" "}
              {isLoadingMinStake ? (
                <span className="text-mc-text/40">...</span>
              ) : (
                `${formattedMinStake} USDC`
              )}
            </span>
          </div>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="w-full px-3 py-2 bg-mc-surface border border-primary/20 rounded-lg text-mc-text placeholder:text-mc-text/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0.00"
            min={formattedMinStake}
            step="0.01"
            disabled={isVoting || !isConnected}
          />
        </div>

        {/* Vote Button */}
        {!isConnected ? (
          <div className="p-3 bg-mc-surface/50 border border-primary/10 rounded-lg text-center text-sm text-mc-text/60">
            Connect wallet to vote
          </div>
        ) : (
          <button
            onClick={handleVote}
            disabled={isVoting || isLoading || !isConnected}
            className="w-full py-3 bg-linear-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading || isVoting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {status === "approving" || isWaitingApproval
                  ? "Approving..."
                  : status === "voting" || isWaitingVote
                  ? "Voting..."
                  : status === "pending"
                  ? "Confirming..."
                  : "Processing..."}
              </>
            ) : hasVotedForThisMeme ? (
              "Update Vote"
            ) : (
              "Vote & Stake"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
