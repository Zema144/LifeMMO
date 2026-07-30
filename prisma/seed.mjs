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
    label: "Iron Foundry",
    className: "Iron Warrior",
    blurb: "Awaken your body, forge raw strength, and conquer the resistance.",
    icon: "dumbbell",
    classColor: "STR",
    displayLevel: 1,
    primaryStat: "STR",
    npcRole: "WARRIOR",
    sortOrder: 20,
    isStarter: true,
    quests: [
      // --- NODE 1: THE STARTING LINE (1 Quest) ---
      {
        slug: "fit-0-baseline",
        title: "Baseline Assessment",
        description: "Record your starting weight, waist, chest, and bicep measurements. Take a realistic 'Before' photo for your hidden vault.",
        xpReward: 100,
        goldReward: 20,
        hasAiHelper: true,
        nodeSlug: "fit-n1-start",
      },

      // --- NODE 2: ZERO TO ONE (20 Quests - Home Foundation) ---
      // Effort & Physics
      {
        slug: "fit-1-push",
        title: "The Floor is Yours",
        description: "Complete 50 push-ups throughout the day. Knee push-ups are perfectly fine. Focus on form, not speed.",
        xpReward: 60,
        goldReward: 5,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-squat",
        title: "Leg Drive (Home)",
        description: "Complete 100 bodyweight squats today. Keep your heels glued to the floor and back straight.",
        xpReward: 60,
        goldReward: 5,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-plank",
        title: "Core Ignition",
        description: "Accumulate 3 minutes of planking in a single day. Don't let your lower back sag.",
        xpReward: 60,
        goldReward: 5,
        hasAiHelper: true,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-pull",
        title: "Improvised Pull",
        description: "Do 3 sets of inverted rows using a very sturdy, heavy table. Safety first: test its stability before pulling your weight.",
        xpReward: 70,
        goldReward: 10,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-cardio",
        title: "Cardio Explorer",
        description: "Walk 3 kilometers at a brisk pace without stopping. Breathe deep and clear your mind.",
        xpReward: 70,
        goldReward: 10,
        nodeSlug: "fit-n2-zero",
      },
      
      // Habits & Consistency
      {
        slug: "fit-1-morning",
        title: "Morning Steel",
        description: "Do a 10-minute stretch routine immediately after waking up, before checking your phone.",
        xpReward: 50,
        goldReward: 0,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-streak",
        title: "Home Consistency",
        description: "Work out at home 3 times this week for at least 20 minutes each session.",
        xpReward: 100,
        goldReward: 15,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-water",
        title: "Water Element",
        description: "Drink at least 2 liters of pure water daily for 3 consecutive days.",
        xpReward: 50,
        goldReward: 0,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-sugar",
        title: "No Sugar Day",
        description: "Survive one full day with zero added sugar, sweets, or sugary drinks.",
        xpReward: 60,
        goldReward: 5,
        hasAiHelper: true,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-protein",
        title: "Protein Awareness",
        description: "Eat 3 different sources of high-quality protein today (e.g., eggs, chicken, tofu).",
        xpReward: 50,
        goldReward: 0,
        nodeSlug: "fit-n2-zero",
      },

      // Mindset & Safety
      {
        slug: "fit-1-schedule",
        title: "The Blueprint",
        description: "Write down your exact workout days and times for the week. Stick to the first scheduled session.",
        xpReward: 50,
        goldReward: 0,
        hasAiHelper: true,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-focus",
        title: "Digital Detox",
        description: "Complete a 20-minute home workout with your phone in another room. No scrolling between sets.",
        xpReward: 50,
        goldReward: 0,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-recovery",
        title: "Active Recovery",
        description: "Do a 10-minute light stretching session the day after a workout to ease muscle soreness.",
        xpReward: 50,
        goldReward: 0,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-research",
        title: "Form Check",
        description: "Watch a tutorial on proper push-up form. Identify and correct one mistake you've been making.",
        xpReward: 40,
        goldReward: 0,
        hasAiHelper: true,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-adapt",
        title: "No Excuses",
        description: "Complete a workout in a space smaller than 2x2 meters. You don't need a gym to sweat.",
        xpReward: 50,
        goldReward: 5,
        nodeSlug: "fit-n2-zero",
      },

      // Milestones & Mini-Bosses
      {
        slug: "fit-1-perfect",
        title: "The Perfect Ten",
        description: "Perform 10 push-ups in a row with flawless form. Chest to the floor, body straight as a board.",
        xpReward: 80,
        goldReward: 10,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-wallsit",
        title: "Static Hold",
        description: "Perform a wall sit with your legs at a 90-degree angle for 60 seconds straight. Embrace the burn.",
        xpReward: 60,
        goldReward: 5,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-lunges",
        title: "Balance & Control",
        description: "Complete 3 sets of 15 alternating lunges per leg. Step carefully and control the descent.",
        xpReward: 60,
        goldReward: 5,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-gauntlet",
        title: "The Gauntlet",
        description: "Pick one exercise (squats or crunches) and do 100 reps as fast as safely possible. Record your time.",
        xpReward: 90,
        goldReward: 15,
        hasAiHelper: true,
        nodeSlug: "fit-n2-zero",
      },
      {
        slug: "fit-1-graduation",
        title: "Ready for Iron",
        description: "Complete 3 sets of 15 push-ups and 30 squats in one session. You are now prepared for the next tier.",
        xpReward: 100,
        goldReward: 20,
        nodeSlug: "fit-n2-zero",
      },
    ],
    nodes: [
      { 
        slug: "fit-n1-start", 
        label: "The Starting Line", 
        statusDefault: "ACTIVE", 
        x: 104, 
        y: 8, 
        prereqs: [] 
      },
      {
        slug: "fit-n2-zero",
        label: "Zero to One",
        statusDefault: "LOCKED",
        x: 104,
        y: 140,
        prereqs: ["fit-n1-start"],
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
