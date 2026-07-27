import { ScrollText } from "lucide-react"
import { QuestCard } from "@/components/quest-card"
import type { Quest } from "@/lib/game-data"

export function QuestLog({
  quests,
  onComplete,
}: {
  quests: Quest[]
  onComplete: (id: string) => void
}) {
  return (
    <section aria-label="Active quests" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ScrollText className="size-4 text-gold" aria-hidden="true" />
        <h2 className="font-pixel text-[10px] uppercase text-foreground">Active Quests</h2>
        <span className="ml-auto font-pixel text-[8px] text-muted-foreground">{quests.length} unlocked</span>
      </div>

      {quests.length === 0 ? (
        <div className="hud-panel flex flex-col items-center gap-2 bg-card/60 p-6 text-center">
          <p className="font-pixel text-[9px] leading-relaxed text-foreground text-pretty">Quest Log Empty</p>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            Visit the Skill Trees tab and accept a quest from an in-progress node to fill your log.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} onComplete={onComplete} />
          ))}
        </div>
      )}
    </section>
  )
}
