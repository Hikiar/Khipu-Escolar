# Plan de implementación — Fase 2 (P3, P9, P10, P11) — Khipu Escolar

> Autor: Big Pickle (subagente de planificación/arquitectura/documentación).
> Fecha: 2026-10-10.
> Alcance: plan DETALLADO que MiMo V2 Pro seguirá al pie de la letra para
> implementar la Fase 2 del plan `plan-frontend-ux.md` (§4): **P3** (terminología),
> **P9** (carga compartida), **P10** (feedback unificado) y **P11** (formularios
> accesibles). **No se modifica código fuente en este documento**; es la
> especificación de implementación.
> Documentos relacionados: `plan-frontend-ux.md` (plan maestro), `AUDITORIA.md`,
> `DESIGN_SYSTEM.md`.

---

## 0. Estado de partida (verificado en código, 2026-10-10)

- **Fase 1 completada**: P1 (páginas huérfanas a `legacy/`), P2 (`apiClient`
  endurecido con `ApiError`), P15 (`AUDITORIA.md` alineado).
- **`<Toaster />` de sonner YA está montado**: `src/components/layout/AppShell.tsx:46`
  renderiza `<ToastProvider />` (definido en `src/components/ui/toast-provider.tsx`),
  que monta `<Toaster position="top-right" theme="system">`. **No hay que montarlo
  de nuevo**; solo importar `toast` desde `'sonner'` en los módulos que lo usen.
  Único consumidor actual: `src/features/perfil/pages/MiPerfilPage.tsx:2,75`.
- **`useCarga` ya existe**: `src/hooks/useCarga.ts` exporta `EstadoCarga` y
  `useCarga<T>(fetcher, habilitado)` → `{ data, estado, error, recargar }`.
- **Componentes comunes ya existen**: `LoadingState`, `ErrorState` (con `onRetry`),
  `EmptyState`, `InlineError` en `src/components/common/` (exportados en `index.ts`).
- **14 archivos redefinen `type EstadoCarga`** localmente (ver §4.2).
- **`sonner@^2.0.8`, `react-hook-form@^7.87`, `zod@^4.6.1`, `@hookform/resolvers@^5.9.1`**
  están en `package.json` (verificado).

---

## 1. Tabla canónica de terminología (P3)

Regla: **toda etiqueta visible al usuario usa estos términos**. Los paréntesis
indican alias técnico/legado que puede seguir existiendo en código, servicios y
datos, pero **no** en copy visible.

| Término canónico | Significado | Alias técnico/legado (NO usar en copy) | Ejemplos de uso correcto |
|---|---|---|---|
| **Grado** | Año/nivel escolar (1.º de Primaria) | `grado`, `Grado` (código) | "Crear grado", "Grados y Secciones", "Grado del catálogo (CNEB)" |
| **Sección** | División de un grado (A, B, Única) | `seccion` | "Crear sección", "Sección A" |
| **Clase** | Grupo concreto: grado + sección + año lectivo (el "salón"/"aula") | `clase`, `salon`, `aula` | "Crear clase", "Matrículas de la clase", "Tutor de aula" (rol, se mantiene) |
| **Asignatura** | Materia que se dicta (Matemática) | `curso`, `Curso` (código) | "Añadir asignatura al plan", "Docentes asignados a asignaturas" |
| **Año lectivo** | Período académico (2027) | `periodo`, `PeriodoAcademico` | "Año lectivo activo", "Filtrar por año lectivo" |

Reglas derivadas:
1. **"Curso" no aparece en copy visible** salvo que sea parte de un nombre propio
   de módulo ya establecido ("Plan de estudios" no contiene "curso"; el módulo
   "Cursos" ya no existe en UI tras P1). En Reportes/Calificaciones, el filtro
   "Curso" pasa a "Asignatura".
2. **"Aula" solo se usa en el rol "Tutor de aula"** (nombre de rol, se mantiene).
   En cualquier otro copy visible, "aula"/"salón" → "clase".
3. **"Salón" no se usa en copy nuevo.** El título del módulo "Mis salones"
   (sidebar, `navigation.ts:34`) se mantiene en Fase 2 por ser nombre de producto
   y ruta establecida (`/mis-salones`, permiso `salones.mis`); **sus descripciones
   internas sí se unifican a "clase"**. Decisión de producto pendiente: renombrar
   el módulo a "Mis clases" (fuera de alcance de Fase 2).
4. **No se renombran identificadores** (`cursoId`, `claseId`, `listarCursos`,
   `gradoNombre`, etc.) ni valores de datos (`estado: 'ACTIVO'`, `alcance: 'AULA'`).
   Solo cambia el texto que lee el usuario.

---

## 2. P3 — Cambios de copy (archivo:línea, ACTUAL → PROPUESTO)

### 2.1 Descripciones de módulo (quitar "horarios")

| Archivo:línea | ACTUAL | PROPUESTO |
|---|---|---|
| `src/config/navigation.ts:45` | `description: 'Grados, plan de estudios, clases, asignaciones y horarios',` | `description: 'Grados, secciones, clases, asignaturas y plan de estudios',` |
| `src/features/planificacion/pages/PlanificacionPage.tsx:34` | `description="Grados, plan de estudios, clases, asignaciones y horarios"` | `description="Grados, secciones, clases, asignaturas y plan de estudios"` |

### 2.2 `src/features/planificacion/components/AsignacionesTab.tsx`

| Línea | ACTUAL | PROPUESTO |
|---|---|---|
| 219 | `description="Docentes asignados a cursos por clase"` | `description="Docentes asignados a asignaturas por clase"` |
| 237 | `: 'Relación docente-curso-clase'}` | `: 'Relación docente-asignatura-clase'}` |
| 260 y 282 | `<TableHead>Curso</TableHead>` | `<TableHead>Asignatura</TableHead>` |
| 326 | `Asigne un docente a un curso en una clase específica` | `Asigne un docente a una asignatura en una clase específica` |
| 353 | `<InputConLabel label="Curso" id="asig-curso" required>` | `<InputConLabel label="Asignatura" id="asig-curso" required>` (el `id` NO cambia) |
| 361 | `'Seleccionar curso'` | `'Seleccionar asignatura'` |
| 393 | `¿Tutor generalista de Primaria? Asigne todos los cursos de una vez con un solo clic.` | `¿Tutor generalista de Primaria? Asigne todas las asignaturas de una vez con un solo clic.` |
| 402 | `'Asignar todos los cursos del aula'` | `'Asignar todas las asignaturas de la clase'` |
| 432 | `... al curso ${asignacionAEliminar.curso.codigo} en ...` | `... a la asignatura ${asignacionAEliminar.curso.codigo} en ...` |

