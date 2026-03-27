import type { ResolvedTheme, ThemeColorTokens } from '@/types'

const COLOR_MAP: Record<keyof ThemeColorTokens, string> = {
  bg: '--color-bg',
  bgSecondary: '--color-bg-secondary',
  bgTertiary: '--color-bg-tertiary',
  bgHover: '--color-bg-hover',
  bgActive: '--color-bg-active',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  textTertiary: '--color-text-tertiary',
  border: '--color-border',
  borderLight: '--color-border-light',
  accent: '--color-accent',
  accentHover: '--color-accent-hover',
  accentLight: '--color-accent-light',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',
}

const RADIUS_MAP: Record<keyof ThemeTokens['radius'], string> = {
  sm: '--radius-sm',
  md: '--radius-md',
  lg: '--radius-lg',
  xl: '--radius-xl',
}

const SHADOW_MAP: Record<keyof ThemeTokens['shadows'], string> = {
  sm: '--shadow-sm',
  md: '--shadow-md',
  lg: '--shadow-lg',
  xl: '--shadow-xl',
}

/** Apply resolved theme tokens to the document root element */
export function applyThemeToDOM(resolved: ResolvedTheme): void {
  const el = document.documentElement
  const { tokens } = resolved

  // Colors
  for (const [key, cssVar] of Object.entries(COLOR_MAP)) {
    el.style.setProperty(cssVar, tokens.colors[key as keyof ThemeColorTokens])
  }

  // Radius
  for (const [key, cssVar] of Object.entries(RADIUS_MAP)) {
    el.style.setProperty(cssVar, tokens.radius[key as keyof ThemeTokens['radius']])
  }

  // Shadows
  for (const [key, cssVar] of Object.entries(SHADOW_MAP)) {
    el.style.setProperty(cssVar, tokens.shadows[key as keyof ThemeTokens['shadows']])
  }

  // Glass effect
  const glass = tokens.glass
  if (glass?.enabled) {
    el.setAttribute('data-glass', '')
    el.style.setProperty('--glass-blur', glass.blur)
    el.style.setProperty('--glass-bg-opacity', String(glass.backgroundOpacity))
    el.style.setProperty('--glass-border-opacity', String(glass.borderOpacity))
  } else {
    el.removeAttribute('data-glass')
  }

  // Set data-mode for any CSS that needs light/dark selectors
  el.setAttribute('data-mode', resolved.mode)
}
