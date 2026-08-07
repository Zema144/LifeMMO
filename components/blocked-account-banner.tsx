"use client"

import { AlertOctagon, Camera } from "lucide-react"

export function BlockedAccountBanner({
  onOpenPenaltyModal,
}: {
  onOpenPenaltyModal?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 border border-rose-600 bg-rose-950/80 p-3 text-rose-100 rounded-lg"
    >
      <div className="flex items-center gap-2">
        <AlertOctagon className="size-4 text-rose-400" />
        <span className="font-pixel text-[10px] text-rose-300">
          ACCOUNT BLOCKED: Complete penalty quest
        </span>
      </div>

      {onOpenPenaltyModal && (
        <button
          type="button"
          onClick={onOpenPenaltyModal}
          className="pixel-btn flex items-center gap-1.5 bg-rose-600 px-2 py-1.5 font-pixel text-[8px] uppercase text-white hover:bg-rose-500"
        >
          <Camera className="size-3.5" />
          <span>Submit Photo</span>
        </button>
      )}
    </div>
  )
}
