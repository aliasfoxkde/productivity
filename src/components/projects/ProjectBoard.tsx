import { useState, useCallback } from 'react'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Kanban,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  dueDate: string
  createdAt: string
}

interface Column {
  id: string
  title: string
  color: string
  taskIds: string[]
}

type ViewMode = 'kanban' | 'list' | 'grid'

// Default data
const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Design system setup', description: 'Create design tokens and component library', status: 'todo', priority: 'high', tags: ['design', 'foundation'], dueDate: '', createdAt: new Date().toISOString() },
  { id: '2', title: 'User authentication', description: 'Implement OAuth and session management', status: 'in-progress', priority: 'urgent', tags: ['backend', 'security'], dueDate: '', createdAt: new Date().toISOString() },
  { id: '3', title: 'Dashboard layout', description: 'Build responsive dashboard with widgets', status: 'in-progress', priority: 'medium', tags: ['frontend', 'ui'], dueDate: '', createdAt: new Date().toISOString() },
  { id: '4', title: 'API documentation', description: 'Document all REST endpoints', status: 'todo', priority: 'low', tags: ['docs'], dueDate: '', createdAt: new Date().toISOString() },
  { id: '5', title: 'Database schema', description: 'Design and migrate database tables', status: 'done', priority: 'high', tags: ['backend', 'database'], dueDate: '', createdAt: new Date().toISOString() },
  { id: '6', title: 'Unit tests', description: 'Add tests for core modules', status: 'todo', priority: 'medium', tags: ['testing'], dueDate: '', createdAt: new Date().toISOString() },
  { id: '7', title: 'CI/CD pipeline', description: 'Set up automated build and deploy', status: 'review', priority: 'high', tags: ['devops'], dueDate: '', createdAt: new Date().toISOString() },
  { id: '8', title: 'Error handling', description: 'Global error boundary and logging', status: 'done', priority: 'medium', tags: ['frontend'], dueDate: '', createdAt: new Date().toISOString() },
]

const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', color: '#636366', taskIds: ['1', '4', '6'] },
  { id: 'in-progress', title: 'In Progress', color: '#0071e3', taskIds: ['2', '3'] },
  { id: 'review', title: 'Review', color: '#ff9f0a', taskIds: ['7'] },
  { id: 'done', title: 'Done', color: '#30d158', taskIds: ['5', '8'] },
]

const priorityColors: Record<string, string> = {
  low: '#636366',
  medium: '#0071e3',
  high: '#ff9f0a',
  urgent: '#ff3b30',
}

const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
  urgent: 'Urgent',
}

const TAG_COLORS = ['#0071e3', '#30d158', '#ff9f0a', '#ff3b30', '#bf5af2', '#64d2ff', '#ff6482', '#ffd60a']

function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

// Components
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:shadow-sm cursor-pointer transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[var(--color-text)] leading-tight">{task.title}</h4>
        <span
          className="shrink-0 w-2 h-2 rounded-full mt-1"
          style={{ background: priorityColors[task.priority] }}
          title={priorityLabels[task.priority]}
        />
      </div>
      {task.description && (
        <p className="text-xs text-[var(--color-text-tertiary)] mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-1 flex-wrap">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ background: getTagColor(tag) + '20', color: getTagColor(tag) }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
    >
      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ background: priorityColors[task.priority] }}
        title={priorityLabels[task.priority]}
      />
      <span className="flex-1 text-sm text-[var(--color-text)] truncate">{task.title}</span>
      <span className="text-xs text-[var(--color-text-tertiary)] capitalize px-2 py-0.5 rounded bg-[var(--color-bg-secondary)]">
        {task.status.replace('-', ' ')}
      </span>
      <div className="flex items-center gap-1">
        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: getTagColor(tag) + '20', color: getTagColor(tag) }}
          >
            {tag}
          </span>
        ))}
        {task.tags.length > 2 && (
          <span className="text-[10px] text-[var(--color-text-tertiary)]">+{task.tags.length - 2}</span>
        )}
      </div>
    </div>
  )
}

