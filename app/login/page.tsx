"use client"

import { signIn } from "next-auth/react"
import { Sparkles, Gamepad2 } from "lucide-react"
import { useEffect } from "react"
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
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData
    if (initData) {
      window.Telegram?.WebApp?.ready()
      signIn("telegram-login", { initData, callbackUrl: "/" })
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />

      <div className="hud-panel max-w-sm w-full bg-card p-6 text-center space-y-6">
        <div>
          <Sparkles className="size-12 mx-auto text-primary mb-2" />
          <h1 className="font-pixel text-xl text-foreground">LifeMMO</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Enter the realm to start your journey.
          </p>
        </div>

        <div className="space-y-3 pt-4">
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
        </div>
      </div>
    </div>
  )
}