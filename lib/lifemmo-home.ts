import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAcceptedQuestsForUser, getSkillTreesForUser, processOverdueQuests } from "@/lib/lifemmo-repository"
import { computeNodeStatuses } from "@/lib/skill-tree-progress"
import type { ClassColor, Player, Quest, SkillNode, SkillTree, NodeStatus } from "@/lib/game-data"

const classColorMap = {
  INT: "int",
  STR: "str",
  CHA: "cha",
  CRAFT: "craft",
} as const satisfies Record<string, ClassColor>

function toPlayer(
  user: {
    firstName: string | null
    username: string | null
    title: string
    level: number
    streak: number
    xp: number
    xpToNext: number
    gold: number
    intStat: number
    strStat: number
    dexStat: number
    chaStat: number
    isBlocked?: boolean
    mentorEnergy?: number
    lastEnergyRefillAt?: Date
    gender?: string | null
    avatarSkin?: string | null
    avatarHair?: string | null
    avatarArmor?: string | null
  },
  activeDebuffs: { stat: string; value: number }[]
): Player & { isBlocked?: boolean } {
  const getDebuff = (statKey: string) =>
    activeDebuffs.filter((d) => d.stat === statKey).reduce((acc, d) => acc + d.value, 0)

  return {
    name: user.firstName ?? user.username ?? "Hero",
    title: user.title,
    level: user.level,
    streak: user.streak,
    xp: user.xp,
    xpToNext: user.xpToNext,
    gold: user.gold,
    gender: user.gender?.toLowerCase() || "male",
    avatarSkin: user.avatarSkin || "light",
    avatarHair: user.avatarHair || "short",
    avatarArmor: user.avatarArmor || "cloth",
    hasDebuff: activeDebuffs.length > 0,
    isBlocked: Boolean(user.isBlocked),
    mentorEnergy: user.mentorEnergy ?? 3,
    lastEnergyRefillAt: (user.lastEnergyRefillAt || new Date()).toISOString(),
    stats: [
      { key: "INT", label: "Intelligence", value: Math.max(1, user.intStat - getDebuff("INT")), color: "int" },
      { key: "STR", label: "Strength", value: Math.max(1, user.strStat - getDebuff("STR")), color: "str" },
      { key: "DEX", label: "Dexterity", value: Math.max(1, user.dexStat - getDebuff("DEX")), color: "craft" },
      { key: "CHA", label: "Charisma", value: Math.max(1, user.chaStat - getDebuff("CHA")), color: "cha" },
    ],
  }
}

function toQuest(quest: {
  slug: string
  title: string
  description: string
  xpReward: number
  goldReward: number
  hasAiHelper?: boolean
  isCustom?: boolean
  isPenalty?: boolean
  statusDefault?: string
  statRewardType?: any
}, userQuestExpiresAt?: Date | null): Quest & { isCustom?: boolean; isPenalty?: boolean } {
  return {
    id: quest.slug,
    title: quest.title,
    description: quest.description,
    rewards: [
      ...(quest.xpReward > 0 ? [{ label: `${quest.xpReward} XP`, kind: "xp" as const }] : []),
      ...(quest.goldReward > 0 ? [{ label: `${quest.goldReward}`, kind: "gold" as const }] : []),
    ],
    status: quest.statusDefault === "LOCKED" ? "locked" : "active",
    hasAiHelper: Boolean(quest.hasAiHelper),
    statRewardType: quest.statRewardType,
    isCustom: Boolean(quest.isCustom),
    isPenalty: Boolean(quest.isPenalty),
    expiresAt: userQuestExpiresAt ? userQuestExpiresAt.toISOString() : undefined,
  }
}

