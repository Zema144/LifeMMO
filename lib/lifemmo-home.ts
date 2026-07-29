import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAcceptedQuestsForUser, getSkillTreesForUser } from "@/lib/lifemmo-repository"
import type { ClassColor, NodeStatus, Player, Quest, SkillNode, SkillTree } from "@/lib/game-data"

const classColorMap = {
  INT: "int",
  STR: "str",
  CHA: "cha",
  CRAFT: "craft",
} as const satisfies Record<string, ClassColor>

const nodeStatusMap = {
  MASTERED: "mastered",
  ACTIVE: "active",
  LOCKED: "locked",
} as const satisfies Record<string, NodeStatus>

function toPlayer(user: {
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
  gender?: string | null
  avatarSkin?: string | null
  avatarHair?: string | null
  avatarArmor?: string | null
}): Player {
  return {
    name: user.firstName ?? user.username ?? "Georgiy",
    title: user.title,
    level: user.level,
    streak: user.streak,
    xp: user.xp,
    xpToNext: user.xpToNext,
    gold: user.gold,
    gender: user.gender?.toLowerCase() || "male", // toLowerCase бо Prisma може повертати MALE
    avatarSkin: user.avatarSkin || "light",
    avatarHair: user.avatarHair || "short",
    avatarArmor: user.avatarArmor || "cloth",
    stats: [
      { key: "INT", label: "Intelligence", value: user.intStat, color: "int" },
      { key: "STR", label: "Strength", value: user.strStat, color: "str" },
      { key: "DEX", label: "Dexterity", value: user.dexStat, color: "craft" },
      { key: "CHA", label: "Charisma", value: user.chaStat, color: "cha" },
    ],
  }
}

function toQuest(quest: {
  slug: string
  title: string
  description: string
  xpReward: number
  goldReward: number
  hasAiHelper: boolean
  statusDefault?: string
  statRewardType?: any
}): Quest {
  return {
    id: quest.slug,
    title: quest.title,
    description: quest.description,
    rewards: [
      ...(quest.xpReward > 0 ? [{ label: `${quest.xpReward} XP`, kind: "xp" as const }] : []),
      ...(quest.goldReward > 0 ? [{ label: `${quest.goldReward}`, kind: "gold" as const }] : []),
    ],
    status: quest.statusDefault === "LOCKED" ? "locked" : "active",
    hasAiHelper: quest.hasAiHelper,
    statRewardType: quest.statRewardType,
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

  const now = new Date()
  let needsUpdate = false
  let newStreak = user.streak

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
      newStreak += 1
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

  const [trees, acceptedQuests] = await Promise.all([
    getSkillTreesForUser(user.id),
    getAcceptedQuestsForUser(user.id),
  ])

  const completedQuestIds = new Set(
    acceptedQuests.filter((entry) => entry.status === "COMPLETED").map((entry) => entry.quest.slug),
  )

  const skillTrees: SkillTree[] = trees.map((tree) => {
    const questByNode = new Map<string, Quest[]>()
    const treeQuests = tree.quests.map((quest) => {
      const mapped = toQuest(quest)
      if (completedQuestIds.has(quest.slug)) {
        mapped.status = "completed"
      }
      if (quest.nodeId) {
        questByNode.set(quest.nodeId, [...(questByNode.get(quest.nodeId) ?? []), mapped])
      }
      return mapped
    })

    const nodes: SkillNode[] = tree.nodes.map((node) => ({
      id: node.slug,
      label: node.label,
      status: nodeStatusMap[node.statusDefault],
      x: node.x,
      y: node.y,
      prereqs: node.prerequisites.map((entry) => entry.prerequisite.slug),
      questIds: (questByNode.get(node.id) ?? []).map((quest) => quest.id),
    }))

    return {
      id: tree.slug as SkillTree["id"],
      label: tree.label,
      className: tree.className,
      blurb: tree.blurb,
      icon: tree.icon as SkillTree["icon"],
      classColor: classColorMap[tree.classColor],
      level: tree.displayLevel,
      quests: treeQuests,
      nodes,
    }
  })

  const activeTrees = trees.filter((tree) => tree.users.length > 0).map((tree) => tree.slug as SkillTree["id"])

  return {
    currentUserId: user.id,
    player: toPlayer(user),
    skillTrees,
    activeTrees,
    acceptedQuestIds: acceptedQuests.map((entry) => entry.quest.slug),
  }
}