export function getRequiredXpForLevel(level: number): number {
  return Math.round(300 * Math.pow(level, 1.35))
}

export function calculatePlayerProgress(currentXp: number, currentLevel: number, earnedXp: number) {
  let newXp = currentXp + earnedXp
  let newLevel = currentLevel

  while (true) {
    const xpNeededForNext = getRequiredXpForLevel(newLevel)
    if (newXp < xpNeededForNext) break
    newLevel++
  }

  const nextLevelTotalXp = getRequiredXpForLevel(newLevel)
  const xpToNext = Math.max(0, nextLevelTotalXp - newXp)

  return {
    xp: newXp,
    level: newLevel,
    xpToNext: xpToNext,
  }
}