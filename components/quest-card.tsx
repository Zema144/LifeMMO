"use client"

import { useState } from "react"
import Image from "next/image"
import { Coins, Zap, Check, CircleCheckBig, Plus, X, Send, Loader2 } from "lucide-react"
import type { Quest } from "@/lib/game-data"
import { getMentor } from "@/lib/mentors"

function RewardChip({ label, kind }: { label: string; kind: string }) {
  const isGold = kind === "gold"
  return (
    <span
      className={`shine-effect inline-flex items-center gap-1 border-2 px-2 py-1 font-pixel text-[8px] leading-none transition-transform duration-200 hover:-translate-y-1 hover:scale-105 cursor-default ${
        isGold
          ? "border-gold bg-gold/15 text-gold shadow-[0_0_8px_rgba(251,191,36,0.35)]"
          : "border-primary bg-primary/15 text-primary shadow-[0_0_8px_rgba(99,102,241,0.3)]"
      }`}
    >
      {isGold ? <Coins className="size-3 relative z-10" aria-hidden="true" /> : <Zap className="size-3 relative z-10" aria-hidden="true" />}
      <span className="relative z-10">{isGold ? `+${label}G` : `+${label}`}</span>
    </span>
  )
}

export function QuestCard({
  quest,
  onComplete,
  onAccept,
  accepted,
}: {
  quest: Quest
  onComplete?: (id: string) => void
  onAccept?: (id: string) => void
  accepted?: boolean
}) {
  console.log("ЯКИЙ КВЕСТ ПРИЙШОВ:", quest.title, quest.statRewardType);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)


  const mentor = getMentor(quest.statRewardType || "INT")

  if (quest.status === "completed") {
    return (
      <article className="hud-panel flex items-center gap-3 bg-card/50 p-3.5 opacity-75 transition-opacity duration-300 hover:opacity-100">
        <CircleCheckBig className="size-5 shrink-0 text-chart-5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-pixel text-[9px] leading-relaxed text-muted-foreground line-through">
            {quest.title}
          </h3>
          <p className="mt-1 font-pixel text-[7px] uppercase text-chart-5">Cleared</p>
        </div>
      </article>
    )
  }

  const acceptMode = typeof onAccept === "function"

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage
    setInputMessage("")
    const newMessages = [...messages, { role: "user" as const, content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: newMessages,
    questTitle: quest.title,
    questDescription: quest.description,
    category: quest.statRewardType || "INT", 
  }),
})

      if (!response.ok) throw new Error("AI response failed")

      const data = await response.json()
      setMessages([...newMessages, { role: "assistant", content: data.feedback || data.content || "Звіт прийнято." }])
    } catch (err) {
      console.error(err)
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Помилка зв'язку з Наставником. Перевір підключення до API." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <article className="hud-panel bg-card p-4 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <h3 className="font-pixel text-[11px] leading-relaxed text-foreground text-pretty">{quest.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{quest.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {quest.rewards.map((r) => (
            <RewardChip key={r.label} label={r.label} kind={r.kind} />
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {quest.hasAiHelper && (
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="pixel-btn flex items-center gap-1.5 bg-secondary px-2 py-2 pr-3 font-pixel text-[8px] leading-none text-secondary-foreground transition-all hover:brightness-110 active:translate-y-[2px]"
            >
              <span className="hud-inset size-5 shrink-0 overflow-hidden bg-background">
                {/* Додано animate-idle для міні-аватарки */}
                <Image
                  src={mentor.avatar}
                  alt=""
                  width={20}
                  height={20}
                  className="pixelated size-full object-cover animate-idle"
                  aria-hidden="true"
                />
              </span>
              Ask {mentor.name}
            </button>
          )}

          {acceptMode ? (
            <button
              type="button"
              disabled={accepted}
              onClick={() => onAccept?.(quest.id)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-2 font-pixel text-[8px] leading-none transition-all ${
                accepted
                  ? "border-2 border-chart-5 bg-chart-5/15 text-chart-5"
                  : "pixel-btn bg-primary text-primary-foreground hover:brightness-110 active:translate-y-[2px]"
              }`}
            >
              {accepted ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" />
                  Accepted
                </>
              ) : (
                <>
                  <Plus className="size-3.5 animate-pulse" aria-hidden="true" />
                  Accept Quest
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onComplete?.(quest.id)}
              // Додано shadow світіння, яке пульсує при наведенні
              className="pixel-btn ml-auto flex items-center gap-1.5 bg-primary px-3 py-2 font-pixel text-[8px] leading-none text-primary-foreground transition-all hover:shadow-[0_0_12px_rgba(201,147,46,0.6)] hover:brightness-110 active:translate-y-[2px]"
            >
              <Check className="size-3.5" aria-hidden="true" />
              Complete Quest
            </button>
          )}
        </div>
      </article>

      {/* --- ДІАЛОГ З НАСТАВНИКОМ --- */}
{/* --- ДІАЛОГ З НАСТАВНИКОМ --- */}
      {isAiModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsAiModalOpen(false)}
        >
          <div className="relative flex w-full max-w-lg items-center justify-center animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Арт для десктопу (збоку) */}
            <div className="mentor-figure-enter pointer-events-none absolute -left-48 bottom-0 z-20 hidden h-[380px] w-48 shrink-0 md:block">
              <Image
                src={mentor.avatar}
                alt={`${mentor.name}`}
                fill
                className="pixelated object-contain object-bottom drop-shadow-[0_10px_16px_rgba(0,0,0,0.6)] animate-idle"
              />
            </div>

            <div className="hud-panel relative z-10 flex h-[85vh] max-h-[520px] w-full flex-col bg-card p-3 sm:p-4 shadow-2xl">
              {/* Шапка з мобільним артом */}
              <div className="flex items-center gap-3 border-b-2 border-border pb-3">
                {/* Мобільна міні-версія арту зверху */}
                <div className="hud-inset relative size-12 shrink-0 overflow-hidden bg-background md:hidden">
                  <Image
                    src={mentor.avatar}
                    alt=""
                    fill
                    className="pixelated object-cover object-top animate-idle"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-pixel text-[11px] sm:text-[12px] uppercase text-foreground">{mentor.name}</h3>
                  <p className="mt-1 truncate text-[10px] sm:text-xs text-muted-foreground">{mentor.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="pixel-btn bg-secondary p-2 text-secondary-foreground transition-all hover:bg-destructive hover:text-destructive-foreground active:translate-y-[2px]"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <p className="border-b-2 border-border py-2 text-xs sm:text-[13px] leading-relaxed text-muted-foreground text-pretty">
                {quest.title}
              </p>

              <div className="my-3 flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
                {messages.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground animate-in fade-in duration-500">
                    <p className="mb-1 font-pixel text-[10px] sm:text-[11px] text-foreground">{mentor.name} is ready!</p>
                    <p className="text-[11px] sm:text-xs">Ask for advice or send a report on your quest progress.</p>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] border-2 p-2.5 animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                        m.role === "user"
                          ? "ml-auto border-primary/50 bg-primary/15 text-foreground"
                          : "mr-auto border-border bg-secondary/50 text-foreground"
                      }`}
                    >
                      <p className="mb-1 font-pixel text-[8px] sm:text-[9px] uppercase text-muted-foreground">
                        {m.role === "user" ? "You" : mentor.name}
                      </p>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 font-pixel text-[9px] sm:text-[10px] text-muted-foreground animate-pulse">
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                    {mentor.name} is formulating a response...
                  </div>
                )}
              </div>

              <form onSubmit={handleSendAiMessage} className="flex items-center gap-2 border-t-2 border-border pt-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a question or report..."
                  className="hud-inset flex-1 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="pixel-btn flex items-center justify-center bg-primary px-3 py-2 text-primary-foreground transition-all hover:brightness-110 active:translate-y-[2px] disabled:opacity-50 disabled:active:translate-y-0"
                >
                  <Send className="size-3.5" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}