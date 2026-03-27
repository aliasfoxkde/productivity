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
  content: string
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

/** Named theme presets */
export type ThemePresetId = 'modern-saas' | 'bold-vibrant' | 'glass-blur' | 'dark-pro'

/** Theme color tokens */
export interface ThemeColorTokens {
  bg: string
  bgSecondary: string
  bgTertiary: string
  bgHover: string
  bgActive: string
  text: string
  textSecondary: string
  textTertiary: string
  border: string
  borderLight: string
  accent: string
  accentHover: string
  accentLight: string
  success: string
  warning: string
  error: string
  info: string
}

/** Full theme token set */
export interface ThemeTokens {
  colors: ThemeColorTokens
  radius: { sm: string; md: string; lg: string; xl: string }
  shadows: { sm: string; md: string; lg: string; xl: string }
  glass?: {
    enabled: boolean
    blur: string
    backgroundOpacity: number
    borderOpacity: number
  }
}

/** User's persisted theme preference */
export interface ThemePreference {
  preset: ThemePresetId | 'system'
  overrides: Partial<Record<ThemePresetId, Partial<ThemeTokens>>>
}

/** Resolved theme at runtime */
export interface ResolvedTheme {
  presetId: ThemePresetId | 'system'
  mode: 'light' | 'dark'
  tokens: ThemeTokens
}
