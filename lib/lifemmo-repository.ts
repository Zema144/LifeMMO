import { prisma } from "@/lib/prisma"
import { generatePenaltyQuestWithAI, validateCustomQuestWithAI, verifyPenaltyPhotoWithAI } from "@/lib/gemini-service"

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
    throw new Error("Акаунт заблоковано через наявність активного штрафу. Спочатку складіть фото-доказ для штрафного квесту!")
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
      select: {
        id: true,
        xpReward: true,
        goldReward: true,
        nodeId: true,
        isPenalty: true,
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

    // Додаємо квест користувачу без дедлайну (hangs until completed)
    await prisma.userQuest.create({
      data: {
        userId,
        questId: penaltyQuest.id,
        status: "ACCEPTED",
        expiresAt: null,
      },
    })

    // Записуємо дебаф
    await prisma.debuff.create({
      data: {
        userId,
        sourceQuestId: expired.quest.id,
        stat: "STR",
        value: 20,
        reason: `Провалено дедлайн квесту: ${expired.quest.title}`,
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
export async function createCustomQuest(
  userId: string,
  title: string,
  description?: string,
  deadlineHours: number = 24
) {
  // Check user blocked
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.isBlocked) {
    return {
      error: "Account is blocked due to an active penalty. Complete the penalty quest before creating new ones!",
      status: 403,
    }
  }

  // Check active custom quests count (max 3)
  const activeCount = await countActiveCustomQuests(userId)
  if (activeCount >= 3) {
    return {
      error: "Limit reached! You already have 3 active custom quests.",
      status: 400,
    }
  }

  // AI Validation
  const aiValidation = await validateCustomQuestWithAI(title, description)
  if (aiValidation.status === "REJECTED_UNREALISTIC") {
    return {
      error: "REJECTED_UNREALISTIC",
      reason: aiValidation.reason,
      status: 400,
    }
  }
  if (aiValidation.status === "REJECTED_TOO_SIMPLE") {
    return {
      error: "REJECTED_TOO_SIMPLE",
      reason: aiValidation.reason,
      status: 400,
    }
  }

  const questSlug = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const expiresAt = new Date(Date.now() + deadlineHours * 60 * 60 * 1000)

  const quest = await prisma.quest.create({
    data: {
      slug: questSlug,
      title,
      description: description || title,
      kind: "CUSTOM",
      isCustom: true,
      createdById: userId,
      xpReward: aiValidation.xpReward || 60,
      goldReward: aiValidation.goldReward || 30,
    },
  })

  const userQuest = await prisma.userQuest.create({
    data: {
      userId,
      questId: quest.id,
      status: "ACCEPTED",
      expiresAt,
    },
  })

  return {
    success: true,
    quest,
    userQuest,
    xpReward: aiValidation.xpReward,
    goldReward: aiValidation.goldReward,
    reason: aiValidation.reason,
  }
}

/**
 * Module 4: Submit Penalty Photo Proof
 */
export async function submitPenaltyProof(
  userId: string,
  questSlug: string,
  imageBase64: string,
  mimeType: string = "image/jpeg"
) {
  const quest = await prisma.quest.findUnique({
    where: { slug: questSlug },
  })

  if (!quest) {
    return { success: false, reason: "Квест не знайдено." }
  }

  if (!quest.isPenalty) {
    return { success: false, reason: "Цей квест не є штрафним." }
  }

  // Verify photo via Gemini Vision AI
  const aiResult = await verifyPenaltyPhotoWithAI(
    quest.title,
    quest.description,
    imageBase64,
    mimeType
  )

  if (!aiResult.success) {
    return {
      success: false,
      reason: aiResult.reason || "Суворий суддя AI не зарахував надане фото.",
    }
  }

  // AI Approved -> complete penalty quest, award rewards, unblock user
  await completeQuest(userId, questSlug)

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
