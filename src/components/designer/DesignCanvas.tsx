import { useState, useCallback, useRef, useEffect } from 'react'
import {
  MousePointer,
  Square,
  Circle,
  Type,
  Minus,
  Image as ImageIcon,
  Layers,
  Palette,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Move,
  Pen,
  Star,
  Triangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface DesignElement {
  id: string
  type: 'rect' | 'circle' | 'line' | 'text' | 'triangle' | 'star'
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  rotation: number
  opacity: number
  text?: string
  fontSize?: number
  fontWeight?: string
}

type Tool = 'select' | 'rect' | 'circle' | 'line' | 'text' | 'triangle' | 'star'

interface HistoryEntry {
  elements: DesignElement[]
}

const CANVAS_W = 800
const CANVAS_H = 600

function createDefaultElement(type: Tool, x: number, y: number): DesignElement {
  const base: Omit<DesignElement, 'width' | 'height' | 'type'> = {
    id: crypto.randomUUID(),
    x, y,
    fill: 'transparent',
    stroke: '#1a1a2e',
    strokeWidth: 2,
    rotation: 0,
    opacity: 1,
  }
  switch (type) {
    case 'rect':
      return { ...base, type: 'rect', width: 120, height: 80 }
    case 'circle':
      return { ...base, type: 'circle', width: 100, height: 100 }
    case 'line':
      return { ...base, type: 'line', width: 150, height: 2, strokeWidth: 2 }
    case 'text':
      return { ...base, type: 'text', width: 150, height: 40, text: 'Text', fill: '#1a1a2e', fontSize: 24, fontWeight: '400' }
    case 'triangle':
      return { ...base, type: 'triangle', width: 100, height: 100 }
    case 'star':
      return { ...base, type: 'star', width: 80, height: 80, fill: '#ff9f0a' }
    default:
      return { ...base, type: 'rect', width: 120, height: 80 }
  }
}

function renderElement(ctx: CanvasRenderingContext2D, el: DesignElement, scale: number) {
  ctx.save()
  ctx.globalAlpha = el.opacity
  ctx.translate(el.x * scale, el.y * scale)
  ctx.rotate((el.rotation * Math.PI) / 180)

  const w = el.width * scale
  const h = el.height * scale

  ctx.fillStyle = el.fill
  ctx.strokeStyle = el.stroke
  ctx.lineWidth = el.strokeWidth * scale

  switch (el.type) {
    case 'rect':
      if (el.fill !== 'transparent') ctx.fillRect(0, 0, w, h)
      if (el.strokeWidth > 0) ctx.strokeRect(0, 0, w, h)
      break
    case 'circle':
      ctx.beginPath()
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      if (el.fill !== 'transparent') ctx.fill()
      if (el.strokeWidth > 0) ctx.stroke()
      break
    case 'line':
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()
      break
    case 'text':
      ctx.font = `${el.fontWeight || '400'} ${el.fontSize! * scale}px Inter, system-ui, sans-serif`
      ctx.fillStyle = el.fill
      ctx.textBaseline = 'top'
      ctx.fillText(el.text || 'Text', 0, 0)
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      if (el.fill !== 'transparent') ctx.fill()
      if (el.strokeWidth > 0) ctx.stroke()
      break
    case 'star': {
      const cx = w / 2, cy = h / 2, spikes = 5
      const outerR = Math.min(w, h) / 2, innerR = outerR * 0.4
      ctx.beginPath()
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const angle = (Math.PI * i) / spikes - Math.PI / 2
        const px = cx + r * Math.cos(angle)
        const py = cy + r * Math.sin(angle)
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      if (el.fill !== 'transparent') ctx.fill()
      if (el.strokeWidth > 0) ctx.stroke()
      break
    }
  }
  ctx.restore()
}

function renderSelection(ctx: CanvasRenderingContext2D, el: DesignElement, scale: number) {
  ctx.save()
  ctx.setLineDash([4 * scale, 4 * scale])
  ctx.strokeStyle = '#0071e3'
  ctx.lineWidth = 1
  const pad = 4 * scale
  ctx.strokeRect(
    el.x * scale - pad,
    el.y * scale - pad,
    el.width * scale + pad * 2,
    el.height * scale + pad * 2,
  )

  // Handles
  ctx.setLineDash([])
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#0071e3'
  ctx.lineWidth = 1
  const handleSize = 6 * scale
  const handles = [
    { x: el.x * scale - pad, y: el.y * scale - pad },
    { x: (el.x + el.width) * scale + pad, y: el.y * scale - pad },
    { x: (el.x + el.width) * scale + pad, y: (el.y + el.height) * scale + pad },
    { x: el.x * scale - pad, y: (el.y + el.height) * scale + pad },
  ]
  handles.forEach(({ x, y }) => {
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
  })
  ctx.restore()
}

export function DesignCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elements, setElements] = useState<DesignElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [scale, setScale] = useState(1)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)

  const pushHistory = useCallback((newElements: DesignElement[]) => {
    setHistory((h) => [...h.slice(0, historyIndex + 1), { elements: newElements }])
    setHistoryIndex((i) => i + 1)
  }, [historyIndex])

  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    const prev = history[historyIndex - 1]
    if (prev) {
      setElements(prev.elements)
      setHistoryIndex((i) => i - 1)
      setSelectedId(null)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const next = history[historyIndex + 1]
    if (next) {
      setElements(next.elements)
      setHistoryIndex((i) => i + 1)
      setSelectedId(null)
    }
  }, [history, historyIndex])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_W * scale * dpr
    canvas.height = CANVAS_H * scale * dpr
    canvas.style.width = `${CANVAS_W * scale}px`
    canvas.style.height = `${CANVAS_H * scale}px`
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W * scale, CANVAS_H * scale)

    // Grid
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    const gridSize = 20 * scale
    for (let x = 0; x <= CANVAS_W * scale; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H * scale); ctx.stroke()
    }
    for (let y = 0; y <= CANVAS_H * scale; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W * scale, y); ctx.stroke()
    }

    // Elements
    elements.forEach((el) => renderElement(ctx, el, scale))

    // Selection
    const selected = elements.find((el) => el.id === selectedId)
    if (selected) renderSelection(ctx, selected, scale)
  }, [elements, selectedId, scale])

  // Mouse handlers
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    }
  }, [scale])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e)

    if (activeTool === 'select') {
      // Hit test (reverse order for top-most)
      let hit: DesignElement | null = null
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]
        if (
          coords.x >= el.x && coords.x <= el.x + el.width &&
          coords.y >= el.y && coords.y <= el.y + el.height
        ) {
          hit = el
          break
        }
      }
      if (hit) {
        setSelectedId(hit.id)
        setDragOffset({ x: coords.x - hit.x, y: coords.y - hit.y })
      } else {
        setSelectedId(null)
      }
    } else {
      setIsDrawing(true)
      setDrawStart(coords)
    }
  }, [activeTool, elements, getCanvasCoords])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragOffset && selectedId) {
      const coords = getCanvasCoords(e)
      setElements((els) =>
        els.map((el) =>
          el.id === selectedId
            ? { ...el, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
            : el
        )
      )
    }
  }, [dragOffset, selectedId, getCanvasCoords])

  const handleMouseUp = useCallback(() => {
    if (dragOffset && selectedId) {
      const updated = elements.find((el) => el.id === selectedId)
      if (updated) pushHistory(elements)
    }
    setDragOffset(null)

    if (isDrawing && drawStart && activeTool !== 'select') {
      const newEl = createDefaultElement(activeTool, drawStart.x, drawStart.y)
      setElements((els) => {
        const next = [...els, newEl]
        pushHistory(next)
        return next
      })
      setSelectedId(newEl.id)
    }
    setIsDrawing(false)
    setDrawStart(null)
  }, [dragOffset, selectedId, elements, isDrawing, drawStart, activeTool, pushHistory])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          setElements((els) => {
            const next = els.filter((el) => el.id !== selectedId)
            pushHistory(next)
            return next
          })
          setSelectedId(null)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, pushHistory, undo, redo])

  const selected = elements.find((el) => el.id === selectedId)

  const updateSelected = useCallback((updates: Partial<DesignElement>) => {
    if (!selectedId) return
    setElements((els) => {
      const next = els.map((el) => el.id === selectedId ? { ...el, ...updates } : el)
      pushHistory(next)
      return next
    })
  }, [selectedId, pushHistory])

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'design.png'
    a.click()
  }, [])

  const tools: { tool: Tool; icon: typeof Square; label: string }[] = [
    { tool: 'select', icon: MousePointer, label: 'Select' },
    { tool: 'rect', icon: Square, label: 'Rectangle' },
    { tool: 'circle', icon: Circle, label: 'Circle' },
    { tool: 'triangle', icon: Triangle, label: 'Triangle' },
    { tool: 'star', icon: Star, label: 'Star' },
    { tool: 'line', icon: Minus, label: 'Line' },
    { tool: 'text', icon: Type, label: 'Text' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[var(--color-border)] bg-[var(--color-bg)] overflow-x-auto flex-wrap">
        {tools.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors',
              activeTool === tool
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
            )}
            title={label}
          >
            <Icon size={14} /> {label}
          </button>
        ))}

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <button onClick={undo} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Undo (Ctrl+Z)">
          <Undo2 size={14} />
        </button>
        <button onClick={redo} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={14} />
        </button>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <button onClick={() => setScale((s) => Math.min(s + 0.1, 3))} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Zoom in">
          <ZoomIn size={14} />
        </button>
        <span className="text-xs text-[var(--color-text-tertiary)] w-10 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.max(s - 0.1, 0.25))} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Zoom out">
          <ZoomOut size={14} />
        </button>
        <button onClick={() => setScale(1)} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Reset zoom">
          <Maximize2 size={14} />
        </button>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <button onClick={exportPNG} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Export PNG">
          <Download size={14} /> Export
        </button>

        {selectedId && (
          <button
            onClick={() => {
              setElements((els) => {
                const next = els.filter((el) => el.id !== selectedId)
                pushHistory(next)
                return next
              })
              setSelectedId(null)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-red-50 text-red-500 cursor-pointer"
            title="Delete"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-[var(--color-bg-secondary)] flex items-center justify-center p-8">
          <canvas
            ref={canvasRef}
            className="shadow-lg cursor-crosshair"
            style={{ cursor: activeTool === 'select' ? (dragOffset ? 'grabbing' : 'default') : 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Properties panel */}
        {selected && (
          <div className="w-52 border-l border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col">
            <div className="px-2 py-1 text-xs text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
              Properties
            </div>
            <div className="p-2 space-y-3 overflow-y-auto flex-1">
              {/* Position */}
              <div>
                <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase mb-1 block">Position</label>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">X</span>
                    <input
                      type="number"
                      value={Math.round(selected.x)}
                      onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                      className="w-full text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1.5 py-1 text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">Y</span>
                    <input
                      type="number"
                      value={Math.round(selected.y)}
                      onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                      className="w-full text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1.5 py-1 text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase mb-1 block">Size</label>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">W</span>
                    <input
                      type="number"
                      value={Math.round(selected.width)}
                      onChange={(e) => updateSelected({ width: Number(e.target.value) })}
                      className="w-full text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1.5 py-1 text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">H</span>
                    <input
                      type="number"
                      value={Math.round(selected.height)}
                      onChange={(e) => updateSelected({ height: Number(e.target.value) })}
                      className="w-full text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1.5 py-1 text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase mb-1 block">Colors</label>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--color-text-tertiary)] w-8">Fill</span>
                    <input
                      type="color"
                      value={selected.fill === 'transparent' ? '#ffffff' : selected.fill}
                      onChange={(e) => updateSelected({ fill: e.target.value })}
                      className="w-6 h-6 rounded border border-[var(--color-border)] cursor-pointer"
                    />
                    <button
                      onClick={() => updateSelected({ fill: 'transparent' })}
                      className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] cursor-pointer"
                    >
                      none
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--color-text-tertiary)] w-8">Stroke</span>
                    <input
                      type="color"
                      value={selected.stroke}
                      onChange={(e) => updateSelected({ stroke: e.target.value })}
                      className="w-6 h-6 rounded border border-[var(--color-border)] cursor-pointer"
                    />
                    <input
                      type="number"
                      value={selected.strokeWidth}
                      onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) })}
                      className="w-12 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1 py-0.5 text-[var(--color-text)] focus:outline-none"
                      min={0}
                      max={20}
                    />
                  </div>
                </div>
              </div>

              {/* Text props */}
              {selected.type === 'text' && (
                <div>
                  <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase mb-1 block">Text</label>
                  <input
                    value={selected.text || ''}
                    onChange={(e) => updateSelected({ text: e.target.value })}
                    className="w-full text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1.5 py-1 text-[var(--color-text)] focus:outline-none mb-1"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">Size</span>
                      <input
                        type="number"
                        value={selected.fontSize || 24}
                        onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                        className="w-full text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1.5 py-1 text-[var(--color-text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">Weight</span>
                      <select
                        value={selected.fontWeight || '400'}
                        onChange={(e) => updateSelected({ fontWeight: e.target.value })}
                        className="w-full text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1 py-1 text-[var(--color-text)] focus:outline-none"
                      >
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="600">Semi</option>
                        <option value="700">Bold</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Opacity & Rotation */}
              <div>
                <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase mb-1 block">Transform</label>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--color-text-tertiary)] w-12">Opacity</span>
                    <input
                      type="range"
                      value={selected.opacity}
                      onChange={(e) => updateSelected({ opacity: Number(e.target.value) })}
                      min={0} max={1} step={0.05}
                      className="flex-1"
                    />
                    <span className="text-[10px] text-[var(--color-text-tertiary)] w-8 text-right">{Math.round(selected.opacity * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--color-text-tertiary)] w-12">Rotate</span>
                    <input
                      type="range"
                      value={selected.rotation}
                      onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
                      min={0} max={360} step={1}
                      className="flex-1"
                    />
                    <span className="text-[10px] text-[var(--color-text-tertiary)] w-8 text-right">{Math.round(selected.rotation)}&deg;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layers panel (when nothing selected) */}
        {!selected && elements.length > 0 && (
          <div className="w-44 border-l border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col">
            <div className="px-2 py-1 text-xs text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
              Layers ({elements.length})
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {[...elements].reverse().map((el) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--color-bg-hover)] cursor-pointer text-[var(--color-text-secondary)]"
                >
                  <span
                    className="w-3 h-3 rounded-sm border border-[var(--color-border)]"
                    style={{ background: el.fill === 'transparent' ? '#ffffff' : el.fill }}
                  />
                  <span className="truncate flex-1">{el.type} {el.text || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
