import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Home } from '@/pages/Home'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDocumentStore } from '@/stores/documents'

// Lazy-load app pages for code-splitting
const DocsPage = lazy(() => import('@/pages/Docs').then(m => ({ default: m.Docs })))
const SheetsPage = lazy(() => import('@/pages/Sheets').then(m => ({ default: m.Sheets })))
const SlidesPage = lazy(() => import('@/pages/Slides').then(m => ({ default: m.Slides })))
const DiagramsPage = lazy(() => import('@/pages/Diagrams').then(m => ({ default: m.Diagrams })))
const ProjectsPage = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })))
const DesignPage = lazy(() => import('@/pages/Design').then(m => ({ default: m.Design })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-sm text-[var(--color-text-tertiary)]">Loading...</div>
    </div>
  )
}

function AppInit() {
  useTheme()
  useKeyboardShortcuts()

  const createWorkspace = useDocumentStore((s) => s.createWorkspace)
  useEffect(() => {
    createWorkspace()
  }, [createWorkspace])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/sheets" element={<SheetsPage />} />
            <Route path="/slides" element={<SlidesPage />} />
            <Route path="/diagrams" element={<DiagramsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/design" element={<DesignPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
