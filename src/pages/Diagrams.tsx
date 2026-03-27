import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { DiagramEditor } from '@/components/diagram/DiagramEditor'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class DiagramErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Diagrams page error:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-sm text-[var(--color-text-secondary)]">Something went wrong loading the diagram editor.</div>
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

export function Diagrams() {
  return (
    <DiagramErrorBoundary>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <span className="text-sm font-medium text-[var(--color-text)]">Diagrams</span>
        </div>
        <DiagramEditor onInit />
      </div>
    </DiagramErrorBoundary>
  )
}
