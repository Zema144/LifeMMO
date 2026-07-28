"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Shield, Sword, Crown, Loader2, ArrowRight, ArrowLeft, UserCheck } from "lucide-react"
import { CharacterAvatar } from "@/components/character-avatar"

const TITLES = [
  { id: "Mind Weaver", label: "Mind Weaver", icon: Sparkles, desc: "Master of intellect, strategy, and mental focus.", stats: "INT: 2 | STR: 1 | DEX: 1 | CHA: 1" },
  { id: "Iron Vanguard", label: "Iron Vanguard", icon: Shield, desc: "Built on discipline and unyielding strength.", stats: "INT: 1 | STR: 2 | DEX: 1 | CHA: 1" },
  { id: "Shadow Artisan", label: "Shadow Artisan", icon: Sword, desc: "Driven by craftsmanship, agility, and precision.", stats: "INT: 1 | STR: 1 | DEX: 2 | CHA: 1" },
  { id: "Silver Orator", label: "Silver Orator", icon: Crown, desc: "Wields charisma, influence, and social connection.", stats: "INT: 1 | STR: 1 | DEX: 1 | CHA: 2" },
]

const SKINS = [
  { id: "light", label: "Light", color: "#ffd1b3" },
  { id: "tan", label: "Tan", color: "#d49b6a" },
  { id: "dark", label: "Dark", color: "#8d5b3c" },
]

const HAIRS = [
  { id: "short", label: "Short" },
  { id: "long", label: "Long" },
  { id: "spikes", label: "Spikes" },
  { id: "bald", label: "Bald" },
]

