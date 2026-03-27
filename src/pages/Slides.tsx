export function Slides() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Presentations</span>
        <span className="text-xs text-[var(--color-text-tertiary)]">— Slide editor coming soon</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📽️</div>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Presentations</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
            Slide editor with transitions, templates, presenter mode, and PDF export.
          </p>
        </div>
      </div>
    </div>
  )
}
