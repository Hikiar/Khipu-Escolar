/**
 * Design Tokens - Single Source of Truth
 * Todos los valores de diseño centralizados aquí.
 * No usar valores hardcoded en componentes.
 */

export const tokens = {
  // ===== COLOR =====
  color: {
    // Neutros cálidos (stone/slate mix)
    neutral: {
      50:  'oklch(0.985 0.002 80)',
      100: 'oklch(0.96  0.003 80)',
      200: 'oklch(0.92  0.004 80)',
      300: 'oklch(0.85  0.006 80)',
      400: 'oklch(0.70  0.008 80)',
      500: 'oklch(0.55  0.01  80)',
      600: 'oklch(0.44  0.01  80)',
      700: 'oklch(0.32  0.01  80)',
      800: 'oklch(0.22  0.01  80)',
      900: 'oklch(0.12  0.01 80)',
      950: 'oklch(0.06  0.01 80)',
    },
    // Accent: Indigo suave (confianza, educación)
    accent: {
      50:  'oklch(0.97  0.015 260)',
      100: 'oklch(0.93  0.03  260)',
      200: 'oklch(0.85  0.06  260)',
      300: 'oklch(0.75  0.10  260)',
      400: 'oklch(0.65  0.15  260)',
      500: 'oklch(0.58  0.18  260)',
      600: 'oklch(0.50  0.20  260)',
      700: 'oklch(0.42  0.20  260)',
      800: 'oklch(0.35  0.18  260)',
      900: 'oklch(0.28  0.15  260)',
    },
    // Semantic mapping (referencias a los tokens arriba)
    semantic: {
      // Light
      light: {
        background:     'var(--neutral-50)',
        foreground:     'var(--neutral-950)',
        card:           'oklch(1 0 0)',
        'card-foreground': 'var(--neutral-950)',
        popover:        'oklch(1 0 0)',
        'popover-foreground': 'var(--neutral-950)',
        primary:        'var(--accent-600)',
        'primary-foreground': 'oklch(1 0 0)',
        secondary:      'var(--neutral-100)',
        'secondary-foreground': 'var(--neutral-700)',
        muted:          'var(--neutral-100)',
        'muted-foreground': 'var(--neutral-500)',
        accent:         'var(--accent-100)',
        'accent-foreground': 'var(--accent-700)',
        destructive:    'oklch(0.577 0.245 27.325)',
        border:         'var(--neutral-200)',
        input:          'var(--neutral-200)',
        ring:           'var(--accent-500)',
        // Sidebar
        sidebar:               'var(--neutral-50)',
        'sidebar-foreground':  'var(--neutral-950)',
        'sidebar-primary':     'var(--accent-600)',
        'sidebar-primary-foreground': 'oklch(1 0 0)',
        'sidebar-accent':      'var(--neutral-100)',
        'sidebar-accent-foreground': 'var(--neutral-700)',
        'sidebar-border':      'var(--neutral-200)',
        'sidebar-ring':        'var(--accent-500)',
      },
      // Dark
      dark: {
        background:     'var(--neutral-950)',
        foreground:     'var(--neutral-50)',
        card:           'var(--neutral-900)',
        'card-foreground': 'var(--neutral-50)',
        popover:        'var(--neutral-900)',
        'popover-foreground': 'var(--neutral-50)',
        primary:        'var(--accent-500)',
        'primary-foreground': 'var(--neutral-950)',
        secondary:      'var(--neutral-800)',
        'secondary-foreground': 'var(--neutral-300)',
        muted:          'var(--neutral-800)',
        'muted-foreground': 'var(--neutral-400)',
        accent:         'var(--accent-900)',
        'accent-foreground': 'var(--accent-100)',
        destructive:    'oklch(0.65 0.20 25)',
        border:         'var(--neutral-800)',
        input:          'var(--neutral-800)',
        ring:           'var(--accent-400)',
        // Sidebar
        sidebar:               'var(--neutral-950)',
        'sidebar-foreground':  'var(--neutral-50)',
        'sidebar-primary':     'var(--accent-500)',
        'sidebar-primary-foreground': 'var(--neutral-950)',
        'sidebar-accent':      'var(--neutral-800)',
        'sidebar-accent-foreground': 'var(--neutral-300)',
        'sidebar-border':      'var(--neutral-800)',
        'sidebar-ring':        'var(--accent-400)',
      },
    },
  },

  // ===== SPACING (4px grid) =====
  spacing: {
    0:     '0',
    1:     '0.25rem',   // 4px
    2:     '0.5rem',    // 8px
    3:     '0.75rem',   // 12px
    4:     '1rem',      // 16px
    5:     '1.25rem',   // 20px
    6:     '1.5rem',    // 24px
    8:     '2rem',      // 32px
    10:    '2.5rem',    // 40px
    12:    '3rem',      // 48px
    16:    '4rem',      // 64px
    20:    '5rem',      // 80px
    24:    '6rem',      // 96px
  },

  // ===== TYPOGRAPHY =====
  fontSize: {
    xs:    ['0.75rem',   { lineHeight: '1.5' }],  // 12px
    sm:    ['0.875rem',  { lineHeight: '1.5' }],  // 14px
    base:  ['1rem',      { lineHeight: '1.5' }],  // 16px
    lg:    ['1.125rem',  { lineHeight: '1.5' }],  // 18px
    xl:    ['1.25rem',   { lineHeight: '1.4' }],  // 20px
    '2xl': ['1.5rem',    { lineHeight: '1.3' }],  // 24px
    '3xl': ['1.875rem',  { lineHeight: '1.2' }],  // 30px
    '4xl': ['2.25rem',   { lineHeight: '1.2' }],  // 36px
    '5xl': ['3rem',      { lineHeight: '1.1' }],  // 48px
    '6xl': ['3.75rem',   { lineHeight: '1.1' }],  // 60px
  },
  fontWeight: {
    normal:  '400',
    medium:  '500',
    semibold: '600',
    bold:    '700',
  },
  fontFamily: {
    sans:     "'Geist Variable', sans-serif",
    heading:  "'Geist Variable', sans-serif",
    mono:     "'Geist Mono Variable', monospace",
  },

  // ===== RADIUS =====
  radius: {
    none: '0',
    sm:   'calc(var(--radius) * 0.6)',   // ~4px
    md:   'calc(var(--radius) * 0.8)',   // ~5px
    lg:   'var(--radius)',                // 6.25px (10px)
    xl:   'calc(var(--radius) * 1.4)',   // ~9px
    '2xl': 'calc(var(--radius) * 1.8)',  // ~11px
    '3xl': 'calc(var(--radius) * 2.2)',  // ~14px
    '4xl': 'calc(var(--radius) * 2.6)',  // ~16px
    full: '9999px',
  },

  // ===== SHADOWS =====
  shadow: {
    none: 'none',
    xs:   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm:   '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md:   '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg:   '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl:   '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // ===== MOTION =====
  motion: {
    duration: {
      fast:  '150ms',   // press, focus
      base:  '200ms',   // transitions estándar
      slow:  '300ms',   // modals, sheets, sidebar
      page:  '500ms',   // page transitions (opcional)
    },
    easing: {
      smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',     // smooth standard
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // bouncy
      sharp:  'cubic-bezier(0.4, 0, 0.2, 1)',      // sharp
    },
  },

  // ===== Z-INDEX =====
  zIndex: {
    hide:      -1,
    base:      0,
    dropdown:  100,
    sticky:    200,
    modal:     300,
    popover:   400,
    tooltip:   500,
    toast:     600,
  },

  // ===== ICON SIZES =====
  iconSize: {
    xs:  '0.75rem',   // 12px - tiny
    sm:  '1rem',      // 16px - small
    md:  '1.25rem',   // 20px - default
    lg:  '1.5rem',    // 24px - large
    xl:  '2rem',      // 32px - extra large
  },

  // ===== BREAKPOINTS =====
  breakpoint: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl': '1536px',
  },

  // ===== DENSITY DIALS =====
  density: {
    low:    { spacing: '1.5', radius: '1.2' },   // Marketing/Landing
    medium: { spacing: '1',   radius: '1' },     // Forms/Detail (default)
    high:   { spacing: '0.75', radius: '0.8' },  // Dashboard/Lists
  },
} as const

export type Tokens = typeof tokens

// Helper para obtener token con fallback
export function getToken<T extends keyof Tokens>(category: T, path: string): string {
  const keys = path.split('.')
  let value: any = tokens[category]
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) return ''
  }
  return typeof value === 'string' ? value : ''
}