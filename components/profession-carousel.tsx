"use client"

import { Compass } from "lucide-react"
import { treeMastery, classColorClasses, type SkillTree, type SkillTreeId } from "@/lib/game-data"
import { TreeIcon } from "@/components/tree-icon"

const SEGMENTS = 6

export function ProfessionCarousel({
  skillTrees,
  activeTrees,
  selected,
  onSelect,
  onExplore,
}: {
  skillTrees: SkillTree[]
  activeTrees: SkillTreeId[]
  selected: SkillTreeId
  onSelect: (id: SkillTreeId) => void
  onExplore: () => void
}) {
  const trees = skillTrees.filter((t) => activeTrees.includes(t.id))

  return (
    <nav aria-label="Skill constellations" className="-mx-4 overflow-x-auto px-4 pb-2">
      <ul className="flex gap-3">
        {trees.map((tree) => {
          const isActive = tree.id === selected
          const mastery = treeMastery(tree)
          const filled = Math.round((mastery / 100) * SEGMENTS)
          const c = classColorClasses[tree.classColor]
          return (
            <li key={tree.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(tree.id)}
                aria-pressed={isActive}
                className={`hud-panel flex w-40 flex-col gap-2 p-3 text-left transition-colors ${
                  isActive ? "bg-card ring-2 ring-primary" : "bg-card/70 hover:bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex size-9 items-center justify-center border-2 ${c.border} ${c.bg}`}>
                    <TreeIcon icon={tree.icon} className={`size-4 ${c.text}`} />
                  </span>
                  <span className={`font-pixel text-[8px] leading-none ${c.text}`}>LVL {tree.level}</span>
                </div>

                <span className="font-pixel text-[9px] leading-relaxed text-foreground text-pretty">
                  {tree.label}
                </span>

                <div className="hud-inset flex gap-1 bg-background p-1" aria-hidden="true">
                  {Array.from({ length: SEGMENTS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 ${i < filled ? "bg-chart-5" : "bg-secondary/60"}`}
                    />
                  ))}
                </div>
                <span className="font-pixel text-[7px] uppercase text-muted-foreground">
                  {mastery}% Mastered
                </span>
              </button>
            </li>
          )
        })}

        <li className="shrink-0">
          <button
            type="button"
            onClick={onExplore}
            className="hud-panel flex h-full w-28 flex-col items-center justify-center gap-2 bg-cyan/10 p-3 text-cyan hover:bg-cyan/20"
          >
            <Compass className="size-6" aria-hidden="true" />
            <span className="font-pixel text-[8px] leading-relaxed text-center">Explore Trees</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
