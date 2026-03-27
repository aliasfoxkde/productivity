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
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dbCount, STORES } from '@/lib/storage'
import type { StoreName } from '@/lib/storage'
import { useThemeStore } from '@/stores/theme'
import { THEME_PRESETS } from '@/lib/themes'
import type { ThemePresetId } from '@/types'

const SHORTCUTS = [
  { keys: ['Cmd', 'K'], description: 'Open command palette' },
  { keys: ['Cmd', 'B'], description: 'Toggle sidebar' },
  { keys: ['Cmd', 'S'], description: 'Save document' },
  { keys: ['Cmd', 'Z'], description: 'Undo' },
  { keys: ['Cmd', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Delete'], description: 'Delete selected' },
  { keys: ['Escape'], description: 'Close modal / deselect' },
]

const PRESET_ICONS: Record<ThemePresetId, typeof Sparkles> = {
  'modern-saas': Sparkles,
  'bold-vibrant': Zap,
  'glass-blur': Layers,
  'dark-pro': Terminal,
}

export function Settings() {
  const preference = useThemeStore((s) => s.preference)
  const resolved = useThemeStore((s) => s.resolved)
  const setPreset = useThemeStore((s) => s.setPreset)
  const resetPreset = useThemeStore((s) => s.resetPreset)
  const updateTokens = useThemeStore((s) => s.updateTokens)
  const [activeSection, setActiveSection] = useState<string>('appearance')
  const [showCustomize, setShowCustomize] = useState(false)
  const [storageInfo, setStorageInfo] = useState<Record<string, number>>({})

  const loadStorageInfo = async () => {
    const counts: Record<string, number> = {}
    for (const [key, storeName] of Object.entries(STORES)) {
      try {
        counts[key] = await dbCount(storeName as StoreName)
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
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">Choose a theme preset and customize colors.</p>

            {/* Preset grid */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Theme Preset</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* System card */}
                <button
                  onClick={() => setPreset('system')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                    preference.preset === 'system'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]',
                  )}
                >
                  <Monitor size={20} className={preference.preset === 'system' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'} />
                  <span className="text-xs font-medium text-[var(--color-text)]">System</span>
                </button>

                {(['modern-saas', 'bold-vibrant', 'glass-blur', 'dark-pro'] as const).map((presetId) => {
                  const preset = THEME_PRESETS[presetId]
                  const tokens = preset.dark.colors
                  const Icon = PRESET_ICONS[presetId]
                  const isActive = preference.preset === presetId
                  return (
                    <button
                      key={presetId}
                      onClick={() => setPreset(presetId)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                        isActive
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]',
                      )}
                    >
                      {/* Color swatch */}
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tokens.bg, border: `1px solid ${tokens.border}` }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tokens.accent }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tokens.text }} />
                      </div>
                      <Icon size={14} className={isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'} />
                      <span className="text-xs font-medium text-[var(--color-text)]">{preset.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active theme info */}
            <div className="mb-4 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-secondary)]">
              Active: <span className="text-[var(--color-text)] font-medium">{THEME_PRESETS[(preference.preset === 'system' ? 'modern-saas' : preference.preset) as ThemePresetId]?.label ?? 'System'}</span>
              {' '}({resolved.mode})
            </div>

            {/* Customize toggle */}
            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)] mb-3 cursor-pointer hover:text-[var(--color-accent)] transition-colors"
            >
              <Palette size={14} />
              {showCustomize ? 'Hide customization' : 'Customize colors...'}
            </button>

            {/* Color customization */}
            {showCustomize && (
              <div className="space-y-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">Accent Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={resolved.tokens.colors.accent}
                      onChange={(e) => updateTokens({ colors: { ...resolved.tokens.colors, accent: e.target.value } })}
                      className="w-8 h-6 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-[var(--color-text-tertiary)]">{resolved.tokens.colors.accent}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={resolved.tokens.colors.bg}
                      onChange={(e) => updateTokens({ colors: { ...resolved.tokens.colors, bg: e.target.value } })}
                      className="w-8 h-6 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-[var(--color-text-tertiary)]">{resolved.tokens.colors.bg}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">Surface</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={resolved.tokens.colors.bgSecondary}
                      onChange={(e) => updateTokens({ colors: { ...resolved.tokens.colors, bgSecondary: e.target.value } })}
                      className="w-8 h-6 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-[var(--color-text-tertiary)]">{resolved.tokens.colors.bgSecondary}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">Text</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={resolved.tokens.colors.text}
                      onChange={(e) => updateTokens({ colors: { ...resolved.tokens.colors, text: e.target.value } })}
                      className="w-8 h-6 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-[var(--color-text-tertiary)]">{resolved.tokens.colors.text}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">Border</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={resolved.tokens.colors.border}
                      onChange={(e) => updateTokens({ colors: { ...resolved.tokens.colors, border: e.target.value } })}
                      className="w-8 h-6 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-[var(--color-text-tertiary)]">{resolved.tokens.colors.border}</span>
                  </div>
                </div>
                <button
                  onClick={resetPreset}
                  className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
                >
                  <RotateCcw size={12} />
                  Reset to default
                </button>
              </div>
            )}

            {/* Light/Dark toggle */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Mode</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const { toggleMode } = useThemeStore.getState()
                    toggleMode()
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors',
                    resolved.mode === 'dark'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                      : 'border-[var(--color-border)]',
                  )}
                >
                  <Moon size={14} />
                  <span className="text-xs font-medium text-[var(--color-text)]">Dark</span>
                </button>
                <button
                  onClick={() => {
                    const { toggleMode } = useThemeStore.getState()
                    toggleMode()
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors',
                    resolved.mode === 'light'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                      : 'border-[var(--color-border)]',
                  )}
                >
                  <Sun size={14} />
                  <span className="text-xs font-medium text-[var(--color-text)]">Light</span>
                </button>
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
              {Object.entries(STORES).map(([key]) => (
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
