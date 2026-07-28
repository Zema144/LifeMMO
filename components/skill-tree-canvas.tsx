"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Lock, Minus, Plus, RotateCcw, ScrollText } from "lucide-react"
import { prereqLabels, type SkillNode, type SkillTree } from "@/lib/game-data"
import { TreeIcon } from "@/components/tree-icon"

const NODE_SPACING = 150
const LEVEL_HEIGHT = 190
const BEND = 26 // fixed arc bend — matches the HTML mockup, not distance-scaled
const JITTER_X = 22
const JITTER_Y = 16

// per-status medallion radius (mastered / active / locked read differently in size, like the mockup)
const RADIUS: Record<SkillNode["status"], number> = {
  mastered: 32,
  active: 35,
  locked: 28,
}

type Point = { x: number; y: number }
type Edge = { key: string; path: string; status: SkillNode["status"] }

function hashId(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

/**
 * Automatic layered layout (Sugiyama-style), centered around (0,0):
 * 1. depth(node) = 1 + max(depth(prereq)) — roots get depth 0
 * 2. group nodes into rows by depth
 * 3. barycenter pass: reorder each row by the average x of its prereqs
 * 4. center every row, then center the whole tree, then add a small
 *    deterministic per-node jitter so it reads as a hand-placed
 *    constellation rather than a rigid flowchart grid.
 *
 * Works for any node count/shape — game-data's x/y fields are ignored.
 */
function computeLayout(nodes: SkillNode[]): Record<string, Point> {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const depth: Record<string, number> = {}

  function getDepth(id: string, seen = new Set<string>()): number {
    if (depth[id] !== undefined) return depth[id]
    if (seen.has(id)) return 0
    seen.add(id)
    const node = byId[id]
    if (!node || node.prereqs.length === 0) {
      depth[id] = 0
      return 0
    }
    const d = 1 + Math.max(...node.prereqs.map((p) => (byId[p] ? getDepth(p, seen) : 0)))
    depth[id] = d
    return d
  }
  nodes.forEach((n) => getDepth(n.id))

  const levels: Record<number, SkillNode[]> = {}
  nodes.forEach((n) => {
    ;(levels[depth[n.id]] ??= []).push(n)
  })
  const maxLevel = Math.max(0, ...Object.keys(levels).map(Number))

  const positions: Record<string, Point> = {}
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    ;(levels[lvl] ?? []).forEach((n, i) => {
      positions[n.id] = { x: i * NODE_SPACING, y: lvl * LEVEL_HEIGHT }
    })
  }

  for (let pass = 0; pass < 4; pass++) {
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      const rowNodes = levels[lvl] ?? []
      const scored = rowNodes.map((n) => {
        const xs = n.prereqs.map((p) => positions[p]?.x).filter((x): x is number => x !== undefined)
        const avg = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : positions[n.id].x
        return { n, avg }
      })
      scored.sort((a, b) => a.avg - b.avg)
      scored.forEach((item, i) => {
        positions[item.n.id] = { x: i * NODE_SPACING, y: lvl * LEVEL_HEIGHT }
      })
    }
  }

  const widths: Record<number, number> = {}
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    widths[lvl] = ((levels[lvl] ?? []).length - 1) * NODE_SPACING
  }
  const maxWidth = Math.max(0, ...Object.values(widths))
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const offset = (maxWidth - (widths[lvl] ?? 0)) / 2
    ;(levels[lvl] ?? []).forEach((n) => {
      positions[n.id].x += offset
    })
  }

  const allX = Object.values(positions).map((p) => p.x)
  const allY = Object.values(positions).map((p) => p.y)
  const midX = (Math.min(...allX) + Math.max(...allX)) / 2
  const midY = (Math.min(...allY) + Math.max(...allY)) / 2
  Object.values(positions).forEach((p) => {
    p.x -= midX
    p.y -= midY
  })

  // organic jitter — deterministic per id, so it's stable across re-renders
  nodes.forEach((n) => {
    const h = hashId(n.id)
    positions[n.id].x += (h % (JITTER_X * 2)) - JITTER_X
    positions[n.id].y += ((h >> 8) % (JITTER_Y * 2)) - JITTER_Y
  })

  return positions
}

