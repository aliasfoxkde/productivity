import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Home } from '@/pages/Home'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDocumentStore } from '@/stores/documents'
import { useNotepadStore } from '@/stores/notepad'

// Lazy-load app pages for code-splitting
const DocsPage = lazy(() => import('@/pages/Docs').then(m => ({ default: m.Docs })))
const SheetsPage = lazy(() => import('@/pages/Sheets').then(m => ({ default: m.Sheets })))
const SlidesPage = lazy(() => import('@/pages/Slides').then(m => ({ default: m.Slides })))
const DiagramsPage = lazy(() => import('@/pages/Diagrams').then(m => ({ default: m.Diagrams })))
const ProjectsPage = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })))
const DesignPage = lazy(() => import('@/pages/Design').then(m => ({ default: m.Design })))
const SettingsPage = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))
const NotepadPage = lazy(() => import('@/pages/Notepad').then(m => ({ default: m.Notepad })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
        <div className="text-xs text-[var(--color-text-tertiary)]">Loading...</div>
      </div>
    </div>
  )
}

// Top-level error boundary — catches errors outside page boundaries
class GlobalErrorBoundary extends Component<{}, { hasError: boolean; error: Error | null }> {
  constructor(props: {}) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Global error:', error, info.componentStack)
  }

  handleReload = () => window.location.reload()

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[var(--color-bg)]">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Something went wrong.
          </div>
          {this.state.error && (
            <div className="text-xs text-[var(--color-text-tertiary)] max-w-md text-center">{this.state.error.message}</div>
          )}
          <button
            onClick={this.handleReload}
            className="px-3 py-1.5 rounded-md text-xs bg-[var(--color-accent)] text-white cursor-pointer hover:opacity-90"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Generic error boundary for lazy-loaded pages
interface PageErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class PageErrorBoundary extends Component<{ children: ReactNode; pageName?: string }, PageErrorBoundaryState> {
  constructor(props: { children: ReactNode; pageName?: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Page error (${this.props.pageName || 'unknown'}):`, error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Something went wrong{this.props.pageName ? ` loading ${this.props.pageName}` : ''}.
          </div>
          {this.state.error && (
            <div className="text-xs text-[var(--color-text-tertiary)] max-w-md text-center">{this.state.error.message}</div>
          )}
          <button
            onClick={this.handleRetry}
            className="px-3 py-1.5 rounded-md text-xs bg-[var(--color-primary)] text-white cursor-pointer hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppInit() {
  useTheme()
  useKeyboardShortcuts()

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    // Load persisted data first, then create default workspace if needed
    const { _loadFromDB: loadDocs, createWorkspace } = useDocumentStore.getState()
    const { _loadFromDB: loadNotepad } = useNotepadStore.getState()
    Promise.all([loadDocs(), loadNotepad()]).then(() => {
      const ws = useDocumentStore.getState().workspaces
      if (ws.length === 0) {
        createWorkspace()
      }
    })
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalErrorBoundary>
        <AppInit />
        <AppShell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/docs" element={<PageErrorBoundary pageName="Documents"><DocsPage /></PageErrorBoundary>} />
              <Route path="/sheets" element={<PageErrorBoundary pageName="Sheets"><SheetsPage /></PageErrorBoundary>} />
              <Route path="/slides" element={<PageErrorBoundary pageName="Slides"><SlidesPage /></PageErrorBoundary>} />
              <Route path="/diagrams" element={<PageErrorBoundary pageName="Diagrams"><DiagramsPage /></PageErrorBoundary>} />
              <Route path="/projects" element={<PageErrorBoundary pageName="Projects"><ProjectsPage /></PageErrorBoundary>} />
              <Route path="/designer" element={<PageErrorBoundary pageName="Designer"><DesignPage /></PageErrorBoundary>} />
              <Route path="/settings" element={<PageErrorBoundary pageName="Settings"><SettingsPage /></PageErrorBoundary>} />
              <Route path="/notepad" element={<PageErrorBoundary pageName="Notepad"><NotepadPage /></PageErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </GlobalErrorBoundary>
    </BrowserRouter>
  )
}
