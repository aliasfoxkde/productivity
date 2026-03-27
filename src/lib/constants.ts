import type { AppDefinition } from '@/types'

/** All apps in the productivity suite */
export const APPS: AppDefinition[] = [
  {
    id: 'docs',
    type: 'doc',
    name: 'Documents',
    description: 'Rich text documents with formatting, collaboration, and export',
    icon: 'FileText',
    color: '#0071e3',
    route: '/docs',
  },
  {
    id: 'sheets',
    type: 'sheet',
    name: 'Spreadsheets',
    description: 'Powerful spreadsheets with formulas, charts, and data analysis',
    icon: 'Table',
    color: '#30d158',
    route: '/sheets',
  },
  {
    id: 'slides',
    type: 'slide',
    name: 'Presentations',
    description: 'Beautiful slides with transitions, templates, and presenter mode',
    icon: 'Presentation',
    color: '#ff9f0a',
    route: '/slides',
  },
  {
    id: 'diagrams',
    type: 'diagram',
    name: 'Diagrams',
    description: 'Flowcharts, org charts, mind maps, and technical diagrams',
    icon: 'GitBranch',
    color: '#bf5af2',
    route: '/diagrams',
  },
  {
    id: 'projects',
    type: 'project',
    name: 'Projects',
    description: 'Kanban boards, task databases, and project management',
    icon: 'LayoutDashboard',
    color: '#64d2ff',
    route: '/projects',
  },
  {
    id: 'design',
    type: 'design',
    name: 'Designer',
    description: 'Vector design tool with components, prototyping, and export',
    icon: 'Palette',
    color: '#ff453a',
    route: '/design',
  },
]

/** App registry for quick lookup */
export const APP_MAP = new Map(APPS.map((app) => [app.id, app]))

/** Default workspace name */
export const DEFAULT_WORKSPACE_NAME = 'My Workspace'

/** Auto-save debounce delay in ms */
export const AUTOSAVE_DELAY = 2000