const ARMORS = [
  { id: "cloth", label: "Novice Robes" },
  { id: "leather", label: "Scout Leather" },
  { id: "plate", label: "Knight Plate" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [transitionAnim, setTransitionAnim] = useState("animate-fade-in")

  // Крок 1: Дані персонажа
  const [name, setName] = useState("")
  const [selectedTitle, setSelectedTitle] = useState(TITLES[0].id)
  const [nameError, setNameError] = useState("")

  // Крок 2: Зовнішній вигляд
  const [gender, setGender] = useState<"male" | "female">("male")
  const [skin, setSkin] = useState("light")
  const [hair, setHair] = useState("short")
  const [armor, setArmor] = useState("cloth")

  const [isLoading, setIsLoading] = useState(false)
  const activeTitleData = TITLES.find((t) => t.id === selectedTitle)

  const changeStep = (nextStep: 1 | 2) => {
    if (nextStep === 2) {
      const trimmedName = name.trim()

      // 1. Перевірка довжини імені (від 3 до 20 символів)
      if (trimmedName.length < 3 || trimmedName.length > 20) {
        setNameError("Name must be between 3 and 20 characters.")
        return
      }

      // 2. Перевірка на спецсимволи (тільки латиниця, цифри та нижнє підкреслення)
      const validNameRegex = /^[a-zA-Z0-9_]+$/
      if (!validNameRegex.test(trimmedName)) {
        setNameError("Only letters, numbers, and underscores are allowed.")
        return
      }

      setNameError("")
    }

    setTransitionAnim("opacity-0 scale-95 transition-all duration-150")
    setTimeout(() => {
      setStep(nextStep)
      setTransitionAnim("opacity-100 scale-100 transition-all duration-200")
    }, 150)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setNameError("")

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          title: selectedTitle,
          gender,
          avatarSkin: skin,
          avatarHair: hair,
          avatarArmor: armor,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/")
        router.refresh()
      } else {
        // Якщо сервер повернув помилку (наприклад, ім'я вже зайняте) — повертаємо користувача на 1 крок назад із повідомленням
        setIsLoading(false)
        setStep(1)
        setNameError(data.error || "Something went wrong.")
      }
    } catch (error) {
      console.error(error)
      setIsLoading(false)
      setNameError("Failed to connect to server.")
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-4">
      <div className={`hud-panel max-w-md w-full bg-card p-6 space-y-6 border-2 border-border shadow-2xl relative overflow-hidden ${transitionAnim}`}>
        
        {/* Індикатор кроку */}
        <div className="flex items-center justify-between border-b-2 border-border pb-3">
          <span className="font-pixel text-[10px] uppercase text-primary">Step {step} of 2</span>
          <span className="font-pixel text-[10px] uppercase text-muted-foreground">
            {step === 1 ? "Class & Attributes" : "Avatar & Gender"}
          </span>
        </div>

        {/* КРОК 1: ІМ'Я ТА КЛАС */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h1 className="font-pixel text-lg text-foreground">Character Creation</h1>
              <p className="text-xs text-muted-foreground">Choose your hero's identity and starting stats.</p>
            </div>

            <div className="space-y-2">
              <label className="font-pixel text-[11px] uppercase text-muted-foreground">Character Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError("")
                }}
                placeholder="Enter hero name..."
                className={`w-full bg-secondary border-2 p-3.5 text-sm font-pixel text-foreground focus:outline-none transition-colors ${
                  nameError ? "border-destructive" : "border-border focus:border-primary"
                }`}
              />
              {nameError && (
                <p className="text-[10px] font-pixel text-destructive mt-1">{nameError}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <label className="font-pixel text-[11px] uppercase text-muted-foreground">Choose Starting Path</label>
              <div className="grid grid-cols-1 gap-2.5">
                {TITLES.map((t) => {
                  const Icon = t.icon
                  const isSelected = selectedTitle === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTitle(t.id)}
                      className={`flex items-start gap-3.5 p-3 border-2 text-left transition-all transform active:scale-[0.98] ${
                        isSelected
                          ? "border-primary bg-primary/15 text-foreground shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                          : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/60"
                      }`}
                    >
                      <div className={`p-2 border border-border ${isSelected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-pixel text-xs text-foreground">{t.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{t.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-secondary/60 border-2 border-border p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[9px] uppercase text-muted-foreground">Stat Distribution</span>
                <span className="text-[9px] font-pixel text-primary">+2 Class Specialty</span>
              </div>
              <p className="font-pixel text-xs text-foreground">{activeTitleData?.stats}</p>
            </div>

            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => changeStep(2)}
              className="w-full flex items-center justify-center gap-2 border-2 border-primary bg-primary hover:bg-primary/90 text-primary-foreground p-3.5 font-pixel text-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>Next: Customize Avatar</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* КРОК 2: АВАТАР ТА СТАТЬ */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center space-y-1">
              <h1 className="font-pixel text-lg text-foreground">Avatar Customization</h1>
              <p className="text-xs text-muted-foreground">Select gender and style parameters.</p>
            </div>

            <div className="flex flex-col items-center justify-center my-2">
              <div className="animate-pulse duration-[3000ms]">
                <CharacterAvatar 
                  gender={gender} 
                  skin={skin} 
                  hair={hair} 
                  armor={armor} 
                  size="lg" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-pixel text-[10px] uppercase text-muted-foreground">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`flex items-center justify-center gap-2 p-2.5 border-2 font-pixel text-xs transition-all ${
                    gender === "male"
                      ? "border-primary bg-primary/25 text-foreground shadow-sm"
                      : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <UserCheck className="size-3.5" />
                  <span>Male</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`flex items-center justify-center gap-2 p-2.5 border-2 font-pixel text-xs transition-all ${
                    gender === "female"
                      ? "border-primary bg-primary/25 text-foreground shadow-sm"
                      : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <UserCheck className="size-3.5" />
                  <span>Female</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-pixel text-[10px] uppercase text-muted-foreground">Skin Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {SKINS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSkin(s.id)}
                    className={`flex items-center justify-center gap-2 p-2 border-2 font-pixel text-[10px] transition-all ${
                      skin === s.id ? "border-primary bg-primary/15 text-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="size-3 border border-black/40 rounded-xs" style={{ backgroundColor: s.color }} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-pixel text-[10px] uppercase text-muted-foreground">Hair Style</label>
              <div className="grid grid-cols-2 gap-2">
                {HAIRS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHair(h.id)}
                    className={`p-2 border-2 font-pixel text-[10px] text-center transition-all ${
                      hair === h.id ? "border-primary bg-primary/15 text-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-pixel text-[10px] uppercase text-muted-foreground">Starting Armor</label>
              <div className="grid grid-cols-3 gap-2">
                {ARMORS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setArmor(a.id)}
                    className={`p-2 border-2 font-pixel text-[9px] text-center transition-all ${
                      armor === a.id ? "border-primary bg-primary/15 text-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => changeStep(1)}
                className="flex items-center justify-center gap-1 border-2 border-border bg-secondary hover:bg-secondary/80 p-3 font-pixel text-xs text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary bg-primary hover:bg-primary/90 text-primary-foreground p-3 font-pixel text-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Entering Realm...</span>
                  </>
                ) : (
                  <span>Begin Journey</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}