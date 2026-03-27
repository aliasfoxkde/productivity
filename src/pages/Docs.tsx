export function Docs() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Documents</span>
        <span className="text-xs text-[var(--color-text-tertiary)]">— Rich text editor coming soon</span>
      </div>

      {/* Placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Documents</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
            Rich text editor with formatting, collaboration, markdown support, and export capabilities.
            Built on TipTap (ProseMirror).
          </p>
        </div>
      </div>
    </div>
  )
}
