import { prisma } from "@/lib/prisma"

export type TelegramUserInput = {
  telegramId: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
}

// --- ФОРМУЛА РІВНЯ ТА ПРОГРЕСУ ---
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

  // Залишок досвіду до наступного рівня
  const nextLevelTotalXp = getRequiredXpForLevel(newLevel)
  const xpToNext = Math.max(0, nextLevelTotalXp - newXp)

  return {
    xp: newXp,
    level: newLevel,
    xpToNext: xpToNext,
  }
}
// ---------------------------------

export async function upsertTelegramUser(input: TelegramUserInput) {
  const user = await prisma.user.upsert({
    where: { telegramId: input.telegramId },
    update: {
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: input.avatarUrl,
    },
    create: {
      telegramId: input.telegramId,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: input.avatarUrl,
      title: "Junior Data Wizard",
      level: 5,
      xp: 750,
      xpToNext: 1000,
      gold: 340,
      streak: 7,
      intStat: 14,
      strStat: 8,
      dexStat: 6,
      chaStat: 10,
    },
  })

  await ensureStarterTrees(user.id)
  return user
}

export async function ensureStarterTrees(userId: string) {
  const starterTrees = await prisma.skillTree.findMany({
    where: { isStarter: true },
    select: { id: true },
  })

  await prisma.userSkillTree.createMany({
    data: starterTrees.map((tree) => ({
      userId,
      skillTreeId: tree.id,
    })),
    skipDuplicates: true,
  })
}

export async function getSkillTreesForUser(userId: string) {
  return prisma.skillTree.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      nodes: {
        orderBy: { sortOrder: "asc" },
        include: {
          prerequisites: {
            include: { prerequisite: true },
          },
          quests: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      users: {
        where: { userId },
        select: { userId: true },
      },
      quests: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })
}

export async function getAcceptedQuestsForUser(userId: string) {
  return prisma.userQuest.findMany({
    where: {
      userId,
      status: { in: ["ACCEPTED", "FAILED", "COMPLETED"] }, 
    },
    orderBy: { acceptedAt: "asc" },
    include: {
      quest: {
        include: {
          tree: true,
          node: true,
        },
      },
    },
  })
}

export async function acceptQuest(userId: string, questSlug: string) {
  const quest = await prisma.quest.findUniqueOrThrow({
    where: { slug: questSlug },
    select: { id: true },
  })

  // Встановлюємо дедлайн: наприклад, 24 години на виконання
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  return prisma.userQuest.upsert({
    where: {
      userId_questId: {
        userId,
        questId: quest.id,
      },
    },
    update: {
      status: "ACCEPTED",
      failedAt: null,
      expiresAt: expiresAt,
    },
    create: {
      userId,
      questId: quest.id,
      status: "ACCEPTED",
      expiresAt: expiresAt,
    },
  })
}

export async function completeQuest(userId: string, questSlug: string) {
  return prisma.$transaction(async (tx) => {
    const quest = await tx.quest.findUniqueOrThrow({
      where: { slug: questSlug },
      select: {
        id: true,
        xpReward: true,
        goldReward: true,
        nodeId: true,
        tree: { select: { classColor: true } },
      },
    })

    // 1. Оновлюємо статус квесту на COMPLETED
    await tx.userQuest.upsert({
      where: {
        userId_questId: { userId, questId: quest.id },
      },
      update: {
        status: "COMPLETED",
        completedAt: new Date(),
        failedAt: null,
      },
      create: {
        userId,
        questId: quest.id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    })

    await tx.debuff.updateMany({
      where: {
        userId: userId,
        sourceQuestId: quest.id,
        resolvedAt: null,
      },
      data: {
        resolvedAt: new Date(),
      },
    })

    let statFieldUpdate = {}
    if (quest.nodeId) {
      const totalQuestsInNode = await tx.quest.count({
        where: { nodeId: quest.nodeId },
      })

      const completedQuestsInNode = await tx.userQuest.count({
        where: {
          userId: userId,
          status: "COMPLETED",
          quest: {
            nodeId: quest.nodeId,
          },
        },
      })

      if (totalQuestsInNode > 0 && totalQuestsInNode === completedQuestsInNode) {
        const color = quest.tree.classColor
        if (color === "INT") statFieldUpdate = { intStat: { increment: 1 } }
        else if (color === "STR") statFieldUpdate = { strStat: { increment: 1 } }
        else if (color === "CHA") statFieldUpdate = { chaStat: { increment: 1 } }
        else if (color === "CRAFT") statFieldUpdate = { dexStat: { increment: 1 } }
      }
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { xp: true, level: true, gold: true },
    })

    const updatedProgress = calculatePlayerProgress(user.xp, user.level, quest.xpReward)

    return tx.user.update({
      where: { id: userId },
      data: {
        xp: updatedProgress.xp,
        level: updatedProgress.level,
        xpToNext: updatedProgress.xpToNext,
        gold: { increment: quest.goldReward },
        ...statFieldUpdate,
      },
    })
  })
}