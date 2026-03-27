import { useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useNodesInitialized,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Square,
  Diamond,
  MessageSquare,
  Database,
  Globe,
  Plus,
  Trash2,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nodeTypeKeys = ['process', 'decision', 'terminal', 'data', 'io'] as const
type NodeTypeKey = (typeof nodeTypeKeys)[number]

const shapeColors: Record<NodeTypeKey, string> = {
  process: '#0071e3',
  decision: '#ff9f0a',
  terminal: '#30d158',
  data: '#64d2ff',
  io: '#bf5af2',
}

function getIconForType(type: string) {
  const icons: Record<string, React.ReactNode> = {
    process: <Square size={14} />,
    decision: <Diamond size={14} />,
    terminal: <MessageSquare size={14} />,
    data: <Database size={14} />,
    io: <Globe size={14} />,
  }
  return icons[type] || <Square size={14} />
}

function CustomNode({ data, type }: { data: { label: string }; type: string }) {
  const color = shapeColors[type as NodeTypeKey] || '#0071e3'
  return (
    <div
      className={cn(
        'px-4 py-2 rounded-lg border-2 shadow-sm min-w-[120px] text-center',
        'bg-[var(--color-bg)] border-[var(--color-border)]',
      )}
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-2 justify-center text-xs font-medium text-[var(--color-text)]">
        <span style={{ color }}>{getIconForType(type)}</span>
        <span>{data.label}</span>
      </div>
    </div>
  )
}

const nodeTypesMap = {
  process: CustomNode,
  decision: CustomNode,
  terminal: CustomNode,
  data: CustomNode,
  io: CustomNode,
}

const defaultNodes: Node[] = [
  { id: '1', type: 'process', position: { x: 250, y: 0 }, data: { label: 'Start' } },
  { id: '2', type: 'process', position: { x: 250, y: 100 }, data: { label: 'Step 1' } },
  { id: '3', type: 'process', position: { x: 250, y: 200 }, data: { label: 'Step 2' } },
  { id: '4', type: 'process', position: { x: 250, y: 300 }, data: { label: 'End' } },
]

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
]

const defaultEdgeOptions = {
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { stroke: '#636366', strokeWidth: 2 },
}

const templates = [
  {
    name: 'Blank',
    nodes: [] as Node[],
    edges: [] as Edge[],
  },
  {
    name: 'Flowchart',
    nodes: defaultNodes,
    edges: defaultEdges,
  },
  {
    name: 'Decision',
    nodes: [
      { id: '1', type: 'process', position: { x: 200, y: 0 }, data: { label: 'Start' } },
      { id: '2', type: 'decision', position: { x: 170, y: 100 }, data: { label: 'Yes/No?' } },
      { id: '3', type: 'process', position: { x: 0, y: 220 }, data: { label: 'Yes Path' } },
      { id: '4', type: 'process', position: { x: 340, y: 220 }, data: { label: 'No Path' } },
    ] as Node[],
    edges: [
      { id: 'e1-2', source: '1', target: '2', ...defaultEdgeOptions },
      { id: 'e2-3', source: '2', target: '3', label: 'Yes', ...defaultEdgeOptions },
      { id: 'e2-4', source: '2', target: '4', label: 'No', ...defaultEdgeOptions },
    ] as Edge[],
  },
]

interface DiagramEditorProps {
  onInit?: boolean
}

export function DiagramEditor({ onInit = false }: DiagramEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(onInit ? defaultNodes : [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(onInit ? defaultEdges : [])
  const nodesInitialized = useNodesInitialized(nodes)

  const onConnect = useCallback(
    (params: Parameters<typeof addEdge>[0]) =>
      setEdges((eds) => addEdge({ ...defaultEdgeOptions, ...params }, eds)),
    [setEdges],
  )

  const addNode = useCallback(
    (type: string = 'process') => {
      const id = Date.now().toString()
      const newNode: Node = {
        id,
        type,
        position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
        data: { label: `New ${type}` },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes],
  )

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const loadTemplate = useCallback(
    (template: (typeof templates)[number]) => {
      setNodes(template.nodes.map((n) => ({ ...n, selected: false })))
      setEdges(template.edges.map((e) => ({ ...e, selected: false })))
    },
    [setNodes, setEdges],
  )

  const exportSVG = useCallback(() => {
    const svgEl = document.querySelector('.react-flow__viewport')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  if (!nodesInitialized) return null

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[var(--color-border)] bg-[var(--color-bg)] overflow-x-auto flex-wrap">
        {nodeTypeKeys.map((nt) => (
          <button
            key={nt}
            onClick={() => addNode(nt)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
          >
            <span style={{ color: shapeColors[nt] }}>{getIconForType(nt)}</span>
            <span className="text-[var(--color-text-secondary)] capitalize">{nt}</span>
          </button>
        ))}

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <button onClick={() => addNode()} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer">
          <Plus size={14} /> Add
        </button>
        <button onClick={deleteSelected} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer">
          <Trash2 size={14} /> Delete
        </button>
        <button onClick={exportSVG} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer">
          <Download size={14} /> SVG
        </button>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        {templates.map((t) => (
          <button
            key={t.name}
            onClick={() => loadTemplate(t)}
            className="px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypesMap}
          fitView
          snapToGrid
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}
            nodeStrokeWidth={2}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