### 2.3 `src/features/planificacion/components/PlanEstudiosTab.tsx`

| Línea | ACTUAL | PROPUESTO |
|---|---|---|
| 279 | `· Cursos asignados con sus horas semanales y orden` | `· Asignaturas del plan con sus horas semanales y orden` |
| 286 y 322 | `Añadir curso al plan` | `Añadir asignatura al plan` |
| 297 y 335 | `<TableHead>Curso</TableHead>` | `<TableHead>Asignatura</TableHead>` |
| 315 | `Sin cursos en el plan` | `Sin asignaturas en el plan` |
| 317 | `Añade cursos a este grado para definir su currícula` | `Añade asignaturas a este grado para definir su currícula` |
| 401 | `Añadir curso al plan de estudios` | `Añadir asignatura al plan de estudios` |
| 403 | `Selecciona un curso y configura las horas semanales...` | `Selecciona una asignatura y configura las horas semanales...` |
| 417 | `<Label htmlFor="cursoId">Curso</Label>` | `<Label htmlFor="cursoId">Asignatura</Label>` (el `id` NO cambia) |
| 420 | `placeholder="Seleccionar curso"` | `placeholder="Seleccionar asignatura"` |
| 424 | `Cargando cursos…` | `Cargando asignaturas…` |
| 427 | `No hay cursos disponibles para añadir` | `No hay asignaturas disponibles para añadir` |
| 476 | `Editar curso en el plan` | `Editar asignatura en el plan` |
| 530 | `Quitar curso del plan` | `Quitar asignatura del plan` |
| 561 | `Asignaciones del curso <strong>...` | `Asignaciones de la asignatura <strong>...` |
| 572 | `No hay docentes asignados a este curso en este grado` | `No hay docentes asignados a esta asignatura en este grado` |

### 2.4 `src/features/mis-salones/pages/MisSalonesPage.tsx`

| Línea | ACTUAL | PROPUESTO |
|---|---|---|
| 111 | `'Los salones donde dictas clases o eres tutor de aula'` | `'Las clases donde dictas asignaturas o eres tutor de aula'` |
| 129 | `title="Aún no tienes salones asignados"` | `title="Aún no tienes clases asignadas"` |
| 130 | `Cuando el director te asigne cursos o te designe tutor de un aula...` | `Cuando el director te asigne asignaturas o te designe tutor de un aula...` |
| 233 | `Sin alumnos matriculados en este salón.` | `Sin alumnos matriculados en esta clase.` |

> Nota: el título del módulo "Mis salones" (`MisSalonesPage.tsx:108`) se mantiene
> (ver regla 3 de §1).

### 2.5 Otras etiquetas visibles que mezclan términos

| Archivo:línea | ACTUAL | PROPUESTO |
|---|---|---|
| `src/features/dashboard/pages/DashboardPage.tsx:291` | `` `${matriculas.porClase.length} aulas · ${matriculas.totalAlumnos} matriculados` `` | `` `${matriculas.porClase.length} clases · ${matriculas.totalAlumnos} matriculados` `` |
| `src/features/dashboard/pages/DashboardPage.tsx:387` | `Matrículas por aula` | `Matrículas por clase` |
| `src/features/dashboard/pages/DashboardPage.tsx:388` | `Matriculados frente a cupos disponibles por aula.` | `Matriculados frente a cupos disponibles por clase.` |
| `src/features/reportes/pages/ReportesPage.tsx:296` | `titulo="Matrículas por aula"` | `titulo="Matrículas por clase"` |
| `src/features/reportes/pages/ReportesPage.tsx:422` | `filtrables por clase, curso (alcance CURSO) y rango de fechas.` | `filtrables por clase, asignatura (alcance CURSO) y rango de fechas.` |
| `src/features/reportes/pages/ReportesPage.tsx:447` | `<Label htmlFor="asis-curso">Curso</Label>` | `<Label htmlFor="asis-curso">Asignatura</Label>` |
| `src/features/reportes/pages/ReportesPage.tsx:449` | `aria-label="Curso"` | `aria-label="Asignatura"` |
| `src/features/reportes/pages/ReportesPage.tsx:450` | `placeholder="Todos los cursos"` | `placeholder="Todas las asignaturas"` |
| `src/features/reportes/pages/ReportesPage.tsx:602` | `<Label htmlFor="eval-curso">Curso</Label>` | `<Label htmlFor="eval-curso">Asignatura</Label>` |
| `src/features/profesores/pages/ProfesorFichaPage.tsx:136` | `Este docente todavía no tiene cursos asignados en ninguna aula.` | `Este docente todavía no tiene asignaturas asignadas en ninguna clase.` |
| `src/features/profesores/pages/ProfesorFichaPage.tsx:154` | `Aula, curso y horas semanales de cada asignación en este periodo.` | `Clase, asignatura y horas semanales de cada asignación en este periodo.` |
| `src/features/profesores/pages/ProfesorFichaPage.tsx:161` | `<TableHead>Aula</TableHead>` | `<TableHead>Clase</TableHead>` |
| `src/features/profesores/pages/ProfesorFichaPage.tsx:206` | `Aulas donde el docente ejerce como tutor.` | `Clases donde el docente ejerce como tutor.` |
| `src/features/profesores/pages/ProfesorFichaPage.tsx:213` | `<TableHead>Aula</TableHead>` | `<TableHead>Clase</TableHead>` |
| `src/features/alumnos/pages/AlumnoFichaPage.tsx:235` | `Año lectivo, aula, estado y fechas de cada matrícula del alumno.` | `Año lectivo, clase, estado y fechas de cada matrícula del alumno.` |
| `src/features/alumnos/pages/AlumnoFichaPage.tsx:243` | `<TableHead>Aula</TableHead>` | `<TableHead>Clase</TableHead>` |
| `src/features/alumnos/pages/AlumnoFichaPage.tsx:313` | `<TableHead>Aula</TableHead>` | `<TableHead>Clase</TableHead>` |
| `src/features/alumnos/pages/AlumnoFichaPage.tsx:327` | `{r.alcance === 'AULA' ? 'Aula' : 'Por curso'}` | `{r.alcance === 'AULA' ? 'Clase' : 'Por asignatura'}` |
| `src/features/asistencia/pages/AsistenciaPage.tsx:127` | `nombre: 'Aula (tutor)'` | `nombre: 'Clase (tutor)'` |
| `src/features/asistencia/pages/AsistenciaPage.tsx:133` | `nombre: 'Aula (tutor)'` | `nombre: 'Clase (tutor)'` |
| `src/features/asistencia/pages/AsistenciaPage.tsx:541` | `{registro?.cursoId ? ' · por curso' : ' · por aula'}` | `{registro?.cursoId ? ' · por asignatura' : ' · por clase'}` |
| `src/features/auth/pages/LoginPage.tsx:13` | `'Matrículas y cupos por aula',` | `'Matrículas y cupos por clase',` |
| `src/features/auth/pages/LoginPage.tsx:44` | `Todas tus aulas, una sola plataforma.` | `Todas tus clases, una sola plataforma.` |
| `src/features/calificaciones/pages/CalificacionesPage.tsx:499` | `<Label>Curso</Label>` | `<Label>Asignatura</Label>` |
| `src/features/calificaciones/pages/CalificacionesPage.tsx:502` | `'Seleccionar curso'` | `'Seleccionar asignatura'` |

