import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const skillTrees = [
  {
    slug: "data-engineering",
    label: "Data Engineering",
    className: "Data Wizard",
    blurb: "Bend databases and pipelines to your will.",
    icon: "brain",
    classColor: "INT",
    displayLevel: 5,
    primaryStat: "INT",
    npcRole: "WIZARD",
    sortOrder: 10,
    isStarter: true,
    quests: [
      {
        slug: "de-1",
        title: "Master PostgreSQL JOINs",
        description: "Write a SQL query using INNER JOIN and LEFT JOIN.",
        xpReward: 150,
        goldReward: 20,
        hasAiHelper: true,
        nodeSlug: "de-n3",
      },
      {
        slug: "de-2",
        title: "Index a Slow Query",
        description: "Add a B-tree index and measure the speedup with EXPLAIN.",
        xpReward: 90,
        nodeSlug: "de-n3",
      },
      {
        slug: "de-3",
        title: "Read the Docs",
        description: "Read 15 pages of the PostgreSQL internals manual.",
        xpReward: 50,
        nodeSlug: "de-n3",
      },
    ],
    nodes: [
      { slug: "de-n1", label: "Python Basics", statusDefault: "MASTERED", x: 8, y: 8, prereqs: [] },
      { slug: "de-n2", label: "SQL Fundamentals", statusDefault: "MASTERED", x: 200, y: 8, prereqs: [] },
      {
        slug: "de-n3",
        label: "PostgreSQL Internals",
        statusDefault: "ACTIVE",
        x: 200,
        y: 140,
        prereqs: ["de-n2"],
      },
      {
        slug: "de-n4",
        label: "SQLAlchemy ORM",
        statusDefault: "LOCKED",
        x: 104,
        y: 272,
        prereqs: ["de-n1", "de-n2"],
      },
      {
        slug: "de-n5",
        label: "Airflow Pipelines",
        statusDefault: "LOCKED",
        x: 200,
        y: 272,
        prereqs: ["de-n3"],
      },
    ],
  },
  {
    slug: "fitness",
    label: "Fitness & Gym",
    className: "Iron Warrior",
    blurb: "Forge raw Strength through real training, tracked honestly.",
    icon: "dumbbell",
    classColor: "STR",
    displayLevel: 1,
    primaryStat: "STR",
    npcRole: "WARRIOR",
    sortOrder: 20,
    isStarter: true,
    quests: [
      {
        slug: "fit-assessment-1",
        title: "Baseline Self-Assessment",
        description:
          "Record your current numbers: max push-ups in one set, max bodyweight squats in one set, and your time for 1 mile (walk, jog, or run). This is your starting line, not a test to pass or fail.",
        xpReward: 60,
        goldReward: 10,
        hasAiHelper: true,
        nodeSlug: "fit-assessment",
      },
      {
        slug: "fit-str-1",
        title: "Bodyweight Squat Volume",
        description: "Complete 3 sets of 8 bodyweight squats with full depth, resting 60–90 seconds between sets.",
        xpReward: 70,
        goldReward: 10,
        nodeSlug: "fit-strength-foundations",
      },
      {
        slug: "fit-str-2",
        title: "Push-Up Progression",
        description:
          "Complete 3 sets of 8 push-ups — knee, incline, or full, whichever is the hardest version you can do with good form.",
        xpReward: 70,
        goldReward: 10,
        hasAiHelper: true,
        nodeSlug: "fit-strength-foundations",
      },
      {
        slug: "fit-str-3",
        title: "Core Stability: Plank Hold",
        description: "Hold a front plank for 3 sets of 30–60 seconds, keeping a straight line from shoulders to heels.",
        xpReward: 50,
        nodeSlug: "fit-strength-foundations",
      },
      {
        slug: "fit-cardio-1",
        title: "5K Walk or Jog",
        description: "Cover 5 kilometers at a steady pace, walking or jogging, without stopping.",
        xpReward: 90,
        goldReward: 15,
        nodeSlug: "fit-cardio-base",
      },
      {
        slug: "fit-cardio-2",
        title: "Zone 2 Endurance Session",
        description:
          "Do 20 continuous minutes of cardio at a conversational pace — a pace where you could still talk in full sentences.",
        xpReward: 60,
        nodeSlug: "fit-cardio-base",
      },
      {
        slug: "fit-pp-1",
        title: "Push Day Session",
        description: "Complete a push-focused session — chest, shoulders, and triceps — 4 working sets per exercise.",
        xpReward: 120,
        goldReward: 20,
        hasAiHelper: true,
        nodeSlug: "fit-push-pull-split",
      },
      {
        slug: "fit-pp-2",
        title: "Pull Day Session",
        description:
          "Complete a pull-focused session — back and biceps — rows plus pull-ups or lat pulldowns, 4 working sets per exercise.",
        xpReward: 120,
        goldReward: 20,
        hasAiHelper: true,
        nodeSlug: "fit-push-pull-split",
      },
      {
        slug: "fit-int-1",
        title: "400m Repeats",
        description: "Run 6 repeats of 400 meters at a hard pace, with 90 seconds of walking rest between each.",
        xpReward: 100,
        goldReward: 15,
        nodeSlug: "fit-interval-training",
      },
      {
        slug: "fit-int-2",
        title: "20-Minute HIIT Circuit",
        description:
          "Complete a 20-minute high-intensity interval circuit: 30 seconds of work, 30 seconds of rest, rotating through 4 exercises.",
        xpReward: 90,
        nodeSlug: "fit-interval-training",
      },
      {
        slug: "fit-hyp-1",
        title: "Full Training Week",
        description: "Complete four structured sessions this week — 2 strength, 2 cardio/interval — logging weight, reps, or pace for each.",
        xpReward: 200,
        goldReward: 40,
        hasAiHelper: true,
        nodeSlug: "fit-hypertrophy-block",
      },
      {
        slug: "fit-hyp-2",
        title: "Progressive Overload Check",
        description: "Increase the weight, reps, or pace on two exercises compared to your last session, and note the improvement.",
        xpReward: 90,
        nodeSlug: "fit-hypertrophy-block",
      },
    ],
    nodes: [
      { slug: "fit-assessment", label: "Fitness Assessment", statusDefault: "ACTIVE", x: 8, y: 8, prereqs: [] },
      {
        slug: "fit-strength-foundations",
        label: "Strength Foundations",
        statusDefault: "LOCKED",
        x: 8,
        y: 140,
        prereqs: ["fit-assessment"],
      },
      {
        slug: "fit-cardio-base",
        label: "Cardio Base",
        statusDefault: "LOCKED",
        x: 200,
        y: 140,
        prereqs: ["fit-assessment"],
      },
      {
        slug: "fit-push-pull-split",
        label: "Push / Pull Split",
        statusDefault: "LOCKED",
        x: 8,
        y: 272,
        prereqs: ["fit-strength-foundations"],
      },
      {
        slug: "fit-interval-training",
        label: "Interval Training",
        statusDefault: "LOCKED",
        x: 200,
        y: 272,
        prereqs: ["fit-cardio-base"],
      },
      {
        slug: "fit-hypertrophy-block",
        label: "Hypertrophy Block",
        statusDefault: "LOCKED",
        x: 104,
        y: 404,
        prereqs: ["fit-push-pull-split", "fit-interval-training"],
      },
    ],
  },
  {
    slug: "culinary",
    label: "Culinary Art",
    className: "Master Chef",
    blurb: "Craft legendary meals from raw ingredients.",
    icon: "chef",
    classColor: "CRAFT",
    displayLevel: 1,
    primaryStat: "DEX",
    npcRole: "ELF",
    sortOrder: 30,
    isStarter: true,
    quests: [
      {
        slug: "cul-1",
        title: "Cook a Fresh Meal",
        description: "Prepare a balanced meal from raw ingredients.",
        xpReward: 100,
        goldReward: 25,
        hasAiHelper: true,
        nodeSlug: "cul-n2",
      },
      {
        slug: "cul-2",
        title: "Master a New Knife Cut",
        description: "Practice the julienne or brunoise technique.",
        xpReward: 60,
        nodeSlug: "cul-n2",
      },
    ],
    nodes: [
      { slug: "cul-n1", label: "Knife Skills", statusDefault: "MASTERED", x: 8, y: 8, prereqs: [] },
      {
        slug: "cul-n2",
        label: "Fresh Cooking",
        statusDefault: "ACTIVE",
        x: 8,
        y: 140,
        prereqs: ["cul-n1"],
      },
      {
        slug: "cul-n3",
        label: "Baking & Pastry",
        statusDefault: "LOCKED",
        x: 200,
        y: 140,
        prereqs: ["cul-n1"],
      },
      {
        slug: "cul-n4",
        label: "Fermentation",
        statusDefault: "LOCKED",
        x: 104,
        y: 272,
        prereqs: ["cul-n2", "cul-n3"],
      },
    ],
  },
  {
    slug: "finance",
    label: "Personal Finance",
    className: "Gold Merchant",
    blurb: "Grow your hoard and master the market.",
    icon: "coins",
    classColor: "CHA",
    displayLevel: 2,
    primaryStat: "DEX",
    npcRole: "ELF",
    sortOrder: 40,
    isStarter: false,
    quests: [
      {
        slug: "fin-1",
        title: "Track This Week's Spend",
        description: "Log every expense for 7 days in a budget sheet.",
        xpReward: 90,
        goldReward: 30,
        hasAiHelper: true,
        nodeSlug: "fin-n2",
      },
      {
        slug: "fin-2",
        title: "Read One Market Article",
        description: "Study a piece on index funds or compounding.",
        xpReward: 45,
        nodeSlug: "fin-n2",
      },
    ],
    nodes: [
      { slug: "fin-n1", label: "Budgeting", statusDefault: "MASTERED", x: 8, y: 8, prereqs: [] },
      {
        slug: "fin-n2",
        label: "Expense Tracking",
        statusDefault: "ACTIVE",
        x: 104,
        y: 140,
        prereqs: ["fin-n1"],
      },
      {
        slug: "fin-n3",
        label: "Investing 101",
        statusDefault: "LOCKED",
        x: 104,
        y: 272,
        prereqs: ["fin-n2"],
      },
    ],
  },
  {
    slug: "language",
    label: "Language Learning",
    className: "Silver Tongue",
    blurb: "Unlock new tongues and charm the realm.",
    icon: "languages",
    classColor: "CHA",
    displayLevel: 2,
    primaryStat: "CHA",
    npcRole: "ELF",
    sortOrder: 50,
    isStarter: false,
    quests: [
      {
        slug: "lang-1",
        title: "Complete a Vocab Set",
        description: "Learn 20 new words and review yesterday's set.",
        xpReward: 80,
        goldReward: 10,
        hasAiHelper: true,
        nodeSlug: "lang-n2",
      },
      {
        slug: "lang-2",
        title: "Speak for 5 Minutes",
        description: "Hold a short conversation out loud, no notes.",
        xpReward: 55,
        nodeSlug: "lang-n2",
      },
    ],
    nodes: [
      { slug: "lang-n1", label: "Alphabet", statusDefault: "MASTERED", x: 8, y: 8, prereqs: [] },
      {
        slug: "lang-n2",
        label: "Core Vocab",
        statusDefault: "ACTIVE",
        x: 104,
        y: 140,
        prereqs: ["lang-n1"],
      },
      {
        slug: "lang-n3",
        label: "Conversation",
        statusDefault: "LOCKED",
        x: 104,
        y: 272,
        prereqs: ["lang-n2"],
      },
    ],
  },
  {
    slug: "music",
    label: "Music & Instrument",
    className: "Bard",
    blurb: "Practice your craft and enchant listeners.",
    icon: "music",
    classColor: "CRAFT",
    displayLevel: 1,
    primaryStat: "CHA",
    npcRole: "ELF",
    sortOrder: 60,
    isStarter: false,
    quests: [
      {
        slug: "mus-1",
        title: "Practice Scales",
        description: "Run through major and minor scales for 15 minutes.",
        xpReward: 70,
        goldReward: 12,
        hasAiHelper: true,
        nodeSlug: "mus-n2",
      },
      {
        slug: "mus-2",
        title: "Learn a New Riff",
        description: "Memorize 8 bars of a song you love.",
        xpReward: 60,
        nodeSlug: "mus-n2",
      },
    ],
    nodes: [
      { slug: "mus-n1", label: "Music Theory", statusDefault: "MASTERED", x: 8, y: 8, prereqs: [] },
      {
        slug: "mus-n2",
        label: "Scales & Technique",
        statusDefault: "ACTIVE",
        x: 104,
        y: 140,
        prereqs: ["mus-n1"],
      },
      {
        slug: "mus-n3",
        label: "First Song",
        statusDefault: "LOCKED",
        x: 104,
        y: 272,
        prereqs: ["mus-n2"],
      },
    ],
  },
]

