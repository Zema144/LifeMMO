"use client"

import { useEnergy } from "@/hooks/use-energy"
import { Zap } from "lucide-react"

export function MentorEnergyDisplay({ 
  initialEnergy, 
  lastRefillAt 
}: { 
  initialEnergy: number
  lastRefillAt: string 
}) {
  const { energy, formattedTime } = useEnergy(initialEnergy, lastRefillAt)
  const maxEnergy = 3

  return (
    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-lg">
      <div className="flex items-center gap-1.5">
        <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
        
        <div className="flex gap-1.5 ml-1">
          {Array.from({ length: maxEnergy }).map((_, i) => {
            const isActive = i < energy
            const isCharging = i === energy // Наступний кристал, який заряджається
            
            return (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-sm rotate-45 transition-all duration-500 ${
                  isActive 
                    ? "bg-cyan-400 shadow-[0_0_10px_theme(colors.cyan.400)]" 
                    : isCharging
                      ? "bg-cyan-900/50 border border-cyan-400/30 animate-pulse"
                      : "bg-white/5 border border-white/10"
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Таймер (показуємо тільки якщо енергія не повна) */}
      {formattedTime && (
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <span className="text-xs text-white/50 font-medium">Refill in</span>
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
            {formattedTime}
          </span>
        </div>
      )}
    </div>
  )
}