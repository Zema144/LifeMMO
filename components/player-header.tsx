import Image from "next/image"
import { Flame, Coins } from "lucide-react"
import type { Player } from "@/lib/game-data"

export function PlayerHeader({ player }: { player: Player }) {
  return (
    <header className="hud-panel flex items-center gap-3 bg-card p-3">
      <div className="relative shrink-0">
        <div className="hud-inset size-16 overflow-hidden bg-secondary">
          <Image
            src="/avatar-wizard.png"
            alt={`${player.name}'s character avatar`}
            width={64}
            height={64}
            className="pixelated size-full object-cover"
            priority
          />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 border-border bg-primary px-1.5 py-1 font-pixel text-[8px] leading-none text-primary-foreground">
          LV {player.level}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-pixel text-[11px] leading-relaxed text-foreground">{player.name}</h1>
        <p className="mt-1 truncate text-xs text-muted-foreground">{player.title}</p>
        <div className="mt-1.5 inline-flex items-center gap-1 border-2 border-border bg-gold/15 px-1.5 py-0.5">
          <Coins className="size-3 text-gold" aria-hidden="true" />
          <span className="font-pixel text-[8px] leading-none text-gold">{player.gold}G</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1 border-2 border-border bg-streak/15 px-2.5 py-2">
        <Flame className="size-5 text-streak" aria-hidden="true" />
        <span className="font-pixel text-[10px] leading-none text-streak">{player.streak}</span>
        <span className="text-[9px] uppercase text-muted-foreground">days</span>
      </div>
    </header>
  )
}
