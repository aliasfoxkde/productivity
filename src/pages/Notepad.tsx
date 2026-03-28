import { useCallback, useEffect, useRef, useState } from 'react'
import { FileCode, Plus, X, ChevronDown, Pencil } from 'lucide-react'
import { CodeEditor } from '@/components/notepad/CodeEditor'
import { useNotepadStore } from '@/stores/notepad'
import { AUTOSAVE_DELAY } from '@/lib/constants'
import { debounce } from '@/lib/utils'

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Shell' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
] as const

export function Notepad() {
  const files = useNotepadStore((s) => s.files)
  const activeFileId = useNotepadStore((s) => s.activeFileId)
  const createFile = useNotepadStore((s) => s.createFile)
  const updateFile = useNotepadStore((s) => s.updateFile)
  const deleteFile = useNotepadStore((s) => s.deleteFile)
  const setActiveFile = useNotepadStore((s) => s.setActiveFile)
  const setLanguage = useNotepadStore((s) => s.setLanguage)
  const getActiveFile = useNotepadStore((s) => s.getActiveFile)
  const hasInitialized = useRef(false)
  const [cursorInfo, setCursorInfo] = useState('Ln 1, Col 1')
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Create default file on first mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    if (files.length === 0) {
      createFile('untitled.ts', 'typescript')
    } else if (!activeFileId && files.length > 0) {
      setActiveFile(files[0].id)
    }
  }, [files, activeFileId, createFile, setActiveFile])

  // Debounced save
  const debouncedSave = useRef(
    debounce((id: string, content: string) => {
      updateFile(id, content)
    }, AUTOSAVE_DELAY),
  ).current

  const handleChange = useCallback(
    (value: string) => {
      if (activeFileId) {
        debouncedSave(activeFileId, value)
      }
    },
    [activeFileId, debouncedSave],
  )

  const activeFile = getActiveFile()

  const handleEditorMount = useCallback((editor: Parameters<NonNullable<import('@monaco-editor/react').OnMount>>[0]) => {
    editor.onDidChangeCursorPosition((e) => {
      setCursorInfo(`Ln ${e.position.lineNumber}, Col ${e.position.column}`)
    })
  }, [])

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setConfirmDeleteId(id)
    },
    [],
  )

  const confirmDelete = useCallback(
    () => {
      if (confirmDeleteId) {
        deleteFile(confirmDeleteId)
        setConfirmDeleteId(null)
      }
    },
    [confirmDeleteId, deleteFile],
  )

  const handleRename = useCallback(
    (id: string, currentName: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setRenamingId(id)
      setRenameValue(currentName)
    },
    [],
  )

  const commitRename = useCallback(
    () => {
      if (renamingId && renameValue.trim()) {
        const store = useNotepadStore.getState()
        store.renameFile(renamingId, renameValue.trim())
      }
      setRenamingId(null)
    },
    [renamingId, renameValue],
  )

  const handleLanguageChange = useCallback(
    (lang: string) => {
      if (activeFileId) {
        setLanguage(activeFileId, lang)
      }
      setLangMenuOpen(false)
    },
    [activeFileId, setLanguage],
  )

  const langLabel = LANGUAGES.find((l) => l.value === activeFile?.language)?.label ?? activeFile?.language

  // Close language menu on outside click
  const langMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!langMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [langMenuOpen])

  // Focus rename input
  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [renamingId])

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center overflow-x-auto flex-1 min-w-0">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setActiveFile(file.id)}
              onDoubleClick={(e) => handleRename(file.id, file.name, e)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-sm border-r border-[var(--color-border)]
                whitespace-nowrap min-w-0 shrink-0 transition-colors
                ${file.id === activeFileId
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                }
              `}
            >
              <FileCode size={14} className="shrink-0" />
              {renamingId === file.id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  onBlur={commitRename}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent text-sm outline-none w-24 border-b border-[var(--color-accent)]"
                />
              ) : (
                <span className="truncate">{file.name}</span>
              )}
              <span
                onClick={(e) => handleRename(file.id, file.name, e)}
                className="p-0.5 rounded hover:bg-[var(--color-border)] shrink-0"
                title="Rename"
              >
                <Pencil size={10} />
              </span>
              <span
                onClick={(e) => handleDelete(file.id, e)}
                className="p-0.5 rounded hover:bg-[var(--color-border)] shrink-0"
              >
                <X size={12} />
              </span>
            </button>
          ))}
        </div>

        {/* New file button */}
        <button
          onClick={() => createFile()}
          className="flex items-center justify-center w-8 h-8 mx-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          title="New file"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0">
        {activeFile ? (
          <CodeEditor
            value={activeFile.content}
            language={activeFile.language}
            onChange={handleChange}
            onMount={handleEditorMount}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
            No file open
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
            >
              {langLabel}
              <ChevronDown size={12} />
            </button>
            {langMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded shadow-lg z-50 min-w-[140px]">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--color-border)] transition-colors ${
                      lang.value === activeFile?.language ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span>{cursorInfo}</span>
        </div>
        {activeFile && <span>{activeFile.name}</span>}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmDeleteId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div
            className="bg-[var(--color-bg)] rounded-xl shadow-xl border border-[var(--color-border)] mx-4 p-5 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">Delete file?</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              This will permanently delete "{files.find((f) => f.id === confirmDeleteId)?.name}". This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-error)] text-white hover:opacity-90 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
