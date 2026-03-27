export function Projects() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Projects</span>
        <span className="text-xs text-[var(--color-text-tertiary)]">— Notion-like workspace coming soon</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Projects</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
            Kanban boards, task databases, multiple views (table, calendar, gallery, timeline),
            and property management.
          </p>
        </div>
      </div>
    </div>
  )
}
