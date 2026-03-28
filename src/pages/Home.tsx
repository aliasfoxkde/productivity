import { useNavigate, useLocation } from 'react-router-dom'
import { APPS } from '@/lib/constants'
import { useDocumentStore } from '@/stores/documents'
import { useUIStore } from '@/stores/ui'
import { APP_MAP } from '@/lib/constants'

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)

export function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const createDocument = useDocumentStore((s) => s.createDocument)
  const documents = useDocumentStore((s) => s.documents)

  const handleOpenApp = (type: string, route: string) => {
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

  // Show recent documents (last 5, excluding those on current page)
  const recentDocs = documents
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

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
        {APPS.map((app) => {
          const isActive = location.pathname === app.route
          return (
            <button
              key={app.id}
              onClick={() => handleOpenApp(app.type, app.route)}
              disabled={isActive}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-default"
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
          )
        })}
      </div>

      {/* Recent documents */}
      {recentDocs.length > 0 && (
        <div className="mt-10 max-w-lg w-full">
          <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3 px-1">
            Recent
          </h2>
          <div className="space-y-1">
            {recentDocs.map((doc) => {
              const app = APP_MAP.get(doc.type === 'doc' ? 'docs' : doc.type === 'sheet' ? 'sheets' : doc.type === 'note' ? 'notepad' : '')
              return (
                <button
                  key={doc.id}
                  onClick={() => app && navigate(app.route)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: app?.color ?? '#666' }}
                  >
                    {app?.name.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--color-text)] truncate">{doc.title}</div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {app?.name ?? doc.type}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-8 text-xs text-[var(--color-text-tertiary)]">
        Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] font-mono text-[10px]">{isMac ? '⌘' : 'Ctrl+'}K</kbd> to search
      </div>
    </div>
  )
}
