import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/ui'
import { APPS } from '@/lib/constants'
import {
  PanelLeftClose,
  Search,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)

  if (!sidebarOpen) return null

  return (
    <aside className="flex flex-col h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] select-none glass-panel" role="navigation" aria-label="Main navigation">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)] tracking-tight">
          Productivity Suite
        </span>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
          aria-label="Close sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
          aria-label="Open search"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[10px]">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Apps */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider px-2 py-1.5">
          Apps
        </div>
        {APPS.map((app) => {
          const isActive = location.pathname === app.route || location.pathname.startsWith(app.route + '/')
          return (
            <button
              key={app.id}
              onClick={() => navigate(app.route)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
                isActive
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium border-l-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] border-l-2 border-transparent',
              )}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: app.color }}
              >
                {app.name.charAt(0)}
              </div>
              <span>{app.name}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-[var(--color-border)]">
        <button
          onClick={() => navigate('/settings')}
          aria-current={location.pathname === '/settings' ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
            location.pathname === '/settings'
              ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium border-l-2 border-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] border-l-2 border-transparent',
          )}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
