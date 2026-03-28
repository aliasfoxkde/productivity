import { create } from 'zustand'
import type { SuiteDocument, Workspace } from '@/types'
import { generateId } from '@/lib/utils'
import { DEFAULT_WORKSPACE_NAME } from '@/lib/constants'
import { dbGetAll, dbPut, dbDelete } from '@/lib/storage'
import type { StoreName } from '@/lib/storage'

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

  /** Persistence */
  _loadFromDB: () => Promise<void>
}

// Background save (fire-and-forget, no await needed)
function persistDoc(doc: SuiteDocument) {
  dbPut('documents' as StoreName, doc).catch(() => {})
}
function persistWorkspace(ws: Workspace) {
  dbPut('ui' as StoreName, ws).catch(() => {})
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
    persistDoc(doc)
    return doc
  },

  updateDocument: (id, updates) =>
    set((s) => {
      const updated = s.documents.map((d) =>
        d.id === id
          ? { ...d, ...updates, updatedAt: new Date().toISOString(), version: d.version + 1 }
          : d,
      )
      const doc = updated.find((d) => d.id === id)
      if (doc) persistDoc(doc)
      return { documents: updated }
    }),

  deleteDocument: (id) =>
    set((s) => {
      const docs = s.documents.filter((d) => d.id !== id)
      dbDelete('documents' as StoreName, id).catch(() => {})
      return { documents: docs }
    }),

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
    persistWorkspace(ws)
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

  _loadFromDB: async () => {
    try {
      const docs = await dbGetAll<SuiteDocument>('documents' as StoreName)
      if (docs.length > 0) {
        set({ documents: docs })
      }
    } catch {
      // IndexedDB not available — continue with in-memory state
    }
  },
}))
