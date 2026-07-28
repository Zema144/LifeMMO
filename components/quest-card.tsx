"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { Coins, Zap, Check, CircleCheckBig, X, Send, Loader2 } from "lucide-react"
import type { Quest } from "@/lib/game-data"
import { getMentor } from "@/lib/mentors"

// --- 1. ОРИГІНАЛЬНИЙ ЧІП (ДЛЯ ГОЛОВНОЇ СТОРІНКИ) ---
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

// --- 2. МАГІЧНИЙ ЧІП (ТІЛЬКИ ДЛЯ ДЕРЕВА НАВИЧОК) ---
function MagicalRewardChip({ label, kind }: { label: string; kind: string }) {
  const isGold = kind === "gold"
  return (
    <span className={`flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 font-pixel text-[9px] leading-none transition-transform duration-200 hover:-translate-y-1 hover:scale-105 ${
      isGold ? "border-gold/40 bg-gold/10 text-gold shadow-[0_0_10px_rgba(251,191,36,0.15)]" : "border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_rgba(201,148,58,0.15)]"
    }`}>
      {isGold ? <Coins className="size-3.5" aria-hidden="true" /> : <Zap className="size-3.5" aria-hidden="true" />}
      <span>{isGold ? `+${label}G` : `+${label}`}</span>
    </span>
  )
}

