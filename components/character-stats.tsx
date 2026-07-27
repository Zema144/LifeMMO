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

export function CharacterStats({ player }: { player: Player }) {
  // 1. Обмежуємо відсоток до максимуму 1 (100%), щоб не було переповнення
  const pct = Math.min(player.xp / player.xpToNext, 1)
  const filled = Math.round(pct * SEGMENTS)
  
  // 2. Рахуємо залишок XP, не допускаючи від'ємних значень
  const xpRemaining = Math.max(0, player.xpToNext - player.xp)

  return (
    <section aria-label="Character progress" className="hud-panel bg-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-pixel text-[12px] text-foreground">LVL {player.level}</span>
        <span className="font-pixel text-[10px] text-muted-foreground">
          {player.xp}/{player.xpToNext} XP
        </span>
      </div>

      <div
        className="hud-inset flex gap-1 bg-background p-1"
        role="progressbar"
        aria-valuenow={player.xp}
        aria-valuemin={0}
        aria-valuemax={player.xpToNext}
        aria-label="Experience to next level"
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFilled = i < filled
          // Пульсує тільки останній заповнений кубик
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
        {xpRemaining > 0 
          ? `${xpRemaining} XP to Level ${player.level + 1}` 
          : "Level Up Ready!" /* Гарний напис, коли XP переповнено */}
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