### 2.6 Opcional (mejora de precisión, bajo riesgo)

| Archivo:línea | ACTUAL | PROPUESTO |
|---|---|---|
| `src/features/planificacion/components/GradosTab.tsx:449` | `'Registra un nuevo nivel educativo'` | `'Registra un nuevo grado'` |

### 2.7 Sin cambios (verificado)

- `MatriculasPage.tsx`: ya usa terminología canónica ("Clase", "Alumno",
  "Matrícula"). Su trabajo está en P10/P11.
- `GradosTab.tsx` y `ClasesTab.tsx`: "Grados y Secciones", "Sección", "Grado",
  "Año lectivo", "Tutor de aula" (rol) son canónicos. No requieren copy.
- `ClasesAgrupadas.tsx`: renderiza datos (`gradoCodigo — gradoNombre · seccionNombre · periodoCodigo`), no copy.

---

## 3. P9 — Mecanismo de carga compartido

### 3.1 Especificación

**Tipo canónico** (ya existe, NO se duplica):
- `src/hooks/useCarga.ts:4` → `export type EstadoCarga = 'cargando' | 'ok' | 'error'`

**Nuevo componente compartido** — `src/components/common/FilasSkeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

/** Filas de skeleton para tablas (dentro de <TableBody>). Sustituye los 14 duplicados locales. */
export function FilasSkeleton({ columnas = 5, filas = 4 }: { columnas?: number; filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }, (_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columnas }, (_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
```

- Exportar desde `src/components/common/index.ts` (añadir `export { FilasSkeleton } from "./FilasSkeleton"`).
- **Nota de diseño**: los skeletons locales usan anchos distintos por columna
  (`w-32`, `w-40`, etc.). El compartido usa `w-24` uniforme. Es aceptable: los
  skeletons son decorativos (`aria-busy="true"` en la tabla) y la diferencia
  visual es imperceptible. No intentar replicar anchos por columna.

**Componentes de estado ya existentes que se usan como patrón destino**:
- `ErrorState` (`src/components/common/ErrorState.tsx`): `Alert` destructivo +
  botón "Reintentar" (`onRetry`). Para errores de carga.
- `EmptyState` (`src/components/common/EmptyState.tsx`): tarjeta con icono + CTA.
  Para vacíos a nivel de tarjeta/página.
- `LoadingState` (`src/components/common/LoadingState.tsx`): variantes
  `table|card|list|inline`. Para páginas que ya lo usan (MisSalones, AlumnoFicha,
  ProfesorFicha, Alumnos).

### 3.2 Migración — alcance explícito de Fase 2

**A. Unificación de tipo (14 archivos, mecánico, riesgo bajo):**
Reemplazar la línea local `type EstadoCarga = 'cargando' | 'ok' | 'error'` por
`import { type EstadoCarga } from '@/hooks/useCarga'` (añadir al import existente
de `@/hooks/...` o crear uno nuevo). Archivos:

| Archivo | Línea local |
|---|---|
| `src/features/mis-salones/pages/MisSalonesPage.tsx` | 42 |
| `src/features/alumnos/pages/AlumnosPage.tsx` | 39 |
| `src/features/calificaciones/pages/CalificacionesPage.tsx` | 44 |
| `src/features/matriculas/pages/MatriculasPage.tsx` | 59 |
| `src/features/usuarios/pages/UsuariosPage.tsx` | 67 |
| `src/features/admin/pages/ModelosPage.tsx` | 28 |
| `src/features/asistencia/pages/AsistenciaPage.tsx` | 31 |
| `src/features/roles/pages/RolesPage.tsx` | 27 |
| `src/features/planificacion/hooks/usePlanificacion.ts` | 18 |
| `src/features/planificacion/components/AsignacionesTab.tsx` | 28 |
| `src/features/periodos/pages/PeriodosPage.tsx` | 45 |
| `src/features/reportes/pages/ReportesPage.tsx` | 51 |
| `src/features/pagos/pages/PagosPage.tsx` | 65 |
| `src/features/profesores/pages/ProfesoresPage.tsx` | 74 |

