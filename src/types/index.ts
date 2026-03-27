/** Document types supported by the suite */
export type DocumentType =
  | 'doc'
  | 'sheet'
  | 'slide'
  | 'diagram'
  | 'project'
  | 'design'
  | 'note'

/** A single node in the universal document model */
export interface DocumentNode {
  id: string
  type: string
  content: unknown
  styles: Record<string, unknown>
  children?: DocumentNode[]
}

/** Base document interface */
export interface SuiteDocument {
  id: string
  type: DocumentType
  title: string
  content: DocumentNode[]
  createdAt: string
  updatedAt: string
  version: number
  tags: string[]
  parentId?: string
  workspaceId: string
}

/** App definition for the launcher */
export interface AppDefinition {
  id: string
  type: DocumentType
  name: string
  description: string
  icon: string
  color: string
  route: string
  isNewDocument?: boolean
}

/** Workspace */
export interface Workspace {
  id: string
  name: string
  icon?: string
  documentIds: string[]
  createdAt: string
}

/** Tab state for multi-document editing */
export interface TabState {
  documentId: string
  type: DocumentType
  title: string
  isActive: boolean
  isDirty: boolean
}

/** Theme */
export type Theme = 'light' | 'dark' | 'system'
