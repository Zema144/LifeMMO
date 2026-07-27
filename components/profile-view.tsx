import Image from "next/image"
import { Coins, Flame, Trophy } from "lucide-react"
import { treeMastery, classColorClasses, type Player, type SkillTree, type SkillTreeId } from "@/lib/game-data"
import { TreeIcon } from "@/components/tree-icon"

export function ProfileView({
  player,
  skillTrees,
  activeTrees,
}: {
  player: Player
  skillTrees: SkillTree[]
  activeTrees: SkillTreeId[]
}) {
  const joined = skillTrees.filter((t) => activeTrees.includes(t.id))

  return (
    <div className="flex flex-col gap-4">
      <section className="hud-panel flex flex-col items-center gap-3 bg-card p-5 text-center">
        <div className="hud-inset size-24 overflow-hidden bg-secondary">
          <Image
            src="/avatar-wizard.png"
            alt={`${player.name}'s character avatar`}
            width={96}
            height={96}
            className="pixelated size-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-pixel text-[13px] leading-relaxed text-foreground">{player.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{player.title}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="border-2 border-border bg-primary/15 px-2 py-1 font-pixel text-[8px] leading-none text-primary">
            LV {player.level}
          </span>
          <span className="flex items-center gap-1 border-2 border-border bg-gold/15 px-2 py-1 font-pixel text-[8px] leading-none text-gold">
            <Coins className="size-3" aria-hidden="true" />
            {player.gold}G
          </span>
          <span className="flex items-center gap-1 border-2 border-border bg-streak/15 px-2 py-1 font-pixel text-[8px] leading-none text-streak">
            <Flame className="size-3" aria-hidden="true" />
            {player.streak} day streak
          </span>
        </div>
      </section>

      <section aria-label="Attributes" className="hud-panel bg-card p-4">
        <p className="font-pixel text-[9px] uppercase text-muted-foreground">Attributes</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {player.stats.map((stat) => {
            const c = classColorClasses[stat.color]
            return (
              <div
                key={stat.key}
                className={`flex flex-col items-center gap-1.5 border-2 ${c.border} ${c.bg} py-3`}
              >
                <span className={`font-pixel text-sm leading-none ${c.text}`}>{stat.value}</span>
                <span className="font-pixel text-[7px] uppercase text-muted-foreground">{stat.key}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-label="Joined professions" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-gold" aria-hidden="true" />
          <p className="font-pixel text-[9px] uppercase text-foreground">Joined Professions</p>
        </div>
        <div className="flex flex-col gap-2.5">
          {joined.map((tree) => {
            const c = classColorClasses[tree.classColor]
            const mastery = treeMastery(tree)
            return (
              <div key={tree.id} className="hud-panel flex items-center gap-3 bg-card p-3">
                <span className={`flex size-9 shrink-0 items-center justify-center border-2 ${c.border} ${c.bg}`}>
                  <TreeIcon icon={tree.icon} className={`size-4 ${c.text}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-pixel text-[9px] leading-relaxed text-foreground">{tree.label}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    {tree.className} · LVL {tree.level}
                  </p>
                </div>
                <span className={`shrink-0 font-pixel text-[9px] leading-none ${c.text}`}>{mastery}%</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
