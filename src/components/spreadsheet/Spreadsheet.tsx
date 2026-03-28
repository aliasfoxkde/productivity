import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Plus, X } from 'lucide-react'
import { useSpreadsheetStore } from '@/stores/spreadsheet'
import { cn } from '@/lib/utils'
import { formatCellRef } from '@/lib/formula/parser'

const COLS = 26 * 3 // 78 columns (A through BZ)
const ROWS = 100
const COL_WIDTH = 100
const ROW_HEIGHT = 28
const HEADER_HEIGHT = 28

function colLabel(index: number): string {
  // Multi-letter column labels: 0=A, 25=Z, 26=AA, 27=AB, ...
  let result = ''
  let n = index + 1
  while (n > 0) {
    n--
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

const SpreadsheetCellComponent = memo(function SpreadsheetCellComponent({
  col,
  row,
  isSelected,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  editValue,
  onEditChange,
}: {
  col: number
  row: number
  isSelected: boolean
  isEditing: boolean
  onStartEdit: (col: number, row: number) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  editValue: string
  onEditChange: (v: string) => void
}) {
  const ref = colLabel(col) + (row + 1)
  const cell = useSpreadsheetStore((s) => s.getCell(s.activeSheetId, ref))

  const displayValue = isEditing
    ? editValue
    : cell.raw.startsWith('=')
      ? String(cell.computed ?? cell.error ?? '')
      : cell.raw

  const isFormula = cell.raw.startsWith('=')
  const isError = cell.error !== undefined

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmitEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancelEdit()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        onSubmitEdit()
      }
    },
    [onSubmitEdit, onCancelEdit],
  )

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  return (
    <div
      className={cn(
        'absolute border-r border-b border-[var(--color-border)] cursor-cell',
        isSelected && 'ring-2 ring-inset ring-[var(--color-accent)] z-10',
        isError && 'bg-[var(--color-error)]/10',
      )}
      style={{
        left: col * COL_WIDTH,
        top: row * ROW_HEIGHT,
        width: COL_WIDTH,
        height: ROW_HEIGHT,
      }}
      onDoubleClick={() => onStartEdit(col, row)}
      onKeyDown={handleKeyDown}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full h-full px-1 text-xs bg-[var(--color-bg)] outline-none"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full px-1 text-xs truncate flex items-center',
            typeof cell.computed === 'number' && 'text-right',
            isFormula && 'text-[var(--color-accent)]',
            isError && 'text-[var(--color-error)]',
          )}
        >
          {displayValue}
        </div>
      )}
    </div>
  )
})