export async function getHomeData() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    redirect("/login")
  }

  // --- 1. ПЕРЕВІРКА ТА ОБРОБКА ПРОСТРОЧЕНИХ КВЕСТІВ (БОРГОВА ЯМА) ---
  await processOverdueQuests(user.id)

  // Re-fetch user in case status or XP changed during processOverdueQuests
  user = (await prisma.user.findUnique({
    where: { id: session.user.id },
  })) || user

  const now = new Date()
  let needsUpdate = false
  let newStreak = user.streak

  // --- 2. ЛОГІКА СТРІКА (ВХОДИ) ---
  if (!user.lastLoginAt) {
    newStreak = 1
    needsUpdate = true
  } else {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const lastLogin = new Date(user.lastLoginAt)
    const lastLoginDay = new Date(Date.UTC(lastLogin.getUTCFullYear(), lastLogin.getUTCMonth(), lastLogin.getUTCDate()))

    const diffTime = today.getTime() - lastLoginDay.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      newStreak = newStreak + 1
      needsUpdate = true
    } else if (diffDays > 1) {
      newStreak = 1
      needsUpdate = true
    }
  }

  if (needsUpdate) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        streak: newStreak,
        lastLoginAt: now,
      },
    })
  }

  // --- 3. ВИТЯГУЄМО АКТИВНІ ДЕБАФИ З БАЗИ ---
  const activeDebuffs = await prisma.debuff.findMany({
    where: {
      userId: user.id,
      resolvedAt: null,
    },
    include: {
      sourceQuest: true,
    },
  })

  // --- 4. ФОРМУЄМО ДАНІ ДЛЯ КЛІЄНТА ---
  const [trees, acceptedQuests] = await Promise.all([
    getSkillTreesForUser(user.id),
    getAcceptedQuestsForUser(user.id),
  ])

  const acceptedQuestMap = new Map(acceptedQuests.map((entry) => [entry.quest.slug, entry]))

  const completedQuestIds = new Set(
    acceptedQuests.filter((entry) => entry.status === "COMPLETED").map((entry) => entry.quest.slug)
  )

  const skillTrees: SkillTree[] = trees.map((tree) => {
    const questByNode = new Map<string, any[]>()
    for (const quest of tree.quests) {
      if (quest.nodeId) {
        const list = questByNode.get(quest.nodeId) || []
        list.push(quest)
        questByNode.set(quest.nodeId, list)
      }
    }

    const treeQuests: Quest[] = tree.quests
      .filter((quest) => !completedQuestIds.has(quest.slug))
      .map((quest) => {
        const userQuest = acceptedQuestMap.get(quest.slug)
        return toQuest(quest, userQuest?.expiresAt)
      })

    const statusByNodeId = computeNodeStatuses(
      tree.nodes.map((node) => ({
        id: node.id,
        prereqIds: node.prerequisites.map((entry) => entry.prerequisiteId),
        questSlugs: (questByNode.get(node.id) ?? []).map((quest) => quest.slug),
      })),
      completedQuestIds
    )

    const nodes: SkillNode[] = tree.nodes.map((node) => ({
      id: node.slug,
      label: node.label,
      status: statusByNodeId.get(node.id) ?? "locked",
      x: node.x,
      y: node.y,
      prereqs: node.prerequisites.map((entry) => entry.prerequisite.slug),
      questIds: (questByNode.get(node.id) ?? []).map((quest) => quest.slug),
    }))

    return {
      id: tree.slug as SkillTree["id"],
      label: tree.label,
      className: tree.className,
      blurb: tree.blurb,
      icon: tree.icon as SkillTree["icon"],
      classColor: classColorMap[tree.classColor],
      level: tree.displayLevel,
      npcRole: tree.npcRole,
      primaryStat: tree.primaryStat,
      quests: treeQuests,
      nodes,
    }
  })

  // Extra quests: Standalone custom quests and penalty quests
  const extraQuests: any[] = acceptedQuests
    .filter((eq) => eq.quest.isCustom || eq.quest.isPenalty)
    .map((eq) => ({
      ...toQuest(eq.quest, eq.expiresAt),
      status: eq.status === "COMPLETED" ? "completed" : "active",
    }))

  const activeTrees = trees.filter((tree) => tree.users.length > 0).map((tree) => tree.slug as SkillTree["id"])

  return {
    currentUserId: user.id,
    player: toPlayer(user, activeDebuffs),
    skillTrees,
    activeTrees,
    acceptedQuestIds: acceptedQuests
      .filter((entry) => entry.status !== "FAILED")
      .map((entry) => entry.quest.slug),
    extraQuests,
    debuffedQuestSlugs: activeDebuffs
      .filter((d) => d.sourceQuest)
      .map((d) => d.sourceQuest!.slug),
  }
}
