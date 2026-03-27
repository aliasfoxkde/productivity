import type { editor } from 'monaco-editor'
import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
  onMount?: (editor: editor.IStandaloneCodeEditor) => void
  readOnly?: boolean
}

export function CodeEditor({ value, language, onChange, onMount, readOnly }: CodeEditorProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={onMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          readOnly: readOnly ?? false,
        }}
      />
    </div>
  )
}
