import {
  PanelLeft,
  Moon,
  Sun,
  Monitor,
  Search,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import type { Theme } from '@/types'
import { cn } from '@/lib/utils'

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const tabs = useUIStore((s) => s.tabs)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const closeTab = useUIStore((s) => s.closeTab)

  const themeIcon =
    theme === 'dark' ? <Moon size={14} /> : theme === 'light' ? <Sun size={14} /> : <Monitor size={14} />

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const next = themes[(themes.indexOf(theme) + 1) % themes.length]
    setTheme(next)
  }

  return (
    <header className="flex items-center h-12 px-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] select-none gap-1">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={16} />
      </button>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto min-w-0 mx-1">
        {tabs.length === 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)] px-2">
            No open documents
          </span>
        )}
        {tabs.map((tab) => (
          <div
            key={tab.documentId}
            onClick={() => setActiveTab(tab.documentId)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors shrink-0 max-w-[180px]',
              tab.isActive
                ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
            )}
          >
            <span className="truncate">{tab.title}</span>
            {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.documentId)
              }}
              className="p-0.5 rounded hover:bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)] cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={toggleCommandPalette}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
          aria-label="Toggle theme"
        >
          {themeIcon}
        </button>
      </div>
    </header>
  )
}
