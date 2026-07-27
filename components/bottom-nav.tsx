"use client"

export type TabId = "quests" | "trees" | "profile"

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "quests", label: "Quests", emoji: "📜" },
  { id: "trees", label: "Skill Trees", emoji: "🌳" },
  { id: "profile", label: "Profile", emoji: "👤" },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-border bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pt-2">
        {TABS.map((t) => {
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`nav-${t.id}`}
              onClick={() => onChange(t.id)}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 px-1 pb-2 pt-1"
            >
              <span
                className={`flex size-9 items-center justify-center border-2 text-base transition-colors ${
                  isActive
                    ? "border-primary bg-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.55)]"
                    : "border-transparent bg-transparent"
                }`}
                aria-hidden="true"
              >
                {t.emoji}
              </span>
              <span
                className={`font-pixel text-[7px] uppercase leading-none ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </span>
              <span className={`mt-0.5 h-[3px] w-6 ${isActive ? "bg-primary" : "bg-transparent"}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
