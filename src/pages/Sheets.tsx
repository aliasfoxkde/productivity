import { useEffect } from 'react'
import { Download } from 'lucide-react'
import { Spreadsheet } from '@/components/spreadsheet/Spreadsheet'
import { useSpreadsheetStore } from '@/stores/spreadsheet'
import { useUIStore } from '@/stores/ui'
import { exportToCSV, downloadFile } from '@/lib/export'

export function Sheets() {
  const sheets = useSpreadsheetStore((s) => s.sheets)
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId)
  const markClean = useUIStore((s) => s.markClean)

  // Spreadsheet auto-saves on every edit, so save just marks clean
  useEffect(() => {
    const handler = () => markClean()
    window.addEventListener('app:save', handler)
    return () => window.removeEventListener('app:save', handler)
  }, [markClean])

  const handleExportCSV = () => {
    const sheet = sheets.find((s) => s.id === activeSheetId)
    if (!sheet || Object.keys(sheet.cells).length === 0) return
    const csv = exportToCSV(sheet.cells)
    downloadFile(csv, `${sheet.name || 'spreadsheet'}.csv`, 'text/csv')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-medium text-[var(--color-text)]">Spreadsheets</span>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          title="Export as CSV"
        >
          <Download size={14} />
          CSV
        </button>
      </div>
      <Spreadsheet />
    </div>
  )
}
