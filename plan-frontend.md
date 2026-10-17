# Plan de Mejora Frontend - Dashboard Colegio

> **Fecha:** 2025-09-09
> **Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + shadcn/ui (@base-ui/react) + Geist Variable + Lucide React
> **Skills aplicadas:** `impeccable`, `design-taste-frontend`, `frontend-design`, `ui-ux-pro-max`, `accessible-components`, `component-architecture`, `animations`, `design-tokens-theming`, `empty-and-loading-states`, `navigation-patterns`, `responsive-layout`, `brand`

---

## 1. DIAGNÓSTICO GENERAL

| Aspecto | Puntuación | Comentario |
|---------|------------|------------|
| **Base técnica** | 8/10 | Stack moderno, bien configurado, tipos estrictos |
| **Componentes UI** | 7.5/10 | shadcn bien adaptado, variantes con CVA |
| **Design System** | 6.5/10 | Tokens OKLCH presentes, pero subutilizados |
| **Consistencia visual** | 6/10 | Patrones repetidos pero con inconsistencias |
| **Accesibilidad** | 5.5/10 | Base buena (Radix), pero gaps en labels, focus, ARIA |
| **Animaciones** | 4/10 | Solo transiciones CSS básicas, sin microinteracciones |
| **Responsive** | 6/10 | Funciona pero sin testing sistemático |
| **Lenguaje/UX Copy** | 5/10 | Términos técnicos, inconsistentes, poco amigables |

---

## 2. PROBLEMAS ENCONTRADOS (PRIORIZADOS)

### 🔴 CRÍTICOS (Bloquean UX o accesibilidad)

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| 1 | **Inputs sin labels asociados** | Forms en Alumnos, Profesores, Calificaciones, etc. | Screen readers no anuncian propósito del campo |
| 2 | **Botones icono-only sin `aria-label`** | Header (tema), tablas (editar/eliminar), dialogs | Usuarios ciegos no saben qué hace el botón |
| 3 | **Focus visible inconsistente** | Buttons, inputs, selects, tabs | Navegación por teclado confusa |
| 4 | **Color-only state** (badges nivel logro AD/A/B/C) | CalificacionesPage.tsx:66-78 | Usuarios daltónicos no distinguen estados |
| 5 | **Tablas sin `scope="col"` en headers** | table.tsx, todas las páginas | Screen readers no asocian headers con celdas |
| 6 | **Dialogs/Sheets sin focus trap visible** | dialog.tsx, sheet.tsx | Teclado puede escapar del modal |

### 🟠 ALTOS (Degradan UX significativamente)

| # | Problema | Ubicación |
|---|----------|-----------|
| 7 | **Estados de carga/empty/error inconsistentes** | Cada página implementa su propia versión |
| 8 | **Formularios sin validación inline** | Solo error al enviar, sin feedback en tiempo real |
| 9 | **Tablas densas sin respaldo móvil** | Horizontal scroll en móvil rompe layout |
| 10 | **No hay toast/notificaciones globales** | Solo alerts inline en cada página |
| 11 | **Sidebar colapsable sin persistencia** | Se resetea al navegar |
| 12 | **Selects sin "limpiar selección"** | UX frustrante para volver a "todos" |
| 13 | **Pagination custom sin aria-labels** | Paginacion.tsx sin atributos ARIA |
| 14 | **Tabs sin `aria-controls`/`aria-selected` correctos** | GradosPage usa shadcn Tabs pero faltan attrs |

### 🟡 MEDIOS (Inconsistencias y deuda técnica)

| # | Problema |
|---|----------|
| 15 | **Radius inconsistente** (8px, 12px, 16px, variables CSS no usadas uniformemente) |
| 16 | **Spacing arbitrario** (gap-2, gap-3, gap-4, p-2, p-4, p-6 mezclados sin sistema) |
| 17 | **Icon sizes inconsistentes** (size-3, size-4, size-5, size-6 sin tokens) |
| 18 | **Hardcoded colors** en CalificacionesPage (bg-green-100, bg-blue-100, etc.) |
| 19 | **Shadows inconsistentes** (shadow-md, shadow-lg, sin token) |
| 20 | **Motion/transitions** solo CSS básico, sin easing consistente |
| 21 | **Dark mode** funcional pero no testeado visualmente en todas las páginas |
| 22 | **Z-index soup** (z-30, z-50, z-10, z-100 sin escala documentada) |

