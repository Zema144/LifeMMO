"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import posthog from "posthog-js"
import { PlayerHeader } from "@/components/player-header"
import { CharacterStats } from "@/components/character-stats"
import { DebuffBanner } from "@/components/debuff-banner"
import { QuestLog } from "@/components/quest-log"
import { SkillTreesView } from "@/components/skill-trees-view"
import { ProfileView } from "@/components/profile-view"
import { NodeDrawer } from "@/components/node-drawer"
import { BrowseTreesModal } from "@/components/browse-trees-modal"
import { BottomNav, type TabId } from "@/components/bottom-nav"
import { analyticsEvents } from "@/lib/analytics-events"
import type { Player, Quest, SkillNode, SkillTree, SkillTreeId } from "@/lib/game-data"

function questIndex(skillTrees: SkillTree[]): Record<string, { quest: Quest; treeId: SkillTreeId }> {
  const index: Record<string, { quest: Quest; treeId: SkillTreeId }> = {}
  for (const tree of skillTrees) {
    for (const quest of tree.quests) {
      index[quest.id] = { quest, treeId: tree.id }
    }
  }
  return index
}

export function PageClient({
  currentUserId,
  initialPlayer,
  initialSkillTrees,
  initialActiveTrees,
  initialAcceptedQuestIds,
}: {
  currentUserId: string
  initialPlayer: Player
  initialSkillTrees: SkillTree[]
  initialActiveTrees: SkillTreeId[]
  initialAcceptedQuestIds: string[]
}) {
  const capturedOpenRef = useRef(false)
  const [activeTab, setActiveTab] = useState<TabId>("quests")
  const [activeTrees, setActiveTrees] = useState<SkillTreeId[]>(initialActiveTrees)
  const [selected, setSelected] = useState<SkillTreeId>(initialActiveTrees[0] ?? initialSkillTrees[0].id)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [openNode, setOpenNode] = useState<SkillNode | null>(null)
  const [acceptedQuestIds, setAcceptedQuestIds] = useState<string[]>(initialAcceptedQuestIds)
  const [questState, setQuestState] = useState<Record<string, Quest[]>>(() =>
    Object.fromEntries(initialSkillTrees.map((tree) => [tree.id, tree.quests])),
  )

  const treeIdByQuestId = useMemo(() => questIndex(initialSkillTrees), [initialSkillTrees])
  const tree = useMemo(() => initialSkillTrees.find((item) => item.id === selected)!, [initialSkillTrees, selected])
  const treeQuests = questState[selected] ?? []
  const showDebuff = activeTrees.includes("fitness") && activeTab === "quests"

  const drawerQuests = useMemo(() => {
    if (!openNode?.questIds) return []
    return treeQuests.filter((quest) => openNode.questIds!.includes(quest.id))
  }, [openNode, treeQuests])

  const mainQuests = useMemo(() => {
    return acceptedQuestIds
      .map((id) => {
        const entry = treeIdByQuestId[id]
        if (!entry) return null
        const live = questState[entry.treeId]?.find((quest) => quest.id === id)
        return live ?? entry.quest
      })
      .filter((quest): quest is Quest => quest !== null && quest.status !== "completed")
  }, [acceptedQuestIds, questState, treeIdByQuestId])

  const handleComplete = (id: string) => {
    const entry = treeIdByQuestId[id]
    if (!entry) return
    const quest = entry.quest

    setQuestState((prev) => ({
      ...prev,
      [entry.treeId]: prev[entry.treeId].map((quest) =>
        quest.id === id ? { ...quest, status: "completed" } : quest,
      ),
    }))

    fetch("/api/quests/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, questSlug: id }),
    })
      .then(() => {
        posthog.capture(analyticsEvents.questCompleted, {
          quest_slug: id,
          quest_title: quest.title,
          tree_slug: entry.treeId,
        })
      })
      .catch(() => {
      setQuestState((prev) => ({
        ...prev,
        [entry.treeId]: prev[entry.treeId].map((quest) =>
          quest.id === id ? { ...quest, status: "active" } : quest,
        ),
      }))
    })
  }

  const handleAccept = (id: string) => {
    const entry = treeIdByQuestId[id]
    setAcceptedQuestIds((prev) => (prev.includes(id) ? prev : [...prev, id]))

    fetch("/api/quests/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, questSlug: id }),
    })
      .then(() => {
        posthog.capture(analyticsEvents.questAccepted, {
          quest_slug: id,
          quest_title: entry?.quest.title,
          tree_slug: entry?.treeId,
        })
      })
      .catch(() => {
      setAcceptedQuestIds((prev) => prev.filter((questId) => questId !== id))
    })
  }

  // --- ГЛОБАЛЬНИЙ СКАНЕР ЧЕРГИ КВЕСТІВ ---
  useEffect(() => {
    activeTrees.forEach((treeId) => {
      const currentTree = initialSkillTrees.find((t) => t.id === treeId)
      if (!currentTree) return

      const activeNodes = currentTree.nodes.filter((node) => node.status === "active")

      activeNodes.forEach((node) => {
        if (!node.questIds) return

        const nodeQuests = questState[currentTree.id]?.filter((q) => node.questIds!.includes(q.id)) || []
        const firstPendingQuest = nodeQuests.find((q) => q.status !== "completed")

        // Якщо знайшли незавершений квест, якого ще немає в прийнятих — беремо його автоматично
        if (firstPendingQuest && !acceptedQuestIds.includes(firstPendingQuest.id)) {
          handleAccept(firstPendingQuest.id)
        }
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrees, questState, acceptedQuestIds, initialSkillTrees])
  // ----------------------------------------------

  useEffect(() => {
    if (capturedOpenRef.current) return
    capturedOpenRef.current = true

    posthog.identify(currentUserId, {
      name: initialPlayer.name,
      level: initialPlayer.level,
    })
    posthog.capture(analyticsEvents.appOpened, {
      active_tree_count: activeTrees.length,
      accepted_quest_count: acceptedQuestIds.length,
    })
  }, [acceptedQuestIds.length, activeTrees.length, currentUserId, initialPlayer.level, initialPlayer.name])

  const handleSelect = (id: SkillTreeId) => {
    setSelected(id)
    setOpenNode(null)
    posthog.capture(analyticsEvents.treeSelected, {
      tree_slug: id,
    })
  }

  const handleJoin = (id: SkillTreeId) => {
    setActiveTrees((prev) => (prev.includes(id) ? prev : [...prev, id]))
    handleSelect(id)
    setBrowseOpen(false)
    posthog.capture(analyticsEvents.treeJoined, {
      tree_slug: id,
    })
  }

  const handleAbandon = () => {
    const abandoned = selected
    setActiveTrees((prev) => {
      const next = prev.filter((treeId) => treeId !== selected)
      if (next.length) setSelected(next[0])
      return next.length ? next : prev
    })
    setOpenNode(null)
    posthog.capture(analyticsEvents.treeAbandoned, {
      tree_slug: abandoned,
    })
  }

  const handleTabChange = (id: TabId) => {
    setActiveTab(id)
    posthog.capture(analyticsEvents.tabOpened, {
      tab: id,
    })
  }

  const handleOpenNode = (node: SkillNode) => {
    setOpenNode(node)
    posthog.capture(analyticsEvents.skillNodeOpened, {
      tree_slug: selected,
      node_slug: node.id,
      node_label: node.label,
    })
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pb-28 pt-5">
      {activeTab === "quests" && (
        <>
          <PlayerHeader player={initialPlayer} />
          <CharacterStats player={initialPlayer} />
          {showDebuff && <DebuffBanner />}
          <QuestLog quests={mainQuests} onComplete={handleComplete} />
        </>
      )}

      {activeTab === "trees" && (
        <SkillTreesView
          skillTrees={initialSkillTrees}
          tree={tree}
          activeTrees={activeTrees}
          selected={selected}
          onSelect={handleSelect}
          onExplore={() => {
            setBrowseOpen(true)
            posthog.capture(analyticsEvents.browseTreesOpened)
          }}
          onAbandon={handleAbandon}
          onOpenNode={handleOpenNode}
        />
      )}

      {activeTab === "profile" && (
        <ProfileView player={initialPlayer} skillTrees={initialSkillTrees} activeTrees={activeTrees} />
      )}

      <NodeDrawer
        tree={tree}
        node={openNode}
        quests={drawerQuests}
        acceptedQuestIds={acceptedQuestIds}
        onAccept={handleAccept}
        onComplete={handleComplete}
        onClose={() => setOpenNode(null)}
      />

      <BrowseTreesModal
        skillTrees={initialSkillTrees}
        open={browseOpen}
        activeTrees={activeTrees}
        onClose={() => setBrowseOpen(false)}
        onJoin={handleJoin}
      />

      <BottomNav active={activeTab} onChange={handleTabChange} />
    </main>
  )
}