import { create } from 'zustand'
import type { ThemePresetId, ThemePreference, ThemeTokens, ResolvedTheme } from '@/types'
import { getPresetTokens } from '@/lib/themes'
import { applyThemeToDOM } from '@/lib/applyTheme'

const STORAGE_KEY = 'theme-preference'
const LS_MODE_KEY = 'theme-mode'

function loadPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ThemePreference
  } catch { /* ignore */ }
  return { preset: 'system', overrides: {} }
}

function savePreference(pref: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pref))
}

function getSystemMode(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveMode(preset: ThemePresetId | 'system'): 'light' | 'dark' {
  if (preset === 'system') return getSystemMode()
  // Default to dark for all presets
  return 'dark'
}

function resolveTokens(
  preset: ThemePresetId | 'system',
  mode: 'light' | 'dark',
  overrides: Partial<Record<ThemePresetId, Partial<ThemeTokens>>>,
): ThemeTokens {
  const presetId = preset === 'system' ? 'modern-saas' : preset
  const base = getPresetTokens(presetId, mode)
  const userOverrides = overrides[presetId]
  if (!userOverrides) return base

  return {
    ...base,
    colors: { ...base.colors, ...userOverrides.colors },
    radius: { ...base.radius, ...userOverrides.radius },
    shadows: { ...base.shadows, ...userOverrides.shadows },
    glass: userOverrides.glass ?? base.glass,
  }
}

function saveModeForFlash(mode: 'light' | 'dark'): void {
  localStorage.setItem(LS_MODE_KEY, mode)
}

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreset: (preset: ThemePresetId | 'system') => void
  updateTokens: (tokens: Partial<ThemeTokens>) => void
  resetPreset: () => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const preference = loadPreference()
  const mode = resolveMode(preference.preset)
  const tokens = resolveTokens(preference.preset, mode, preference.overrides)
  const presetId = preference.preset === 'system' ? 'modern-saas' : preference.preset
  const resolved: ResolvedTheme = { presetId, mode, tokens }

  // Apply immediately on store creation
  applyThemeToDOM(resolved)

  return {
    preference,
    resolved,

    setPreset: (preset) => {
      const mode = resolveMode(preset)
      const tokens = resolveTokens(preset, mode, get().preference.overrides)
      const presetId = preset === 'system' ? 'modern-saas' : preset
      const newPref = { ...get().preference, preset }
      const newResolved: ResolvedTheme = { presetId, mode, tokens }
      savePreference(newPref)
      saveModeForFlash(mode)
      applyThemeToDOM(newResolved)
      set({ preference: newPref, resolved: newResolved })
    },

    updateTokens: (partialTokens) => {
      const { preference } = get()
      const currentPresetId = (preference.preset === 'system' ? 'modern-saas' : preference.preset) as ThemePresetId
      const newOverrides = {
        ...preference.overrides,
        [currentPresetId]: {
          ...preference.overrides[currentPresetId],
          ...partialTokens,
        },
      }
      const newPref = { ...preference, overrides: newOverrides }
      const mode = resolveMode(newPref.preset)
      const tokens = resolveTokens(newPref.preset, mode, newOverrides)
      const newResolved: ResolvedTheme = { presetId: currentPresetId, mode, tokens }
      savePreference(newPref)
      applyThemeToDOM(newResolved)
      set({ preference: newPref, resolved: newResolved })
    },

    resetPreset: () => {
      const { preference } = get()
      const currentPresetId = (preference.preset === 'system' ? 'modern-saas' : preference.preset) as ThemePresetId
      const { [currentPresetId]: _removed, ...remainingOverrides } = preference.overrides
      void _removed
      const newPref = { ...preference, overrides: remainingOverrides }
      const mode = resolveMode(newPref.preset)
      const tokens = resolveTokens(newPref.preset, mode, newPref.overrides)
      const newResolved: ResolvedTheme = { presetId: currentPresetId, mode, tokens }
      savePreference(newPref)
      applyThemeToDOM(newResolved)
      set({ preference: newPref, resolved: newResolved })
    },

    toggleMode: () => {
      const { resolved } = get()
      const newMode = resolved.mode === 'dark' ? 'light' : 'dark'
      const { preference } = get()
      const currentPresetId = (preference.preset === 'system' ? 'modern-saas' : preference.preset) as ThemePresetId
      const tokens = resolveTokens(currentPresetId, newMode, preference.overrides)
      const newResolved: ResolvedTheme = { ...resolved, mode: newMode, tokens }
      saveModeForFlash(newMode)
      applyThemeToDOM(newResolved)
      set({ resolved: newResolved })
    },
  }
})

/** Listen for system preference changes when set to 'system' */
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { preference } = useThemeStore.getState()
    if (preference.preset !== 'system') return
    useThemeStore.getState().setPreset('system')
  })
}
