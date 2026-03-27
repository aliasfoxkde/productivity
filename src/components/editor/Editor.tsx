import { useCallback } from 'react'
import { CKEditor, type EventInfo, type Editor } from '@ckeditor/ckeditor5-react'
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  List,
  Link,
  LinkImage,
  Paragraph,
  Table,
  TableToolbar,
  Image,
  ImageToolbar,
  FontSize,
  FontFamily,
  FontColor,
  Highlight,
  Alignment,
  Indent,
  IndentBlock,
  BlockQuote,
  CodeBlock,
  HorizontalLine,
  RemoveFormat,
  WordCount,
} from 'ckeditor5'

interface EditorProps {
  content?: string
  onUpdate?: (html: string) => void
  editable?: boolean
}

export function Editor({ content, onUpdate, editable = true }: EditorProps) {
  const handleEditorReady = useCallback(
    (editor: Editor) => {
      const element = editor.ui.element as HTMLElement
      element.style.setProperty('--ck-color-base-text', 'var(--color-text)')
      element.style.setProperty('--ck-color-base-background', 'var(--color-bg)')
      element.style.setProperty('--ck-color-border', 'var(--color-border)')
      element.style.setProperty('--ck-color-text', 'var(--color-text)')
      element.style.setProperty('--ck-color-toolbar-background', 'var(--color-bg)')
      element.style.setProperty('--ck-color-toolbar-border', 'var(--color-border)')
      element.style.setProperty('--ck-color-button-default-background', 'var(--color-bg)')
      element.style.setProperty('--ck-color-button-default-hover-background', 'var(--color-bg-hover)')
      element.style.setProperty('--ck-color-button-on-background', 'var(--color-accent)')
      element.style.setProperty('--ck-color-button-on-color', 'var(--color-accent)')
      element.style.setProperty('--ck-color-focus-border', 'var(--color-accent)')
      element.style.setProperty('--ck-color-text-placeholder', 'var(--color-text-tertiary)')
      element.style.setProperty('--ck-color-panel-background', 'var(--color-bg-secondary)')
      element.style.setProperty('--ck-color-input-background', 'var(--color-bg)')
      element.style.setProperty('--ck-color-input-border', 'var(--color-border)')
      element.style.setProperty('--ck-color-input-text', 'var(--color-text)')
      element.style.setProperty('--ck-color-dropdown-panel-background', 'var(--color-bg-secondary)')
    },
    [],
  )

  const handleChange = useCallback(
    (_event: EventInfo, editor: Editor) => {
      onUpdate?.(editor.getData())
    },
    [onUpdate],
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto ck-editor-content">
        <CKEditor
          editor={ClassicEditor}
          config={{
            plugins: [
              Essentials,
              Bold, Italic, Underline, Strikethrough,
              Heading,
              List, Link, LinkImage, Paragraph,
              Table, TableToolbar,
              Image, ImageToolbar,
              FontSize, FontFamily, FontColor, Highlight,
              Alignment, Indent, IndentBlock,
              BlockQuote, CodeBlock, HorizontalLine,
              RemoveFormat, WordCount,
            ],
            toolbar: {
              items: [
                'undo', 'redo', '|',
                'heading1', 'heading2', 'heading3', '|',
                'bold', 'italic', 'underline', 'strikethrough', '|',
                'bulletedList', 'numberedList', '|',
                'alignment:left', 'alignment:center', 'alignment:right', '|',
                'blockQuote', 'codeBlock', 'horizontalLine', '|',
                'insertTable', 'linkImage', '|',
                'fontSize', 'fontFamily', 'fontColor', 'highlight', '|',
                'removeFormat',
              ],
            },
            language: 'en',
            placeholder: 'Start typing...',
          }}
          data={content || ''}
          disabled={!editable}
          onReady={handleEditorReady}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}
