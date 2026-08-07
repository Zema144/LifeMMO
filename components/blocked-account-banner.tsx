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
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-2 border-rose-600 bg-rose-950/80 p-4 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse rounded-lg"
    >
      <div className="flex items-center gap-2 shrink-0">
        <AlertOctagon className="size-6 text-rose-400" />
        <span className="font-pixel text-[10px] uppercase text-rose-300 font-bold tracking-wider">
          DEBT PIT (ACCOUNT BLOCKED)
        </span>
      </div>

      <div className="flex-1 text-xs text-rose-200/90 leading-relaxed">
        You missed a quest deadline (-20% XP). All primary quest slots are frozen! To regain access, complete the x2 penalty quest and submit photo proof.
      </div>

      {onOpenPenaltyModal && (
        <button
          type="button"
          onClick={onOpenPenaltyModal}
          className="pixel-btn flex items-center gap-1.5 shrink-0 bg-rose-600 px-3 py-2 font-pixel text-[8px] uppercase text-white hover:bg-rose-500 shadow-lg active:translate-y-[2px]"
        >
          <Camera className="size-3.5" />
          <span>Submit Photo Proof</span>
        </button>
      )}
    </div>
  )
}
