import { create } from 'zustand'
import { generateId } from '@/lib/utils'
import { dbGetAll, dbPut, dbDelete } from '@/lib/storage'
import type { StoreName } from '@/lib/storage'

export interface NotepadFile {
  id: string
  name: string
  language: string
  content: string
  createdAt: string
  updatedAt: string
}

interface NotepadState {
  files: NotepadFile[]
  activeFileId: string

  createFile: (name?: string, language?: string) => NotepadFile
  updateFile: (id: string, content: string) => void
  renameFile: (id: string, name: string) => void
  deleteFile: (id: string) => void
  setLanguage: (id: string, language: string) => void
  setActiveFile: (id: string) => void
  getActiveFile: () => NotepadFile | undefined

  /** Persistence */
  _loadFromDB: () => Promise<void>
}

const DEFAULT_LANGUAGE = 'typescript'
const DEFAULT_NAME = 'untitled.ts'
const DEFAULT_CONTENT = '// Start typing here...\n'

function persistFile(file: NotepadFile) {
  dbPut('notepad' as StoreName, file).catch(() => {})
}

export const useNotepadStore = create<NotepadState>((set, get) => ({
  files: [],
  activeFileId: '',

  createFile: (name, language) => {
    const file: NotepadFile = {
      id: generateId(),
      name: name || DEFAULT_NAME,
      language: language || DEFAULT_LANGUAGE,
      content: DEFAULT_CONTENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((s) => ({
      files: [...s.files, file],
      activeFileId: file.id,
    }))
    persistFile(file)
    return file
  },

  updateFile: (id, content) =>
    set((s) => {
      const files = s.files.map((f) =>
        f.id === id ? { ...f, content, updatedAt: new Date().toISOString() } : f,
      )
      const file = files.find((f) => f.id === id)
      if (file) persistFile(file)
      return { files }
    }),

  renameFile: (id, name) =>
    set((s) => {
      const files = s.files.map((f) =>
        f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f,
      )
      const file = files.find((f) => f.id === id)
      if (file) persistFile(file)
      return { files }
    }),

  deleteFile: (id) =>
    set((s) => {
      const remaining = s.files.filter((f) => f.id !== id)
      let nextActiveId = s.activeFileId
      if (s.activeFileId === id) {
        const idx = s.files.findIndex((f) => f.id === id)
        nextActiveId = remaining[Math.min(idx, remaining.length - 1)]?.id ?? ''
      }
      dbDelete('notepad' as StoreName, id).catch(() => {})
      return { files: remaining, activeFileId: nextActiveId }
    }),

  setLanguage: (id, language) =>
    set((s) => {
      const files = s.files.map((f) =>
        f.id === id ? { ...f, language, updatedAt: new Date().toISOString() } : f,
      )
      const file = files.find((f) => f.id === id)
      if (file) persistFile(file)
      return { files }
    }),

  setActiveFile: (id) => set({ activeFileId: id }),

  getActiveFile: () => {
    const { files, activeFileId } = get()
    return files.find((f) => f.id === activeFileId)
  },

  _loadFromDB: async () => {
    try {
      const files = await dbGetAll<NotepadFile>('notepad' as StoreName)
      if (files.length > 0) {
        set({
          files,
          activeFileId: files[0].id,
        })
      }
    } catch {
      // IndexedDB not available — continue with in-memory state
    }
  },
}))
