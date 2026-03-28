import { useState, useRef, useEffect } from 'react'
import {
  PanelLeft,
  Moon,
  Sun,
  Search,
  Monitor,
  Sparkles,
  Zap,
  Layers,
  Terminal,
  ChevronDown,
  X,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'
import { THEME_PRESETS } from '@/lib/themes'
import type { ThemePresetId } from '@/types'
import { cn } from '@/lib/utils'

const PRESET_ICONS: Record<ThemePresetId, typeof Sparkles> = {
  'modern-saas': Sparkles,
  'bold-vibrant': Zap,
  'glass-blur': Layers,
  'dark-pro': Terminal,
}

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const tabs = useUIStore((s) => s.tabs)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const closeTab = useUIStore((s) => s.closeTab)
  const preference = useThemeStore((s) => s.preference)
  const resolved = useThemeStore((s) => s.resolved)
  const setPreset = useThemeStore((s) => s.setPreset)

  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!themeMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [themeMenuOpen])

  const themeIcon =
    preference.preset === 'system'
      ? <Monitor size={14} />
      : (() => { const I = PRESET_ICONS[preference.preset as ThemePresetId]; return I ? <I size={14} /> : <Moon size={14} /> })()

  return (
    <header className="flex items-center h-12 px-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] select-none gap-1 glass-panel">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={16} />
      </button>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto min-w-0 mx-1" role="tablist">
        {tabs.length === 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)] px-2">
            No open documents
          </span>
        )}
        {tabs.map((tab) => (
          <div
            key={tab.documentId}
            role="tab"
            aria-selected={tab.isActive}
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
              aria-label={`Close ${tab.title}`}
              className="p-0.5 rounded hover:bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)] cursor-pointer"
            >
              <X size={12} />
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

        {/* Theme picker */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer flex items-center gap-1"
            aria-label="Theme"
          >
            {themeIcon}
            <ChevronDown size={10} />
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 min-w-[200px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-lg)] z-50">
              {/* System */}
              <button
                onClick={() => { setPreset('system'); setThemeMenuOpen(false) }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer transition-colors text-left',
                  preference.preset === 'system' ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]',
                )}
              >
                <Monitor size={14} />
                System
              </button>

              <div className="h-px bg-[var(--color-border)] mx-2 my-1" />

              {/* Presets */}
              {(['modern-saas', 'bold-vibrant', 'glass-blur', 'dark-pro'] as const).map((presetId) => {
                const preset = THEME_PRESETS[presetId]
                const Icon = PRESET_ICONS[presetId]
                const isActive = preference.preset === presetId
                return (
                  <button
                    key={presetId}
                    onClick={() => { setPreset(presetId); setThemeMenuOpen(false) }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer transition-colors text-left',
                      isActive ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]',
                    )}
                  >
                    <div className="flex gap-0.5">
                      <div className="w-3 h-3 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: preset.dark.colors.bg }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.dark.colors.accent }} />
                    </div>
                    <Icon size={14} />
                    {preset.label}
                  </button>
                )
              })}

              <div className="h-px bg-[var(--color-border)] mx-2 my-1" />

              {/* Light/Dark toggle */}
              <button
                onClick={() => {
                  useThemeStore.getState().setMode(resolved.mode === 'dark' ? 'light' : 'dark')
                  setThemeMenuOpen(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer transition-colors text-left text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
              >
                {resolved.mode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                {resolved.mode === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
