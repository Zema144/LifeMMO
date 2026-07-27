export type SkillTreeId =
  | "data-engineering"
  | "fitness"
  | "culinary"
  | "finance"
  | "language"
  | "music"

export type Reward = {
  label: string
  kind: "xp" | "gold" | "stat"
}

export type QuestStatus = "active" | "completed" | "locked"

export type Quest = {
  id: string
  title: string
  description: string
  rewards: Reward[]
  status: QuestStatus
  hasAiHelper?: boolean
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
  icon: "brain" | "dumbbell" | "chef" | "coins" | "languages" | "music"
  classColor: ClassColor
  level: number
  quests: Quest[]
  nodes: SkillNode[]
}

export const skillTrees: SkillTree[] = [
  {
    id: "data-engineering",
    label: "Data Engineering",
    className: "Data Wizard",
    blurb: "Bend databases and pipelines to your will.",
    icon: "brain",
    classColor: "int",
    level: 5,
    quests: [
      {
        id: "de-1",
        title: "Master PostgreSQL JOINs",
        description: "Write a SQL query using INNER JOIN and LEFT JOIN.",
        rewards: [
          { label: "150 XP", kind: "xp" },
          { label: "20", kind: "gold" },
        ],
        status: "active",
        hasAiHelper: true,
      },
      {
        id: "de-2",
        title: "Index a Slow Query",
        description: "Add a B-tree index and measure the speedup with EXPLAIN.",
        rewards: [{ label: "90 XP", kind: "xp" }],
        status: "active",
      },
      {
        id: "de-3",
        title: "Read the Docs",
        description: "Read 15 pages of the PostgreSQL internals manual.",
        rewards: [{ label: "50 XP", kind: "xp" }],
        status: "completed",
      },
    ],
    nodes: [
      { id: "de-n1", label: "Python Basics", status: "mastered", x: 8, y: 8, prereqs: [] },
      { id: "de-n2", label: "SQL Fundamentals", status: "mastered", x: 200, y: 8, prereqs: [] },
      {
        id: "de-n3",
        label: "PostgreSQL Internals",
        status: "active",
        x: 200,
        y: 140,
        prereqs: ["de-n2"],
        questIds: ["de-1", "de-2", "de-3"],
      },
      { id: "de-n4", label: "SQLAlchemy ORM", status: "locked", x: 104, y: 272, prereqs: ["de-n1", "de-n2"] },
      { id: "de-n5", label: "Airflow Pipelines", status: "locked", x: 200, y: 272, prereqs: ["de-n3"] },
    ],
  },
  {
    id: "fitness",
    label: "Fitness & Gym",
    className: "Iron Warrior",
    blurb: "Forge raw Strength through daily training.",
    icon: "dumbbell",
    classColor: "str",
    level: 3,
    quests: [
      {
        id: "fit-1",
        title: "Push Day Session",
        description: "Complete 4 sets of bench press and shoulder work.",
        rewards: [
          { label: "120 XP", kind: "xp" },
          { label: "15", kind: "gold" },
        ],
        status: "active",
        hasAiHelper: true,
      },
      {
        id: "fit-2",
        title: "10k Steps",
        description: "Walk at least 10,000 steps before sunset.",
        rewards: [{ label: "40 XP", kind: "xp" }],
        status: "active",
      },
    ],
    nodes: [
      { id: "fit-n1", label: "Cardio Base", status: "mastered", x: 8, y: 8, prereqs: [] },
      { id: "fit-n2", label: "Strength Foundations", status: "mastered", x: 200, y: 8, prereqs: [] },
      {
        id: "fit-n3",
        label: "Push / Pull Split",
        status: "active",
        x: 104,
        y: 140,
        prereqs: ["fit-n1", "fit-n2"],
        questIds: ["fit-1", "fit-2"],
      },
      { id: "fit-n4", label: "Hypertrophy Block", status: "locked", x: 104, y: 272, prereqs: ["fit-n3"] },
    ],
  },
  {
    id: "culinary",
    label: "Culinary Art",
    className: "Master Chef",
    blurb: "Craft legendary meals from raw ingredients.",
    icon: "chef",
    classColor: "craft",
    level: 1,
    quests: [
      {
        id: "cul-1",
        title: "Cook a Fresh Meal",
        description: "Prepare a balanced meal from raw ingredients.",
        rewards: [
          { label: "100 XP", kind: "xp" },
          { label: "25", kind: "gold" },
        ],
        status: "active",
        hasAiHelper: true,
      },
      {
        id: "cul-2",
        title: "Master a New Knife Cut",
        description: "Practice the julienne or brunoise technique.",
        rewards: [{ label: "60 XP", kind: "xp" }],
        status: "active",
      },
    ],
    nodes: [
      { id: "cul-n1", label: "Knife Skills", status: "mastered", x: 8, y: 8, prereqs: [] },
      {
        id: "cul-n2",
        label: "Fresh Cooking",
        status: "active",
        x: 8,
        y: 140,
        prereqs: ["cul-n1"],
        questIds: ["cul-1", "cul-2"],
      },
      { id: "cul-n3", label: "Baking & Pastry", status: "locked", x: 200, y: 140, prereqs: ["cul-n1"] },
      { id: "cul-n4", label: "Fermentation", status: "locked", x: 104, y: 272, prereqs: ["cul-n2", "cul-n3"] },
    ],
  },
  {
    id: "finance",
    label: "Personal Finance",
    className: "Gold Merchant",
    blurb: "Grow your hoard and master the market.",
    icon: "coins",
    classColor: "cha",
    level: 2,
    quests: [
      {
        id: "fin-1",
        title: "Track This Week's Spend",
        description: "Log every expense for 7 days in a budget sheet.",
        rewards: [
          { label: "90 XP", kind: "xp" },
          { label: "30", kind: "gold" },
        ],
        status: "active",
        hasAiHelper: true,
      },
      {
        id: "fin-2",
        title: "Read One Market Article",
        description: "Study a piece on index funds or compounding.",
        rewards: [{ label: "45 XP", kind: "xp" }],
        status: "active",
      },
    ],
    nodes: [
      { id: "fin-n1", label: "Budgeting", status: "mastered", x: 8, y: 8, prereqs: [] },
      {
        id: "fin-n2",
        label: "Expense Tracking",
        status: "active",
        x: 104,
        y: 140,
        prereqs: ["fin-n1"],
        questIds: ["fin-1", "fin-2"],
      },
      { id: "fin-n3", label: "Investing 101", status: "locked", x: 104, y: 272, prereqs: ["fin-n2"] },
    ],
  },
  {
    id: "language",
    label: "Language Learning",
    className: "Silver Tongue",
    blurb: "Unlock new tongues and charm the realm.",
    icon: "languages",
    classColor: "cha",
    level: 2,
    quests: [
      {
        id: "lang-1",
        title: "Complete a Vocab Set",
        description: "Learn 20 new words and review yesterday's set.",
        rewards: [
          { label: "80 XP", kind: "xp" },
          { label: "10", kind: "gold" },
        ],
        status: "active",
        hasAiHelper: true,
      },
      {
        id: "lang-2",
        title: "Speak for 5 Minutes",
        description: "Hold a short conversation out loud, no notes.",
        rewards: [{ label: "55 XP", kind: "xp" }],
        status: "active",
      },
    ],
    nodes: [
      { id: "lang-n1", label: "Alphabet", status: "mastered", x: 8, y: 8, prereqs: [] },
      {
        id: "lang-n2",
        label: "Core Vocab",
        status: "active",
        x: 104,
        y: 140,
        prereqs: ["lang-n1"],
        questIds: ["lang-1", "lang-2"],
      },
      { id: "lang-n3", label: "Conversation", status: "locked", x: 104, y: 272, prereqs: ["lang-n2"] },
    ],
  },
  {
    id: "music",
    label: "Music & Instrument",
    className: "Bard",
    blurb: "Practice your craft and enchant listeners.",
    icon: "music",
    classColor: "craft",
    level: 1,
    quests: [
      {
        id: "mus-1",
        title: "Practice Scales",
        description: "Run through major and minor scales for 15 minutes.",
        rewards: [
          { label: "70 XP", kind: "xp" },
          { label: "12", kind: "gold" },
        ],
        status: "active",
        hasAiHelper: true,
      },
      {
        id: "mus-2",
        title: "Learn a New Riff",
        description: "Memorize 8 bars of a song you love.",
        rewards: [{ label: "60 XP", kind: "xp" }],
        status: "active",
      },
    ],
    nodes: [
      { id: "mus-n1", label: "Music Theory", status: "mastered", x: 8, y: 8, prereqs: [] },
      {
        id: "mus-n2",
        label: "Scales & Technique",
        status: "active",
        x: 104,
        y: 140,
        prereqs: ["mus-n1"],
        questIds: ["mus-1", "mus-2"],
      },
      { id: "mus-n3", label: "First Song", status: "locked", x: 104, y: 272, prereqs: ["mus-n2"] },
    ],
  },
]