**B. Sustitución de `FilasSkeleton` local por el compartido (14 archivos):**
Eliminar la función local `FilasSkeleton` y usar `import { FilasSkeleton } from '@/components/common'`.
Archivos: `GradosTab.tsx:56`, `ClasesTab.tsx:49`, `PlanEstudiosTab.tsx:60`,
`AsignacionesTab.tsx:30`, `MatriculasPage.tsx:61`, `PeriodosPage.tsx:64`,
`UsuariosPage.tsx:72`, `ModelosPage.tsx:38`, `RolesPage.tsx:29`,
`AsistenciaPage.tsx:57`, `PagosPage.tsx:88`, `ReportesPage.tsx:82`,
`CalificacionesPage.tsx:51`, `ProfesoresPage.tsx:147`.
> Ojo: `CalificacionesPage.tsx:564,639,703` y `PagosPage.tsx:386,489` llaman a
> `FilasSkeleton` con `columnas` distintas; el compartido acepta `columnas`.

**C. Migración a `ErrorState`/`EmptyState` de los 3 peores duplicados (Fase 2):**

1. **`MatriculasPage.tsx`**:
   - Líneas 288-302 (error `Alert` + botón reintento) → `<ErrorState message={error ?? 'No se pudieron cargar las matrículas.'} onRetry={reintentar} />`.
   - Líneas 321-325 (vacíos `<p>`) → mantener `<p>` inline estandarizado (ver §3.3), porque está dentro de `CardContent` y `EmptyState` renderiza un `Card` anidado (feo).
2. **`AsignacionesTab.tsx`**:
   - Líneas 241-253 (error `Alert` + botón reintento) → `<ErrorState message={error ?? 'No se pudieron cargar las asignaciones.'} onRetry={reintentar} />`.
   - Líneas 271-275 (vacíos `<p>`) → `<p>` inline estandarizado.
3. **`PeriodosPage.tsx`**:
   - Líneas 187-193 (error `Alert` sin reintento) → `<ErrorState message={errorCarga ?? 'No se pudieron cargar los años lectivos.'} onRetry={() => void cargar()} />`.
   - Líneas 216-222 (vacíos `TableRow`) → mantener `TableRow` con `colSpan` (está dentro de `<Table>`).

**D. Diferido explícitamente (NO migrar a `useCarga` en Fase 2):**
`AlumnosPage`, `CalificacionesPage`, `UsuariosPage`, `ModelosPage`, `AsistenciaPage`,
`RolesPage`, `ReportesPage`, `PagosPage`, `ProfesoresPage`, `GradosTab`, `ClasesTab`,
`PlanEstudiosTab`, `usePlanificacion`. Estos conservan su gestión de estado manual
(ya correcta); en Fase 2 solo reciben la unificación de tipo (A) y de skeleton (B).
La adopción plena de `useCarga` en estos archivos queda para una fase posterior.

> **Advertencia para MiMo**: `useCarga` solo re-ejecuta el fetcher cuando cambia
> `habilitado` (no cuando cambia el fetcher). Para cargas dependientes de un id
> (p. ej. matrículas por `claseId`), NO migrar a `useCarga` sin añadir un
> `useEffect(() => { void recargar() }, [claseId])` explícito. Por eso MatriculasPage
> conserva su estado manual en Fase 2.

### 3.3 Patrón de "sin datos" estandarizado

- **A nivel de tarjeta/página** (con icono y CTA): `EmptyState` (ya usado en
  MisSalonesPage, AlumnoFichaPage, ProfesorFichaPage).
- **Dentro de `CardContent` o `<Table>`**: `<p className="py-8 text-center text-sm text-muted-foreground">…</p>`
  (o `TableRow` con `colSpan` si está dentro de `<TableBody>`). Este es el patrón
  que se aplica en MatriculasPage y AsignacionesTab.

---

## 4. P10 — Política de feedback unificado

### 4.1 Reglas

| Situación | Mecanismo | Texto |
|---|---|---|
| Éxito de mutación (crear/editar/eliminar/retirar/anular/activar/cerrar) | `toast.success` | Ver tabla §4.3 |
| Error de negocio de mutación (`res.ok === false`) | `toast.error(res.error)` | Mensaje del backend; fallback `'No se pudo completar la acción. Intenta nuevamente.'` |
| Error de transporte (`ApiError` lanzada) en mutación | `toast.error(err.message)` | Mensaje amigable ya definido en `apiClient.ts:40-42` |
| Error de carga de datos | `ErrorState` (Alert destructivo + Reintentar) | `'No se pudieron cargar …'` + detalle |
| Error de validación de formulario (cliente) | Inline por campo (P11) | Mensaje del schema/manual |
| Confirmación destructiva | `Dialog` de shadcn (nunca `confirm()` nativo) | Texto del diálogo existente |
| Errores informativos de contexto (sin acción) | `Alert` no destructivo o texto inline | — |

**Regla de oro**: éxito → toast; error de carga → `ErrorState` con reintento;
error de mutación → `toast.error`; validación → por campo. **Se elimina el
`div role="alert"` de `PlanificacionPage.tsx:48`** → `<ErrorState message={error} onRetry={() => void recargarTodo()} />`.

### 4.2 Montaje del `<Toaster />`

**Confirmado: YA está montado.** `src/components/layout/AppShell.tsx:46` →
`<ToastProvider />` → `src/components/ui/toast-provider.tsx:7` → `<Toaster position="top-right" theme="system">`.
No se requiere ningún cambio de montaje. Los módulos solo deben `import { toast } from 'sonner'`.

### 4.3 Helper opcional para uniformidad — `src/lib/feedback.ts` (NUEVO)

```ts
import { toast } from 'sonner'

export function notificarExito(accion: string, detalle?: string) {
  toast.success(accion, detalle ? { description: detalle } : undefined)
}

export function notificarError(mensaje: string) {
  toast.error(mensaje || 'No se pudo completar la acción. Intenta nuevamente.')
}
```

Convención de textos de éxito (usar estos verbos en pretérito):

