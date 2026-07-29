import type { NodeStatus } from "@/lib/game-data"

type NodeInput = {
  id: string
  prereqIds: string[]
  questSlugs: string[]
}

export function computeNodeStatuses(
  nodes: NodeInput[],
  completedQuestSlugs: Set<string>,
): Map<string, NodeStatus> {
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const memo = new Map<string, boolean>()

  function isMastered(nodeId: string, stack = new Set<string>()): boolean {
    if (memo.has(nodeId)) return memo.get(nodeId)!
    if (stack.has(nodeId)) return false // захист від циклічних залежностей

    const node = nodeById.get(nodeId)
    if (!node) return false

    stack.add(nodeId)
    const prereqsMastered = node.prereqIds.every((id) => isMastered(id, stack))
    stack.delete(nodeId)

    const mastered =
      prereqsMastered &&
      (node.questSlugs.length === 0 || node.questSlugs.every((slug) => completedQuestSlugs.has(slug)))

    memo.set(nodeId, mastered)
    return mastered
  }

  const statusById = new Map<string, NodeStatus>()
  for (const node of nodes) {
    if (isMastered(node.id)) {
      statusById.set(node.id, "mastered")
      continue
    }
    const prereqsMastered = node.prereqIds.every((id) => isMastered(id))
    statusById.set(node.id, prereqsMastered ? "active" : "locked")
  }

  return statusById
}