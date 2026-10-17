# Design System — Khipu Escolar (frontend dashboard)

Sistema de diseño del dashboard de gestión escolar. Stack: React 19 + Vite + Tailwind CSS v4 + shadcn/ui (registry nuevo, base-ui) + sonner + tw-animate-css + lucide-react.

## 1. Tokens

Definidos en `src/index.css` (`@theme inline` + bloques `:root` / `.dark`). Usan **OKLCH** para consistencia entre temas.

### Color

| Token | Uso |
|---|---|
| `--background` / `--foreground` | Fondo y texto base |
| `--card` / `--card-foreground` | Superficies (Card) |
| `--popover` / `--popover-foreground` | Menús, diálogos |
| `--primary` / `--primary-foreground` | Acciones principales, marca |
| `--secondary`, `--muted` (+ foreground) | Superficies suaves |
| `--accent` (+ foreground) | Resaltados contextuales |
| `--destructive` | Acciones destructivas y errores |
| `--border` / `--input` | Bordes e inputs (contraste AA verificado) |
| `--ring` | Foco visible |
| `--chart-1…5` | Visualizaciones (barras, donuts) |
| `--sidebar-*` | Navegación lateral |

### Tipografía
- Sans: `Geist Variable` (auto-cargada). Mono: `Geist Mono Variable`.
- Jerarquía: títulos con `tracking-tight`, cuerpo `text-sm` por defecto en componentes.

### Radio y espaciado
- `--radius: 0.625rem` (escala `radius-sm…4xl` derivada).
- Espaciado vía sistema Tailwind (`--spacing`). No inventar valores ad-hoc.

### Motion (solo funcional)
| Token | Valor |
|---|---|
| `--motion-fast` | 150ms ease-out |
| `--motion-base` | 200ms ease-out |
| `--motion-slow` | 300ms ease-in-out |
| `--ease-smooth` | cubic-bezier(0.16,1,0.3,1) |

Regla: animaciones solo de **feedback funcional** (press, focus, modales, sidebar). No animar cards/rows decorativamente. Se respeta `prefers-reduced-motion`.

## 2. Tema y dark mode

- `@custom-variant dark (&:is(.dark *))` + bloque `.dark` con tokens paralelos.
- Charts: usar `--chart-*` (flip automático en dark). Barras CSS-only en `src/features/dashboard`.

## 3. Densidad

Token `--density` (normal = 1, compacto = 0.72):

```html
<div data-density="compact">…</div>
```

Aplica a tablas (celdas + `font-size`) para contextos de listado (dashboard, reportes). Los formularios conservan densidad normal. Definido en `src/index.css` (sección DENSITY).

## 4. Componentes base

### `src/components/ui/` (shadcn/ui + variantes CVA en `variants.ts`)
`alert`, `badge`, `button`, `card`, `dialog`, `input`, `label`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`, `tabs`, `toast-provider` (sonner).

`variants.ts` es la única fuente de variantes (button/badge/card/input).

### `src/components/common/`
`PageHeader`, `EmptyState`, `LoadingState` (variants `table|cards`), `ErrorState`, `InlineError`, `FilasSkeleton` (filas de skeleton para tablas, props `columnas`/`filas`), `CampoFormulario` (label asociado `htmlFor={id}` + error accesible `role="alert"`), `TableResponsive` (+ `Column`, `TableSort`, `SortDirection`), `Paginacion`, `CommandPalette` (Ctrl/Cmd+K).

### Layout
`AppShell` + `SidebarProvider` (persistencia en `localStorage`, clave `sidebar.state`), `Header`, `AppSidebar`. Guard de permisos `<Can>` / `useFilteredNav`.

## 5. Estados de UI

- **Carga**: `LoadingState` con skeletons; en tablas, `FilasSkeleton` dentro de `<TableBody>` con `aria-busy="true"` en la tabla.
- **Vacío**: `EmptyState` con CTA (`Aún no hay X. Registra el primero.`).
- **Error**: `ErrorState` con reintento + `InlineError` para formularios.
- **Feedback**: toasts globales (sonner) para éxito/error vía `src/lib/feedback.ts` (`notificarExito`/`notificarError`); confirmación destructiva siempre en Dialog.
- **Validación de formularios**: `CampoFormulario` (label `htmlFor` + error `role="alert"` con `id` predecible) y, cuando aplique, `aria-invalid`/`aria-describedby` en el control.

## 6. Lenguaje (contexto Perú — MINEDU/SIAGIE)

**Obligatorio:**
- `año lectivo` (nunca "período académico"), `Años lectivos` en navegación.
- `Dar de baja` / `Volver a activar` **solo para personas** (alumno, profesor, usuario). Cursos/grados: `Desactivar` / `Reactivar`.
- `Cupos disponibles` (nunca "Vacantes" en UI).
- `Tutor de aula`, `Esquema de calificación`, `Tipos de calificación`, `Plan de estudios`, `Asignación de docentes`.
- `Apoderado` y `Sección` se mantienen (términos oficiales).
- Acción destructiva: mantener `Eliminar` + confirmación "Esta acción no se puede deshacer".

## 7. Accesibilidad (WCAG 2.2 AA)

- `aria-label` en botones icono-only; `scope="col"` en `TableHead`.
- `htmlFor`/`id` en todos los inputs.
- `focus-visible:ring-2` global en button/input/select.
- Estados no solo-color: badges de nivel logro con icono + texto (`Destacado/Logrado/En proceso/En inicio`).
- Tablas responsive accesibles (`TableResponsive`), paginación con `aria-current` y `aria-live`.

## 8. Verificación

```bash
npx tsc -b
npm run build
npm run test:smoke
npx oxlint <archivos>
```

## 9. Convenciones de código

- `verbatimModuleSyntax`: imports de tipos con `import type`.
- No añadir comentarios salvo lo indispensable.
- Strings de UI en español (ver §6); identificadores/API en inglés.