async function main() {
  for (const treeData of skillTrees) {

    const tree = await prisma.skillTree.upsert({
      where: { slug: treeData.slug },
      update: {
        label: treeData.label,
        className: treeData.className,
        blurb: treeData.blurb,
        icon: treeData.icon,
        classColor: treeData.classColor,
        displayLevel: treeData.displayLevel,
        primaryStat: treeData.primaryStat,
        npcRole: treeData.npcRole,
        sortOrder: treeData.sortOrder,
        isStarter: treeData.isStarter,
      },
      create: {
        slug: treeData.slug,
        label: treeData.label,
        className: treeData.className,
        blurb: treeData.blurb,
        icon: treeData.icon,
        classColor: treeData.classColor,
        displayLevel: treeData.displayLevel,
        primaryStat: treeData.primaryStat,
        npcRole: treeData.npcRole,
        sortOrder: treeData.sortOrder,
        isStarter: treeData.isStarter,
      },
    })

    const nodeBySlug = new Map()

    for (const [index, nodeData] of treeData.nodes.entries()) {
      const node = await prisma.skillNode.upsert({
        where: { slug: nodeData.slug },
        update: {
          treeId: tree.id,
          label: nodeData.label,
          statusDefault: nodeData.statusDefault,
          x: nodeData.x,
          y: nodeData.y,
          sortOrder: index,
        },
        create: {
          treeId: tree.id,
          slug: nodeData.slug,
          label: nodeData.label,
          statusDefault: nodeData.statusDefault,
          x: nodeData.x,
          y: nodeData.y,
          sortOrder: index,
        },
      })
      nodeBySlug.set(nodeData.slug, node)
    }

    for (const nodeData of treeData.nodes) {
      const node = nodeBySlug.get(nodeData.slug)
      await prisma.skillNodePrerequisite.deleteMany({
        where: { nodeId: node.id },
      })

      for (const prereqSlug of nodeData.prereqs) {
        const prerequisite = nodeBySlug.get(prereqSlug)
        await prisma.skillNodePrerequisite.create({
          data: {
            nodeId: node.id,
            prerequisiteId: prerequisite.id,
          },
        })
      }
    }

    for (const [index, questData] of treeData.quests.entries()) {
      const node = nodeBySlug.get(questData.nodeSlug)

      await prisma.quest.upsert({
        where: { slug: questData.slug },
        update: {
          treeId: tree.id,
          nodeId: node?.id,
          title: questData.title,
          description: questData.description,
          xpReward: questData.xpReward,
          goldReward: questData.goldReward ?? 0,
          hasAiHelper: questData.hasAiHelper ?? false,
          sortOrder: index,
        },
        create: {
          treeId: tree.id,
          nodeId: node?.id,
          slug: questData.slug,
          title: questData.title,
          description: questData.description,
          xpReward: questData.xpReward,
          goldReward: questData.goldReward ?? 0,
          hasAiHelper: questData.hasAiHelper ?? false,
          sortOrder: index,
        },
      })
    }
const definedNodeSlugs = treeData.nodes.map((n) => n.slug)
    const definedQuestSlugs = treeData.quests.map((q) => q.slug)

    const staleNodes = await prisma.skillNode.findMany({
      where: { treeId: tree.id, slug: { notIn: definedNodeSlugs } },
      select: { id: true },
    })
    const staleNodeIds = staleNodes.map((n) => n.id)

    if (staleNodeIds.length > 0) {
      await prisma.skillNodePrerequisite.deleteMany({
        where: { OR: [{ nodeId: { in: staleNodeIds } }, { prerequisiteId: { in: staleNodeIds } }] },
      })
      await prisma.quest.deleteMany({ where: { nodeId: { in: staleNodeIds } } })
      await prisma.skillNode.deleteMany({ where: { id: { in: staleNodeIds } } })
    }

    await prisma.quest.deleteMany({
      where: { treeId: tree.id, slug: { notIn: definedQuestSlugs } },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
