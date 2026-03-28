import { useState, useRef, useCallback } from 'react'
import { X, Link, Download, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type ExportableDocument,
  generateShareURL,
  downloadJSON,
  readTextFile,
  importFromJSON,
} from '@/lib/export'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  doc: ExportableDocument | null
  onImport?: (doc: ExportableDocument) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareDialog({ open, onClose, doc, onImport }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCopyLink = useCallback(async () => {
    if (!doc) return
    const url = generateShareURL(doc)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [doc])

  const handleDownload = useCallback(() => {
    if (!doc) return
    downloadJSON(doc)
  }, [doc])

  const handleImport = useCallback(async () => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setImportError(false)
      try {
        const text = await readTextFile(file)
        const imported = importFromJSON(text)
        if (imported) {
          onImport?.(imported)
          onClose()
        } else {
          setImportError(true)
        }
      } catch {
        setImportError(true)
      }
      // reset so the same file can be re-selected
      e.target.value = ''
    },
    [onImport, onClose],
  )

  if (!open || !doc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Share document">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-[var(--color-bg)] border border-[var(--color-border)]',
          'rounded-lg shadow-xl max-w-md w-full p-5',
          'flex flex-col gap-4',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--color-text)] truncate">
              {doc.title}
            </h2>
            <span className="text-xs text-[var(--color-text-tertiary)]">{doc.type}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopyLink}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
              'border border-[var(--color-border)]',
              'bg-[var(--color-bg)] text-[var(--color-text)]',
              'hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors',
            )}
          >
            <Link size={16} className="shrink-0" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={handleDownload}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
              'border border-[var(--color-border)]',
              'bg-[var(--color-bg)] text-[var(--color-text)]',
              'hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors',
            )}
          >
            <Download size={16} className="shrink-0" />
            Download JSON
          </button>

          <button
            onClick={handleImport}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
              'border border-[var(--color-border)]',
              'bg-[var(--color-bg)] text-[var(--color-text)]',
              'hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors',
            )}
          >
            <Upload size={16} className="shrink-0" />
            Import
          </button>

          {importError && (
            <div className="text-xs text-[var(--color-error)] px-1">
              Invalid file. Please select a valid JSON document.
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