| Acción | `toast.success` |
|---|---|
| Crear grado/sección/clase/asignación/asignatura del plan/año lectivo/matrícula | `'Grado creado'`, `'Sección creada'`, `'Clase creada'`, `'Asignación creada'`, `'Asignatura añadida al plan'`, `'Año lectivo creado'`, `'Matrícula registrada'` |
| Editar | `'Cambios guardados'` |
| Eliminar | `'Registro eliminado'` |
| Retirar matrícula | `'Matrícula retirada'` |
| Anular matrícula | `'Matrícula anulada'` |
| Activar/cerrar año lectivo | `'Año lectivo activado'` / `'Año lectivo cerrado'` |
| Asignación masiva | `'Asignaciones creadas'` (description: `'Se asignaron N asignaturas'`) |

### 4.4 Mutaciones a migrar en Fase 2 (archivo:línea)

| Archivo | Mutación | Líneas | Cambio |
|---|---|---|---|
| `MatriculasPage.tsx` | `enviarRegistro` éxito | 206-209 | `setMensajeExito(...)` + temporizador → `notificarExito('Matrícula registrada')`; **eliminar** estado `mensajeExito` (116, 159, 206-209) y el `Alert` de éxito (254-259) |
| `MatriculasPage.tsx` | `enviarRegistro` error | 201-203 | `setFormError(...)` → `notificarError(resultado.error)` (el diálogo permanece abierto) |
| `MatriculasPage.tsx` | `ejecutarAccion` éxito | 228-229 | → `notificarExito(dialogoAccion.tipo === 'retirar' ? 'Matrícula retirada' : 'Matrícula anulada')` |
| `MatriculasPage.tsx` | `ejecutarAccion` error | 224-226 | `setAccionError(...)` → `notificarError(resultado.error)` |
| `GradosTab.tsx` | `enviarGrado` éxito | 159 | → `notificarExito(dialogoGrado.modo === 'crear' ? 'Grado creado' : 'Cambios guardados')` |
| `GradosTab.tsx` | `enviarGrado` error | 155-157 | `setFormGradoErrores({ codigo: res.error })` → `notificarError(res.error)` |
| `GradosTab.tsx` | `manejarEliminarGrado` | 162-170 | **Reemplazar `confirm()` (163) por `Dialog`** (reutilizar patrón del diálogo de sección, líneas 606-627); `alert(res.error)` (166) → `notificarError`; éxito (169) → `notificarExito('Grado eliminado')` |
| `GradosTab.tsx` | `enviarSeccion` éxito | 207-208 | → `notificarExito('Sección creada' / 'Cambios guardados')` |
| `GradosTab.tsx` | `enviarSeccion` error | 203-205 | → `notificarError(res.error)` |
| `GradosTab.tsx` | `manejarEliminarSeccion` | 215-226 | `alert(res.error)` (221) → `notificarError`; éxito (224-225) → `notificarExito('Sección eliminada')` |
| `ClasesTab.tsx` | `enviarClase` éxito | 222-223 | → `notificarExito('Clase creada' / 'Cambios guardados')` |
| `ClasesTab.tsx` | `enviarClase` error | 218-220 | → `notificarError(res.error)` |
| `ClasesTab.tsx` | `manejarEliminarClase` | 230-241 | `alert(res.error)` (236) → `notificarError`; éxito (239-240) → `notificarExito('Clase eliminada')` |
| `AsignacionesTab.tsx` | `enviarCrear` éxito | 175-176 | → `notificarExito('Asignación creada')` |
| `AsignacionesTab.tsx` | `enviarCrear` error | 171-173 | `setErrorDialogo(...)` → `notificarError(res.error)` |
| `AsignacionesTab.tsx` | `enviarMasivo` éxito | 190-195 | `setMensajeMasivo(...)` → `notificarExito('Asignaciones creadas', 'Se asignaron N asignaturas…')`; **eliminar** estado `mensajeMasivo` (80, 194) y el `<p role="status">` (404-408) |
| `AsignacionesTab.tsx` | `enviarMasivo` error | 186-188 | → `notificarError(res.error)` |
| `AsignacionesTab.tsx` | `enviarEliminar` éxito | 211-212 | → `notificarExito('Asignación eliminada')` |
| `AsignacionesTab.tsx` | `enviarEliminar` error | 207-209 | → `notificarError(res.error)` |
| `PlanEstudiosTab.tsx` | `enviarAgregar` éxito | 184-185 | → `notificarExito('Asignatura añadida al plan')` |
| `PlanEstudiosTab.tsx` | `enviarAgregar` error | 180-182 | → `notificarError(res.error)` |
| `PlanEstudiosTab.tsx` | `enviarEditar` éxito | 201 | → `notificarExito('Cambios guardados')` |
| `PlanEstudiosTab.tsx` | `enviarEditar` error | 197-199 | → `notificarError(res.error)` |
| `PlanEstudiosTab.tsx` | `enviarQuitar` éxito | 213-214 | → `notificarExito('Asignatura quitada del plan')` |
| `PlanEstudiosTab.tsx` | `enviarQuitar` error | 209-211 | → `notificarError(res.error)` |
| `PeriodosPage.tsx` | `handleCrearPeriodo` éxito | 135-138 | → `notificarExito('Año lectivo creado')` |
| `PeriodosPage.tsx` | `handleCrearPeriodo` error | 139-141 | → `notificarError(extraerError(res))` |
| `PeriodosPage.tsx` | `handleConfirmarAccion` éxito | 153-155 | → `notificarExito(confirmacion.accion === 'activar' ? 'Año lectivo activado' : 'Año lectivo cerrado')` |
| `PeriodosPage.tsx` | `handleConfirmarAccion` error | 156-158 | → `notificarError(extraerError(res))` |
| `PlanificacionPage.tsx` | error de carga global | 47-51 | `div role="alert"` → `<ErrorState message={error} onRetry={() => void recargarTodo()} />` |

> **Decisión sobre `alert()`/`confirm()` nativos**: se reemplazan en Fase 2 porque
> el riesgo es bajo (el patrón `Dialog` de confirmación ya existe en los mismos
> archivos). Quedan **0** `alert()`/`confirm()` en `src/` al terminar.
> Los `Alert` de error dentro de diálogos de formulario (p. ej. `formError` en
> MatriculasPage:414-420, `errorDialogo` en AsignacionesTab:329-335) se sustituyen
> por `notificarError`; los errores de validación por campo van inline (P11).

