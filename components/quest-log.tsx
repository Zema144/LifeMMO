"use client"

import { useState } from "react"
import { ScrollText, Plus, Sparkles } from "lucide-react"
import { QuestCard } from "@/components/quest-card"
import { BlockedAccountBanner } from "@/components/blocked-account-banner"
import { CreateCustomQuestModal } from "@/components/create-custom-quest-modal"
import { SubmitPenaltyModal } from "@/components/submit-penalty-modal"
import type { Quest } from "@/lib/game-data"

export function QuestLog({
  quests,
  player,
  userId,
  onComplete,
  onRefresh,
}: {
  quests: Quest[]
  player?: any
  userId?: string
  onComplete: (id: string) => void
  onRefresh?: () => void
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activePenaltyQuest, setActivePenaltyQuest] = useState<Quest | null>(null)

  const isBlocked = Boolean(player?.isBlocked)
  const penaltyQuest = quests.find(
    (q: any) => q.isPenalty || q.title?.toLowerCase().includes("penalty")
  )
  const activeCustomQuestsCount = quests.filter((q: any) => q.isCustom).length
  const canCreateCustomQuest = !isBlocked && activeCustomQuestsCount < 3

  return (
    <section aria-label="Active quests" className="flex flex-col gap-3">
      {/* Blocked Account Banner */}
      {isBlocked && (
        <BlockedAccountBanner
          onOpenPenaltyModal={() => {
            if (penaltyQuest) {
              setActivePenaltyQuest(penaltyQuest)
            }
          }}
        />
      )}

      {/* Header bar */}
      <div className="flex items-center gap-2">
        <ScrollText className="size-4 text-gold" aria-hidden="true" />
        <h2 className="font-pixel text-[10px] uppercase text-foreground">Active Quests</h2>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!canCreateCustomQuest}
            className="pixel-btn flex items-center gap-1.5 bg-indigo-600 px-2.5 py-1.5 font-pixel text-[8px] uppercase text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            <Plus className="size-3" />
            <span>+ Create Quest</span>
          </button>
          <span className="font-pixel text-[8px] text-muted-foreground">{quests.length} active</span>
        </div>
      </div>

      {quests.length === 0 ? (
        <div className="hud-panel flex flex-col items-center gap-3 bg-card/60 p-6 text-center">
          <p className="font-pixel text-[9px] leading-relaxed text-foreground text-pretty">Quest Log Empty</p>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            Create your own custom quest or select one from the Skill Trees.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!canCreateCustomQuest}
            className="pixel-btn flex items-center gap-1.5 bg-indigo-600 px-3 py-2 font-pixel text-[8px] uppercase text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Sparkles className="size-3.5" />
            <span>Create First Quest</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              player={{ ...player, currentUserId: userId }}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}

      {/* Modal for creating custom quest */}
      {isCreateModalOpen && (
        <CreateCustomQuestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onQuestCreated={() => {
            if (onRefresh) onRefresh()
          }}
        />
      )}

      {/* Modal for penalty photo submission */}
      {activePenaltyQuest && (
        <SubmitPenaltyModal
          isOpen={Boolean(activePenaltyQuest)}
          onClose={() => setActivePenaltyQuest(null)}
          questSlug={activePenaltyQuest.id}
          questTitle={activePenaltyQuest.title}
          questDescription={activePenaltyQuest.description}
          onSuccess={() => {
            if (onRefresh) onRefresh()
          }}
        />
      )}
    </section>
  )
}
