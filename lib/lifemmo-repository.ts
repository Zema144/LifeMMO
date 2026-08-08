import { prisma } from "@/lib/prisma"
import { generatePenaltyQuestWithAI, validateCustomQuestWithAI, verifyPenaltyProofWithAI } from "@/lib/gemini-service"
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
  let newXp = Math.max(0, currentXp + earnedXp)
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
      status: { in: ["ACCEPTED", "COMPLETED"] },
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

export async function countActiveCustomQuests(userId: string): Promise<number> {
  const count = await prisma.userQuest.count({
    where: {
      userId,
      status: "ACCEPTED",
      quest: {
        isCustom: true,
      },
    },
  })
  return count
}

export async function acceptQuest(userId: string, questSlug: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.isBlocked) {
    throw new Error("Account is blocked due to an active penalty. Submit a photo proof for the penalty quest first!")
  }

  const quest = await prisma.quest.findUniqueOrThrow({
    where: { slug: questSlug },
    select: { id: true },
  })

  // Встановлюємо дедлайн: 24 години на виконання
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
  const userObj = await prisma.user.findUnique({ where: { id: userId } })
  const targetQuest = await prisma.quest.findUnique({ where: { slug: questSlug } })

  if (userObj?.isBlocked && !targetQuest?.isPenalty) {
    throw new Error("Акаунт заблоковано через активний штраф. Виконання інших квестів заморожено!")
  }

  return prisma.$transaction(async (tx: any) => {
    const quest = await tx.quest.findUniqueOrThrow({
      where: { slug: questSlug },
      select: { id: true, xpReward: true, goldReward: true, nodeId: true, isPenalty: true, tree: { select: { classColor: true } } },
    })

    const existing = await tx.userQuest.findUnique({
      where: { userId_questId: { userId, questId: quest.id } },
    })
    if (existing?.status === "COMPLETED") {
      return tx.user.findUniqueOrThrow({ where: { id: userId } })
    }

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


    let statFieldUpdate = {}
    if (quest.nodeId && quest.tree) {
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
      select: { xp: true, level: true, gold: true, isBlocked: true },
    })

    const updatedProgress = calculatePlayerProgress(user.xp, user.level, quest.xpReward)

    // Якщо це був штрафний квест, розблоковуємо акаунт
    const unblockUpdate = quest.isPenalty ? { isBlocked: false } : {}

    return tx.user.update({
      where: { id: userId },
      data: {
        xp: updatedProgress.xp,
        level: updatedProgress.level,
        xpToNext: updatedProgress.xpToNext,
        gold: { increment: quest.goldReward },
        ...unblockUpdate,
        ...statFieldUpdate,
      },
    })
  })
}

/**
 * Module 2 & 3: Process Overdue Quests and Generate Penalties
 */
