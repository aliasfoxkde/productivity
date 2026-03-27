import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { APPS } from '@/lib/constants'
import { useNavigate } from 'react-router-dom'

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen)
  const close = useUIStore((s) => s.closeCommandPalette)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const handleClose = useCallback(() => {
    setQuery('')
    close()
  }, [close])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close, handleClose])

  if (!open) return null

  const filteredApps = APPS.filter(
    (app) =>
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.description.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, documents, commands..."
            className="flex-1 py-3 bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] rounded border border-[var(--color-border)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filteredApps.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-tertiary)]">
              No results found
            </div>
          ) : (
            filteredApps.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  navigate(app.route)
                  close()
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: app.color }}
                >
                  {app.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text)] truncate">
                    {app.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] truncate">
                    {app.description}
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
            <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">↑↓</kbd>
            navigate
            <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">↵</kbd>
            open
          </span>
        </div>
      </div>
    </div>
  )
}
