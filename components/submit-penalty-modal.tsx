"use client"

import { useState } from "react"
import { AlertOctagon, Upload, ShieldCheck, ShieldAlert, X, Loader2, Camera, PenLine } from "lucide-react"

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
  const [textProof, setTextProof] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; reason: string } | null>(null)

  if (!isOpen) return null

  const hasProof = Boolean(imagePreview) || textProof.trim().length >= 10

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
    if (!hasProof) return

    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/quests/submit-penalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questSlug,
          imageBase64: imagePreview,
          textProof: textProof.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, reason: data.error || "Failed to verify proof." })
        return
      }

      setResult({
        success: data.success,
        reason: data.reason || (data.success ? "Proof verified successfully! Account unblocked." : "Proof rejected by AI Judge."),
      })

      if (data.success) {
        setTimeout(() => {
          onSuccess()
          onClose()
          setImagePreview(null)
          setTextProof("")
          setResult(null)
        }, 2000)
      }
    } catch {
      setResult({ success: false, reason: "Network error during proof submission." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-xl border-2 border-destructive/80 bg-card p-6 shadow-2xl space-y-4">
        {!isLoading && (
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        )}

        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
            <AlertOctagon className="size-6" />
          </div>
          <div>
            <h2 className="font-pixel text-lg text-destructive">Submit Proof</h2>
            <p className="text-xs text-muted-foreground">Photo or written description — AI Judge reviews either</p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 border border-border/50 text-xs space-y-1">
          <p className="font-pixel text-primary uppercase text-[10px]">What you need to do:</p>
          <p className="font-bold text-foreground">{questTitle}</p>
          <p className="text-muted-foreground text-[11px] leading-relaxed whitespace-pre-wrap">{questDescription}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-pixel uppercase text-muted-foreground mb-2">
              Photo proof <span className="normal-case text-muted-foreground/70">(optional if you describe below)</span>
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
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-pixel uppercase text-muted-foreground mb-2">
              <PenLine className="size-3" />
              Written description
              <span className="normal-case text-muted-foreground/70">
                {imagePreview ? "(optional)" : "(required if no photo, min 10 chars)"}
              </span>
            </label>
            <textarea
              rows={3}
              value={textProof}
              onChange={(e) => {
                setTextProof(e.target.value)
                if (result) setResult(null)
              }}
              placeholder="Describe specifically what you did — reps, pages, minutes, etc."
              className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none resize-none"
            />
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
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-xs font-pixel rounded-md border border-border hover:bg-accent transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !hasProof}
              className="flex items-center gap-2 px-5 py-2 text-xs font-pixel rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>AI Analyzing...</span>
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