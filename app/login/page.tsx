"use client"

import { signIn } from "next-auth/react"
import { Sparkles, Gamepad2, Send, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import Script from "next/script"

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string
        ready: () => void
      }
    }
  }
}

export default function LoginPage() {
  const [isTelegramAvailable, setIsTelegramAvailable] = useState(false)
  const [isTelegramLoading, setIsTelegramLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const detectTelegram = async () => {
      let attempts = 0
      while (!window.Telegram?.WebApp?.initData && attempts < 20 && !cancelled) {
        await new Promise((r) => setTimeout(r, 100))
        attempts++
      }
      if (!cancelled && window.Telegram?.WebApp?.initData) {
        setIsTelegramAvailable(true)
      }
    }

    detectTelegram()
    return () => {
      cancelled = true
    }
  }, [])

  const handleTelegramLogin = async () => {
    const webApp = window.Telegram?.WebApp
    const initData = webApp?.initData
    if (!initData) return

    setIsTelegramLoading(true)
    setError("")
    webApp.ready()

    try {
      const res = await signIn("telegram-login", { initData, redirect: false })
      if (res?.ok) {
        window.location.href = "/"
      } else {
        setError("Не вдалося увійти через Telegram. Спробуй ще раз.")
        setIsTelegramLoading(false)
      }
    } catch {
      setError("Помилка з'єднання з сервером.")
      setIsTelegramLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />

      <div className="hud-panel max-w-sm w-full bg-card p-6 text-center space-y-6">
        <div>
          <Sparkles className="size-12 mx-auto text-primary mb-2" />
          <h1 className="font-pixel text-xl text-foreground">LifeMMO</h1>
          <p className="text-xs text-muted-foreground mt-2">Enter the realm to start your journey.</p>
        </div>

        <div className="space-y-3 pt-4">
          {isTelegramAvailable && (
            <button
              onClick={handleTelegramLogin}
              disabled={isTelegramLoading}
              className="w-full flex items-center justify-center gap-2 border-2 border-[#2AABEE] bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 p-3 transition-colors disabled:opacity-60"
            >
              {isTelegramLoading ? (
                <Loader2 className="size-4 text-[#2AABEE] animate-spin" />
              ) : (
                <Send className="size-4 text-[#2AABEE]" />
              )}
              <span className="font-pixel text-xs text-[#2AABEE]">
                {isTelegramLoading ? "Connecting..." : "Continue with Telegram"}
              </span>
            </button>
          )}

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 border-2 border-border bg-secondary hover:bg-secondary/80 p-3 transition-colors"
          >
            <span className="font-pixel text-xs text-foreground">Continue with Google</span>
          </button>

          <button
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 border-2 border-[#5865F2] bg-[#5865F2]/10 hover:bg-[#5865F2]/20 p-3 transition-colors"
          >
            <Gamepad2 className="size-4 text-[#5865F2]" />
            <span className="font-pixel text-xs text-[#5865F2]">Continue with Discord</span>
          </button>

          {error && <p className="text-[10px] font-pixel text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}