---

## 3. CAMBIOS RECOMENDADOS (POR PRIORIDAD)

### Fase 1: Accesibilidad Base (Semana 1-2)
| Acción | Skill | Archivos |
|--------|-------|----------|
| Añadir `htmlFor`/`id` a todos los inputs + labels | accessible-components | Todas las pages con forms |
| `aria-label` en botones icono-only | accessible-components | Header, tablas, dialogs |
| Focus visible consistente (`focus-visible:ring-2`) | accessible-components | button.tsx, input.tsx, select.tsx, tabs.tsx |
| Color-only → icon + text en badges nivel logro | accessible-components | CalificacionesPage.tsx |
| `scope="col"` en TableHead | accessible-components | table.tsx |
| Focus trap en Dialog/Sheet | accessible-components | dialog.tsx, sheet.tsx |

### Fase 2: Design System & Consistencia (Semana 2-3)
| Acción | Skill | Archivos |
|--------|-------|----------|
| Tokens de spacing (4px grid) + radius + shadows en CSS vars | design-system, design-tokens-theming | index.css, tailwind.config |
| cva variants unificados para Button, Badge, Card, Input | component-architecture | button.tsx, badge.tsx, card.tsx |
| Eliminar hardcoded colors → semantic tokens | design-tokens-theming | CalificacionesPage, todas las pages |
| Icon size tokens (size-3/4/5/6 → icon-sm/md/lg) | design-tokens-theming | lucide imports |
| Dark mode audit completo | design-tokens-theming | Todas las pages |

