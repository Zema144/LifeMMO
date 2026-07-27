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

const edgeColor: Record<SkillNode["status"], string> = {
  mastered: "var(--chart-5)",
  active: "var(--primary)",
  locked: "rgba(154,138,108,0.45)",
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
  const width = Math.max(...tree.nodes.map((n) => n.x + NODE)) + 80
  const height = Math.max(...tree.nodes.map((n) => n.y + NODE)) + 120

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
          {edges.map((e) =>
            e.status === "locked" ? (
              <line
                key={e.key}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={edgeColor.locked}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray="0.1 14"
                className="animate-flow-line-locked opacity-40"
              />
            ) : (
              <g key={e.key}>
                <line
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  stroke="var(--border)"
                  strokeWidth={12}
                  strokeDasharray="14 5"
                  strokeLinecap="butt"
                />
                <line
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  stroke={edgeColor[e.status]}
                  strokeWidth={9}
                  strokeDasharray="14 5"
                  strokeLinecap="butt"
                  className="animate-flow-line"
                  style={{ filter: "drop-shadow(0 3px 0 rgba(0,0,0,0.5))" }}
                />
                <line
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  stroke={edgeColor[e.status]}
                  strokeWidth={3}
                  strokeDasharray="14 5"
                  strokeLinecap="butt"
                  opacity={0.55}
                  className="animate-flow-line"
                />
              </g>
            ),
          )}
        </svg>

        {tree.nodes.map((node, index) => (
          <NodeTile
            key={node.id}
            tree={tree}
            node={node}
            index={index}
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
  index,
  showTip,
  onOpenNode,
  onToggleTip,
}: {
  tree: SkillTree
  node: SkillNode
  index: number
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
    <div 
      className={`absolute animate-in zoom-in-90 fade-in duration-500 fill-mode-both ${
        showTip ? "z-50" : "z-10"
      }`} 
      style={{ 
        left: node.x, 
        top: node.y, 
        width: NODE, 
        height: NODE,
        animationDelay: `${index * 120}ms`
      }}
    >
      <div className="relative size-full">
        <button
          type="button"
          data-testid={`node-${node.id}`}
          onClick={() => (node.status === "active" ? onOpenNode(node) : onToggleTip())}
          aria-label={`${node.label} — ${statusText}`}
          className={`group rune-node flex size-full flex-col items-center justify-center gap-1 px-1 transition-all duration-300 ${
            node.status === "mastered"
              ? "rune-mastered hover:scale-105"
              : node.status === "active"
                ? "rune-active hover:scale-105"
                : "rune-locked opacity-80 hover:opacity-100"
          }`}
        >
          {badge}
          <span
            className={`text-center font-pixel text-[6px] leading-tight transition-colors ${
              node.status === "locked" ? "text-muted-foreground group-hover:text-foreground/70" : "text-foreground"
            }`}
          >
            {node.label}
          </span>
          {node.status === "active" && (
            <span className="mt-0.5 flex items-center gap-0.5 border border-primary bg-primary/25 px-1 py-0.5 font-pixel text-[5px] uppercase leading-none text-primary-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <ScrollText className="size-2 animate-pulse group-hover:animate-none" aria-hidden="true" />
              View
            </span>
          )}
        </button>

        {node.status === "locked" && showTip && reqs.length > 0 && (
          <div
            role="tooltip"
            className="hud-panel absolute left-1/2 top-full mt-3 w-40 -translate-x-1/2 bg-popover p-2 text-center animate-in slide-in-from-top-2 fade-in duration-200 shadow-2xl"
          >
            <p className="font-pixel text-[6px] uppercase leading-relaxed text-gold">Requires</p>
            <p className="mt-1 font-pixel text-[6px] leading-relaxed text-popover-foreground">
              {reqs.join(" + ")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}