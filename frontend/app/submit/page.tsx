"use client"

import { useState, useRef } from "react"
import { MCNavbar } from "@/components/mc-navbar"
import { Upload, CheckCircle } from "lucide-react"

type UploadStatus = "idle" | "uploading" | "success" | "error"

export default function SubmitPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [preview, setPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (newFile: File | null) => {
    if (!newFile) {
      setFile(null)
      setPreview("")
      return
    }

    if (newFile.size > 10 * 1024 * 1024) {
      setStatus("error")
      return
    }

    setFile(newFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(newFile)
  }

  const handleSubmit = async () => {
    if (!file) return
    setStatus("uploading")
    await new Promise((r) => setTimeout(r, 2000))
    setStatus("success")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mc-bg via-mc-surface to-mc-bg">
      <MCNavbar />

      <section className="px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            Submit Your Meme
          </h1>
          <p className="text-mc-text/70 mb-12">Choose a battle and upload your best meme</p>

          {/* Battle Select */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-mc-text mb-3">Select Battle</label>
            <select className="w-full px-4 py-3 bg-mc-panel border border-primary/20 rounded-lg text-mc-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Doge vs Pepe: The Ultimate Roast</option>
              <option>Bull Market Drip Memes</option>
              <option>AI vs Humans — Funniest Take</option>
            </select>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mb-8 p-12 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all text-center"
          >
            {preview ? (
              <div className="space-y-4">
                <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border border-primary/30">
                  <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm text-mc-text/70">{file?.name}</p>
                  <p className="text-xs text-mc-text/50">{(file?.size || 0) / 1024 / 1024}MB</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFileSelect(null)
                  }}
                  className="text-sm text-warning hover:text-warning-700"
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-primary/20 rounded-lg w-fit mx-auto">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-mc-text">Drop your meme here</p>
                  <p className="text-sm text-mc-text/60">or click to browse</p>
                </div>
                <p className="text-xs text-mc-text/50">JPG, PNG, GIF, WebP • Max 10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!file || status !== "idle"}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-700 text-mc-bg font-bold uppercase rounded-lg hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 transition-all"
          >
            {status === "idle" && "Submit Meme"}
            {status === "uploading" && "Uploading..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </button>

          {status === "success" && (
            <div className="mt-6 p-4 rounded-lg bg-positive/10 border border-positive/30 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-positive flex-shrink-0" />
              <span className="text-sm text-mc-text">Meme submitted successfully!</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
