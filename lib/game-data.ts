export type SkillTreeId =
  | "data-engineering"
  | "fitness"
  | "culinary"
  | "finance"
  | "language"
  | "music"
  | string // Додаємо можливість будь-якого стрінга, бо з бази можуть прийти нові ID

export type Reward = {
  label: string
  kind: "xp" | "gold" | "stat"
}

export type QuestStatus = "active" | "completed" | "locked"

export type StatKey = "STR" | "INT" | "DEX" | "CHA" | "CRAFT"

export type Quest = {
  id: string
  title: string
  description: string
  rewards: Reward[]
  status: QuestStatus
  hasAiHelper?: boolean
  statRewardType?: StatKey 
  expiresAt?: string // Додано для таймера дейліків
}

export type ClassColor = "int" | "str" | "cha" | "craft"

export type NodeStatus = "mastered" | "active" | "locked"

export type SkillNode = {
  id: string
  label: string
  status: NodeStatus
  /** pixel position on the canvas (top-left of the 76px node) */
  x: number
  y: number
  /** node ids that must be mastered before this unlocks */
  prereqs: string[]
  /** quest ids surfaced in this node's drawer (active nodes) */
  questIds?: string[]
}

export type SkillTree = {
  id: SkillTreeId
  label: string
  className: string
  blurb: string
  icon: "brain" | "dumbbell" | "chef" | "coins" | "languages" | "music" | string
  classColor: ClassColor
  level: number
  quests: Quest[]
  nodes: SkillNode[]
}

export type PlayerStat = {
  key: string
  label: string
  value: number
  color: ClassColor
}

export type Player = {
  name: string
  title: string
  level: number
  streak: number
  xp: number
  xpToNext: number
  gold: number
  gender?: string
  avatarSkin?: string
  avatarHair?: string
  avatarArmor?: string
  hasDebuff?: boolean // Додано для контролю банера штрафів
  stats: PlayerStat[]
}

export const classColorClasses: Record<ClassColor, { text: string; border: string; bg: string }> = {
  int: { text: "text-primary", border: "border-primary", bg: "bg-primary/15" },
  str: { text: "text-streak", border: "border-streak", bg: "bg-streak/15" },
  cha: { text: "text-cyan", border: "border-cyan", bg: "bg-cyan/15" },
  craft: { text: "text-chart-5", border: "border-chart-5", bg: "bg-chart-5/15" },
}

/** Percent of a tree's nodes that are mastered (0-100). */
export function treeMastery(tree: SkillTree): number {
  if (!tree.nodes.length) return 0
  const mastered = tree.nodes.filter((n) => n.status === "mastered").length
  return Math.round((mastered / tree.nodes.length) * 100)
}

/** Resolve a node's prerequisite labels for lock tooltips. */
export function prereqLabels(tree: SkillTree, node: SkillNode): string[] {
  return node.prereqs
    .map((id) => tree.nodes.find((n) => n.id === id)?.label)
    .filter((l): l is string => Boolean(l))
}