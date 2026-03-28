import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import '@/styles/ckeditor5.css'
import { Editor } from '@/components/editor/Editor'
import { ExportButton } from '@/components/shared/ExportButton'
import { useDocumentStore } from '@/stores/documents'
import { debounce } from '@/lib/utils'
import type { ExportableDocument } from '@/lib/export'

const DOC_KEY = 'suite-default-doc-id'

export function Docs() {
  const createDocument = useDocumentStore((s) => s.createDocument)
  const updateDocument = useDocumentStore((s) => s.updateDocument)
  const documents = useDocumentStore((s) => s.documents)
  const hasInitialized = useRef(false)
  const [searchParams, setSearchParams] = useSearchParams()

  // Check for ?doc= param (set by Home page recent docs)
  const urlDocId = searchParams.get('doc')

  const existingDocId = useMemo(() => {
    // Priority: URL param > sessionStorage
    if (urlDocId) {
      const exists = documents.find((d) => d.id === urlDocId)
      if (exists) return urlDocId
    }
    const storedId = sessionStorage.getItem(DOC_KEY)
    if (storedId) {
      const exists = documents.find((d) => d.id === storedId)
      if (exists) return storedId
    }
    return null
  }, [documents, urlDocId])

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    if (!existingDocId) {
      const doc = createDocument('doc', 'Untitled Document')
      sessionStorage.setItem(DOC_KEY, doc.id)
    } else if (urlDocId) {
      // URL doc exists — persist it and clean up URL
      sessionStorage.setItem(DOC_KEY, urlDocId)
      setSearchParams({}, { replace: true })
    }
  }, [existingDocId, createDocument, urlDocId, setSearchParams])

  const docId = existingDocId ?? documents[documents.length - 1]?.id ?? null

  const currentDoc = useMemo(() => {
    if (!docId) return null
    return documents.find((d) => d.id === docId) ?? null
  }, [docId, documents])

  const initialContent = currentDoc?.content ?? ''

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

  const handleImport = useCallback(
    (imported: ExportableDocument) => {
      const doc = createDocument(imported.type as 'doc', imported.title)
      updateDocument(doc.id, { content: imported.content })
    },
    [createDocument, updateDocument],
  )

  const exportableDoc: ExportableDocument | null = currentDoc
    ? {
        id: currentDoc.id,
        type: currentDoc.type,
        title: currentDoc.title,
        content: currentDoc.content,
        createdAt: currentDoc.createdAt,
        updatedAt: currentDoc.updatedAt,
        tags: currentDoc.tags,
      }
    : null

  const { trigger: shareTrigger, dialog: shareDialog } = ExportButton({
    doc: exportableDoc,
    onImport: handleImport,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Documents</span>
        <div className="flex-1" />
        {shareTrigger}
      </div>

      <Editor onUpdate={handleUpdate} content={initialContent} />
      {shareDialog}
    </div>
  )
}
