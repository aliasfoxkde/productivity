import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Home } from '@/pages/Home'
import { Docs } from '@/pages/Docs'
import { Sheets } from '@/pages/Sheets'
import { Slides } from '@/pages/Slides'
import { Diagrams } from '@/pages/Diagrams'
import { Projects } from '@/pages/Projects'
import { Design } from '@/pages/Design'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDocumentStore } from '@/stores/documents'
import { useEffect } from 'react'

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/sheets" element={<Sheets />} />
          <Route path="/slides" element={<Slides />} />
          <Route path="/diagrams" element={<Diagrams />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/design" element={<Design />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
