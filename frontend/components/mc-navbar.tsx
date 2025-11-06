"use client"

import { useState } from "react"
import { Menu, Zap } from "lucide-react"
import Link from "next/link"

export function MCNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-gradient-to-b from-mc-panel to-mc-surface/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-r from-primary to-primary-700 p-2 rounded-lg group-hover:shadow-lg group-hover:shadow-primary/50 transition-all">
              <Zap className="w-5 h-5 text-mc-bg" />
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-700 to-accent hidden sm:inline">
              MemeChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-mc-text hover:text-primary transition-colors">
              Live
            </Link>
            <Link href="/upcoming" className="text-sm text-mc-text hover:text-primary transition-colors">
              Upcoming
            </Link>
            <Link href="/gallery" className="text-sm text-mc-text hover:text-primary transition-colors">
              Gallery
            </Link>
            <Link href="/sentiment" className="text-sm text-mc-text hover:text-primary transition-colors">
              Sentiment
            </Link>
            <Link href="/profile" className="text-sm text-mc-text hover:text-primary transition-colors">
              Profile
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-primary/50 transition-all">
              <Zap className="w-4 h-4" />
              Connect Wallet
            </button>

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
              href="/"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Live
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
              href="/profile"
              className="block px-4 py-2 text-mc-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Profile
            </Link>
            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-primary to-primary-700 text-mc-bg rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-primary/50 transition-all">
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
