import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Editor } from '@/components/editor/Editor'
import { useDocumentStore } from '@/stores/documents'
import { debounce } from '@/lib/utils'

const DOC_KEY = 'suite-default-doc-id'

export function Docs() {
  const createDocument = useDocumentStore((s) => s.createDocument)
  const updateDocument = useDocumentStore((s) => s.updateDocument)
  const documents = useDocumentStore((s) => s.documents)
  const hasInitialized = useRef(false)

  // Find existing document ID from sessionStorage + store
  const existingDocId = useMemo(() => {
    const storedId = sessionStorage.getItem(DOC_KEY)
    if (storedId) {
      const exists = documents.find((d) => d.id === storedId)
      if (exists) return storedId
    }
    return null
  }, [documents])

  // Create document on first render if none exists yet
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    if (!existingDocId) {
      const doc = createDocument('doc', 'Untitled Document')
      sessionStorage.setItem(DOC_KEY, doc.id)
    }
  }, [existingDocId, createDocument])

  // The active doc ID is either the existing one or the first doc if just created
  const docId = existingDocId ?? documents[documents.length - 1]?.id ?? null

  // Get initial content from the store
  const initialContent = useMemo(() => {
    if (!docId) return ''
    const doc = documents.find((d) => d.id === docId)
    return doc?.content ?? ''
  }, [docId, documents])

  // Debounced save handler (stable reference)
  const debouncedSave = useRef(
    debounce((id: string, html: string) => {
      updateDocument(id, { content: html })
    }, 500),
  ).current

  const handleUpdate = useCallback(
    (html: string) => {
      if (docId) {
        debouncedSave(docId, html)
      }
    },
    [docId, debouncedSave],
  )

  return (
    <div className="flex flex-col h-full">
      {/* Document toolbar */}
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Documents</span>
      </div>

      {/* Editor */}
      <Editor onUpdate={handleUpdate} content={initialContent} />
    </div>
  )
}
