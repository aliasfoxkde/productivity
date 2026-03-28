import { useState, useCallback, useRef } from 'react'
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Palette,
  Download,
} from 'lucide-react'
import { cn, generateId } from '@/lib/utils'

interface SlideContent {
  id: string
  type: 'title' | 'text' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  content: string
  style: Record<string, string>
}

interface Slide {
  id: string
  background: string
  content: SlideContent[]
}

const THEMES = {
  blue: { bg: '#1e3a5f', text: '#ffffff', accent: '#4a9eff' },
  dark: { bg: '#1a1a2e', text: '#ffffff', accent: '#e94560' },
  light: { bg: '#ffffff', text: '#1a1a2e', accent: '#0071e3' },
  green: { bg: '#1b4332', text: '#ffffff', accent: '#52b788' },
  purple: { bg: '#2d1b69', text: '#ffffff', accent: '#c77dff' },
}

const LAYOUTS: Record<string, (theme: typeof THEMES.blue) => SlideContent[]> = {
  'title-slide': (theme) => [
    {
      id: 'title',
      type: 'title',
      x: 10, y: 30, width: 80, height: 30,
      content: 'Presentation Title',
      style: { fontSize: '2.5rem', fontWeight: '700', color: theme.text, textAlign: 'center' },
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 10, y: 60, width: 80, height: 15,
      content: 'Subtitle goes here',
      style: { fontSize: '1.2rem', color: theme.accent, textAlign: 'center' },
    },
  ],
  'content': (theme) => [
    {
      id: 'heading',
      type: 'title',
      x: 5, y: 5, width: 90, height: 12,
      content: 'Slide Title',
      style: { fontSize: '1.8rem', fontWeight: '700', color: theme.text },
    },
    {
      id: 'body',
      type: 'text',
      x: 5, y: 22, width: 90, height: 70,
      content: '• Point one\n• Point two\n• Point three',
      style: { fontSize: '1.1rem', color: theme.text, lineHeight: '1.8' },
    },
  ],
  'two-column': (theme) => [
    {
      id: 'heading',
      type: 'title',
      x: 5, y: 5, width: 90, height: 12,
      content: 'Two Column Layout',
      style: { fontSize: '1.8rem', fontWeight: '700', color: theme.text },
    },
    {
      id: 'left',
      type: 'text',
      x: 5, y: 22, width: 42, height: 70,
      content: 'Left column content goes here',
      style: { fontSize: '1rem', color: theme.text },
    },
    {
      id: 'right',
      type: 'text',
      x: 53, y: 22, width: 42, height: 70,
      content: 'Right column content goes here',
      style: { fontSize: '1rem', color: theme.text },
    },
  ],
  'blank': () => [],
}

function createSlide(layout: string, themeKey: string = 'blue'): Slide {
  const theme = THEMES[themeKey as keyof typeof THEMES]
  return {
    id: generateId(),
    background: theme.bg,
    content: LAYOUTS[layout]?.(theme) ?? [],
  }
}

