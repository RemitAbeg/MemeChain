"use client";

import { useState, useEffect } from "react";
import { Menu, Zap } from "lucide-react";
import Link from "next/link";
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { baseSepolia } from "@reown/appkit/networks";

export function MCNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Base Sepolia chain ID is 84532
  const baseSepoliaChainId = baseSepolia.id;

  // Check if connected to the correct network
  const isCorrectNetwork = chainId === baseSepoliaChainId;

  // Automatically switch to Base Sepolia when connected to wrong network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && switchChain) {
      // Small delay to avoid race conditions
      const timer = setTimeout(() => {
        switchChain({ chainId: baseSepoliaChainId }).catch((error) => {
          console.error("Failed to switch chain:", error);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isCorrectNetwork, switchChain, baseSepoliaChainId]);

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-linear-to-b from-mc-panel to-mc-surface/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-linear-to-r from-primary to-primary-700 p-2 rounded-lg group-hover:shadow-lg group-hover:shadow-primary/50 transition-all">
              <Zap className="w-5 h-5 text-mc-bg" />
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary via-primary-700 to-accent hidden sm:inline">
              MemeChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/battles"
              className="text-sm text-mc-text hover:text-primary transition-colors"
            >
              Live
            </Link>
            <Link
              href="/vote"
              className="text-sm text-mc-text hover:text-primary transition-colors font-semibold"
            >
              Vote
            </Link>
            <Link
              href="/upcoming"
              className="text-sm text-mc-text hover:text-primary transition-colors"
            >
              Upcoming
            </Link>
            <Link
              href="/gallery"
              className="text-sm text-mc-text hover:text-primary transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/sentiment"
              className="text-sm text-mc-text hover:text-primary transition-colors"
            >
              Sentiment
            </Link>
            <Link
              href="/profile"
              className="text-sm text-mc-text hover:text-primary transition-colors"
            >
              Profile
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {isConnected && address ? (
              <div className="hidden sm:flex items-center gap-2">
                {!isCorrectNetwork && (
                  <button
                    onClick={() => switchChain({ chainId: baseSepoliaChainId })}
                    className="px-3 py-2 bg-warning/20 text-warning rounded-lg font-semibold text-xs hover:bg-warning/30 transition-colors"
                  >
                    Switch to Base Sepolia
                  </button>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-semibold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>{formatAddress(address)}</span>
                  <button
                    onClick={() => disconnect()}
                    className="ml-2 px-2 py-1 bg-mc-surface/20 hover:bg-mc-surface/40 rounded text-xs transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <appkit-button className="hidden sm:flex" />
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-primary/10 pt-4">
            <Link
              href="/battles"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Live
            </Link>
            <Link
              href="/vote"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors font-semibold"
            >
              Vote
            </Link>
            <Link
              href="/upcoming"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Upcoming
            </Link>
            <Link
              href="/gallery"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/sentiment"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Sentiment
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Profile
            </Link>
            {isConnected && address ? (
              <div className="w-full mt-4 space-y-2">
                {!isCorrectNetwork && (
                  <button
                    onClick={() => switchChain({ chainId: baseSepoliaChainId })}
                    className="w-full px-4 py-2 bg-warning/20 text-warning rounded-lg font-semibold text-sm hover:bg-warning/30 transition-colors"
                  >
                    Switch to Base Sepolia
                  </button>
                )}
                <div className="w-full px-4 py-2 bg-linear-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-semibold text-sm flex items-center justify-between">
                  <span>{formatAddress(address)}</span>
                  <button
                    onClick={() => disconnect()}
                    className="px-2 py-1 bg-mc-surface/20 hover:bg-mc-surface/40 rounded text-xs transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <appkit-button className="w-full mt-4" />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