function TaskGrid({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:shadow-sm cursor-pointer transition-shadow"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: priorityColors[task.priority] }}
        />
        <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded" style={{ background: priorityColors[task.priority] + '20', color: priorityColors[task.priority] }}>
          {priorityLabels[task.priority]}
        </span>
      </div>
      <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">{task.title}</h4>
      <p className="text-xs text-[var(--color-text-tertiary)] mb-3 line-clamp-2">{task.description}</p>
      <div className="flex items-center gap-1 flex-wrap">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: getTagColor(tag) + '20', color: getTagColor(tag) }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function TaskDetail({ task, onClose, onSave, onDelete }: {
  task: Task
  onClose: () => void
  onSave: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState(task.priority)
  const [status, setStatus] = useState(task.status)
  const [tagInput, setTagInput] = useState('')

  const handleSave = () => {
    onSave({ ...task, title, description, priority, status })
    onClose()
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !task.tags.includes(tag)) {
      onSave({ ...task, tags: [...task.tags, tag] })
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    onSave({ ...task, tags: task.tags.filter((t) => t !== tag) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--color-bg)] rounded-xl shadow-xl border border-[var(--color-border)] mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-medium text-[var(--color-text)]">Edit Task</h3>
          <button onClick={onClose} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] cursor-pointer">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-medium bg-transparent border-b border-[var(--color-border)] pb-2 text-[var(--color-text)] focus:outline-none focus:border-blue-500"
            placeholder="Task title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 resize-none text-[var(--color-text)] focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Description"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text)] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text)] focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1 mb-1">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-xs cursor-pointer"
                  style={{ background: getTagColor(tag) + '20', color: getTagColor(tag) }}
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} &times;
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)] focus:outline-none"
                placeholder="Add tag..."
              />
              <button onClick={handleAddTag} className="px-2 py-1 text-xs bg-[var(--color-bg-hover)] rounded hover:bg-[var(--color-border)] cursor-pointer">Add</button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => onDelete(task.id)}
            className="text-xs text-red-500 hover:text-red-400 cursor-pointer"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSave} className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProjectBoard() {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS)
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.tags.some((tag) => tag.includes(searchQuery.toLowerCase()))) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    return true
  })

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  const addTask = useCallback((columnId: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: 'New task',
      description: '',
      status: columnId,
      priority: 'medium',
      tags: [],
      dueDate: '',
      createdAt: new Date().toISOString(),
    }
    setTasks((t) => [...t, newTask])
    setColumns((c) => c.map((col) =>
      col.id === columnId ? { ...col, taskIds: [...col.taskIds, newTask.id] } : col
    ))
    setSelectedTaskId(newTask.id)
  }, [])

  const updateTask = useCallback((updated: Task) => {
    setTasks((t) => t.map((task) => task.id === updated.id ? updated : task))
    // If status changed, move between columns
    if (updated.status !== selectedTask?.status) {
      setColumns((cols) =>
        cols.map((col) => ({
          ...col,
          taskIds: col.taskIds.filter((id) => id !== updated.id),
        })).map((col) =>
          col.id === updated.status
            ? { ...col, taskIds: [...col.taskIds, updated.id] }
            : col
        )
      )
    }
  }, [selectedTask])

  const deleteTask = useCallback((id: string) => {
    setTasks((t) => t.filter((task) => task.id !== id))
    setColumns((cols) => cols.map((col) => ({
      ...col,
      taskIds: col.taskIds.filter((tid) => tid !== id),
    })))
    setSelectedTaskId(null)
  }, [])

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
          <Search size={12} className="text-[var(--color-text-tertiary)]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-[var(--color-text)] outline-none w-32 placeholder:text-[var(--color-text-tertiary)]"
            placeholder="Search tasks..."
          />
        </div>

        {/* Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-1.5 py-1 text-[var(--color-text)] focus:outline-none"
        >
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="flex-1" />

        {/* Stats */}
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {stats.done}/{stats.total} done
        </span>

        {/* View mode */}
        <div className="flex items-center border border-[var(--color-border)] rounded-md overflow-hidden">
          {([
            { mode: 'kanban' as ViewMode, icon: Kanban, label: 'Board' },
            { mode: 'list' as ViewMode, icon: List, label: 'List' },
            { mode: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'p-1 cursor-pointer transition-colors',
                viewMode === mode
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]',
              )}
              title={label}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'kanban' && (
          <div className="flex h-full gap-3 p-3">
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter((t) => column.taskIds.includes(t.id))
              return (
                <div key={column.id} className="flex flex-col w-72 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: column.color }} />
                    <h3 className="text-xs font-semibold text-[var(--color-text)]">{column.title}</h3>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                    <button
                      onClick={() => addTask(column.id)}
                      className="ml-auto p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                    {columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="text-xs text-[var(--color-text-tertiary)] text-center py-4">No tasks</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="p-3">
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)]">
              {filteredTasks.map((task) => (
                <TaskRow key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} />
              ))}
              {filteredTasks.length === 0 && (
                <div className="text-xs text-[var(--color-text-tertiary)] text-center py-8">No tasks found</div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="p-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredTasks.map((task) => (
              <TaskGrid key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} />
            ))}
            {filteredTasks.length === 0 && (
              <div className="col-span-full text-xs text-[var(--color-text-tertiary)] text-center py-8">No tasks found</div>
            )}
          </div>
        )}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onSave={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  )
}
