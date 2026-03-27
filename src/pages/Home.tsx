import { useNavigate } from 'react-router-dom'
import { APPS } from '@/lib/constants'
import { useDocumentStore } from '@/stores/documents'
import { useUIStore } from '@/stores/ui'

export function Home() {
  const navigate = useNavigate()
  const createDocument = useDocumentStore((s) => s.createDocument)

  const handleOpenApp = (_appId: string, type: string, route: string) => {
    const doc = createDocument(type as 'doc')
    useUIStore.getState().openTab({
      documentId: doc.id,
      type: type as 'doc',
      title: doc.title,
      isActive: true,
      isDirty: false,
    })
    navigate(route)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          Productivity Suite
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Create something new, or pick up where you left off
        </p>
      </div>

      {/* App grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg w-full">
        {APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => handleOpenApp(app.id, app.type, app.route)}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-transform group-hover:scale-110"
              style={{ backgroundColor: app.color }}
            >
              {app.name.charAt(0)}
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--color-text)]">
                {app.name}
              </div>
              <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">
                New {app.name.toLowerCase().replace(/s$/, '')}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="mt-8 text-xs text-[var(--color-text-tertiary)]">
        Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] font-mono text-[10px]">⌘K</kbd> to search
      </div>
    </div>
  )
}
