"use client"

import { useState } from "react"
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
  const [isExploring, setIsExploring] = useState(false)
  const trees = skillTrees.filter((t) => activeTrees.includes(t.id))

  const handleExploreClick = () => {
    if (isExploring) return
    setIsExploring(true)
    setTimeout(() => {
      setIsExploring(false)
      onExplore()
    }, 400)
  }

  return (
    <nav aria-label="Skill constellations" className="-mx-4 overflow-x-auto px-4 pb-4 custom-scrollbar">
      <ul className="flex gap-3 snap-x snap-mandatory">
        {trees.map((tree, idx) => {
          const isActive = tree.id === selected
          const mastery = treeMastery(tree)
          const filled = Math.round((mastery / 100) * SEGMENTS)
          const c = classColorClasses[tree.classColor]

          return (
            <li
              key={tree.id}
              className="shrink-0 snap-start animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <button
                type="button"
                onClick={() => onSelect(tree.id)}
                aria-pressed={isActive}
                className={`hud-panel flex w-40 min-w-40 shrink-0 flex-col gap-2 p-3 text-left transition-all duration-300 ${
                  isActive
                    ? "bg-card border-primary shadow-[0_0_15px_rgba(201,147,46,0.35)] scale-[1.02]"
                    : "bg-card/70 hover:bg-card hover:-translate-y-1 hover:shadow-[0_6px_12px_rgba(0,0,0,0.5)] active:translate-y-0"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex size-9 items-center justify-center border-2 transition-colors ${c.border} ${c.bg}`}>
                    <TreeIcon icon={tree.icon} className={`size-4 ${c.text}`} />
                  </span>
                  <span className={`font-pixel text-[8px] leading-none ${c.text}`}>LVL {tree.level}</span>
                </div>

                <span className="font-pixel text-[11px] leading-tight text-foreground text-pretty line-clamp-2 min-h-[30px]">
                  {tree.label}
                </span>

                <div className="hud-inset flex gap-1 bg-background p-1" aria-hidden="true">
                  {Array.from({ length: SEGMENTS }).map((_, i) => {
                    const isFilled = i < filled
                    const isNext = i === filled && mastery < 100

                    return (
                      <div
                        key={i}
                        className={`h-2 flex-1 transition-all duration-500 ${
                          isFilled
                            ? "bg-chart-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                            : isNext
                            ? "bg-chart-5 opacity-40 animate-pulse"
                            : "bg-secondary/60"
                        }`}
                      />
                    )
                  })}
                </div>
                <span className="font-pixel text-[7px] uppercase text-muted-foreground">
                  {mastery}% Mastered
                </span>
              </button>
            </li>
          )
        })}

        <li
          className="shrink-0 snap-start animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both"
          style={{ animationDelay: `${trees.length * 100}ms` }}
        >
          <button
            type="button"
            onClick={handleExploreClick}
            className={`group hud-panel flex h-full w-28 flex-col items-center justify-center gap-2 p-3 transition-all duration-300 ${
              isExploring
                ? "bg-cyan/30 text-cyan scale-[0.98] shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"
                : "bg-cyan/10 text-cyan hover:bg-cyan/20 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(79,143,138,0.3)] active:translate-y-0"
            }`}
          >
            <Compass
              className={`size-6 transition-transform duration-500 ${
                isExploring ? "animate-spin scale-110" : "group-hover:rotate-90 group-hover:scale-110"
              }`}
              aria-hidden="true"
            />
            <span className="font-pixel text-[8px] leading-relaxed text-center">Explore Trees</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}