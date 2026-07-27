"use client"

import { useState } from "react"
import { Sparkles, Coins, Zap, Check, CircleCheckBig, Plus, X, Send, Paperclip, Loader2 } from "lucide-react"
import type { Quest } from "@/lib/game-data"

function RewardChip({ label, kind }: { label: string; kind: string }) {
  const isGold = kind === "gold"
  return (
    <span
      className={`inline-flex items-center gap-1 border-2 px-2 py-1 font-pixel text-[8px] leading-none ${
        isGold
          ? "border-gold bg-gold/15 text-gold shadow-[0_0_8px_rgba(251,191,36,0.35)]"
          : "border-primary bg-primary/15 text-primary shadow-[0_0_8px_rgba(99,102,241,0.3)]"
      }`}
    >
      {isGold ? <Coins className="size-3" aria-hidden="true" /> : <Zap className="size-3" aria-hidden="true" />}
      {isGold ? `+${label}G` : `+${label}`}
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
  /** When provided, the card renders in "accept" mode (used inside a node drawer). */
  onAccept?: (id: string) => void
  accepted?: boolean
}) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  if (quest.status === "completed") {
    return (
      <article className="hud-panel flex items-center gap-3 bg-card/50 p-3.5 opacity-75">
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
          category: quest.category || "INT", // За замовчуванням INT (Маг)
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
      <article className="hud-panel bg-card p-4">
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
              className="pixel-btn flex items-center gap-1.5 bg-secondary px-3 py-2 font-pixel text-[8px] leading-none text-secondary-foreground hover:brightness-110 transition-all"
            >
              <Sparkles className="size-3.5 text-cyan" aria-hidden="true" />
              Ask AI
            </button>
          )}

          {acceptMode ? (
            <button
              type="button"
              disabled={accepted}
              data-testid={`accept-${quest.id}`}
              onClick={() => onAccept?.(quest.id)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-2 font-pixel text-[8px] leading-none ${
                accepted
                  ? "border-2 border-chart-5 bg-chart-5/15 text-chart-5"
                  : "pixel-btn bg-primary text-primary-foreground"
              }`}
            >
              {accepted ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" />
                  Accepted
                </>
              ) : (
                <>
                  <Plus className="size-3.5" aria-hidden="true" />
                  Accept Quest
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              data-testid={`complete-${quest.id}`}
              onClick={() => onComplete?.(quest.id)}
              className="pixel-btn ml-auto flex items-center gap-1.5 bg-primary px-3 py-2 font-pixel text-[8px] leading-none text-primary-foreground"
            >
              <Check className="size-3.5" aria-hidden="true" />
              Complete Quest
            </button>
          )}
        </div>
      </article>

      {/* --- МОДАЛЬНЕ ВІКНО ЧАТУ З ШІ --- */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="hud-panel relative flex flex-col w-full max-w-lg h-[500px] bg-slate-900 border-2 border-indigo-500/30 p-4 shadow-2xl">
            {/* Хедер модалки */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-cyan" />
                <h3 className="font-pixel text-[10px] text-foreground uppercase truncate max-w-[280px]">
                  {quest.title} — AI Assistant
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Область повідомлень */}
            <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-xs">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="font-pixel text-[9px] text-cyan mb-1">ШІ-Наставник готовий!</p>
                  <p className="text-xs">Запитай пораду або надішли звіт про виконання квесту.</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded border max-w-[85%] ${
                      m.role === "user"
                        ? "ml-auto bg-indigo-950/60 border-indigo-500/40 text-indigo-100"
                        : "mr-auto bg-slate-800/80 border-slate-700 text-slate-200"
                    }`}
                  >
                    <p className="font-pixel text-[7px] uppercase mb-1 text-cyan">
                      {m.role === "user" ? "Ти" : "ШІ-Наставник"}
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-cyan font-pixel text-[8px] animate-pulse">
                  <Loader2 className="size-3 animate-spin" />
                  Наставник міркує...
                </div>
              )}
            </div>

            {/* Інпут відправки */}
            <form onSubmit={handleSendAiMessage} className="flex items-center gap-2 border-t border-slate-800 pt-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Напиши запитання або звіт..."
                className="flex-1 bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 rounded"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="pixel-btn bg-indigo-600 px-3 py-2 text-white disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="size-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}