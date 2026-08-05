"use client"

import { useEffect } from "react"
import { X, Lock, CheckCircle2, Sparkles } from "lucide-react"
import { QuestCard } from "@/components/quest-card"
import type { Quest, SkillNode, SkillTree } from "@/lib/game-data"

export function NodeDrawer({
  tree,
  node,
  quests,
  player,
  acceptedQuestIds,
  onAccept,
  onComplete, // <--- 1. ДОДАЛИ onComplete СЮДИ
  onClose,
}: {
  tree: SkillTree
  node: SkillNode | null
  quests: Quest[]
  player?: any
  acceptedQuestIds: string[]
  onAccept: (id: string) => void
  onComplete: (id: string) => void // <--- 2. ДОДАЛИ ТИП ДЛЯ onComplete
  onClose: () => void
}) {
  const pendingQuests = quests.filter((q) => q.status !== "completed")
  const completedQuests = quests.filter((q) => q.status === "completed")
  const activeQuest = pendingQuests[0]

  useEffect(() => {
    if (activeQuest && !acceptedQuestIds.includes(activeQuest.id)) {
      onAccept(activeQuest.id)
    }
  }, [activeQuest, acceptedQuestIds, onAccept])

  if (!node) return null

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050308]/80 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-primary/30 bg-[#120d16] shadow-[0_0_50px_rgba(201,148,58,0.15)] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-4 sm:p-5">
          <div>
            <p className="flex items-center gap-1 font-pixel text-[9px] sm:text-[11px] uppercase tracking-wider text-primary">
              <Sparkles className="size-3 sm:size-3.5" aria-hidden="true" />
              {tree.label}
            </p>
            <h2 className="mt-1 font-serif text-xl sm:text-2xl italic tracking-wide text-foreground drop-shadow-md">
              {node.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-primary/20 bg-background/50 p-2 sm:p-2.5 text-primary/70 transition-all hover:border-destructive/50 hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="size-4 sm:size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex max-h-[80vh] flex-col gap-4 sm:gap-6 overflow-y-auto p-4 sm:p-5 pointer-events-auto">
          {pendingQuests.map((quest) => {
            const isActive = activeQuest?.id === quest.id

            return (
              <div
                key={quest.id}
                className={`relative transition-all duration-700 ease-out animate-in slide-in-from-bottom-4 fade-in ${
                  isActive
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-[0.98] opacity-50 grayscale"
                }`}
              >
                {isActive && (
                  <div className="absolute -inset-1 rounded-xl bg-primary/25 blur-md animate-pulse" />
                )}

                {!isActive && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/30 backdrop-blur-[1px]">
                    <div className="flex items-center gap-1.5 rounded-full border border-border bg-[#16121e] px-4 py-1.5 font-pixel text-[10px] uppercase text-muted-foreground shadow-xl">
                      <Lock className="size-3.5" aria-hidden="true" />
                      In Queue
                    </div>
                  </div>
                )}
                
                <div className={`relative z-10 overflow-hidden rounded-xl bg-card ${isActive ? 'border border-primary/80 shadow-[0_0_20px_rgba(201,148,58,0.2)]' : 'border border-border'}`}>
                  {/* 3. ТЕПЕР МИ ПЕРЕДАЄМО onComplete ПРАВИЛЬНО */}
                  <QuestCard quest={quest} player={player} onComplete={onComplete} variant="magical" />
                </div>
              </div>
            )
          })}

          {pendingQuests.length === 0 && completedQuests.length > 0 && (
            <div className="my-5 flex flex-col items-center justify-center text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-chart-5/10">
                <CheckCircle2 className="size-7 text-chart-5" />
              </div>
              <p className="font-pixel text-[13px] uppercase text-chart-5 drop-shadow-[0_0_8px_rgba(122,156,74,0.4)]">
                Node Mastered
              </p>
              <p className="mt-2 text-[12px] text-muted-foreground">All arcane knowledge absorbed.</p>
            </div>
          )}

          {completedQuests.length > 0 && (
            <div className="mt-2 flex flex-col gap-3 border-t border-primary/20 pt-5">
              <p className="font-pixel text-[10px] uppercase tracking-wider text-muted-foreground">
                Completed Manifestations
              </p>
              {completedQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="flex items-center gap-4 rounded-md border border-chart-5/30 bg-chart-5/5 p-3.5 transition-all animate-in zoom-in duration-300"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-chart-5" aria-hidden="true" />
                  <p className="line-clamp-1 font-serif text-[15px] italic text-muted-foreground line-through">
                    {quest.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}