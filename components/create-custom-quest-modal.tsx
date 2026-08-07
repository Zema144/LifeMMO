"use client"

import { useState } from "react"
import { Sparkles, ShieldCheck, ShieldAlert, X, Loader2, Plus, Clock, Award } from "lucide-react"

interface CreateCustomQuestModalProps {
  isOpen: boolean
  onClose: () => void
  onQuestCreated: () => void
  activeCount?: number
}

const DEADLINE_PRESETS = [
  { label: "6h", value: 6 },
  { label: "12h", value: 12 },
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
  { label: "72h", value: 72 },
]

export function CreateCustomQuestModal({
  isOpen,
  onClose,
  onQuestCreated,
  activeCount = 0,
}: CreateCustomQuestModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [hoursToComplete, setHoursToComplete] = useState(24)
  const [isLoading, setIsLoading] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<{
    status: "APPROVED" | "REJECTED_UNREALISTIC" | "REJECTED_TOO_SIMPLE"
    reason: string
    xpReward?: number
    goldReward?: number
  } | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    setAiFeedback(null)

    try {
      const res = await fetch("/api/quests/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          hoursToComplete,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAiFeedback({
          status: data.status || "REJECTED_UNREALISTIC",
          reason: data.error || "Failed to validate quest with AI.",
        })
        return
      }

      setAiFeedback({
        status: "APPROVED",
        reason: data.reason || "Quest approved by AI Gatekeeper!",
        xpReward: data.quest?.xpReward,
        goldReward: data.quest?.goldReward,
      })

      setTimeout(() => {
        onQuestCreated()
        onClose()
        setTitle("")
        setDescription("")
        setHoursToComplete(24)
        setAiFeedback(null)
      }, 1600)
    } catch {
      setAiFeedback({
        status: "REJECTED_UNREALISTIC",
        reason: "Network error. Failed to send quest for AI review.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create custom quest"
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="hud-panel flex w-full max-w-md flex-col bg-card shadow-[0_0_30px_rgba(99,102,241,0.25)] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-border p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center border-2 border-indigo-500/60 bg-indigo-500/15 text-indigo-300">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-pixel text-[11px] text-foreground tracking-wide">Custom Quest</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{activeCount}/3 slots used</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pixel-btn bg-secondary p-1.5 text-foreground transition-transform active:scale-95"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div className="space-y-1.5">
            <label className="font-pixel text-[9px] uppercase tracking-wide text-muted-foreground">
              Quest Title
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Do 30 push-ups & 20 squats"
              className="hud-inset w-full bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-pixel text-[9px] uppercase tracking-wide text-muted-foreground">
              Description <span className="normal-case text-muted-foreground/70">(optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify requirements and criteria for completion..."
              className="hud-inset w-full resize-none bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-pixel text-[9px] uppercase tracking-wide text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              Deadline
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {DEADLINE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setHoursToComplete(preset.value)}
                  className={`border-2 py-2 font-pixel text-[9px] transition-all ${
                    hoursToComplete === preset.value
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {aiFeedback && (
            <div
              className={`border-2 p-3 text-xs space-y-1.5 animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                aiFeedback.status === "APPROVED"
                  ? "border-chart-5/50 bg-chart-5/10 text-chart-5"
                  : "border-destructive/50 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2 font-pixel text-[9px] uppercase">
                {aiFeedback.status === "APPROVED" ? (
                  <>
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    <span>AI Gatekeeper Approved</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-3.5" aria-hidden="true" />
                    <span>AI Gatekeeper Rejected</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/90">{aiFeedback.reason}</p>
              {aiFeedback.status === "APPROVED" && aiFeedback.xpReward && (
                <div className="flex items-center gap-3 pt-1 font-pixel text-[9px]">
                  <span className="flex items-center gap-1 text-primary">
                    <Award className="size-3" aria-hidden="true" /> +{aiFeedback.xpReward} XP
                  </span>
                  <span className="text-gold">+{aiFeedback.goldReward}G</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="pixel-btn flex-1 bg-secondary py-2.5 font-pixel text-[9px] uppercase text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="pixel-btn flex flex-[2] items-center justify-center gap-2 bg-indigo-600 py-2.5 font-pixel text-[9px] uppercase text-white transition-all hover:brightness-110 active:translate-y-[2px] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>AI Reviewing...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Send to AI Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}