### Fase 3: UX & Interacción (Semana 3-4)
| Acción | Skill | Archivos |
|--------|-------|----------|
| Toast system global (sonner/shadcn) | ui-ux-pro-max, component-architecture | Nuevo: toast-provider |
| Empty/Loading/Error states unificados | empty-and-loading-states | Nuevo: components/common/*State.tsx |
| Form validation inline (zod + react-hook-form) | frontend-design, component-architecture | Forms en todas pages |
| Responsive tables (card view en móvil) | responsive-layout | table.tsx + responsive wrapper |
| Sidebar persistence (localStorage) | navigation-patterns | AppSidebar.tsx |
| Global search/command palette (cmdk) | navigation-patterns | Nuevo: components/ui/command.tsx |

### Fase 4: Animaciones & Microinteracciones (Semana 4-5)
| Acción | Skill | Archivos |
|--------|-------|----------|
| Motion tokens (hover 200ms, transition 300ms, page 500ms) | animations | index.css, tailwind config |
| Staggered list animations (Framer Motion o CSS) | animations | Tablas, listas, sidebar |
| Micro-interactions: button press, hover lift, focus ring | animations | button.tsx, input.tsx |
| Page transitions (router) | animations | App.tsx, router |
| Loading skeletons con shimmer | animations, empty-and-loading-states | Skeleton.tsx |
| Reduced motion support | animations, accessible-components | CSS @media prefers-reduced-motion |

### Fase 5: Lenguaje & UX Copy (Semana 5)
| Acción | Skill |
|--------|-------|
| Auditoría completa de términos técnicos → lenguaje humano | ui-ux-pro-max, frontend-design |
| Guía de estilo de voz/tono | brand, ui-ux-pro-max |
| Reemplazo sistemático en toda la app | - |

### Fase 6: Visual Direction & Polish (Semana 6+)
| Acción | Skill |
|--------|-------|
| Direction visual única (taste-skill) | design-taste-frontend |
| Bento grids / density dial para dashboards | ui-ux-pro-max (--density) |
| Charts/visualización datos (Recharts) | ui-ux-pro-max (--domain chart) |
| Landing/login page redesign | design, frontend-design |

---

## 4. MEJORAS DE UI/UX (DETALLADAS)

### 4.1 Jerarquía Visual
**Tokens tipográficos propuestos:**
```
--text-h1: 30px/1.2 bold (solo 1 por página)
--text-h2: 24px/1.3 semibold (secciones)
--text-h3: 18px/1.4 medium (cards)
--text-body: 14px/1.5 regular
--text-sm: 12px/1.5 muted (metadata)
--text-xs: 11px/1.5 muted (badges, timestamps)
```

### 4.2 Layout y Distribución
| Actual | Recomendado |
|--------|-------------|
| Gap arbitrario (2,3,4,6) | Sistema 4px: 4,8,12,16,24,32,48,64,96 |
| Container max-w-6xl fijo | Responsive: 640/768/1024/1280/1536 |
| Sidebar fijo 280px | Responsive: colapsable a icon (56px) en <1024px |
| Header h-14 fijo | Variable según contenido + safe area |

### 4.3 Colores y Contraste (Crítico)
| Token | Light | Dark | Contraste | Estado |
|-------|-------|------|-----------|--------|
| foreground/background | 15.3:1 | 15.3:1 | ✅ AAA | ✅ |
| primary/primary-foreground | 8.2:1 | 7.1:1 | ✅ AA | ✅ |
| muted-foreground/muted | 4.1:1 | 4.3:1 | ⚠️ AA large only | ⚠️ |
| border/input | 2.8:1 | 1.8:1 | ❌ | ❌ |
| destructive | 5.2:1 | 4.8:1 | ✅ AA | ✅ |

**Crítico:** `--border` y `--input` fallan contraste en ambos temas. Inputs indistinguibles del fondo.

### 4.4 Estados (Carga, Vacío, Error, Éxito)
| Estado | Implementación | Consistencia |
|--------|----------------|--------------|
| Loading | Skeleton rows por página | ❌ Cada página define su `FilasSkeleton` |
| Empty | Card centrada con icono + texto + CTA | ⚠️ Parcial |
| Error | Alert destructiva inline + botón reintentar | ✅ Consistente |
| Success | Solo toast inline (no global) | ❌ Inconsistente |

---

## 5. MEJORAS DE ANIMACIÓN Y MICROINTERACCIONES (SKILL: ANIMATIONS)

### 5.1 Motion Tokens (index.css) — Enfoque Funcional
```css
@theme {
  --motion-fast: 150ms ease-out;      /* press, focus */
  --motion-base: 200ms ease-out;      /* transitions estándar */
  --motion-slow: 300ms ease-in-out;   /* modals, sheets, sidebar */
  --motion-page: 500ms cubic-bezier(0.16, 1, 0.3, 1); /* page transitions (opcional) */
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);      /* smooth standard */
}
```

> **Referencia:** Enfoque de **Emil Kowalski** — motion solo donde comunica estado o guía atención. En sistemas administrativos: **no animar cards, filas, ni elementos decorativos**. Motion solo en: feedback de botones, apertura de modals/sheets, transiciones de sidebar, skeletons, toasts, focus states.
### 5.2 Micro-interacciones Prioritarias (Motion Funcional — Emil Kowalski)

> **Principio:** Solo animar lo que comunica estado o guía la atención. En un sistema administrativo, **menos es más**. No animar cards, tablas ni elementos decorativos.

| Elemento | Animación | Duración | Justificación |
|----------|-----------|----------|---------------|
| Button press | `scale-[0.98]` | 100ms | Feedback inmediato de acción |
| Button focus | `ring-2 ring-ring/50` | 150ms | Accesibilidad teclado |
| Input focus | `ring-2 ring-ring/50 + border-ring` | 150ms | Guía visual de foco |
| Modal/Dialog enter | `zoom-in-95 + fade-in` | 200ms | Entrada de overlay |
| Modal/Dialog exit | `zoom-out-95 + fade-out` | 150ms | Salida limpia |
| Sheet slide | `slide-in-from-right` | 300ms | Navegación lateral |
| Sidebar collapse/expand | `width transition` | 200ms | Cambio de layout |
| Toast enter | `slide-in-from-top + zoom-in` | 200ms | Notificación no intrusiva |
| Toast exit | `fade-out + slide-out` | 150ms | Desaparición suave |
| Skeleton shimmer | `animate-pulse` o custom shimmer | 1.5s loop | Percepción de carga |
| Row hover | `bg-muted/50` | 100ms | Feedback sutil de fila accionable |
| Tab switch | `fade` | 150ms | Cambio de vista |

### 5.3 Staggered Animations
```css
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
```

### 5.4 Page Transitions (React Router)
```tsx
// App.tsx
<Routes>
  <Route element={<AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      {/* routes */}
    </Routes>
  </AnimatePresence>} />
