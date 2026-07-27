"use client"

import { useEffect } from "react"
import { X, Plus, Check } from "lucide-react"
import { classColorClasses, type SkillTree, type SkillTreeId } from "@/lib/game-data"
import { TreeIcon } from "@/components/tree-icon"

export function BrowseTreesModal({
  skillTrees,
  open,
  activeTrees,
  onClose,
  onJoin,
}: {
  skillTrees: SkillTree[]
  open: boolean
  activeTrees: SkillTreeId[]
  onClose: () => void
  onJoin: (id: SkillTreeId) => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Explore skill trees"
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="hud-panel flex max-h-[80vh] w-full max-w-md flex-col bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-border p-4">
          <h2 className="font-pixel text-[11px] text-foreground">Explore Trees</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pixel-btn bg-secondary p-1.5 text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <ul className="flex flex-col gap-2.5 overflow-y-auto p-4">
          {skillTrees.map((tree) => {
            const joined = activeTrees.includes(tree.id)
            const c = classColorClasses[tree.classColor]
            return (
              <li key={tree.id} className={`flex items-center gap-3 border-2 ${c.border} bg-secondary/40 p-3`}>
                <div className={`flex size-10 shrink-0 items-center justify-center border-2 ${c.border} ${c.bg}`}>
                  <TreeIcon icon={tree.icon} className={`size-5 ${c.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-pixel text-[9px] leading-relaxed text-foreground">{tree.label}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{tree.blurb}</p>
                </div>
                <button
                  type="button"
                  disabled={joined}
                  onClick={() => onJoin(tree.id)}
                  className={`pixel-btn flex shrink-0 items-center gap-1 px-2.5 py-2 font-pixel text-[8px] leading-none ${
                    joined ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {joined ? (
                    <>
                      <Check className="size-3" aria-hidden="true" />
                      Joined
                    </>
                  ) : (
                    <>
                      <Plus className="size-3" aria-hidden="true" />
                      Join
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
