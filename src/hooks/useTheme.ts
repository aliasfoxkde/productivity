import { useThemeStore } from '@/stores/theme'

/** Hook for accessing the current theme state and actions */
export function useTheme() {
  const preference = useThemeStore((s) => s.preference)
  const resolved = useThemeStore((s) => s.resolved)
  const setPreset = useThemeStore((s) => s.setPreset)
  const toggleMode = useThemeStore((s) => s.toggleMode)

  return { preference, resolved, setPreset, toggleMode }
}
