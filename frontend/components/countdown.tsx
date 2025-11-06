"use client"

import { useEffect, useState } from "react"

interface CountdownProps {
  endTime: number // unix timestamp in seconds
  onComplete?: () => void
}

export function Countdown({ endTime, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--")
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const diff = endTime - now

      if (diff <= 0) {
        setTimeLeft("00:00")
        onComplete?.()
        clearInterval(interval)
      } else {
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60
        setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`)
        setIsUrgent(diff < 60)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime, onComplete])

  return (
    <div
      className={`font-mono text-2xl font-bold tracking-wider text-center transition-all ${
        isUrgent ? "text-warning animate-pulse" : "text-primary"
      }`}
    >
      {timeLeft}
    </div>
  )
}
