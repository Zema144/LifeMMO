import { Brain, Dumbbell, ChefHat, Coins, Languages, Music, type LucideIcon } from "lucide-react"
import type { SkillTree } from "@/lib/game-data"

const iconMap: Record<SkillTree["icon"], LucideIcon> = {
  brain: Brain,
  dumbbell: Dumbbell,
  chef: ChefHat,
  coins: Coins,
  languages: Languages,
  music: Music,
}

export function TreeIcon({
  icon,
  className,
}: {
  icon: SkillTree["icon"]
  className?: string
}) {
  const Icon = iconMap[icon]
  return <Icon className={className} aria-hidden="true" />
}