export async function processOverdueQuests(userId: string) {
  const now = new Date()

  const expiredUserQuests = await prisma.userQuest.findMany({
    where: {
      userId,
      status: "ACCEPTED",
      expiresAt: { lt: now },
    },
    include: {
      quest: true,
    },
  })

  if (expiredUserQuests.length === 0) {
    return { processed: 0 }
  }

  for (const expired of expiredUserQuests) {
    // Не створюємо штраф для штрафного квесту
    if (expired.quest.isPenalty) continue

    // 1. Позначаємо квест як FAILED
    await prisma.userQuest.update({
      where: { id: expired.id },
      data: {
        status: "FAILED",
        failedAt: now,
      },
    })

    // 2. Знімаємо 20 XP від балансу та блокуємо акаунт
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
      const newXp = Math.max(0, user.xp - 20)
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          isBlocked: true,
        },
      })
    }

    // 3. Згенеуємо Штрафний квест (х2 складності)
    const penaltyData = await generatePenaltyQuestWithAI(
      expired.quest.title,
      expired.quest.description
    )

    const penaltySlug = `penalty-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const halfGold = Math.floor((expired.quest.goldReward || 30) / 2)
    const halfXp = Math.floor((expired.quest.xpReward || 50) / 2)

    // Створюємо квест в БД
    const penaltyQuest = await prisma.quest.create({
    data: {
      slug: penaltySlug,
      title: penaltyData.title,
      description: penaltyData.description,
      kind: "PENALTY",
      isPenalty: true,
      xpReward: halfXp,
      goldReward: halfGold,
    },
  })

  await prisma.userQuest.create({
    data: { userId, questId: penaltyQuest.id, status: "ACCEPTED", expiresAt: null },
  })

  await prisma.debuff.create({
    data: {
      userId,
      sourceQuestId: expired.quest.id,
      penaltyQuestId: penaltyQuest.id,   // NEW — точний лінк
      stat: "STR",
      value: 20,
      reason: `Missed quest deadline: ${expired.quest.title}`,
      penaltyQuestTitle: penaltyData.title,
      penaltyDescription: penaltyData.description,
    },
  })
  }

  return { processed: expiredUserQuests.length }
}

/**
 * Module 1: Create Custom Quest with AI Gatekeeper
 */
export async function createCustomQuest(input: {
  userId: string
  title: string
  description?: string
  hoursToComplete?: number
  xpReward?: number
  goldReward?: number
}) {
  const { userId, title, description, hoursToComplete = 24, xpReward = 60, goldReward = 30 } = input

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.isBlocked) {
    throw new Error("Account is blocked due to an active penalty. Complete the penalty quest first!")
  }

  const activeCount = await countActiveCustomQuests(userId)
  if (activeCount >= 3) {
    throw new Error("Limit reached! You already have 3 active custom quests.")
  }

  const questSlug = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const expiresAt = new Date(Date.now() + hoursToComplete * 60 * 60 * 1000)

  const quest = await prisma.quest.create({
    data: {
      slug: questSlug,
      title,
      description: description || title,
      kind: "CUSTOM",
      isCustom: true,
      createdById: userId,
      xpReward,
      goldReward,
    },
  })

  await prisma.userQuest.create({
    data: { userId, questId: quest.id, status: "ACCEPTED", expiresAt },
  })

  return quest
}

/**
 * Module 4: Submit Penalty Photo Proof
 */
export async function submitPenaltyProof(
  userId: string,
  questSlug: string,
  proof: { imageBase64?: string; textProof?: string }
) {
  const quest = await prisma.quest.findUnique({ where: { slug: questSlug } })

  if (!quest) return { success: false, reason: "Quest not found." }
  if (!quest.isPenalty) return { success: false, reason: "This quest is not a penalty." }

  const aiResult = await verifyPenaltyProofWithAI(quest.title, quest.description, proof)

  if (!aiResult.success) {
    return { success: false, reason: aiResult.reason || "Strict AI Judge rejected the provided proof." }
  }

  await completeQuest(userId, questSlug)

  const debuffs = await prisma.debuff.findMany({
    where: { userId, isActive: true, penaltyQuestId: quest.id },   // точний матч замість назви
  })

  for (const debuff of debuffs) {
    await prisma.debuff.update({
      where: { id: debuff.id },
      data: { isActive: false, resolvedAt: new Date() },
    })

    if (debuff.sourceQuestId) {
      await prisma.userQuest.updateMany({
        where: { userId, questId: debuff.sourceQuestId },
        data: { status: "COMPLETED", completedAt: new Date() },
      })
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { isBlocked: false } })

  const updatedUser = await prisma.user.findUnique({ where: { id: userId } })
  return { success: true, reason: aiResult.reason, user: updatedUser }
}

  // AI Approved -> complete penalty quest, award rewards, unblock user
  await completeQuest(userId, questSlug)

  // Find associated debuff and resolve it
  const debuffs = await prisma.debuff.findMany({
    where: {
      userId,
      isActive: true,
      penaltyQuestTitle: quest.title,
    },
  })

  for (const debuff of debuffs) {
    await prisma.debuff.update({
      where: { id: debuff.id },
      data: { isActive: false, resolvedAt: new Date() },
    })

    if (debuff.sourceQuestId) {
      await prisma.userQuest.updateMany({
        where: { userId, questId: debuff.sourceQuestId },
        data: { status: "COMPLETED", completedAt: new Date() },
      })
    }
  }

  // Unblock user explicitly
  await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: false },
  })

  const updatedUser = await prisma.user.findUnique({ where: { id: userId } })

  return {
    success: true,
    reason: aiResult.reason,
    user: updatedUser,
  }
}
