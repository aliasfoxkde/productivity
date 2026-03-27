import { useState } from 'react'
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Keyboard,
  Info,
  Trash2,
  Database,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import { dbCount, STORES } from '@/lib/storage'

const SHORTCUTS = [
  { keys: ['Cmd', 'K'], description: 'Open command palette' },
  { keys: ['Cmd', 'B'], description: 'Toggle sidebar' },
  { keys: ['Cmd', 'S'], description: 'Save document' },
  { keys: ['Cmd', 'Z'], description: 'Undo' },
  { keys: ['Cmd', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Delete'], description: 'Delete selected' },
  { keys: ['Escape'], description: 'Close modal / deselect' },
]

export function Settings() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const [activeSection, setActiveSection] = useState<string>('appearance')
  const [storageInfo, setStorageInfo] = useState<Record<string, number>>({})

  const loadStorageInfo = async () => {
    const counts: Record<string, number> = {}
    for (const [key, storeName] of Object.entries(STORES)) {
      try {
        counts[key] = await dbCount(storeName as any)
      } catch {
        counts[key] = 0
      }
    }
    setStorageInfo(counts)
  }

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ]

  return (
    <div className="flex h-full">
      {/* Section nav */}
      <div className="w-48 border-r border-[var(--color-border)] bg-[var(--color-bg)] p-2">
        <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase px-2 mb-2">Settings</h3>
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveSection(id)
              if (id === 'storage') loadStorageInfo()
            }}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors',
              activeSection === id
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeSection === 'appearance' && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Appearance</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">Customize how the suite looks and feels.</p>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Theme</h3>
              <div className="flex gap-3">
                {([
                  { value: 'light' as const, label: 'Light', icon: Sun },
                  { value: 'dark' as const, label: 'Dark', icon: Moon },
                  { value: 'system' as const, label: 'System', icon: Monitor },
                ]).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 w-28 cursor-pointer transition-colors',
                      theme === value
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]',
                    )}
                  >
                    <Icon size={20} className={theme === value ? 'text-blue-500' : 'text-[var(--color-text-secondary)]'} />
                    <span className={cn('text-xs font-medium', theme === value ? 'text-blue-500' : 'text-[var(--color-text)]')}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'shortcuts' && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Keyboard Shortcuts</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">Quick access to common actions.</p>

            <div className="space-y-1">
              {SHORTCUTS.map(({ keys, description }) => (
                <div key={description} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-bg-hover)]">
                  <span className="text-sm text-[var(--color-text)]">{description}</span>
                  <div className="flex gap-1">
                    {keys.map((key, i) => (
                      <span key={i}>
                        <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-secondary)]">
                          {key}
                        </kbd>
                        {i < keys.length - 1 && <span className="mx-0.5 text-[var(--color-text-tertiary)]">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'storage' && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Storage</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">Local storage used by the application.</p>

            <div className="space-y-2 mb-6">
              {Object.entries(STORES).map(([key, storeName]) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-bg-secondary)]">
                  <span className="text-sm text-[var(--color-text)] capitalize">{key}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {storageInfo[key] ?? '...'} items
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                if (confirm('Clear all local data? This cannot be undone.')) {
                  const { dbClear } = await import('@/lib/storage')
                  for (const storeName of Object.values(STORES)) {
                    await dbClear(storeName)
                  }
                  loadStorageInfo()
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 border border-red-200 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 size={14} />
              Clear All Data
            </button>
          </div>
        )}

        {activeSection === 'about' && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">About</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">Productivity Suite — open-source office suite for the web.</p>

            <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between py-1">
                <span>Version</span>
                <span className="text-[var(--color-text)] font-mono text-xs">0.1.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Framework</span>
                <span className="text-[var(--color-text)]">React 19 + Vite 8</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Language</span>
                <span className="text-[var(--color-text)]">TypeScript 5.9</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Styling</span>
                <span className="text-[var(--color-text)]">Tailwind CSS 4</span>
              </div>
              <div className="flex justify-between py-1">
                <span>State</span>
                <span className="text-[var(--color-text)]">Zustand</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Hosting</span>
                <span className="text-[var(--color-text)]">Cloudflare Pages</span>
              </div>
              <div className="flex justify-between py-1">
                <span>License</span>
                <span className="text-[var(--color-text)]">MIT</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
