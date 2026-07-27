"use client"

import { useEffect } from "react"
import { X, ScrollText } from "lucide-react"
import { QuestCard } from "@/components/quest-card"
import { TreeIcon } from "@/components/tree-icon"
import type { Quest, SkillNode, SkillTree } from "@/lib/game-data"

export function NodeDrawer({
  tree,
  node,
  quests,
  acceptedQuestIds,
  onAccept,
  onClose,
}: {
  tree: SkillTree
  node: SkillNode | null
  quests: Quest[]
  acceptedQuestIds: string[]
  onAccept: (id: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!node) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [node, onClose])

  if (!node) return null

  const active = quests.filter((q) => q.status !== "completed")

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close node details"
        onClick={onClose}
        className="absolute inset-0 bg-background/80"
      />

      <div className="hud-panel relative z-10 flex max-h-[80vh] w-full max-w-md flex-col bg-card">
        <div className="flex items-center gap-3 border-b-2 border-border bg-primary/15 p-4">
          <span className="flex size-9 items-center justify-center border-2 border-primary bg-primary/25">
            <TreeIcon icon={tree.icon} className="size-4 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-[7px] uppercase text-primary">In Progress</p>
            <h2 className="mt-1 truncate font-pixel text-[10px] leading-relaxed text-foreground">
              {node.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pixel-btn bg-secondary p-2 text-secondary-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 pt-4">
          <ScrollText className="size-4 text-gold" aria-hidden="true" />
          <h3 className="font-pixel text-[9px] uppercase text-foreground">Node Quests</h3>
          <span className="ml-auto font-pixel text-[8px] text-muted-foreground">{active.length} active</span>
        </div>

        <p className="px-4 pt-2 text-[11px] leading-relaxed text-muted-foreground text-pretty">
          Accept a quest to add it to your Quests tab.
        </p>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {quests.length === 0 ? (
            <p className="py-6 text-center font-pixel text-[8px] leading-relaxed text-muted-foreground">
              No quests bound to this node yet.
            </p>
          ) : (
            quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onAccept={onAccept}
                accepted={acceptedQuestIds.includes(quest.id)}
              />
            ))
          )}
          {quests.length > 0 && active.length === 0 && (
            <p className="pb-2 text-center font-pixel text-[8px] leading-relaxed text-chart-5">
              Node complete. Master it to unlock the next rune.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
