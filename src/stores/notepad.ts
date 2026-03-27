import { create } from 'zustand'
import { generateId } from '@/lib/utils'

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
}

const DEFAULT_LANGUAGE = 'typescript'
const DEFAULT_NAME = 'untitled.ts'
const DEFAULT_CONTENT = '// Start typing here...\n'

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
    return file
  },

  updateFile: (id, content) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, content, updatedAt: new Date().toISOString() } : f,
      ),
    })),

  renameFile: (id, name) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f,
      ),
    })),

  deleteFile: (id) =>
    set((s) => {
      const remaining = s.files.filter((f) => f.id !== id)
      let nextActiveId = s.activeFileId
      if (s.activeFileId === id) {
        const idx = s.files.findIndex((f) => f.id === id)
        nextActiveId = remaining[Math.min(idx, remaining.length - 1)]?.id ?? ''
      }
      return { files: remaining, activeFileId: nextActiveId }
    }),

  setLanguage: (id, language) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, language, updatedAt: new Date().toISOString() } : f,
      ),
    })),

  setActiveFile: (id) => set({ activeFileId: id }),

  getActiveFile: () => {
    const { files, activeFileId } = get()
    return files.find((f) => f.id === activeFileId)
  },
}))