---

## 5. P11 — Formularios accesibles

### 5.1 Patrón destino

**Nuevo componente compartido** — `src/components/common/CampoFormulario.tsx`
(extraído del `InputConLabel` de `AsignacionesTab.tsx:46-66`):

```tsx
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

export function CampoFormulario({
  label, id, children, required = false, error,
}: {
  label: string
  id: string
  children: ReactNode
  required?: boolean
  error?: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
      {error && <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}
```

- Exportar desde `src/components/common/index.ts`.
- **Contrato de uso**: el `<p>` de error tiene `id={`${id}-error`}`. El llamador
  debe cablear en el control (`<Input>` o `<SelectTrigger>`):
  - `aria-invalid={!!error}`
  - `aria-describedby={error ? `${id}-error` : undefined}`
  - El `id` del control debe coincidir con el `id` del `CampoFormulario`
    (en `Select`, el `id` va en `<SelectTrigger id={id}>`, no en `<Select>`).
- **Consumidores en Fase 2**: `AsignacionesTab.tsx` (reemplazar su `InputConLabel`
  local por el compartido) y `MatriculasPage.tsx` (diálogo "Registrar matrícula").
  Los diálogos de GradosTab/ClasesTab/PlanEstudiosTab ya tienen `Label htmlFor` +
  `Input id` correctos; **no** se obliga a migrarlos (opcional, bajo riesgo).

### 5.2 Inventario de formularios (estado actual → destino)

**Prioridad 1 — `MatriculasPage.tsx` (foco principal):**

| Línea | Campo | Estado actual | Destino |
|---|---|---|---|
| 263 | Filtro "Clase" | `<Label className="mb-1.5 block">Clase</Label>` sin `htmlFor` | `htmlFor="filtro-clase"` + `<SelectTrigger id="filtro-clase">` |
| 424 | "Alumno" (diálogo) | `<Label>Alumno</Label>` sin `htmlFor` | `htmlFor="mat-alumno"` + `<SelectTrigger id="mat-alumno">` |
| 440 | "Clase" (diálogo) | `<Label>Clase</Label>` sin `htmlFor` | `htmlFor="mat-clase"` + `<SelectTrigger id="mat-clase">` |
| 452 | "Observaciones (opcional)" | **YA tiene** `htmlFor="obs"` + `Input id="obs"` (correcto) | Sin cambios (nota: el diagnóstico original citaba 452 como ofensor; verificado: no lo es) |
| 414-420 | Error global del formulario | `Alert` destructivo | `notificarError` (P10); el diálogo permanece abierto |
| — | Validación | Manual, solo al enviar | Mantener validación manual consistente (aceptado por el plan) + `aria-invalid`/`aria-describedby` en los selects cuando `formError` esté presente |

**Prioridad 2 — labels de filtros sin `htmlFor` (mismo patrón: `htmlFor` + `id` en `SelectTrigger`):**

| Archivo:línea | Campo |
|---|---|
| `src/features/alumnos/pages/AlumnosPage.tsx:303` | "Filtrar por estado" |
| `src/features/profesores/pages/ProfesoresPage.tsx:462` | "Filtrar por estado" |
| `src/features/planificacion/components/ClasesTab.tsx:264` | "Filtrar por año lectivo" |
| `src/features/planificacion/components/ClasesTab.tsx:275` | "Grado" |
| `src/features/pagos/pages/PagosPage.tsx:298` | "Alumno" (filtro) |
| `src/features/calificaciones/pages/CalificacionesPage.tsx:488` | "Clase" |
| `src/features/calificaciones/pages/CalificacionesPage.tsx:499` | "Asignatura" (tras P3) |
| `src/features/asistencia/pages/AsistenciaPage.tsx:450` | "Fecha" |
| `src/features/asistencia/pages/AsistenciaPage.tsx:455` | "Alcance" |

**Prioridad 3 — campos de diálogo sin `htmlFor` (opcional en Fase 2, o diferir):**

| Archivo:línea | Campo |
|---|---|
| `src/features/pagos/pages/PagosPage.tsx:588` | "Concepto" |
| `src/features/pagos/pages/PagosPage.tsx:617` | "Método de pago" |
| `src/features/asistencia/pages/AsistenciaPage.tsx:545` | "Observaciones del registro" |
| `src/features/calificaciones/pages/CalificacionesPage.tsx:787,800,804,808,874,878,959,963` | Campos de trabajos/exámenes/resultados |

**Sin cambios (ya accesibles o no son campos):**
- `LoginForm.tsx:65-96` (htmlFor + aria-invalid + aria-describedby — patrón de referencia).
- `MiPerfilPage.tsx:163-199` (htmlFor + error por campo).
- `PeriodosPage.tsx:288-324`, `UsuariosPage.tsx:554-646`, `ModelosPage.tsx:314-365`,
  `ReportesPage.tsx:432-467`, `GradosTab.tsx:470-591`, `ClasesTab.tsx:415-498`,
  `PlanEstudiosTab.tsx:417-513`, `AlumnosPage.tsx:432-496`, `ProfesoresPage.tsx:725-901`
  (todos con `htmlFor` + `id` correctos).
- `ProfesoresPage.tsx:87,129` (labels de grupo con `role="group"` + `aria-label` — aceptable).
- `UsuariosPage.tsx:804`, `ProfesoresPage.tsx:1111` (labels de solo lectura, no campos).

---

## 6. Orden de implementación sugerido (para MiMo)

1. **P3 — Copy** (todo §2): cambios de string puros, sin dependencias. Hacerlo
   primero evita tocar los mismos archivos dos veces.
2. **P9a — Crear componentes nuevos**: `FilasSkeleton.tsx`, `CampoFormulario.tsx`
   (este último sirve a P11), exportarlos en `index.ts`. Archivos nuevos, sin conflicto.
