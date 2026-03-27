import { useEffect } from 'react'
import { useUIStore } from '@/stores/ui'

/** Register global keyboard shortcuts */
export function useKeyboardShortcuts() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+K — Command palette
      if (mod && e.key === 'k') {
        e.preventDefault()
        toggleCommandPalette()
      }

      // Cmd/Ctrl+B — Toggle sidebar
      if (mod && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleCommandPalette, toggleSidebar])
}
