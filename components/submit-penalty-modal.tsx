"use client"

import { useState } from "react"
import { AlertOctagon, Upload, ShieldCheck, ShieldAlert, X, Loader2, Camera } from "lucide-react"

interface SubmitPenaltyModalProps {
  isOpen: boolean
  questSlug: string
  questTitle: string
  questDescription: string
  onClose: () => void
  onSuccess: () => void
}

export function SubmitPenaltyModal({
  isOpen,
  questSlug,
  questTitle,
  questDescription,
  onClose,
  onSuccess,
}: SubmitPenaltyModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    reason: string
  } | null>(null)

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should not exceed 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imagePreview) return

    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/quests/submit-penalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questSlug,
          questTitle,
          questDescription,
          imageBase64: imagePreview,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({
          success: false,
          reason: data.error || "Failed to verify photo proof.",
        })
        return
      }

      setResult({
        success: data.success,
        reason: data.reason || (data.success ? "Photo verified successfully! Account unblocked." : "Photo rejected by AI Judge."),
      })

      if (data.success) {
        setTimeout(() => {
          onSuccess()
          onClose()
          setImagePreview(null)
          setResult(null)
        }, 2000)
      }
    } catch {
      setResult({
        success: false,
        reason: "Network error during photo submission.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-xl border-2 border-destructive/80 bg-card p-6 shadow-2xl space-y-4">
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        )}

        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
            <AlertOctagon className="size-6" />
          </div>
          <div>
            <h2 className="font-pixel text-lg text-destructive">Submit Penalty Photo</h2>
            <p className="text-xs text-muted-foreground">AI Judge photo verification to unlock account</p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 border border-border/50 text-xs space-y-1">
          <p className="font-pixel text-primary uppercase text-[10px]">Penalty Quest Requirements:</p>
          <p className="font-bold text-foreground">{questTitle}</p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">{questDescription}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-pixel uppercase text-muted-foreground mb-2">
              Photo Proof *
            </label>

            <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-4 bg-background hover:bg-accent/20 transition-colors">
              {imagePreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full py-6">
                  <Camera className="size-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-pixel text-foreground">Click to upload photo</span>
                  <span className="text-[10px] text-muted-foreground mt-1">JPEG, PNG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {result && (
            <div
              className={`rounded-lg p-3 text-xs border space-y-1 ${
                result.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2 font-pixel">
                {result.success ? (
                  <>
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span>AI Judge Verified: Approved</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-4 text-destructive" />
                    <span>AI Judge Verdict: Rejected</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">{result.reason}</p>
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
              disabled={isLoading || !imagePreview}
              className="flex items-center gap-2 px-5 py-2 text-xs font-pixel rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>AI Analyzing Photo...</span>
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  <span>Submit for AI Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
