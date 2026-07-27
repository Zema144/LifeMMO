import { prisma } from "@/lib/prisma"

export type TelegramUserInput = {
  telegramId: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
}

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
      status: { in: ["ACCEPTED", "FAILED"] },
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
    },
    create: {
      userId,
      questId: quest.id,
      status: "ACCEPTED",
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
      },
    })

    await tx.userQuest.upsert({
      where: {
        userId_questId: {
          userId,
          questId: quest.id,
        },
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

    return tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: quest.xpReward },
        gold: { increment: quest.goldReward },
      },
    })
  })
}
