import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { APPS, APP_MAP } from '@/lib/constants'
import { useDocumentStore } from '@/stores/documents'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen)
  const close = useUIStore((s) => s.closeCommandPalette)
  const documents = useDocumentStore((s) => s.documents)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const handleClose = useCallback(() => {
    setQuery('')
    setSelectedIndex(0)
    close()
  }, [close])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleClose])

  const q = query.toLowerCase().trim()

  // Build results: apps + documents (memoized)
  const results = useMemo(() => {
    const appResults = q
      ? APPS.filter(
          (app) =>
            app.name.toLowerCase().includes(q) ||
            app.description.toLowerCase().includes(q),
        )
      : APPS

    const docResults = q
      ? documents
          .filter((d) =>
            d.title.toLowerCase().includes(q) ||
            d.tags.some((t) => t.toLowerCase().includes(q)) ||
            d.content.toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map((d) => {
            const app = d.type === 'doc' ? APP_MAP.get('docs')
              : d.type === 'sheet' ? APP_MAP.get('sheets')
              : d.type === 'note' ? APP_MAP.get('notepad')
              : null
            // Show content snippet if query matched content but not title
            const titleMatch = d.title.toLowerCase().includes(q)
            const snippet = !titleMatch && d.content
              ? d.content.replace(/<[^>]+>/g, '').slice(0, 60).trim()
              : undefined
            return {
              id: d.id,
              name: d.title,
              description: snippet
                ? `...${snippet}...`
                : `Document · ${app?.name ?? d.type}`,
              route: d.type === 'doc' ? `${app?.route ?? '/docs'}?doc=${d.id}` : app?.route ?? '/docs',
              color: app?.color ?? '#666',
              char: app?.name.charAt(0) ?? '?',
            }
          })
      : []

    return [
      ...appResults.map((app) => ({
        id: `app-${app.id}`,
        name: app.name,
        description: app.description,
        route: app.route,
        color: app.color,
        char: app.name.charAt(0),
      })),
      ...docResults,
    ]
  }, [q, documents])

  // Clamp selected index
  const currentIndex = results.length > 0 ? Math.min(selectedIndex, results.length - 1) : 0

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[currentIndex]) {
        navigate(results[currentIndex].route)
        handleClose()
      }
    },
    [results, currentIndex, navigate, handleClose],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
          <Search size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search apps, documents, commands..."
            className="flex-1 py-3 bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] rounded border border-[var(--color-border)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1" role="listbox">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-tertiary)]">
              No results found
            </div>
          ) : (
            results.map((item, index) => (
              <button
                key={item.id}
                role="option"
                aria-selected={index === currentIndex}
                onClick={() => {
                  navigate(item.route)
                  handleClose()
                }}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer',
                  index === currentIndex
                    ? 'bg-[var(--color-bg-hover)]'
                    : 'hover:bg-[var(--color-bg-hover)]',
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {item.char}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text)] truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-tertiary)]">
          <span>Productivity Suite</span>
          <span className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">&uarr;&darr;</kbd>
            navigate
            <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">&crarr;</kbd>
            open
          </span>
        </div>
      </div>
    </div>
  )
}
