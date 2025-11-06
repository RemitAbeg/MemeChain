"use client"

import { useState } from "react"
import { MCNavbar } from "@/components/mc-navbar"
import { Search, Filter } from "lucide-react"

export default function GalleryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const filters = [
    { id: "all", label: "All NFTs" },
    { id: "recent", label: "Recent" },
    { id: "trending", label: "Trending" },
    { id: "ranked", label: "High Ranked" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      {/* Header */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-4">
            NFT Gallery
          </h1>
          <p className="text-mc-text/70 mb-8">All winning meme NFTs from past battles</p>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Search NFTs, creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-mc-panel border border-primary/20 rounded-lg text-mc-text placeholder:text-mc-text/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="px-4 py-3 bg-mc-panel border border-primary/20 rounded-lg text-mc-text hover:bg-mc-surface transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Tags */}
          <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === filter.id
                    ? "bg-gradient-to-r from-primary to-primary-700 text-mc-bg"
                    : "bg-mc-panel border border-primary/20 text-mc-text hover:border-primary/40"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* NFT Grid */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div
                key={i}
                className="group rounded-lg overflow-hidden bg-gradient-to-br from-mc-panel to-mc-surface border border-primary/20 hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                {/* NFT Image */}
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-mc-bg/80 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                  <span className="text-3xl">#NFT {i}</span>
                </div>

                {/* NFT Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-primary text-sm">#Rank {i}</div>
                    {i % 3 === 1 && <div className="text-lg">🏆</div>}
                  </div>
                  <div className="text-xs text-mc-text/70 font-mono mb-3 truncate">
                    0xAbC...{String(i).padStart(3, "0")}
                  </div>
                  <button className="w-full py-2 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors">
                    View on OpenSea
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
