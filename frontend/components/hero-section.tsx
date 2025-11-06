"use client"

import { useState, useEffect } from "react"
import { Zap, Play, Sparkles } from "lucide-react"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setIsVisible(true)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0">
      {/* Background animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>

        {/* Animated floating particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + i}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Scanlines effect */}
      <div className="absolute inset-0 scanlines pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content with enhanced animations */}
          <div
            className={`transition-all duration-1000 delay-100 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            {/* Badge with pulse animation */}
            <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/30 hover:border-primary/50 transition-all group hover:shadow-lg hover:shadow-primary/20">
              <Zap className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Live Arena</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>

            {/* Main Headline with staggered animation */}
            <h1
              className="text-5xl md:text-7xl font-black mb-6 leading-tight"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <span className="gradient-text block mb-2">ENTER THE</span>
              <span className="gradient-text block">MEME WARS</span>
            </h1>

            {/* Subtitle with fade-in */}
            <p className="text-lg md:text-xl text-mc-text/80 mb-8 leading-relaxed max-w-lg opacity-0 animate-[fadeIn_1.5s_ease-in_0.3s_forwards]">
              Submit your fiercest memes, stake your USDC, and battle thousands of creators for glory, NFTs, and real
              rewards on Base. The arena waits for no one.
            </p>

            {/* Stats Row with hover effects */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: "Active Battles", value: "42K+", color: "primary" },
                { label: "Prize Pool", value: "$2.4M", color: "accent" },
                { label: "Players Online", value: "128K", color: "positive" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="card-glass p-4 text-center group hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1 cursor-pointer"
                  style={{
                    animation: `slideUp 0.6s ease-out ${0.4 + i * 0.1}s backwards`,
                  }}
                >
                  <div
                    className={`text-2xl md:text-3xl font-black mb-1 ${
                      stat.color === "primary"
                        ? "text-primary"
                        : stat.color === "accent"
                          ? "text-accent"
                          : "text-positive"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-mc-text/60 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons with animation */}
            <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-[fadeIn_1.5s_ease-in_0.6s_forwards]">
              <button className="btn-gaming rounded-lg group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" fill="currentColor" />
                  <span>START BATTLING</span>
                </div>
              </button>
              <button className="px-8 py-4 font-bold uppercase tracking-widest rounded-lg border-2 border-primary/50 text-primary hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1">
                View Leaderboard
              </button>
            </div>
          </div>

          {/* Right: Hero Image with enhanced gaming frame */}
          <div
            className={`relative transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95"
            }`}
          >
            {/* Glowing frame effect with animation */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl animate-pulse"></div>
            <div className="absolute -inset-1 rounded-2xl opacity-0 animate-[borderGlow_3s_ease-in-out_infinite] bg-gradient-to-r from-primary via-accent to-primary"></div>

            {/* Image container with gaming frame */}
            <div
              className="relative rounded-2xl overflow-hidden border-2 border-primary/40 bg-mc-panel p-4 hover:border-primary/60 transition-all group"
              style={{
                transform: `perspective(1000px) rotateX(${mousePosition.y * 0.5}deg) rotateY(${mousePosition.x * 0.5}deg)`,
                transition: "transform 0.1s ease-out",
              }}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden border border-primary/30 bg-gradient-to-br from-mc-bg to-mc-surface">
                {/* Gaming arena visual placeholder */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-mc-bg to-accent/10 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="w-12 h-12 border-2 border-primary rounded-lg flex items-center justify-center animate-spin"
                          style={{ animationDuration: "3s" }}
                        >
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-primary font-bold uppercase tracking-wider text-sm">Battle Arena</p>
                    </div>
                  </div>

                  {/* Animated grid background */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `linear-gradient(0deg, rgba(102, 227, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(102, 227, 255, 0.1) 1px, transparent 1px)`,
                      backgroundSize: "30px 30px",
                      animation: "gridMove 20s linear infinite",
                    }}
                  />
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/60 group-hover:border-primary-700 transition-colors"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent/60 group-hover:border-accent transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent/60 group-hover:border-accent transition-colors"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/60 group-hover:border-primary-700 transition-colors"></div>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 group-hover:backdrop-blur-none">
                  <Play className="w-16 h-16 text-primary mb-4 animate-pulse" fill="currentColor" />
                  <span className="text-lg font-bold text-primary uppercase tracking-wider">Enter Arena</span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-gradient-to-r from-positive/20 to-primary/20 border border-positive/50 flex items-center gap-2 shadow-lg shadow-positive/20">
                <div className="w-2 h-2 bg-positive rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-positive uppercase tracking-wide">LIVE BATTLES NOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gridMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 30px 30px;
          }
        }
        
        @keyframes borderGlow {
          0%, 100% {
            opacity: 0.5;
            filter: blur(0px);
          }
          50% {
            opacity: 1;
            filter: blur(2px);
          }
        }
      `}</style>
    </section>
  )
}
