import { Flame, Coins } from "lucide-react"
import type { Player } from "@/lib/game-data"
import { CharacterAvatar } from "@/components/character-avatar"

export function PlayerHeader({ player }: { player: Player }) {
  return (
    <header className="hud-panel flex items-center gap-3 bg-card p-3">
      <div className="relative shrink-0">
        
        {/* Аватар маленького розміру */}
        <div className="animate-idle">
          <CharacterAvatar 
            gender={player.gender} 
            skin={player.avatarSkin} 
            hair={player.avatarHair} 
            armor={player.avatarArmor} 
            size="sm" 
          />
        </div>

        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 border-border bg-primary px-1.5 py-1 font-pixel text-[8px] leading-none text-primary-foreground z-10">
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

      <div className="flex shrink-0 flex-col items-center gap-1 border-2 border-border bg-streak/15 px-2.5 py-2 relative overflow-hidden">
        <Flame className="size-5 text-streak animate-flame" aria-hidden="true" />
        <span className="font-pixel text-[10px] leading-none text-streak relative z-10">{player.streak}</span>
        <span className="text-[9px] uppercase text-muted-foreground relative z-10">days</span>
      </div>
    </header>
  )
}