"use client"

import { useState } from "react"
import { Sparkles, ShieldCheck, ShieldAlert, X, Loader2, Plus, Clock, Award } from "lucide-react"

interface CreateCustomQuestModalProps {
  isOpen: boolean
  onClose: () => void
  onQuestCreated: () => void
}

export function CreateCustomQuestModal({
  isOpen,
  onClose,
  onQuestCreated,
}: CreateCustomQuestModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [treeSlug, setTreeSlug] = useState("fitness")
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
          treeSlug,
          hoursToComplete: Number(hoursToComplete),
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
        setAiFeedback(null)
      }, 1800)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-xl border-2 border-primary/50 bg-card p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="font-pixel text-lg text-foreground">Create Custom Quest</h2>
            <p className="text-xs text-muted-foreground">AI Gatekeeper validates difficulty and rewards</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-pixel uppercase text-muted-foreground mb-1">
              Quest Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Do 30 push-ups & 20 squats"
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-pixel uppercase text-muted-foreground mb-1">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify requirements and criteria for completion..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-pixel uppercase text-muted-foreground mb-1">
                Skill Tree
              </label>
              <select
                value={treeSlug}
                onChange={(e) => setTreeSlug(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="fitness">Fitness & Health</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="learning">Learning & Wisdom</option>
                <option value="productivity">Productivity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-pixel uppercase text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="size-3" /> Time Limit (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={72}
                value={hoursToComplete}
                onChange={(e) => setHoursToComplete(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {aiFeedback && (
            <div
              className={`rounded-lg p-3 text-xs border space-y-1 ${
                aiFeedback.status === "APPROVED"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2 font-pixel">
                {aiFeedback.status === "APPROVED" ? (
                  <>
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span>AI Gatekeeper Approved</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-4 text-destructive" />
                    <span>AI Gatekeeper Rejected</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">{aiFeedback.reason}</p>
              {aiFeedback.status === "APPROVED" && aiFeedback.xpReward && (
                <div className="flex items-center gap-3 pt-1 text-emerald-300 font-pixel">
                  <span className="flex items-center gap-1"><Award className="size-3" /> +{aiFeedback.xpReward} XP</span>
                  <span>+{aiFeedback.goldReward} Gold</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-pixel rounded-md border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-pixel rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>AI Reviewing...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
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