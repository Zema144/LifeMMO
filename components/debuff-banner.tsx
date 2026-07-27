import { TriangleAlert } from "lucide-react"

export function DebuffBanner() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-2 border-destructive bg-destructive/15 p-3 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-pixel text-[9px] leading-relaxed text-destructive">Muscle Atrophy Debuff</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-pixel text-[8px] text-destructive">-20% XP</span> for 12h. Complete a quick
          recovery quest to remove it.
        </p>
      </div>
    </div>
  )
}
