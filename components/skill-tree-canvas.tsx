"use client"

import { useState } from "react"
import { Check, Lock, ScrollText } from "lucide-react"
import { prereqLabels, type SkillNode, type SkillTree } from "@/lib/game-data"
import { TreeIcon } from "@/components/tree-icon"

const NODE = 84
const HALF = NODE / 2

type Edge = {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
  status: SkillNode["status"]
}

const edgeStroke: Record<SkillNode["status"], string> = {
  mastered: "var(--chart-5)",
  active: "var(--primary)",
  locked: "rgba(148,163,184,0.4)",
}

export function SkillTreeCanvas({
  tree,
  onOpenNode,
}: {
  tree: SkillTree
  onOpenNode: (node: SkillNode) => void
}) {
  const [tipNode, setTipNode] = useState<string | null>(null)

  const nodeById = Object.fromEntries(tree.nodes.map((n) => [n.id, n]))
  const width = Math.max(...tree.nodes.map((n) => n.x + NODE)) + 8
  const height = Math.max(...tree.nodes.map((n) => n.y + NODE)) + 8

  const edges: Edge[] = tree.nodes.flatMap((node) =>
    node.prereqs
      .map((pid) => nodeById[pid])
      .filter(Boolean)
      .map((src) => {
        const sx = src.x + HALF
        const sy = src.y + HALF
        const tx = node.x + HALF
        const ty = node.y + HALF
        const dx = tx - sx
        const dy = ty - sy
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len
        const uy = dy / len
        const pad = HALF + 5
        return {
          key: `${src.id}-${node.id}`,
          x1: sx + ux * pad,
          y1: sy + uy * pad,
          x2: tx - ux * pad,
          y2: ty - uy * pad,
          status: node.status,
        }
      }),
  )

  return (
    <div className="hud-inset overflow-x-auto bg-background/60 p-3">
      <div className="relative mx-auto" style={{ width, height }}>
        <svg
          className="pointer-events-none absolute inset-0"
          width={width}
          height={height}
          aria-hidden="true"
        >
          <defs>
            {(["mastered", "active", "locked"] as const).map((s) => (
              <marker
                key={s}
                id={`arrow-${s}`}
                viewBox="0 0 8 8"
                refX="4"
                refY="4"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill={edgeStroke[s]} />
              </marker>
            ))}
          </defs>
          {edges.map((e) => (
            <line
              key={e.key}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={edgeStroke[e.status]}
              strokeWidth={2}
              strokeDasharray={e.status === "locked" ? "5 4" : undefined}
              markerEnd={`url(#arrow-${e.status})`}
            />
          ))}
        </svg>

        {tree.nodes.map((node) => (
          <NodeTile
            key={node.id}
            tree={tree}
            node={node}
            showTip={tipNode === node.id}
            onOpenNode={onOpenNode}
            onToggleTip={() => setTipNode((cur) => (cur === node.id ? null : node.id))}
          />
        ))}
      </div>
    </div>
  )
}

function NodeTile({
  tree,
  node,
  showTip,
  onOpenNode,
  onToggleTip,
}: {
  tree: SkillTree
  node: SkillNode
  showTip: boolean
  onOpenNode: (node: SkillNode) => void
  onToggleTip: () => void
}) {
  const reqs = prereqLabels(tree, node)

  const badge =
    node.status === "mastered" ? (
      <Check className="size-4 text-chart-5" aria-hidden="true" />
    ) : node.status === "locked" ? (
      <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
    ) : (
      <TreeIcon icon={tree.icon} className="size-4 text-primary" />
    )

  const statusText =
    node.status === "mastered" ? "Mastered" : node.status === "locked" ? "Locked" : "In Progress"

  return (
    <div className="absolute" style={{ left: node.x, top: node.y, width: NODE, height: NODE }}>
      <button
        type="button"
        data-testid={`node-${node.id}`}
        onClick={() => (node.status === "active" ? onOpenNode(node) : onToggleTip())}
        aria-label={`${node.label} — ${statusText}`}
        className={`rune-node flex size-full flex-col items-center justify-center gap-1 px-1 ${
          node.status === "mastered"
            ? "rune-mastered"
            : node.status === "active"
              ? "rune-active"
              : "rune-locked opacity-80"
        }`}
      >
        {badge}
        <span
          className={`text-center font-pixel text-[6px] leading-tight ${
            node.status === "locked" ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {node.label}
        </span>
        {node.status === "active" && (
          <span className="mt-0.5 flex items-center gap-0.5 border border-primary bg-primary/25 px-1 py-0.5 font-pixel text-[5px] uppercase leading-none text-primary-foreground">
            <ScrollText className="size-2" aria-hidden="true" />
            View
          </span>
        )}
      </button>

      {node.status === "locked" && showTip && reqs.length > 0 && (
        <div
          role="tooltip"
          className="hud-panel absolute left-1/2 top-full z-20 mt-2 w-40 -translate-x-1/2 bg-popover p-2 text-center"
        >
          <p className="font-pixel text-[6px] uppercase leading-relaxed text-gold">Requires</p>
          <p className="mt-1 font-pixel text-[6px] leading-relaxed text-popover-foreground">
            {reqs.join(" + ")}
          </p>
        </div>
      )}
    </div>
  )
}