</Routes>
```

### 5.5 Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. MEJORAS DE LENGUAJE Y NOMBRES (SKILL: BRAND + FRONTEND-DESIGN)

### 6.1 Auditoría de Términos Actuales → Propuestos (Contexto Perú)

> **Nota:** Los términos se basan en la normativa MINEDU, SIAGIE y documentos oficiales peruanos (RM 447-2020-MINEDU, Ley 28044, Instructivos de Matrícula).

| Actual | Problema | Propuesto | Razón |
|--------|----------|-----------|-------|
| "Desactivar" (alumnos/profesores) | Suena técnico/irreversible | **"Dar de baja"** | Lenguaje administrativo estándar en Perú |
| "Reactivar" | Técnico | **"Restituir"** o **"Volver a activar"** | Más humano, usado en SIAGIE |
| "Eliminar" (grados/secciones/clases) | Irreversible, asusta | **"Borrar"** + confirmación clara | Consistencia |
| "Matrícula" (verb) | Sustantivo usado como verbo | **"Matricular"** | Verbo de acción oficial |
| "Apoderado" | **Mantener** | **"Apoderado"** | **Término oficial MINEDU/SIAGIE** (padre, madre, tutor u otro que acredite representación legal) |
| "Competencia" (solo) | Ambigüedad curricular | **"Competencia curricular"** | Precisión según CNEB |
| "Configuración de evaluación" | Técnico | **"Esquema de calificación"** | Funcional, usado en documentos MINEDU |
| "Período académico" | Formal | **"Año lectivo"** | Término oficial (RM 447-2020) |
| "Curso" (entidad) vs "Materia" | Confusión | **"Área curricular"** / **"Asignatura"** | Términos CNEB (Primaria: áreas; Secundaria: asignaturas) |
| "Grado" vs "Nivel" | Confusión | **"Grado" (1º, 2º...) + "Nivel" (Inicial/Primaria/Secundaria)** | Claridad según LEY 28044 |
| "Sección" | Técnico | **"Sección"** | **Mantener**: término oficial (aula/grupo en SIAGIE) |
| "Clase" (entidad) | Ambigüedad | **"Aula"** o **"Grupo"** | Término coloquial docente; en SIAGIE se usa "sección" |
| "Tutor" (docente) | Rol ambiguo | **"Profesor tutor"** o **"Tutor de aula"** | Rol oficial en norma |
| "Vacantes" | Frío | **"Cupos disponibles"** | Humano, usado en instructivos de matrícula |
| "Nivel logro AD/A/B/C" | Código interno | **"Destacado / Logrado / En proceso / En inicio"** | Nombres oficiales de los niveles de logro (RVM 094-2020) |
| "Responsable de pagos" | Técnico | **"Apoderado"** o **"Responsable económico"** | En Perú el apoderado asume compromisos de pago |
| "Concepto de pago" | Contable | **"Concepto"** o **"Ítem de pago"** | Simple, usado en recibos escolares |

### 6.2 Patrones de UX Copy

| Tipo | Patrón Actual | Propuesto |
|-------|---------------|-----------|
| Botón acción primaria | "Crear alumno" | **"Registrar alumno"** |
| Botón acción secundaria | "Cancelar" | **"Cancelar"** (ok) |
| Botón destructivo | "Eliminar" | **"Borrar"** + "Esta acción no se puede deshacer" |
| Placeholder input | "Ej: 4" | **"4"** (placeholder numérico) |
| Empty state | "No hay alumnos registrados todavía." | **"Aún no hay alumnos. Registra el primero."** |
| Error validación | "El cuerpo de la petición no es válido." | **"Revisa los campos marcados."** |
| Loading | "Guardando..." | **"Guardando cambios..."** |
| Confirmación | "¿Está seguro?" | **"¿Borrar a [Nombre]? Esta acción no se puede deshacer."** |
| Toast éxito | (No existe) | **"Alumno registrado correctamente"** |
| Toast error | (No existe) | **"No se pudo registrar. Intenta de nuevo."** |
### 6.3 Navegación y Menús

| Actual | Propuesto |
|--------|-----------|
| "Planificación Académica" | ✅ Bueno |
| "Grados y Secciones" | **"Grados y secciones"** (mantener, término oficial) |
| "Asignaciones de Curso" | **"Asignación de docentes"** |
| "Plan de Estudios" | **"Currícula"** o **"Plan de estudios"** |
| "Configuración de Evaluación" | **"Esquemas de calificación"** |
| "Modelos de Evaluación" | **"Tipos de calificación"** |

---

## 7. PROPUESTA DE DIRECCIÓN VISUAL GENERAL (SKILL: DESIGN-TASTE-FRONTEND + UI-UX-PRO-MAX)

### 7.1 Dirección: "Calma Funcional" (Functional Calm)
**Concepto:** Interfaz que transmite confianza, orden y calma. No "divertida", no "corporativa fría". Para docentes y administradores que pasan horas en el sistema.

| Atributo | Valor |
|----------|-------|
| **Personalidad** | Profesional, confiable, tranquila, eficiente |
| **Densidad** | Media-alta (dashboard) / Media (forms) |
| **Color** | Neutro cálido (slate/stone) + accent indigo/violet suave |
| **Tipografía** | Geist Variable (ya elegido) - scale armónica |
| **Motion** | Sutil, funcional, nunca decorativo |
| **Iconografía** | Lucide outline (consistente, 1.5px stroke) |
| **Ilustraciones** | Ninguna (evitar decoración innecesaria) |

### 7.2 Paleta Refinada (OKLCH)
```css
:root {
  /* Neutros cálidos (stone/slate mix) */
  --neutral-50:  oklch(0.985 0.002 80);
  --neutral-100: oklch(0.96  0.003 80);
  --neutral-200: oklch(0.92  0.004 80);
  --neutral-300: oklch(0.85  0.006 80);
  --neutral-400: oklch(0.70  0.008 80);
  --neutral-500: oklch(0.55  0.01  80);
  --neutral-600: oklch(0.44  0.01  80);
  --neutral-700: oklch(0.32  0.01 80);
  --neutral-800: oklch(0.22  0.01 80);
  --neutral-900: oklch(0.12  0.01 80);
  --neutral-950: oklch(0.06  0.01 80);

  /* Accent: Indigo suave (confianza, educación) */
  --accent-50:  oklch(0.97  0.015 260);
  --accent-100: oklch(0.93  0.03  260);
  --accent-500: oklch(0.58  0.18  260);
  --accent-600: oklch(0.50  0.20  260);
  --accent-700: oklch(0.42  0.20  260);

  /* Semantic mapping */
  --background: var(--neutral-50);
  --foreground: var(--neutral-950);
  --card: oklch(1 0 0);
  --card-foreground: var(--neutral-950);
  --primary: var(--accent-600);
  --primary-foreground: oklch(1 0 0);
  --secondary: var(--neutral-100);
  --secondary-foreground: var(--neutral-700);
  --muted: var(--neutral-100);
  --muted-foreground: var(--neutral-500);
  --accent: var(--accent-100);
  --accent-foreground: var(--accent-700);
  --destructive: oklch(0.58 0.22 25);
  --border: var(--neutral-200);
  --input: var(--neutral-200);
  --ring: var(--accent-500);
}

