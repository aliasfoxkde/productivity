import { create } from 'zustand'
import type { SuiteDocument, Workspace } from '@/types'
import { generateId } from '@/lib/utils'
import { DEFAULT_WORKSPACE_NAME } from '@/lib/constants'

interface DocumentState {
  documents: SuiteDocument[]
  workspaces: Workspace[]
  activeWorkspaceId: string

  /** Document CRUD */
  createDocument: (type: SuiteDocument['type'], title?: string) => SuiteDocument
  updateDocument: (id: string, updates: Partial<SuiteDocument>) => void
  deleteDocument: (id: string) => void
  getDocument: (id: string) => SuiteDocument | undefined

  /** Workspace management */
  createWorkspace: (name?: string) => Workspace
  setActiveWorkspace: (id: string) => void
  getWorkspace: (id: string) => Workspace | undefined

  /** Search */
  searchDocuments: (query: string) => SuiteDocument[]
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  workspaces: [],
  activeWorkspaceId: '',

  createDocument: (type, title) => {
    const { activeWorkspaceId } = get()
    const doc: SuiteDocument = {
      id: generateId(),
      type,
      title: title || `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      tags: [],
      workspaceId: activeWorkspaceId,
    }
    set((s) => ({ documents: [...s.documents, doc] }))
    return doc
  },

  updateDocument: (id, updates) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id
          ? { ...d, ...updates, updatedAt: new Date().toISOString(), version: d.version + 1 }
          : d,
      ),
    })),

  deleteDocument: (id) =>
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
    })),

  getDocument: (id) => get().documents.find((d) => d.id === id),

  createWorkspace: (name) => {
    const ws: Workspace = {
      id: generateId(),
      name: name || DEFAULT_WORKSPACE_NAME,
      documentIds: [],
      createdAt: new Date().toISOString(),
    }
    set((s) => {
      const isFirst = s.workspaces.length === 0
      return {
        workspaces: [...s.workspaces, ws],
        activeWorkspaceId: isFirst ? ws.id : s.activeWorkspaceId,
      }
    })
    return ws
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  getWorkspace: (id) => get().workspaces.find((w) => w.id === id),

  searchDocuments: (query) => {
    const q = query.toLowerCase()
    return get().documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)),
    )
  },
}))
