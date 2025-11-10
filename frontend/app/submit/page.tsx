"use client";

import { useMemo, useRef, useState } from "react";
import { MCNavbar } from "@/components/mc-navbar";
import { useSubmitMeme } from "@/hooks/useSubmitMeme";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export default function SubmitPage() {
  const {
    battles,
    isLoadingBattles,
    battlesError,
    selectedBattleId,
    setSelectedBattleId,
    status,
    error,
    submissionCount,
    maxSubmissions,
    hasReachedLimit,
    submitMeme,
    resetState,
    cid,
    gatewayUrl,
    memeId,
    txHash,
    isConnected,
    isLoadingBattleState,
    isLoadingSubmissionCount,
    isLoadingMaxSubmissions,
    isWaitingForReceipt,
  } = useSubmitMeme();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = useMemo(
    () =>
      status === "uploading" || status === "signing" || status === "pending",
    [status]
  );

  const buttonLabel = useMemo(() => {
    switch (status) {
      case "uploading":
        return "Uploading to IPFS...";
      case "signing":
        return "Confirm in Wallet...";
      case "pending":
        return "Waiting for Confirmation...";
      case "success":
        return "Submitted!";
      case "error":
        return "Try Again";
      default:
        return "Submit Meme";
    }
  }, [status]);

  const handleFileSelect = (newFile: File | null) => {
    setFileError(null);

    if (!newFile) {
      setFile(null);
      setPreview("");
      resetState();
      return;
    }

    if (!ALLOWED_TYPES.has(newFile.type)) {
      setFileError("Unsupported file type. Use JPG, PNG, GIF, or WebP.");
      return;
    }

    if (newFile.size > MAX_FILE_SIZE) {
      setFileError("File exceeds 10MB limit.");
      return;
    }

    setFile(newFile);
    resetState();
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview((e.target?.result as string) ?? "");
    };
    reader.readAsDataURL(newFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      setFileError("Select a file to submit.");
      return;
    }

    await submitMeme(file);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      <section className="px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
            Submit Your Meme
          </h1>
          <p className="mb-12 text-mc-text/70">
            Choose a battle in submission phase and upload your best meme.
          </p>

          {/* Battle Select */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-semibold text-mc-text">
              Select Battle
            </label>
            <select
              className="w-full rounded-lg border border-primary/20 bg-mc-panel px-4 py-3 text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              value={selectedBattleId ? String(selectedBattleId) : ""}
              onChange={(event) => {
                const value = event.target.value;
                resetState();
                setFile(null);
                setPreview("");
                setFileError(null);
                setSelectedBattleId(value ? Number(value) : undefined);
              }}
              disabled={isLoadingBattles || battles.length === 0}
            >
              {isLoadingBattles ? (
                <option value="">Loading battles...</option>
              ) : battles.length === 0 ? (
                <option value="">No battles accepting submissions</option>
              ) : (
                <>
                  <option value="">Select a battle</option>
                  {battles.map((battle) => (
                    <option key={battle.id} value={battle.id}>
                      #{battle.id} — {battle.theme}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="mt-2 text-xs text-mc-text/60">
              Only battles in submission phase are available. Make sure you are
              connected to submit.
            </div>
          </div>

          {/* Submission Limit */}
          <div className="mb-6 rounded-lg border border-primary/10 bg-mc-panel/60 p-4 text-sm text-mc-text/80">
            <div className="flex items-center justify-between">
              <span>Submission Count</span>
              <span className="font-semibold">
                {isLoadingSubmissionCount || isLoadingMaxSubmissions
                  ? "Loading..."
                  : `${submissionCount}${
                      maxSubmissions !== null ? ` / ${maxSubmissions}` : ""
                    }`}
              </span>
            </div>
            {hasReachedLimit && (
              <p className="mt-2 text-xs text-warning">
                You have reached the maximum submissions for this battle.
              </p>
            )}
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mb-8 cursor-pointer rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-12 text-center transition-all hover:bg-primary/10"
          >
            {preview ? (
              <div className="space-y-4">
                <div className="mx-auto h-32 w-32 overflow-hidden rounded-lg border border-primary/30">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-mc-text/70">{file?.name}</p>
                  <p className="text-xs text-mc-text/50">
                    {file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB
                  </p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleFileSelect(null);
                  }}
                  className="text-sm text-warning transition hover:text-warning-700"
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-fit rounded-lg bg-primary/20 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-mc-text">
                    Drop your meme here
                  </p>
                  <p className="text-sm text-mc-text/60">or click to browse</p>
                </div>
                <p className="text-xs text-mc-text/50">
                  JPG, PNG, GIF, WebP • Max 10MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleFileSelect(event.target.files?.[0] ?? null)
              }
              className="hidden"
            />
          </div>

          {fileError && (
            <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              {fileError}
            </div>
          )}

          {battlesError && (
            <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              Failed to load battles. Refresh the page to try again.
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {status === "success" && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg border border-positive/30 bg-positive/10 p-4 text-sm text-mc-text">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-positive" />
                <span>
                  Meme submitted successfully
                  {memeId !== null ? `! Meme ID #${memeId}` : "!"}
                </span>
              </div>
              {gatewayUrl && (
                <a
                  href={gatewayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  View uploaded image
                </a>
              )}
              {cid && (
                <p className="text-xs text-mc-text/60 break-all">CID: {cid}</p>
              )}
              {txHash && (
                <p className="text-xs text-mc-text/60 break-all">
                  Tx: {txHash}
                </p>
              )}
            </div>
          )}

          {!isConnected && (
            <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              Connect your wallet to submit a meme.
            </div>
          )}

          {selectedBattleId && isLoadingBattleState && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking battle status…</span>
            </div>
          )}

          {isWaitingForReceipt && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for transaction confirmation…</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={
              !file ||
              !selectedBattleId ||
              isSubmitting ||
              hasReachedLimit ||
              !isConnected
            }
            className="w-full rounded-lg bg-linear-to-r from-primary to-primary-700 py-4 font-bold uppercase text-mc-bg transition-all hover:shadow-lg hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {buttonLabel}
              </span>
            ) : (
              buttonLabel
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
