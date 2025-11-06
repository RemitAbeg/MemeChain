"use client"

import { Flame, Zap, Crown, Wallet } from "lucide-react"

const features = [
  {
    icon: Flame,
    title: "Intense Battles",
    description: "Submit your hottest memes and compete against thousands of creators in real-time voting arenas.",
    color: "accent",
  },
  {
    icon: Zap,
    title: "Instant Rewards",
    description: "Win battles and earn USDC rewards directly to your wallet. Daily payouts, no intermediaries.",
    color: "primary",
  },
  {
    icon: Crown,
    title: "NFT Champions",
    description: "Top creators mint exclusive NFTs from winning submissions. Build your collection and legacy.",
    color: "positive",
  },
  {
    icon: Wallet,
    title: "True Ownership",
    description: "Every meme is tracked on-chain. Own your creations and trade them on secondary markets.",
    color: "warning",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-black mb-6 gradient-text"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            GAME-CHANGING FEATURES
          </h2>
          <p className="text-lg text-mc-text/70 max-w-2xl mx-auto">
            Experience the future of creative competition with blockchain-backed battles and real rewards.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            const colorClass =
              feature.color === "primary"
                ? "text-primary"
                : feature.color === "accent"
                  ? "text-accent"
                  : feature.color === "positive"
                    ? "text-positive"
                    : "text-warning"

            return (
              <div
                key={i}
                className="card-glass p-8 group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-8 h-8 ${colorClass}`} />
                  </div>

                  <h3
                    className="text-2xl font-bold mb-3 uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-electrolize)" }}
                  >
                    {feature.title}
                  </h3>

                  <p className="text-mc-text/70 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
