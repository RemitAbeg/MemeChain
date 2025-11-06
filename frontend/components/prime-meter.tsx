"use client"

interface PrizeMeterProps {
  current: number
  target: number
  currency: string
}

export function PrizeMeter({ current, target, currency }: PrizeMeterProps) {
  const percentage = (current / target) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-mc-text">Prize Pool Progress</span>
        <span className="text-sm font-bold text-primary">
          {current.toLocaleString()} / {target.toLocaleString()} {currency}
        </span>
      </div>

      <div className="relative h-3 bg-mc-surface rounded-full border border-primary/20 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-700 transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="text-xs text-mc-text/60">{Math.round(percentage)}% funded</div>
    </div>
  )
}