3. **P9b — Unificación mecánica**: tipo `EstadoCarga` (14 archivos) + sustitución
   de `FilasSkeleton` local (14 archivos). Verificar `npm run build` antes de seguir.
4. **P11 — Accesibilidad**: `MatriculasPage` (labels + `CampoFormulario` +
   `aria-invalid`/`aria-describedby`) y filtros de Prioridad 2.
5. **P10 — Feedback**: crear `src/lib/feedback.ts`; migrar toasts y `ErrorState`
   en MatriculasPage, GradosTab, ClasesTab, AsignacionesTab, PlanEstudiosTab,
   PeriodosPage, PlanificacionPage; reemplazar `confirm()`/`alert()`.
   > **Importante**: MatriculasPage recibe cambios de P9b, P11 y P10. Hacer TODOS
   > los cambios de ese archivo en una sola pasada para evitar conflictos.
6. **Verificación final**: comandos de §8 + `npm run build` + `npx oxlint`.

---

## 7. Riesgos (top 5)

1. **`MatriculasPage.tsx` concentra P9+P10+P11** → alto riesgo de conflicto dentro
   del archivo. Mitigación: una sola pasada por archivo (paso 5 del orden).
2. **Unificación de tipo en 14 archivos** → riesgo de imports rotos o `EstadoCarga`
   sin usar. Mitigación: cambio mecánico + `npm run build` inmediato (paso 3).
3. **Reemplazo de `confirm()` por `Dialog` en GradosTab** → cambio de flujo UX
   (el `confirm()` nativo bloquea; el `Dialog` no). Mitigación: reutilizar el
   patrón `Dialog` ya existente en el mismo archivo (líneas 606-627) y mantener
   el mismo texto de confirmación.
4. **Migración ingenua a `useCarga` con dependencias** (p. ej. matrículas por
   `claseId`) → loops de recarga o datos obsoletos, porque `useCarga` no re-ejecuta
   al cambiar el fetcher. Mitigación: **no** migrar cargas dependientes en Fase 2
   (ver advertencia §3.2-D); conservar estado manual en MatriculasPage.
5. **Copy "Curso"→"Asignatura" en Reportes/Calificaciones** → posible confusión
   temporal para usuarios que conocen el filtro como "Curso". Mitigación: la tabla
   canónica (§1) define "Asignatura (curso)" como alias; el cambio es de etiqueta,
   no de datos. Riesgo bajo, pero es el cambio de copy más visible.

---

## 8. Criterios de aceptación (verificables)

```bash
# P3 — sin "horarios" ni mezclas en copy
rg -n "horarios" src/                                   # → 0 resultados
rg -n "por aula|por salón|en este salón|tus aulas|Todas tus aulas" src/   # → 0 resultados
rg -n ">Curso<|label=\"Curso\"|'Seleccionar curso'|'Todos los cursos'" src/features/planificacion src/features/reportes src/features/calificaciones   # → 0 resultados

# P9 — un solo EstadoCarga y un solo FilasSkeleton
rg -n "type EstadoCarga" src/                           # → solo src/hooks/useCarga.ts:4
rg -n "function FilasSkeleton" src/                     # → 0 resultados
rg -n "FilasSkeleton" src/features/                     # → todos importan de '@/components/common'

# P10 — sin alert/confirm nativos, sin mensajeExito manual
rg -n "\b(alert|confirm)\(" src/                        # → 0 resultados
rg -n "mensajeExito|setMensajeExito" src/               # → 0 resultados
rg -n "toast\.(success|error)" src/features/            # → presente en mutaciones migradas
rg -n "role=\"alert\"" src/features/planificacion/pages/PlanificacionPage.tsx   # → 0 (reemplazado por ErrorState)

# P11 — labels asociados
rg -n "<Label>" src/features/matriculas/                # → 0 resultados (todos con htmlFor)
rg -n "<Label[^>]*>[^<]*</Label>" src/features/matriculas/pages/MatriculasPage.tsx   # → 0

# Global
npm run build                                            # → sin errores
npx oxlint                                               # → sin errores nuevos
```

---

## 9. Trazabilidad

| Hallazgo (plan maestro) | Propuesta | Fase |
|---|---|---|
| C4, C5 | P3 | Fase 2 |
| C6, C7 | P9, P10 | Fase 2 |
| C8 | P11 | Fase 2 |
| C10 (estado de error visible en páginas sin try/catch) | P9/P10 (ErrorState + toasts) | Fase 2 (parcial; el resto en fases posteriores) |

---

## 10. Conteo de archivos por propuesta

| Propuesta | Archivos refactorizados | Archivos nuevos |
|---|---|---|
| P3 | 12 (navigation, PlanificacionPage, AsignacionesTab, PlanEstudiosTab, MisSalonesPage, DashboardPage, ReportesPage, ProfesorFichaPage, AlumnoFichaPage, AsistenciaPage, LoginPage, CalificacionesPage) + 1 opcional (GradosTab) | 0 |
| P9 | 14 (tipo) + 14 (skeleton) + 3 migrados a ErrorState/EmptyState (MatriculasPage, AsignacionesTab, PeriodosPage) — archivos únicos ≈ 15 | 1 (`FilasSkeleton.tsx`) |
| P10 | 7 (MatriculasPage, GradosTab, ClasesTab, AsignacionesTab, PlanEstudiosTab, PeriodosPage, PlanificacionPage) | 1 (`lib/feedback.ts`) |
| P11 | 7 (MatriculasPage + 6 filtros: AlumnosPage, ProfesoresPage, ClasesTab, PagosPage, CalificacionesPage, AsistenciaPage) + 4 opcionales | 1 (`CampoFormulario.tsx`) |

---

## 11. Estado de implementación y revisión (2026-10-10)

> Revisión de Big Pickle (planificador/revisor) sobre la implementación de MiMo V2 Pro.
> Verificación ejecutada: `npx tsc -b` (exit 0), `npm run lint` (exit 0, solo warnings
> preexistentes), `npm run build` (OK), `npm run test:smoke` (SMOKE OK).

### 11.1 Criterios de §8 — resultado

