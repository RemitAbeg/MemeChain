interface PhaseChipProps {
  phase: "UPCOMING" | "SUBMISSION_OPEN" | "VOTING_OPEN" | "TALLYING" | "FINALIZED" | "ARCHIVED"
  timeLeft?: string
}

const phaseConfig = {
  UPCOMING: { label: "Upcoming", color: "from-muted to-muted-foreground", bg: "bg-muted/20" },
  SUBMISSION_OPEN: { label: "Submissions Open", color: "from-positive to-positive", bg: "bg-positive/20" },
  VOTING_OPEN: { label: "Voting Active", color: "from-primary to-primary-700", bg: "bg-primary/20" },
  TALLYING: { label: "Tallying...", color: "from-warning to-warning", bg: "bg-warning/20" },
  FINALIZED: { label: "Finalized", color: "from-accent to-accent", bg: "bg-accent/20" },
  ARCHIVED: { label: "Archived", color: "from-destructive to-destructive", bg: "bg-destructive/20" },
}

export function PhaseChip({ phase, timeLeft }: PhaseChipProps) {
  const config = phaseConfig[phase]

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} border border-opacity-30`}
      style={{ borderColor: `var(--mc-primary)` }}
    >
      <span
        className={`text-xs font-bold uppercase tracking-wide bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
      >
        {config.label}
      </span>
      {timeLeft && <span className="text-xs text-mc-text/70 font-mono">{timeLeft}</span>}
    </div>
  )
}
