"use client";

import { MCNavbar } from "@/components/mc-navbar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      <HeroSection />

      <FeaturesSection />

      {/* CTA Section */}
      <section className="px-4 md:px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="card-glass p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"></div>
            <div className="relative z-10">
              <h2
                className="text-3xl md:text-4xl font-black mb-4 gradient-text"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                READY TO ENTER THE ARENA?
              </h2>
              <p className="text-lg text-mc-text/70 mb-8 max-w-2xl mx-auto">
                Join thousands of creators competing for glory, rewards, and
                exclusive NFTs. The battles are live and waiting for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/battles"
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-bold uppercase text-sm hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  View All Battles
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/submit"
                  className="px-8 py-4 border-2 border-primary/50 text-primary rounded-lg font-bold uppercase text-sm hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all"
                >
                  Create Battle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-primary/10 mt-20 px-4 md:px-6 py-12 bg-mc-surface/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Product
              </h4>
              <ul className="space-y-2 text-sm text-mc-text/60">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Battles
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Gallery
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Community
              </h4>
              <ul className="space-y-2 text-sm text-mc-text/60">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Leaderboard
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-mc-text/60">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-mc-text mb-4 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-electrolize)" }}
              >
                Network
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-positive rounded-full animate-pulse"></div>
                <span className="text-sm text-mc-text/60">Base Mainnet</span>
              </div>
            </div>
          </div>
          <div className="border-t border-primary/10 pt-8 text-center text-sm text-mc-text/40">
            © 2025 MemeChain. All rights reserved. | Built on Base | Power by
            Crypto
          </div>
        </div>
      </footer>
    </div>
  );
}
