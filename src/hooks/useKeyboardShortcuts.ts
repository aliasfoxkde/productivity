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

      // Cmd/Ctrl+S — Save (dispatch custom event for pages to handle)
      if (mod && e.key === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('app:save'))
      }

      // Escape — Close modals/dialogs (dispatch custom event)
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('app:escape'))
      }

      // Cmd/Ctrl+N — New document (dispatch custom event)
      if (mod && e.key === 'n') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('app:new'))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleCommandPalette, toggleSidebar])
}