export const defaultActiveTrees: SkillTreeId[] = ["data-engineering", "fitness", "culinary"]

/** Quests already accepted into the player's main Quest Log on first load. */
export const defaultAcceptedQuestIds: string[] = ["de-1", "de-2", "fit-1", "cul-1"]

/** Flatten every quest across all trees into an id -> quest map. */
export function questIndex(): Record<string, { quest: Quest; treeId: SkillTreeId }> {
  const index: Record<string, { quest: Quest; treeId: SkillTreeId }> = {}
  for (const tree of skillTrees) {
    for (const quest of tree.quests) {
      index[quest.id] = { quest, treeId: tree.id }
    }
  }
  return index
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

export const player = {
  name: "Georgiy",
  title: "Junior Data Wizard",
  level: 5,
  streak: 7,
  xp: 750,
  xpToNext: 1000,
  gold: 340,
  stats: [
    { key: "INT", label: "Intelligence", value: 14, color: "int" as ClassColor },
    { key: "STR", label: "Strength", value: 8, color: "str" as ClassColor },
    { key: "CHA", label: "Charisma", value: 10, color: "cha" as ClassColor },
    { key: "CRAFT", label: "Crafting", value: 6, color: "craft" as ClassColor },
  ],
}

export type Player = typeof player

export const classColorClasses: Record<ClassColor, { text: string; border: string; bg: string }> = {
  int: { text: "text-primary", border: "border-primary", bg: "bg-primary/15" },
  str: { text: "text-streak", border: "border-streak", bg: "bg-streak/15" },
  cha: { text: "text-cyan", border: "border-cyan", bg: "bg-cyan/15" },
  craft: { text: "text-chart-5", border: "border-chart-5", bg: "bg-chart-5/15" },
}