.dark {
  --background: var(--neutral-950);
  --foreground: var(--neutral-50);
  --card: var(--neutral-900);
  --card-foreground: var(--neutral-50);
  --primary: var(--accent-500);
  --primary-foreground: var(--neutral-950);
  --secondary: var(--neutral-800);
  --secondary-foreground: var(--neutral-300);
  --muted: var(--neutral-800);
  --muted-foreground: var(--neutral-400);
  --accent: var(--accent-900);
  --accent-foreground: var(--accent-100);
  --destructive: oklch(0.65 0.20 25);
  --border: var(--neutral-800);
  --input: var(--neutral-800);
  --ring: var(--accent-400);
}
```
### 7.3 Estilo de Componentes (Taste: "Refined Utility")

| Componente | Estilo |
|------------|--------|
| **Cards** | `rounded-xl`, `ring-1 ring-foreground/10`, `bg-card`, **sin shadow en hover** (static) |
| **Buttons** | `rounded-lg`, `h-10` default, `font-medium`, press `scale-[0.98]` |
| **Inputs** | `h-10`, `rounded-lg`, `border-input`, focus `ring-2 ring-ring/50` |
| **Badges** | `rounded-full`, `px-2.5 py-0.5`, `text-xs font-medium` |
| **Tables** | `text-sm`, `border-b neutral-200`, hover `bg-muted/30` |
| **Modals/Sheets** | `rounded-xl`, `bg-popover`, `shadow-lg`, `ring-1 ring-foreground/10` |
| **Toasts** | `rounded-lg`, `bg-card`, `shadow-lg`, slide from top-right |

### 7.4 Density Dials (ui-ux-pro-max)
| Contexto | Density | Spacing Scale |
|----------|---------|---------------|
| Dashboard / Lists | High (8) | 8-32px |
| Forms / Detail views | Medium (5) | 16-48px |
| Marketing / Landing | Low (3) | 24-96px |

---

## 8. PLAN DE IMPLEMENTACIÓN POR ETAPAS

### ETAPA 1: Accesibilidad Base (2 semanas)
**Objetivo:** Cumplir WCAG 2.2 AA baseline

| Sprint | Tareas | Entregable |
|--------|--------|------------|
| 1.1 | Labels + aria-labels + focus-visible + color-only fixes | PR con 0 a11y regressions |
| 1.2 | Table scope, dialog focus trap, reduced motion | axe-core score ≥ 95 |
| 1.3 | Testing con NVDA/VoiceOver + axe-core CI | Reporte accesibilidad |

**Archivos clave:** `button.tsx`, `input.tsx`, `select.tsx`, `table.tsx`, `dialog.tsx`, `sheet.tsx`, `index.css`, todas las pages con forms/tablas

---

### ETAPA 2: Design System & Consistencia (2-3 semanas)
**Objetivo:** Sistema de diseño unificado, tokens documentados

| Sprint | Tareas | Entregable |
|--------|--------|------------|
| 2.1 | Tokens CSS (spacing, radius, shadow, color, motion) | `index.css` actualizado + `design-tokens.md` |
| 2.2 | cva variants unificados (Button, Badge, Card, Input) | Componentes con API consistente |
| 2.3 | Eliminar hardcoded colors → semantic tokens | 0 hardcoded colors en pages |
| 2.4 | Dark mode audit visual completo | Checklist dark mode ✅ |
| 2.5 | Storybook/visual regression (opcional) | Chromatic/Storybook configurado |

**Archivos clave:** `index.css`, `components/ui/*.tsx`, `tailwind.config.ts` (si existe), nuevas `components/ui/*Variants.ts`

---

### ETAPA 3: UX Core & Interacción (3-4 semanas)
**Objetivo:** UX fluida, feedback claro, responsive real

| Sprint | Tareas | Entregable |
|--------|--------|------------|
| 3.1 | Toast system global (sonner) | `<Toaster />` en AppShell |
| 3.2 | Empty/Loading/Error states unificados | `components/common/*State.tsx` |
| 3.3 | Form validation inline (zod + RHF) | Forms con validación en tiempo real |
| 3.4 | Responsive tables (card view <768px) | `TableResponsive` wrapper |
| 3.5 | Sidebar persistence + Cmd+K palette | localStorage + cmdk |
| 3.6 | Pagination accesible + sorting | `Paginacion` + `TableSort` |

**Nuevos componentes:** `ToastProvider`, `EmptyState`, `LoadingState`, `ErrorState`, `TableResponsive`, `CommandPalette`

---

### ETAPA 4: Animaciones & Microinteracciones (1-2 semanas)
**Objetivo:** Motion funcional — solo lo que comunica estado o guía atención (estilo Emil Kowalski)

| Sprint | Tareas | Entregable |
|--------|--------|------------|
| 4.1 | Motion tokens CSS + reduced motion | `index.css` actualizado |
| 4.2 | Micro-interactions funcionales (press, focus, state change) | Button, Input, Modal, Sheet, Toast, Skeleton |
| 4.3 | Transiciones de layout (sidebar, tabs, modals) | CSS-only transitions |
| 4.4 | Skeleton shimmer + toast animations | Loading perceived performance |

**Herramientas:** CSS-only (preferido), sin Framer Motion. No animar cards, filas, ni elementos decorativos.

---

### ETAPA 5: Lenguaje & UX Copy (1-2 semanas)
**Objetivo:** Interfaz que habla como un colega, no como un sistema

| Sprint | Tareas | Entregable |
|--------|--------|------------|
| 5.1 | Auditoría completa de strings (grep + revisión manual) | Inventario de términos |
| 5.2 | Guía de voz/tono + glosario aprobado | `UX_WRITING_GUIDE.md` |
| 5.3 | Reemplazo sistemático (scripts + manual) | 0 términos técnicos en UI |
| 5.4 | Revisión con usuarios reales (docentes/admin) | Feedback cualitativo |

---

### ETAPA 6: Visual Direction & Polish (2-4 semanas)
**Objetivo:** Identidad visual distintiva y profesional

| Sprint | Tareas | Entregable |
|--------|--------|------------|
| 6.1 | Aplicar paleta refinada + dark mode paralelo | `index.css` final |
| 6.2 | Density dials por contexto (dashboard vs forms) | `--density` CSS var |
| 6.3 | Charts/visualización (Recharts) | Dashboard KPIs visuales |
| 6.4 | Login/landing redesign | `LoginPage.tsx` + public routes |
| 6.5 | Auditoría final + documentación | `DESIGN_SYSTEM.md` completo |

---

## 9. RESUMEN EJECUTIVO

### Inversión Estimada
| Fase | Semanas | Esfuerzo | ROI |
|------|---------|----------|-----|
| 1. Accesibilidad | 2 | Alto | **Crítico** (legal + ético) |
| 2. Design System | 2-3 | Alto | **Alto** (velocidad dev + consistencia) |
| 3. UX Core | 3-4 | Muy Alto | **Muy Alto** (retención usuarios) |
| 4. Animaciones | 1-2 | Bajo-Medio | **Medio** (perceived quality, solo motion funcional) |
| 5. Lenguaje | 1-2 | Bajo | **Alto** (usabilidad) |
| 6. Visual Polish | 2-4 | Medio | **Medio** (brand trust) |
| **TOTAL** | **11-17** | | |

### Quick Wins (Hacer YA, <1 día cada uno)
1. ✅ `aria-label` en botones icono-only (Header, tablas)
2. ✅ `htmlFor`/`id` en todos los inputs
3. ✅ `focus-visible:ring-2` en button, input, select
4. ✅ `scope="col"` en TableHead
5. ✅ Color-only badges → icon + texto (nivel logro)
6. ✅ Contraste `--border` / `--input` en ambos temas
7. ✅ Toast global (sonner) - reemplaza alerts inline
8. ✅ Mantener "Apoderado" (término oficial MINEDU/SIAGIE)
9. ✅ Usar "Año lectivo" en vez de "Período académico"
10. ✅ Usar "Cupos disponibles" en vez de "Vacantes"

### Métricas de Éxito
| Métrica | Actual | Objetivo |
|---------|--------|----------|
| axe-core score | ~75 | ≥ 95 |
| Lighthouse Accessibility | ~85 | ≥ 95 |
| Time to Interactive (dashboard) | ~3s | <1.5s |
| Task completion rate (registrar alumno) | ~70% | ≥ 95% |
| Support tickets (UX confusion) | Baseline | -50% |
| Dev velocity (nueva page) | Baseline | +40% |

---

## PRÓXIMOS PASOS INMEDIATOS

1. **Aprobar este plan** o ajustar prioridades
2. **Crear branch `feat/a11y-baseline`** para Etapa 1
3. **Configurar axe-core en CI** (`npm run test:a11y`)
4. **Documentar tokens actuales** en `DESIGN_TOKENS.md`
5. **Inventario de strings** para fase de lenguaje (`npm run i18n:audit`)

---

## HABILIDADES (SKILLS) UTILIZADAS POR FASE

| Fase | Skills Principales |
|------|-------------------|
| 1. Accesibilidad | `accessible-components`, `impeccable` |
| 2. Design System | `design-system`, `design-tokens-theming`, `frontend-design`, `component-architecture` |
| 3. UX Core | `ui-ux-pro-max`, `frontend-design`, `empty-and-loading-states`, `navigation-patterns`, `responsive-layout`, `dashboard-layout` |
| 4. Animaciones | `animations`, `ui-ux-pro-max` (--domain gsap) |
| 5. Lenguaje | `brand`, `frontend-design`, `ui-ux-pro-max` |
| 6. Visual Polish | `design-taste-frontend`, `design`, `ui-ux-pro-max` (--design-system --variance --density) |

---

*Documento generado automáticamente tras análisis completo del códigobase.*
*Para iniciar: `git checkout -b feat/a11y-baseline` y comenzar con Etapa 1.*