import { SlideEditor } from '@/components/slides/SlideEditor'

export function Slides() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Presentations</span>
      </div>
      <SlideEditor />
    </div>
  )
}