export function QuestCard({
  quest,
  onComplete,
  variant = "retro"
}: {
  quest: Quest
  onComplete?: (id: string) => void
  variant?: "retro" | "magical"
}) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const mentor = getMentor(quest.statRewardType || "INT")

  // Портал вимагає щоб компонент змонтувався
  useEffect(() => {
    setMounted(true)
  }, [])

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
      setMessages([...newMessages, { role: "assistant", content: "Помилка зв'язку з Наставником." }])
    } finally {
      setIsLoading(false)
    }
  }

  // ======================================================================
  // ВАРІАНТ 1: НОВИЙ МАГІЧНИЙ ДИЗАЙН (Використовується тільки в Node Drawer)
  // ======================================================================
  if (variant === "magical") {
    if (quest.status === "completed") {
      return (
        <article className="flex items-center gap-4 rounded-xl border border-chart-5/20 bg-chart-5/5 p-5 opacity-75 transition-opacity duration-300 hover:opacity-100">
          <CircleCheckBig className="size-6 shrink-0 text-chart-5" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-[16px] italic text-muted-foreground line-through">{quest.title}</h3>
            <p className="mt-1 font-pixel text-[9px] uppercase tracking-wider text-chart-5">Cleared</p>
          </div>
        </article>
      )
    }

    return (
      <>
        <article className="relative overflow-hidden bg-gradient-to-br from-[#1c1622] to-background p-6 transition-all duration-300">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/10 blur-3xl" />
          <h3 className="relative z-10 font-serif text-[18px] italic text-foreground text-pretty drop-shadow-sm">{quest.title}</h3>
          <p className="relative z-10 mt-2 text-[14px] leading-relaxed text-muted-foreground text-pretty">{quest.description}</p>
          <div className="relative z-10 mt-5 flex flex-wrap gap-2.5">
            {quest.rewards.map((r) => <MagicalRewardChip key={r.label} label={r.label} kind={r.kind} />)}
          </div>
          <div className="relative z-10 mt-7 flex flex-wrap gap-3">
            {quest.hasAiHelper && (
              <button type="button" onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 font-pixel text-[10px] text-foreground transition-all hover:border-primary/50 hover:bg-primary/15 hover:shadow-[0_0_15px_rgba(201,148,58,0.2)] active:scale-95">
                <div className="relative size-7 overflow-hidden rounded-full border border-primary/30 bg-background shadow-inner">
                  <Image src={mentor.avatar} alt="" fill className="pixelated object-cover animate-idle" aria-hidden="true" />
                </div>
                Ask {mentor.name}
              </button>
            )}
            {onComplete && (
              <button type="button" onClick={() => onComplete(quest.id)} className="ml-auto flex items-center gap-2 rounded-lg border border-primary bg-primary/20 px-5 py-2.5 font-pixel text-[10px] uppercase tracking-wide text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(201,148,58,0.4)] active:scale-95">
                <Check className="size-4" aria-hidden="true" /> Complete
              </button>
            )}
          </div>
        </article>

        {isAiModalOpen && mounted && createPortal(
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050308]/80 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAiModalOpen(false)}>
            <div className="relative flex w-full max-w-lg items-center justify-center animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="mentor-figure-enter pointer-events-none absolute -left-48 bottom-0 z-20 hidden h-[380px] w-48 shrink-0 md:block">
                <Image src={mentor.avatar} alt={mentor.name} fill className="pixelated object-contain object-bottom drop-shadow-[0_10px_16px_rgba(0,0,0,0.6)] animate-idle" />
              </div>
              <div className="relative z-10 flex h-[85vh] max-h-[550px] w-full flex-col overflow-hidden rounded-xl border border-primary/30 bg-[#120d16] shadow-[0_0_40px_rgba(201,148,58,0.15)]">
                <div className="flex items-center gap-3 border-b border-primary/20 bg-primary/5 p-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-primary/30 bg-background md:hidden">
                    <Image src={mentor.avatar} alt="" fill className="pixelated object-cover object-top animate-idle" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-pixel text-[13px] uppercase tracking-wider text-primary">{mentor.name}</h3>
                    <p className="mt-1 truncate font-serif text-[14px] italic text-muted-foreground">{mentor.title}</p>
                  </div>
                  <button type="button" onClick={() => setIsAiModalOpen(false)} className="rounded-full border border-primary/20 bg-background/50 p-2 text-muted-foreground transition-all hover:border-destructive/50 hover:bg-destructive/20 hover:text-destructive">
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
                  {messages.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground animate-in fade-in duration-500">
                      <p className="mb-2 font-pixel text-[12px] uppercase text-primary">{mentor.name} is ready!</p>
                      <p className="font-serif text-[15px] italic">Ask for advice or send a report on your quest progress.</p>
                    </div>
                  ) : (
                    messages.map((m, idx) => (
                      <div key={idx} className={`max-w-[85%] rounded-xl border p-3.5 shadow-sm animate-in slide-in-from-bottom-2 fade-in duration-300 ${m.role === "user" ? "ml-auto border-primary/30 bg-primary/10 text-primary-foreground" : "mr-auto border-border bg-[#1c1622] text-foreground"}`}>
                        <p className="mb-1.5 font-pixel text-[10px] uppercase tracking-wider text-muted-foreground opacity-75">{m.role === "user" ? "You" : mentor.name}</p>
                        <p className="leading-relaxed whitespace-pre-wrap text-[13px]">{m.content}</p>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex items-center gap-2 font-pixel text-[10px] uppercase tracking-wider text-primary/70 animate-pulse">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> {mentor.name} is formulating a response...
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendAiMessage} className="flex items-center gap-3 border-t border-primary/20 bg-primary/5 p-4">
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type a question or report..." className="flex-1 rounded-lg border border-border bg-[#0d0812] px-4 py-3 text-sm text-foreground placeholder:font-serif placeholder:italic placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" />
                  <button type="submit" disabled={isLoading || !inputMessage.trim()} className="flex items-center justify-center rounded-lg border border-primary bg-primary/20 p-3 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                    <Send className="size-5" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
          </div>, document.body
        )}
      </>
    )
  }

  // ======================================================================
  // ВАРІАНТ 2: ТВІЙ ОРИГІНАЛЬНИЙ КОД (Для головної сторінки - БЕЗ КНОПКИ ACCEPT)
  // ======================================================================

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

          {onComplete && (
            <button
              type="button"
              onClick={() => onComplete?.(quest.id)}
              className="pixel-btn ml-auto flex items-center gap-1.5 bg-primary px-3 py-2 font-pixel text-[8px] leading-none text-primary-foreground transition-all hover:shadow-[0_0_12px_rgba(201,147,46,0.6)] hover:brightness-110 active:translate-y-[2px]"
            >
              <Check className="size-3.5" aria-hidden="true" />
              Complete Quest
            </button>
          )}
        </div>
      </article>

      {/* ТВІЙ ОРИГІНАЛЬНИЙ ДІАЛОГ (Через createPortal) */}
      {isAiModalOpen && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 animate-in fade-in duration-200"
          onClick={() => setIsAiModalOpen(false)}
        >
          <div className="relative flex w-full max-w-lg items-center animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="mentor-figure-enter pointer-events-none relative z-20 -mr-16 hidden h-[340px] w-56 shrink-0 sm:block">
              <Image
                src={mentor.avatar}
                alt={`${mentor.name}`}
                fill
                className="pixelated object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.6)] animate-idle"
              />
            </div>

            <div className="hud-panel relative z-10 flex h-[520px] w-full flex-col bg-card p-4 shadow-2xl">
              <div className="flex items-center gap-3 border-b-2 border-border pb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-pixel text-[12px] uppercase text-foreground">{mentor.name}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{mentor.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="pixel-btn bg-secondary p-2 text-secondary-foreground transition-all hover:bg-destructive hover:text-destructive-foreground active:translate-y-[2px]"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <p className="border-b-2 border-border py-2 text-[13px] leading-relaxed text-muted-foreground text-pretty">
                {quest.title}
              </p>

              <div className="my-3 flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground animate-in fade-in duration-500">
                    <p className="mb-1 font-pixel text-[11px] text-foreground">{mentor.name} is ready!</p>
                    <p className="text-xs">Ask for advice or send a report on your quest progress.</p>
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
                      <p className="mb-1 font-pixel text-[9px] uppercase text-muted-foreground">
                        {m.role === "user" ? "You" : mentor.name}
                      </p>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 font-pixel text-[10px] text-muted-foreground animate-pulse">
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
        </div>, document.body
      )}
    </>
  )
}