function bezierPath(a: Point, aR: number, b: Point, bR: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const sx = a.x + ux * (aR + 6)
  const sy = a.y + uy * (aR + 6)
  const tx = b.x - ux * (bR + 6)
  const ty = b.y - uy * (bR + 6)

  const mx = (sx + tx) / 2
  const my = (sy + ty) / 2
  const nx = -dy
  const ny = dx
  const nlen = Math.hypot(nx, ny) || 1
  const cx = mx + (nx / nlen) * BEND
  const cy = my + (ny / nlen) * BEND

  return `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`
}

const edgeColor: Record<SkillNode["status"], string> = {
  mastered: "var(--chart-5)",
  active: "var(--primary)",
  locked: "rgba(154,138,108,0.55)",
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2.2
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function SkillTreeCanvas({
  tree,
  onOpenNode,
}: {
  tree: SkillTree
  onOpenNode: (node: SkillNode) => void
}) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  const layout = useMemo(() => computeLayout(tree.nodes), [tree.nodes])
  const nodesById = useMemo(() => Object.fromEntries(tree.nodes.map((n) => [n.id, n])), [tree.nodes])

  const edges: Edge[] = useMemo(
    () =>
      tree.nodes.flatMap((node) =>
        node.prereqs
          .filter((pid) => layout[pid])
          .map((pid) => {
            const prereqStatus = nodesById[pid]?.status ?? "mastered"
            return {
              key: `${pid}-${node.id}`,
              path: bezierPath(layout[pid], RADIUS[prereqStatus], layout[node.id], RADIUS[node.status]),
              status: node.status,
            }
          }),
      ),
    [tree.nodes, layout, nodesById],
  )

  // ---------- pan & zoom via Pointer Events ----------
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: -40 })
  const [isDragging, setIsDragging] = useState(false)
  const pointers = useRef<Map<number, Point>>(new Map())
  const dragPointerId = useRef<number | null>(null)
  const lastPos = useRef<Point>({ x: 0, y: 0 })
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      dragPointerId.current = e.pointerId
      lastPos.current = { x: e.clientX, y: e.clientY }
      setIsDragging(true)
    } else if (pointers.current.size === 2) {
      dragPointerId.current = null
      setIsDragging(false)
      const pts = Array.from(pointers.current.values())
      pinchStart.current = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), scale }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    // ЗАХИСТ ВІД СКРОЛУ СТОРІНКИ ПІД ЧАС ДРАГУ
    if (pointers.current.size > 0 && e.cancelable) {
      e.preventDefault()
    }
    
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      setScale(clamp(pinchStart.current.scale * (dist / pinchStart.current.dist), MIN_SCALE, MAX_SCALE))
      return
    }
    if (dragPointerId.current === e.pointerId) {
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
    }
  }

  function onPointerEnd(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (dragPointerId.current === e.pointerId) {
      dragPointerId.current = null
      setIsDragging(false)
    }
    if (pointers.current.size < 2) pinchStart.current = null
  }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.08 : 0.08
      setScale((s) => clamp(s + delta, MIN_SCALE, MAX_SCALE))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  useEffect(() => {
    setScale(1)
    setPan({ x: 0, y: -40 })
    setPinnedId(null)
  }, [tree.id])

  return (
    <div className="arcane-scene relative">
      <div className="arcane-nebula" data-tint={tree.classColor} aria-hidden="true" />
      <div className="arcane-vignette" aria-hidden="true" />

      <div
        ref={viewportRef}
        // ДОДАЛИ КЛАС "touch-none", ЩОБ БРАУЗЕР НЕ ПЕРЕХОПЛЮВАВ ЖЕСТИ
        className={`arcane-viewport touch-none ${isDragging ? "grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="arcane-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}>
          {/* ... решта твого коду з SVG та нодами залишається без змін ... */}
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden="true">
            <defs>
              <filter id={`thread-glow-${tree.id}`} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {edges.map((e) =>
              e.status === "locked" ? (
                <path key={e.key} d={e.path} stroke={edgeColor.locked} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeDasharray="1 9" />
              ) : (
                <path
                  key={e.key}
                  d={e.path}
                  stroke={edgeColor[e.status]}
                  strokeWidth={2.2}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={e.status === "active" ? "5 11" : "none"}
                  className={e.status === "active" ? "animate-thread-flow" : ""}
                  style={{ filter: `url(#thread-glow-${tree.id})` }}
                />
              ),
            )}
          </svg>

          {tree.nodes.map((node) => (
            <NodeTile
              key={node.id}
              tree={tree}
              node={node}
              position={layout[node.id]}
              visible={hoverId === node.id || pinnedId === node.id}
              onOpenNode={onOpenNode}
              onHoverStart={() => setHoverId(node.id)}
              onHoverEnd={() => setHoverId((cur) => (cur === node.id ? null : cur))}
              onTogglePin={() => setPinnedId((cur) => (cur === node.id ? null : node.id))}
            />
          ))}
        </div>
      </div>

      <div className="arcane-controls">
        <button type="button" aria-label="Zoom in" onClick={() => setScale((s) => clamp(s + 0.15, MIN_SCALE, MAX_SCALE))}>
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => setScale((s) => clamp(s - 0.15, MIN_SCALE, MAX_SCALE))}>
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Reset view"
          onClick={() => {
            setScale(1)
            setPan({ x: 0, y: -40 })
          }}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      </div>

      <p className="arcane-hint">Drag to pan · Scroll or pinch to zoom</p>
    </div>
  )
}

