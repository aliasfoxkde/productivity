import { useState, type ReactNode } from 'react'
import { Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ExportableDocument } from '@/lib/export'
import { ShareDialog } from './ShareDialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportButtonProps {
  doc: ExportableDocument
  onImport?: (doc: ExportableDocument) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Small toolbar button that opens the `ShareDialog` on click.
 *
 * Returns `{ trigger, dialog }` so the consumer can place them independently
 * in the DOM (e.g. trigger in a toolbar, dialog in a portal).
 */
export function ExportButton({ doc, onImport, className }: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  const trigger: ReactNode = (
    <button
      onClick={() => setOpen(true)}
      title="Share / Export"
      className={cn(
        'p-1.5 rounded-md transition-colors cursor-pointer',
        'hover:bg-[var(--color-bg-hover)]',
        'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
        className,
      )}
    >
      <Share2 size={15} />
    </button>
  )

  const dialog: ReactNode = (
    <ShareDialog
      open={open}
      onClose={() => setOpen(false)}
      doc={doc}
      onImport={onImport}
    />
  )

  return { trigger, dialog }
}
