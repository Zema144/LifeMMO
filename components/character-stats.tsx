"use client"

import { Brain, Dumbbell, Gauge, MessageCircleHeart, ChefHat, type LucideIcon } from "lucide-react"
import { classColorClasses, type ClassColor, type Player } from "@/lib/game-data"

const statIcon: Record<string, LucideIcon> = {
  INT: Brain,
  STR: Dumbbell,
  DEX: Gauge,
  CHA: MessageCircleHeart,
  CRAFT: ChefHat,
}

const SEGMENTS = 10

// Формула для визначення загального порогу XP рівня
function getRequiredXpForLevel(level: number): number {
  return Math.round(300 * Math.pow(level, 1.35))
}

export function CharacterStats({ player }: { player: Player }) {
  // 1. Рахуємо межі поточного рівня та скільки всього треба для цього левела
  const currentLevelTotalNeeded = getRequiredXpForLevel(player.level)
  const previousLevelTotalNeeded = getRequiredXpForLevel(player.level - 1)
  const levelSpan = currentLevelTotalNeeded - previousLevelTotalNeeded
  
  // 2. Скільки гравці набрали досвіду всередині цього рівня
  const progressInLevel = Math.max(0, player.xp - previousLevelTotalNeeded)
  
  // 3. Відсоток заповнення шкали (від 0 до 1)
  const pct = Math.min(progressInLevel / levelSpan, 1)
  const filled = Math.round(pct * SEGMENTS)
  
  // 4. Залишок XP до наступного рівня беручи з бази (xpToNext)
  const xpRemaining = Math.max(0, player.xpToNext)
  const isReady = xpRemaining === 0 || progressInLevel >= levelSpan

  return (
    <section aria-label="Character progress" className="hud-panel bg-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-pixel text-[12px] text-foreground">LVL {player.level}</span>
        <span className="font-pixel text-[10px] text-muted-foreground">
          {progressInLevel}/{levelSpan} XP
        </span>
      </div>

      <div
        className="hud-inset flex gap-1 bg-background p-1"
        role="progressbar"
        aria-valuenow={progressInLevel}
        aria-valuemin={0}
        aria-valuemax={levelSpan}
        aria-label="Experience to next level"
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFilled = i < filled
          const isLastFilled = i === filled - 1

          return (
            <div
              key={i}
              className={`h-3 flex-1 transition-all duration-300 ${
                isLastFilled
                  ? "bg-xp xp-pulse"
                  : isFilled
                  ? "bg-xp shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                  : "bg-secondary/60"
              }`}
            />
          )
        })}
      </div>
      
      <p className="mt-2 text-[11px] text-muted-foreground">
        {!isReady 
          ? `${xpRemaining} XP to Level ${player.level + 1}` 
          : "Level Up Ready!"}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {player.stats.map((stat) => {
          const Icon = statIcon[stat.key]
          const c = classColorClasses[stat.color as ClassColor]
          return (
            <div
              key={stat.key}
              className={`flex flex-col items-center gap-1.5 border-2 ${c.border} ${c.bg} py-3`}
            >
              <Icon className={`size-5 ${c.text}`} aria-hidden="true" />
              <span className={`font-pixel text-sm leading-none ${c.text}`}>{stat.value}</span>
              <span className="font-pixel text-[9px] uppercase text-muted-foreground">{stat.key}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}