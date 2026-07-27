"use client"

import { LogOut } from "lucide-react"
import { ProfessionCarousel } from "@/components/profession-carousel"
import { SkillTreeCanvas } from "@/components/skill-tree-canvas"
import type { SkillNode, SkillTree, SkillTreeId } from "@/lib/game-data"

export function SkillTreesView({
  skillTrees,
  tree,
  activeTrees,
  selected,
  onSelect,
  onExplore,
  onAbandon,
  onOpenNode,
}: {
  skillTrees: SkillTree[]
  tree: SkillTree
  activeTrees: SkillTreeId[]
  selected: SkillTreeId
  onSelect: (id: SkillTreeId) => void
  onExplore: () => void
  onAbandon: () => void
  onOpenNode: (node: SkillNode) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="font-pixel text-[9px] uppercase text-muted-foreground">Profession Trees</p>
        <ProfessionCarousel
          skillTrees={skillTrees}
          activeTrees={activeTrees}
          selected={selected}
          onSelect={onSelect}
          onExplore={onExplore}
        />
      </div>

      <section aria-label={`${tree.label} skill tree`} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-pixel text-[10px] leading-relaxed text-foreground">{tree.label}</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground text-pretty">{tree.blurb}</p>
          </div>
          {activeTrees.length > 1 && (
            <button
              type="button"
              onClick={onAbandon}
              className="flex shrink-0 items-center gap-1.5 border-2 border-destructive/60 bg-destructive/10 px-2.5 py-1.5 font-pixel text-[8px] leading-none text-destructive hover:bg-destructive/20"
            >
              <LogOut className="size-3" aria-hidden="true" />
              Abandon
            </button>
          )}
        </div>

        <SkillTreeCanvas tree={tree} onOpenNode={onOpenNode} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-pixel text-[7px] uppercase text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 border border-chart-5 bg-chart-5/40" aria-hidden="true" />
            Mastered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 border border-primary bg-primary/40" aria-hidden="true" />
            In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 border border-muted-foreground/50 bg-background" aria-hidden="true" />
            Locked
          </span>
        </div>
      </section>
    </div>
  )
}
