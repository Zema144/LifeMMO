import { useState, useEffect } from "react"

const MAX_ENERGY = 3
const REFILL_INTERVAL_MS = 8 * 60 * 60 * 1000 // 4 години

export function useEnergy(initialEnergy: number, lastRefillAt: string) {
  const [energy, setEnergy] = useState(initialEnergy)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    const calculateEnergy = () => {
      const now = new Date().getTime()
      const refillTime = new Date(lastRefillAt).getTime()
      const timeSinceRefill = now - refillTime

      if (timeSinceRefill >= REFILL_INTERVAL_MS && energy < MAX_ENERGY) {
        const energyToAdd = Math.floor(timeSinceRefill / REFILL_INTERVAL_MS)
        const newEnergy = Math.min(MAX_ENERGY, energy + energyToAdd)
        setEnergy(newEnergy)
        
        if (newEnergy === MAX_ENERGY) {
          setTimeLeft(null)
          return
        }
      }

      if (energy < MAX_ENERGY) {
        const timeTowardsNext = timeSinceRefill % REFILL_INTERVAL_MS
        setTimeLeft(REFILL_INTERVAL_MS - timeTowardsNext)
      } else {
        setTimeLeft(null)
      }
    }

    calculateEnergy()
    const interval = setInterval(calculateEnergy, 1000)
    return () => clearInterval(interval)
  }, [energy, lastRefillAt])

  // Форматуємо час як HH:MM:SS
  const formattedTime = timeLeft !== null 
    ? new Date(timeLeft).toISOString().substring(11, 19) 
    : null

  return { energy, formattedTime }
}