function SlideCanvas({ slide, scale = 1, onContentClick, selectedId }: {
  slide: Slide
  scale?: number
  onContentClick?: (id: string) => void
  selectedId?: string | null
}) {
  return (
    <div
      className="relative bg-white shadow-lg"
      style={{
        width: `${960 * scale}px`,
        height: `${540 * scale}px`,
        background: slide.background,
        borderRadius: '4px',
      }}
    >
      {slide.content.map((item) => (
        <div
          key={item.id}
          onClick={(e) => { e.stopPropagation(); onContentClick?.(item.id) }}
          className={cn(
            'absolute overflow-hidden cursor-pointer',
            selectedId === item.id && 'ring-2 ring-blue-500 ring-offset-1',
          )}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.width}%`,
            height: `${item.height}%`,
            ...item.style,
            fontSize: item.style.fontSize ? `calc(${item.style.fontSize} * ${scale})` : undefined,
            padding: '8px',
          }}
        >
          {item.content.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function SlideEditor() {
  const [slides, setSlides] = useState<Slide[]>([
    createSlide('title-slide', 'blue'),
    createSlide('content', 'blue'),
    createSlide('content', 'blue'),
  ])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)
  const [themeKey, setThemeKey] = useState<string>('blue')
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const slide = slides[currentSlide]

  const addSlide = useCallback((layout: string = 'content') => {
    const newSlide = createSlide(layout, themeKey)
    setSlides((s) => [...s, newSlide])
    setCurrentSlide(slides.length)
    setSelectedContentId(null)
  }, [slides.length, themeKey])

  const deleteSlide = useCallback(() => {
    if (slides.length <= 1) return
    setSlides((s) => s.filter((_, i) => i !== currentSlide))
    setCurrentSlide((c) => Math.min(c, slides.length - 2))
    setSelectedContentId(null)
  }, [slides.length, currentSlide])

  const handleContentClick = useCallback((id: string) => {
    const content = slide.content.find((c) => c.id === id)
    if (!content) return
    setSelectedContentId(id)
    setEditingText(content.content)
    setIsEditing(true)
    setTimeout(() => textAreaRef.current?.focus(), 50)
  }, [slide])

  const handleContentBlur = useCallback(() => {
    if (!selectedContentId) return
    setSlides((s) => s.map((sl, i) =>
      i === currentSlide
        ? {
            ...sl,
            content: sl.content.map((c) =>
              c.id === selectedContentId ? { ...c, content: editingText } : c
            ),
          }
        : sl
    ))
    setIsEditing(false)
  }, [selectedContentId, editingText, currentSlide])

  const applyTheme = useCallback((key: string) => {
    setThemeKey(key)
    const theme = THEMES[key as keyof typeof THEMES]
    setSlides((s) => s.map((sl) => ({
      ...sl,
      background: theme.bg,
      content: sl.content.map((c) => ({
        ...c,
        style: {
          ...c.style,
          color: c.type === 'title' ? theme.text : theme.text,
        },
      })),
    })))
  }, [])

  // Presentation mode keyboard nav
  const handlePresentationKey = useCallback((e: React.KeyboardEvent) => {
    if (!isPresenting) return
    if (e.key === 'Escape') setIsPresenting(false)
    if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlide((c) => Math.min(c + 1, slides.length - 1))
    if (e.key === 'ArrowLeft') setCurrentSlide((c) => Math.max(c - 1, 0))
  }, [isPresenting, slides.length])

  if (isPresenting) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        onKeyDown={handlePresentationKey}
        tabIndex={0}
        autoFocus
        onClick={() => setCurrentSlide((c) => Math.min(c + 1, slides.length - 1))}
      >
        <SlideCanvas slide={slide} scale={1} />
        <div className="absolute bottom-4 right-4 text-white/50 text-sm">
          {currentSlide + 1} / {slides.length}
        </div>
        <div className="absolute bottom-4 left-4 text-white/30 text-xs">
          ESC to exit, arrows to navigate
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[var(--color-border)] bg-[var(--color-bg)] overflow-x-auto flex-wrap">
        <button onClick={() => addSlide('title-slide')} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Add title slide">
          <Plus size={14} /> Title
        </button>
        <button onClick={() => addSlide('content')} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Add content slide">
          <Plus size={14} /> Content
        </button>
        <button onClick={() => addSlide('two-column')} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Add two-column slide">
          <Plus size={14} /> 2-Column
        </button>
        <button onClick={() => addSlide('blank')} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Add blank slide">
          <Plus size={14} /> Blank
        </button>
        <button onClick={deleteSlide} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Delete slide">
          <Trash2 size={14} />
        </button>
        <button onClick={() => setIsPresenting(true)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Present">
          <Maximize2 size={14} /> Present
        </button>
        <button onClick={() => {
          const theme = THEMES[themeKey as keyof typeof THEMES]
          const slideHTML = slides.map((s) => {
            const contentHTML = s.content.map((c) => {
              const style = Object.entries(c.style).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';')
              if (c.type === 'title' || c.type === 'text') {
                return `<div style="position:absolute;left:${c.x}%;top:${c.y}%;width:${c.width}%;height:${c.height}%;${style}">${c.content}</div>`
              }
              return ''
            }).join('\n')
            return `<section style="position:relative;width:960px;height:540px;background:${s.background};margin:0 auto 40px;overflow:hidden;border-radius:8px;">${contentHTML}</section>`
          }).join('\n')
          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Presentation</title><style>body{margin:40px auto;max-width:960px;font-family:sans-serif;background:#f0f0f0}section{box-shadow:0 4px 12px rgba(0,0,0,0.15)}</style></head><body>${slideHTML}</body></html>`
          const blob = new Blob([html], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = 'presentation.html'; a.click()
          a.remove(); URL.revokeObjectURL(url)
        }} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer" title="Export as HTML">
          <Download size={14} /> Export
        </button>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <Palette size={14} className="text-[var(--color-text-tertiary)]" />
        {Object.keys(THEMES).map((key) => (
          <button
            key={key}
            onClick={() => applyTheme(key)}
            className={cn(
              'w-5 h-5 rounded-full border-2 cursor-pointer',
              themeKey === key ? 'border-blue-500' : 'border-transparent',
            )}
            style={{ background: THEMES[key as keyof typeof THEMES].bg }}
            title={key}
          />
        ))}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide canvas */}
        <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-secondary)] overflow-auto p-8">
          <SlideCanvas slide={slide} scale={0.75} onContentClick={handleContentClick} selectedId={selectedContentId} />
        </div>

        {/* Sidebar - slide list */}
        <div className="w-48 border-l border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col">
          <div className="px-2 py-1 text-xs text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
            Slides ({slides.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {slides.map((s, i) => (
              <div
                key={s.id}
                onClick={() => { setCurrentSlide(i); setSelectedContentId(null) }}
                className={cn(
                  'cursor-pointer rounded border-2 transition-colors',
                  i === currentSlide ? 'border-blue-500' : 'border-transparent hover:border-[var(--color-border)]',
                )}
              >
                <SlideCanvas slide={s} scale={0.18} />
              </div>
            ))}
          </div>
        </div>

        {/* Properties panel */}
        {isEditing && selectedContentId && (
          <div className="w-56 border-l border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col">
            <div className="px-2 py-1 text-xs text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
              Properties
            </div>
            <div className="p-2 flex-1 flex flex-col gap-2">
              <textarea
                ref={textAreaRef}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleContentBlur}
                className="flex-1 w-full p-2 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded resize-none focus:outline-none focus:border-blue-500"
                placeholder="Edit content..."
              />
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-xs bg-[var(--color-bg-hover)] rounded hover:bg-[var(--color-border)] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-4 h-8 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
        <button
          onClick={() => { setCurrentSlide((c) => Math.max(c - 1, 0)); setSelectedContentId(null) }}
          disabled={currentSlide === 0}
          className="p-1 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft size={14} className="text-[var(--color-text-secondary)]" />
        </button>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <button
          onClick={() => { setCurrentSlide((c) => Math.min(c + 1, slides.length - 1)); setSelectedContentId(null) }}
          disabled={currentSlide === slides.length - 1}
          className="p-1 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight size={14} className="text-[var(--color-text-secondary)]" />
        </button>
      </div>
    </div>
  )
}
