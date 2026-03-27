export function Diagrams() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Diagrams</span>
        <span className="text-xs text-[var(--color-text-tertiary)]">— Canvas engine coming soon</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔀</div>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Diagrams</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
            Flowcharts, org charts, mind maps, UML diagrams with auto-layout and SVG export.
            Built on Konva.js.
          </p>
        </div>
      </div>
    </div>
  )
}