function NodeTile({
  tree,
  node,
  position,
  visible,
  onOpenNode,
  onHoverStart,
  onHoverEnd,
  onTogglePin,
}: {
  tree: SkillTree
  node: SkillNode
  position: Point
  visible: boolean
  onOpenNode: (node: SkillNode) => void
  onHoverStart: () => void
  onHoverEnd: () => void
  onTogglePin: () => void
}) {
  const reqs = prereqLabels(tree, node)
  const size = RADIUS[node.status] * 2
  // optional per-node emoji glyph — add `icon?: string` to SkillNode in game-data.ts to use this
  const customIcon = (node as SkillNode & { icon?: string }).icon
  const customDesc = (node as SkillNode & { desc?: string }).desc

  const statusText = node.status === "mastered" ? "Mastered" : node.status === "locked" ? "Locked" : "In Progress"

  const description =
    node.status === "locked"
      ? reqs.length
        ? `Requires ${reqs.join(" + ")}.`
        : "Sealed for now."
      : node.status === "mastered"
        ? customDesc ?? "Fully mastered — this rune burns steady with completed training."
        : customDesc ?? "In progress — tap to view its quests."

  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        zIndex: visible ? 50 : 10,
      }}
    >
      <div className="relative size-full">
        <button
          type="button"
          data-testid={`node-${node.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
          onClick={(e) => {
            e.stopPropagation()
            if (node.status === "active") onOpenNode(node)
            else onTogglePin()
          }}
          aria-label={`${node.label} — ${statusText}`}
          className={`medallion flex size-full items-center justify-center ${
            node.status === "mastered" ? "medallion-mastered" : node.status === "active" ? "medallion-active" : "medallion-locked"
          }`}
        >
          {node.status === "locked" && <span className="chain-ring" aria-hidden="true" />}

          {customIcon ? (
            <span className={`node-glyph ${node.status === "locked" ? "opacity-40 grayscale" : ""}`}>{customIcon}</span>
          ) : (
            <TreeIcon
              icon={tree.icon}
              className={`size-5 ${node.status === "locked" ? "text-muted-foreground opacity-50" : "text-primary"}`}
            />
          )}

          {node.status === "mastered" && (
            <span className="status-seal status-seal-mastered" aria-hidden="true">
              <Check className="size-2.5" />
            </span>
          )}
          {node.status === "locked" && (
            <span className="status-seal status-seal-locked" aria-hidden="true">
              <Lock className="size-2.5" />
            </span>
          )}
        </button>

        <span className={`node-label ${node.status === "locked" ? "node-label-locked" : ""}`}>{node.label}</span>

        {node.status === "active" && (
          <span className="view-badge">
            <ScrollText className="size-2.5" aria-hidden="true" />
            View
          </span>
        )}

        {visible && (
          <div role="tooltip" className="arcane-tooltip">
            <p className="arcane-tooltip-title">{node.label}</p>
            <p className={`arcane-tooltip-status status-${node.status}`}>{statusText}</p>
            <p className="arcane-tooltip-body">{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
