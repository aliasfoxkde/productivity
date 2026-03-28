import { create } from 'zustand'
import type { TabState } from '@/types'

const TABS_KEY = 'ui-tabs'
const SIDEBAR_KEY = 'ui-sidebar-open'

function loadTabs(): { tabs: TabState[]; activeTabId: string | null } {
  try {
    const raw = localStorage.getItem(TABS_KEY)
    if (!raw) return { tabs: [], activeTabId: null }
    const data = JSON.parse(raw)
    if (!Array.isArray(data.tabs)) return { tabs: [], activeTabId: null }
    return {
      tabs: data.tabs.map((t: TabState) => ({ ...t, isActive: t.documentId === data.activeTabId })),
      activeTabId: data.activeTabId ?? null,
    }
  } catch {
    return { tabs: [], activeTabId: null }
  }
}

function persistTabs(tabs: TabState[], activeTabId: string | null) {
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify({ tabs, activeTabId }))
  } catch { /* localStorage unavailable */ }
}

function loadSidebar(): boolean {
  try {
    const val = localStorage.getItem(SIDEBAR_KEY)
    if (val !== null) return val === 'true'
    return window.innerWidth >= 768
  } catch {
    return window.innerWidth >= 768
  }
}

interface UIState {
  sidebarOpen: boolean
  sidebarWidth: number
  commandPaletteOpen: boolean
  tabs: TabState[]
  activeTabId: string | null

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

const initial = loadTabs()

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: loadSidebar(),
  sidebarWidth: 260,
  commandPaletteOpen: false,
  tabs: initial.tabs,
  activeTabId: initial.activeTabId,

  toggleSidebar: () => set((s) => {
    const next = !s.sidebarOpen
    try { localStorage.setItem(SIDEBAR_KEY, String(next)) } catch { /* */ }
    return { sidebarOpen: next }
  }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  openTab: (tab) =>
    set((s) => {
      const exists = s.tabs.find((t) => t.documentId === tab.documentId)
      if (exists) {
        const result = {
          activeTabId: tab.documentId,
          tabs: s.tabs.map((t) =>
            t.documentId === tab.documentId ? { ...t, isActive: true } : { ...t, isActive: false },
          ),
        }
        persistTabs(result.tabs, result.activeTabId)
        return result
      }
      const newTab = { ...tab, isActive: true }
      const result = {
        tabs: [...s.tabs.map((t) => ({ ...t, isActive: false })), newTab],
        activeTabId: tab.documentId,
      }
      persistTabs(result.tabs, result.activeTabId)
      return result
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
      persistTabs(newTabs, newActive)
      return { tabs: newTabs, activeTabId: newActive }
    }),

  setActiveTab: (documentId) =>
    set((s) => {
      const result = {
        activeTabId: documentId,
        tabs: s.tabs.map((t) => ({
          ...t,
          isActive: t.documentId === documentId,
        })),
      }
      persistTabs(result.tabs, result.activeTabId)
      return result
    }),

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