| Criterio | Estado | Evidencia |
|---|---|---|
| `type EstadoCarga` solo en `useCarga.ts` | ✅ | 1 sola coincidencia (`src/hooks/useCarga.ts:4`); 14 archivos migrados (incl. `usePlanificacion.ts`). |
| `function FilasSkeleton` solo en `common/` | ✅ | 1 sola definición (`src/components/common/FilasSkeleton.tsx:9`); 14 imports desde `@/components/common`. |
| `mensajeExito`/`setMensajeExito` eliminados | ✅ | 0 coincidencias (`mensajeMasivo` también eliminado). |
| `alert()`/`confirm()` nativos | ✅ | 0 coincidencias en `src/`. |
| `role="alert"` en `PlanificacionPage` | ✅ | reemplazado por `<ErrorState onRetry>` (`PlanificacionPage.tsx:48-53`). |
| P3 sin "horarios"/"por aula"/"Todas tus aulas" | ✅ | 0 coincidencias de esos patrones. |
| Build / lint / smoke | ✅ | En verde. |

### 11.2 Decisiones confirmadas correctas

- **P9-A/B:** tipo y skeleton unificados de forma mecánica; `usePlanificacion` consume
  `EstadoCarga` desde `useCarga`; `MatriculasPage`, `AsignacionesTab`, `PeriodosPage` y
  `GradosTab` (secciones) usan `ErrorState` con reintento.
- **P10:** `src/lib/feedback.ts` implementa `notificarExito`/`notificarError` con fallback
  correcto; 7 archivos migrados; el `confirm()` de `GradosTab` se sustituyó por `Dialog`
  (`GradosTab.tsx:601-621`). Los diálogos permanecen abiertos ante error de mutación (el
  diálogo de creación/edición cierra solo al éxito) — comportamiento correcto.
- **P11:** `CampoFormulario` extraído y usado en `MatriculasPage` (Alumno/Clase) y
  `AsignacionesTab` (Clase/Asignatura/Docente), con `id` en el `SelectTrigger`; filtros de
  prioridad 2 con `htmlFor` + `id`.
- **Contrato ADT:** `ResultadoServicio<T>` (`shared/types/operations.ts:4-6`) usa `ok` como
  discriminante; los consumidores usan `res.ok` / `res.ok === false` correctamente, y
  `extraerError` de `PeriodosPage` respeta el contrato.

### 11.3 Hallazgos de la revisión

**Menores**

1. **P3 incompleto fuera del inventario §2** (etiquetas encabezado/aria restantes con
   "Curso"), aunque los patrones del §8 dan 0:
   - `src/features/dashboard/pages/DashboardPage.tsx:312` — "Resultados por clase y curso"
   - `src/features/dashboard/pages/DashboardPage.tsx:328` — `<TableHead>Curso</TableHead>`
   - `src/features/alumnos/pages/AlumnoFichaPage.tsx:315` — `<TableHead>Curso</TableHead>`
   - `src/features/profesores/pages/ProfesorFichaPage.tsx:135,152,162` — "Sin cursos asignados" / "Cursos asignados" / `<TableHead>Curso</TableHead>`
   - `src/features/reportes/pages/ReportesPage.tsx:550` (columna CSV `Curso`) y `:562` ("por clase y curso")
   - `src/features/planificacion/components/AsignacionesTab.tsx:143` (`"Se asignaron N curso(s)"`, también usa "especialistas") y `:254` (`aria-label` "…del curso")
   → **Acción sugerida:** unificar a "Asignatura" en copy/aria y a "Asignaturas" en el CSV.

2. **P11: filtro "Clase" de Asistencia sin asociar.** `src/features/asistencia/pages/AsistenciaPage.tsx:407`
   tiene `<Label>` sin `htmlFor` y su `SelectTrigger` (`:414`) sin `id`. No estaba en el
   inventario §5.2 (que listó Fecha y Alcance); corregir con `htmlFor="asistencia-clase"` +
   `id` en el trigger.

3. **Código muerto tras P10 en `PlanEstudiosTab`.** `editError` (`:84`) y `quitarError` (`:88`)
   solo se inicializan a `null`; los errores de `enviarEditar`/`enviarQuitar` van a
   `notificarError`. Los bloques `Alert` de `:471-477` y `:526-532` son inalcanzables → eliminar
   estado y UI muerta.

4. **Estado declarado a mitad de componente en `GradosTab`.** `gradoPorEliminar`/`eliminandoGrado`
   (`GradosTab.tsx:149-150`) están entre callbacks; conviene subirlos junto a
   `seccionPorEliminar` (`:90`) por legibilidad. No viola reglas de hooks.

**Observaciones**

5. **Semántica desactivar vs eliminar grado:** `manejarEliminarGrado` (`GradosTab.tsx:152-164`)
   llama a `desactivarGrado` pero el diálogo y el toast dicen "Eliminar grado" / "Grado
   eliminado". Es coherente con el patrón previo, pero conviene confirmar la intención (¿baja
   reversible?) y alinear el copy con "Desactivar" si aplica.
6. **Texto de éxito de asignación masiva:** `AsignacionesTab.tsx:147` usa "Asignación masiva
   completada" en lugar de la convención de §4.3 ("Asignaciones creadas" + description "Se
   asignaron N asignaturas").
7. **Accesibilidad por campo en MatriculasPage:** al mover los errores a toast, no se cablean
   `aria-invalid`/`aria-describedby` (aceptado por §5.2, pero el formulario queda con validación
   manual sin anuncio por campo).
8. **"Salones" en copy interno:** `src/config/navigation.ts:37` ("Tus salones y sus alumnos") y
   `MisSalonesPage.tsx:121` ("No se pudieron cargar tus salones.") conservan "salones" (el
   nombre del módulo se mantiene por decisión de producto; el resto de descripciones internas
   sí se unificaron).

### 11.4 Pendiente para fases posteriores

- Adopción plena de `useCarga` en las páginas con estado manual (§3.2-D).
- Errores por campo con `aria-invalid`/`aria-describedby` en formularios de validación manual.
- Cerrar los residuales de copy de §11.3 (1) y la asociación del filtro de Asistencia (2).