export function Spreadsheet() {
  const sheet = useSpreadsheetStore((s) => s.getActiveSheet())
  const setCell = useSpreadsheetStore((s) => s.setCell)
  const sheets = useSpreadsheetStore((s) => s.sheets)
  const setActiveSheet = useSpreadsheetStore((s) => s.setActiveSheet)
  const addSheet = useSpreadsheetStore((s) => s.addSheet)
  const removeSheet = useSpreadsheetStore((s) => s.removeSheet)

  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null)
  const [editingCell, setEditingCell] = useState<{ col: number; row: number } | null>(null)
  const [editValue, setEditValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleStartEdit = useCallback((col: number, row: number) => {
    const ref = colLabel(col) + (row + 1)
    const cell = useSpreadsheetStore.getState().getCell(useSpreadsheetStore.getState().activeSheetId, ref)
    setSelectedCell({ col, row })
    setEditingCell({ col, row })
    setEditValue(cell.raw)
  }, [])

  const handleSubmitEdit = useCallback(() => {
    if (editingCell) {
      const ref = colLabel(editingCell.col) + (editingCell.row + 1)
      setCell(ref, editValue)
      setEditingCell(null)
    }
  }, [editingCell, editValue, setCell])

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  // Navigate with arrow keys
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) return
      if (!selectedCell) {
        if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
          e.preventDefault()
          setSelectedCell({ col: 0, row: 0 })
          return
        }
      }

      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault()
        const { col, row } = selectedCell!
        switch (e.key) {
          case 'ArrowDown': setSelectedCell({ col, row: Math.min(row + 1, ROWS - 1) }); break
          case 'ArrowUp': setSelectedCell({ col, row: Math.max(row - 1, 0) }); break
          case 'ArrowRight': setSelectedCell({ col: Math.min(col + 1, COLS - 1), row }); break
          case 'ArrowLeft': setSelectedCell({ col: Math.max(col - 1, 0), row }); break
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCell) {
          const ref = colLabel(selectedCell.col) + (selectedCell.row + 1)
          setCell(ref, '')
        }
      }

      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        handleStartEdit(selectedCell!.col, selectedCell!.row)
        setEditValue(e.key)
      }
    },
    [editingCell, selectedCell, setCell, handleStartEdit],
  )

  const cellRef = selectedCell ? formatCellRef(selectedCell) : ''

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Formula bar */}
      <div className="flex items-center gap-2 px-3 h-8 border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs">
        <span className="w-12 text-[var(--color-text-tertiary)] font-mono shrink-0">
          {cellRef}
        </span>
        <span className="text-[var(--color-text-tertiary)]">fx</span>
        <input
          value={editingCell ? editValue : selectedCell ? (useSpreadsheetStore.getState().getCell(useSpreadsheetStore.getState().activeSheetId, cellRef).raw) : ''}
          onChange={(e) => {
            if (!editingCell && selectedCell) handleStartEdit(selectedCell.col, selectedCell.row)
            setEditValue(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSubmitEdit() }
            if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit() }
          }}
          className="flex-1 h-5 px-1 text-xs bg-transparent border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="Enter a value or formula (=SUM(A1:A10))"
        />
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center gap-1 px-2 h-7 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        {sheets.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSheet(s.id)}
            className={cn(
              'px-3 py-0.5 text-xs rounded-t border-b-2 transition-colors cursor-pointer',
              s.id === sheet.id
                ? 'border-b-[var(--color-accent)] text-[var(--color-text)] font-medium'
                : 'border-b-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
            )}
          >
            {s.name}
          </button>
        ))}
        <button
          onClick={() => addSheet()}
          className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
          title="Add sheet"
        >
          <Plus size={14} />
        </button>
        {sheets.length > 1 && (
          <button
            onClick={() => removeSheet(sheet.id)}
            className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] cursor-pointer"
            title="Delete sheet"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-[var(--color-bg)]"
        onScroll={(e) => {
          setScrollTop(e.currentTarget.scrollTop)
          setScrollLeft(e.currentTarget.scrollLeft)
        }}
      >
        {/* Column headers */}
        <div
          className="sticky top-0 z-20 flex"
          style={{ height: HEADER_HEIGHT, marginLeft: 48 }}
        >
          {Array.from({ length: COLS }, (_, i) => (
            <div
              key={i}
              className="border-r border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-center text-[10px] text-[var(--color-text-secondary)] select-none"
              style={{ width: COL_WIDTH, height: HEADER_HEIGHT, transform: `translateX(${scrollLeft}px)` }}
            >
              {colLabel(i)}
            </div>
          ))}
        </div>

        {/* Row headers */}
        <div
          className="sticky left-0 z-10 flex flex-col"
          style={{ width: 48, marginTop: HEADER_HEIGHT }}
        >
          {Array.from({ length: ROWS }, (_, i) => (
            <div
              key={i}
              className={cn(
                'border-r border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-center text-[10px] text-[var(--color-text-secondary)] select-none',
                selectedCell?.row === i && 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
              )}
              style={{ width: 48, height: ROW_HEIGHT, transform: `translateY(${scrollTop}px)` }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Corner cell */}
        <div className="sticky left-0 top-0 z-30 w-12 h-7 border-r border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]" />

        {/* Cells */}
        <div
          className="relative"
          style={{ marginTop: HEADER_HEIGHT, marginLeft: 48 }}
        >
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => (
              <SpreadsheetCellComponent
                key={`${col}-${row}`}
                col={col}
                row={row}
                isSelected={selectedCell?.col === col && selectedCell?.row === row}
                isEditing={editingCell?.col === col && editingCell?.row === row}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSubmitEdit={handleSubmitEdit}
                editValue={editValue}
                onEditChange={setEditValue}
              />
            )),
          )}
        </div>
      </div>
    </div>
  )
}
