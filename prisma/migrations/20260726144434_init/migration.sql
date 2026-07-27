-- CreateEnum
CREATE TYPE "StatKey" AS ENUM ('STR', 'INT', 'DEX', 'CHA');

-- CreateEnum
CREATE TYPE "NpcRole" AS ENUM ('WIZARD', 'WARRIOR', 'ELF');

-- CreateEnum
CREATE TYPE "ClassColor" AS ENUM ('INT', 'STR', 'CHA', 'CRAFT');

-- CreateEnum
CREATE TYPE "QuestKind" AS ENUM ('DAILY', 'MAIN', 'MILESTONE', 'PENALTY');

-- CreateEnum
CREATE TYPE "QuestDefaultStatus" AS ENUM ('ACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "UserQuestStatus" AS ENUM ('ACCEPTED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NodeDefaultStatus" AS ENUM ('MASTERED', 'ACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Novice Adventurer',
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "xpToNext" INTEGER NOT NULL DEFAULT 1000,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "str" INTEGER NOT NULL DEFAULT 5,
    "int" INTEGER NOT NULL DEFAULT 5,
    "dex" INTEGER NOT NULL DEFAULT 5,
    "cha" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_trees" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "classColor" "ClassColor" NOT NULL,
    "displayLevel" INTEGER NOT NULL DEFAULT 1,
    "primaryStat" "StatKey" NOT NULL,
    "npcRole" "NpcRole" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skill_trees" (
    "userId" TEXT NOT NULL,
    "skillTreeId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skill_trees_pkey" PRIMARY KEY ("userId","skillTreeId")
);

-- CreateTable
CREATE TABLE "skill_nodes" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "statusDefault" "NodeDefaultStatus" NOT NULL DEFAULT 'LOCKED',
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_node_prerequisites" (
    "nodeId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "skill_node_prerequisites_pkey" PRIMARY KEY ("nodeId","prerequisiteId")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "nodeId" TEXT,
    "kind" "QuestKind" NOT NULL DEFAULT 'DAILY',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "statusDefault" "QuestDefaultStatus" NOT NULL DEFAULT 'ACTIVE',
    "hasAiHelper" BOOLEAN NOT NULL DEFAULT false,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "goldReward" INTEGER NOT NULL DEFAULT 0,
    "statRewardType" "StatKey",
    "statRewardValue" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" "UserQuestStatus" NOT NULL DEFAULT 'ACCEPTED',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "aiApproved" BOOLEAN,
    "aiFeedback" TEXT,
    "aiVerdict" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "quest_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debuffs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceQuestId" TEXT,
    "stat" "StatKey" NOT NULL,
    "value" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "penaltyQuestTitle" TEXT,
    "penaltyDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "debuffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_trees_slug_key" ON "skill_trees"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "skill_nodes_slug_key" ON "skill_nodes"("slug");

-- CreateIndex
CREATE INDEX "skill_nodes_treeId_idx" ON "skill_nodes"("treeId");

-- CreateIndex
CREATE UNIQUE INDEX "quests_slug_key" ON "quests"("slug");

-- CreateIndex
CREATE INDEX "quests_treeId_idx" ON "quests"("treeId");

-- CreateIndex
CREATE INDEX "quests_nodeId_idx" ON "quests"("nodeId");

-- CreateIndex
CREATE INDEX "user_quests_questId_idx" ON "user_quests"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "user_quests_userId_questId_key" ON "user_quests"("userId", "questId");

-- CreateIndex
CREATE INDEX "quest_submissions_userId_questId_idx" ON "quest_submissions"("userId", "questId");

-- CreateIndex
CREATE INDEX "debuffs_userId_isActive_idx" ON "debuffs"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "user_skill_trees" ADD CONSTRAINT "user_skill_trees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_trees" ADD CONSTRAINT "user_skill_trees_skillTreeId_fkey" FOREIGN KEY ("skillTreeId") REFERENCES "skill_trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "skill_trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_node_prerequisites" ADD CONSTRAINT "skill_node_prerequisites_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "skill_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_node_prerequisites" ADD CONSTRAINT "skill_node_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "skill_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "skill_trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "skill_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_submissions" ADD CONSTRAINT "quest_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_submissions" ADD CONSTRAINT "quest_submissions_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debuffs" ADD CONSTRAINT "debuffs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debuffs" ADD CONSTRAINT "debuffs_sourceQuestId_fkey" FOREIGN KEY ("sourceQuestId") REFERENCES "quests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
