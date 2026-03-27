import { useCallback } from 'react'
import { Editor } from '@/components/editor/Editor'

export function Docs() {
  const handleUpdate = useCallback((html: string) => {
    // TODO: save to document store
    void html
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Document toolbar */}
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Documents</span>
      </div>

      {/* Editor */}
      <Editor onUpdate={handleUpdate} />
    </div>
  )
}
