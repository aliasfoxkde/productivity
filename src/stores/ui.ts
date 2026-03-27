import { create } from 'zustand'
import type { Theme, TabState } from '@/types'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  sidebarWidth: number
  commandPaletteOpen: boolean
  tabs: TabState[]
  activeTabId: string | null

  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
  openTab: (tab: TabState) => void
  closeTab: (documentId: string) => void
  setActiveTab: (documentId: string) => void
  markTabDirty: (documentId: string, dirty: boolean) => void
  updateTabTitle: (documentId: string, title: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  sidebarWidth: 260,
  commandPaletteOpen: false,
  tabs: [],
  activeTabId: null,

  setTheme: (theme) => {
    set({ theme })
    const resolved = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme
    document.documentElement.setAttribute('data-theme', resolved)
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  openTab: (tab) =>
    set((s) => {
      const exists = s.tabs.find((t) => t.documentId === tab.documentId)
      if (exists) {
        return {
          activeTabId: tab.documentId,
          tabs: s.tabs.map((t) =>
            t.documentId === tab.documentId ? { ...t, isActive: true } : { ...t, isActive: false },
          ),
        }
      }
      const newTab = { ...tab, isActive: true }
      return {
        tabs: [...s.tabs.map((t) => ({ ...t, isActive: false })), newTab],
        activeTabId: tab.documentId,
      }
    }),

  closeTab: (documentId) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.documentId === documentId)
      const newTabs = s.tabs.filter((t) => t.documentId !== documentId)
      let newActive = s.activeTabId
      if (s.activeTabId === documentId) {
        if (newTabs.length > 0) {
          const nextIdx = Math.min(idx, newTabs.length - 1)
          newActive = newTabs[nextIdx].documentId
          newTabs[nextIdx] = { ...newTabs[nextIdx], isActive: true }
        } else {
          newActive = null
        }
      }
      return { tabs: newTabs, activeTabId: newActive }
    }),

  setActiveTab: (documentId) =>
    set((s) => ({
      activeTabId: documentId,
      tabs: s.tabs.map((t) => ({
        ...t,
        isActive: t.documentId === documentId,
      })),
    })),

  markTabDirty: (documentId, dirty) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.documentId === documentId ? { ...t, isDirty: dirty } : t,
      ),
    })),

  updateTabTitle: (documentId, title) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.documentId === documentId ? { ...t, title } : t,
      ),
    })),
}))
