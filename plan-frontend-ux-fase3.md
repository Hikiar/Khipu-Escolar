# Plan de implementación — Fase 3 (P4, P5, P6, P7, P12) — Khipu Escolar

> Autor: Big Pickle (subagente de planificación/arquitectura/documentación).
> Fecha: 2026-10-10.
> Alcance: plan DETALLADO que MiMo V2 Pro seguirá para implementar la **Fase 3**
> del plan `plan-frontend-ux.md` (§4): **P4** (detalle de matrícula), **P5** (detalle
> de asignatura en Plan de estudios), **P6** (edición de trabajos), **P7** (indicador
> global de año lectivo) y **P12** (separar "Retirar" de "Anular" matrícula).
> **No se modifica código fuente en este documento**; es la especificación de
> implementación.
> Documentos relacionados: `plan-frontend-ux.md` (plan maestro),
> `plan-frontend-ux-fase2.md` (fases previas + §11 de revisión), `AUDITORIA.md`,
> `DESIGN_SYSTEM.md`.
>
> **Herramientas disponibles**: en este entorno `rg` **no está disponible**; las
> verificaciones de este documento usan `Get-ChildItem` + `Select-String` de
> PowerShell (ver §9). Todas las rutas y líneas citadas fueron verificadas en el
> código el 2026-10-10.

---

## 0. Estado de partida (verificado en código, 2026-10-10)

- **Fase 1 completada**: P1 (páginas huérfanas a `legacy/`), P2 (`apiClient`
  endurecido con `ApiError`), P15 (`AUDITORIA.md` alineado).
- **Fase 2 completada**: P3, P9, P10, P11 (ver `plan-frontend-ux-fase2.md` §11).
- **`<Toaster />` de sonner ya montado**: `src/components/layout/AppShell.tsx:46`
  (`<ToastProvider />`). Existe `src/lib/feedback.ts` con `notificarExito`/
  `notificarError`.
- **Componentes comunes**: `ErrorState`, `EmptyState`, `LoadingState`, `InlineError`,
  `FilasSkeleton`, `CampoFormulario` en `src/components/common/` (exportados en
  `index.ts`).
- **Componentes UI disponibles** (`src/components/ui/`): `sheet.tsx` (drawer lateral,
  `side="right"`), `dialog.tsx`, `tooltip.tsx`, `select`, `table`, `badge`, `button`,
  `alert`, `card`, `input`, `label`, `separator`, `skeleton`, `tabs`, etc.
- **Variantes útiles**: `Button` acepta `size="xs" | "sm" | "icon-sm" | "icon"`;
  `Badge` acepta `variant="success" | "warning" | "destructive" | "info" | "outline" | "secondary"`.
- **Rutas de API montadas** (`server/api/app.ts`): `/api/matriculas` (:67),
  `/api/cursos` (:70), `/api/trabajos` (:62), `/api/periodos` (:79),
  `/api` → catálogo (:74, incluye `/periodo-activo`).

### 0.1 Contratos exactos de los endpoints objetivo (verificado)

| Endpoint | Permiso | Servicio frontend | DTO de éxito |
|---|---|---|---|
| `GET /api/matriculas/:id` | `matriculas.ver` | `obtenerMatricula` (`matriculasService.ts:32`) | `Matricula` = `{ id, alumnoId, alumno?: {dni,nombres,apellidos,codigoInstitucional}, claseId, periodoId, registradoPor, fechaRegistro, estado:'ACTIVA'\|'RETIRADA', retiradoAt?, observaciones? }` |
| `GET /api/cursos/:id` | `cursos.ver` | `obtenerCurso` (`cursosService.ts:63`) | `Curso` = `{ id, codigo, nombre, descripcion: string\|null, activo: boolean }` |
| `PATCH /api/trabajos/:id` | `notas.registrar` | `editarTrabajo` (`evaluacionService.ts:94`) | `Trabajo` = `{ id, claseId, competenciaCursoId, nombre, descripcion?, fecha?, activo }` |
| `GET /api/periodo-activo` | *(solo auth)* | `listarPeriodoActivo` (`catalogoService.ts:155`) | `PeriodoAcademico \| null` = `{ id, codigo, nombre, fechaInicio?, fechaFin?, estado }` |
| `GET /api/periodos/activo` | *(solo auth)* | `obtenerPeriodoActivo` (`periodosService.ts:26`) | `PeriodoAcademico \| null` (idéntico al anterior) |
| `GET /api/periodos` | `periodos.ver` ⚠️ | `listarPeriodos` (`periodosService.ts:22`) | `PeriodoAcademico[]` |

Cuerpo aceptado por `PATCH /api/trabajos/:id` (`server/api/schemas.ts:80-86`):
`{ nombre?, descripcion?, fecha?, activo? }`. La competencia **no** es editable.

### 0.2 Hallazgos clave del código (condicionan el diseño)

1. **`usePeriodoActivo` ya existe Y tiene consumidores**, no está muerto:
   `src/hooks/usePeriodoActivo.ts` → usado por `AppSidebar.tsx:20,56` y
   `DashboardPage.tsx:41,454`. Cachea `/periodos/activo` por sesión del navegador.
2. **El sidebar YA muestra el año lectivo activo** en su footer
   (`AppSidebar.tsx:78-84`): `Año Lectivo {codigo}` o `Sin año lectivo activo`.
   P7 NO parte de cero: debe *elevar* y enriquecer ese indicador (banner global),
   no duplicarlo sin criterio.
3. **Doble endpoint de año activo**: `/periodo-activo` (catálogo) y `/periodos/activo`
   (periodos) devuelven lo mismo. `listarPeriodoActivo` se usa en MatriculasPage
   (:46,143), `usePlanificacion` (:13,56) y PagosPage (:44,145); `usePeriodoActivo`
   usa `obtenerPeriodoActivo`.
4. **La lista de matrículas ya devuelve el DTO completo** (incluye `alumno`,
   `observaciones`, `retiradoAt`). Es decir, `obtenerMatricula` es *redundante en
   datos*; P4 lo usa para **validar el endpoint y traer detalle fresco bajo demanda**.
5. **MatriculasPage solo lista matrículas ACTIVAS** (`listarMatriculas(claseId)`
   con `todas=false`, `matriculasService.ts:24-29`). El `Badge` "Retirada" de la
   tabla (`MatriculasPage.tsx:308-309`) es **inalcanzable** hoy y no hay toggle
   "ver retiradas". Afecta a P4/P12 (ver §8, hallazgo H1).
6. **No existe permiso dedicado de anulación/retiro**: `shared/permissions.ts:34-36`
   solo tiene `matriculas.anular`. En backend, BOTH `/retirar` y `/anular` exigen
   `exigirPermiso('matriculas.anular')` (`server/api/rutas/matriculas.ts:42,47`).
7. **`actualizarTrabajo` valida el periodo escribible** (`N10`): en un año cerrado,
   `PATCH /api/trabajos/:id` responde `fallo('invalido', 'El periodo "..." está cerrado (solo lectura).')`
   (`server/domain/evaluacion.service.ts:170-175`). La UI debe mostrar ese error tal cual.
8. **CalificacionesPage conserva el patrón de `Alert` inline** (no migró a toasts en
   Fase 2); su diálogo de edición de examen (`:931-968`) es el patrón local a imitar
   para P6.
9. **Mismatch de permisos en Plan de estudios**: la página está gated por
   `grados.ver` (`App.tsx:92`), pero `obtenerCurso` exige `cursos.ver`. Un usuario con
   `grados.ver` sin `cursos.ver` recibiría 403 al abrir el detalle (P5).

---

## 1. Decisiones de diseño pendientes (resolver antes o durante la implementación)

> Recomendación de Big Pickle entre paréntesis. El usuario autorizó continuar sin
> pedir permisos; estas decisiones se pueden tomar por defecto con la recomendación.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 | **P4: drawer vs diálogo** para el detalle de matrícula | (a) `Sheet side="right"`; (b) `Dialog` | **(a) Sheet**, consistente con el drawer de docentes ya existente en `PlanEstudiosTab.tsx:525-570`. |
| D2 | **P4: ¿fetch a `obtenerMatricula` o render desde la fila?** | (a) fetch bajo demanda; (b) render desde el dato ya listado | **(a) fetch**, para dar uso real al endpoint huérfano y obtener datos frescos; usar la fila como placeholder optimista. |
| D3 | **P5: implementar detalle o eliminar la función** | (a) Sheet de detalle; (b) borrar `obtenerCurso` | **(a) detalle** (el plan maestro exige dar uso o justificar deprecación). |
| D4 | **P5: cómo manejar el 403 por `cursos.ver`** | (a) mostrar mensaje de permiso en el drawer; (b) ocultar el affordance sin `cursos.ver` | **(a)** mensaje inline; opcional (b) con `Can permission="cursos.ver"`. |
| D5 | **P6: campos editables del trabajo** | (a) nombre/fecha/descripción; (b) añadir `activo` | **(a)**; `activo` se gestiona con la acción "Anular" existente (no reactivar desde edición). |
| D6 | **P7: dónde va el indicador** | (a) banner full-width en `AppShell` (sobre el `Outlet`); (b) badge compacto en `Header`; (c) ambos | **(a) banner** (más visible en todas las pantallas) + conservar el badge del sidebar (o retirarlo para evitar duplicación; decisión menor). |
| D7 | **P7: detección de "año cerrado"** | (a) solo `/periodo-activo` (sin permiso): "cerrado" = no hay año activo; (b) además `/periodos` (requiere `periodos.ver`) para detectar el último CERRADO | **(a)** por defecto (funciona para todos los roles). (b) como mejora opcional para roles con `periodos.ver`. |
| D8 | **P12: permiso dedicado** | (a) reutilizar `matriculas.anular`; (b) **[BACKEND NUEVO]** `matriculas.retirar` + `matriculas.anular` | **(a) reutilizar** en Fase 3 (frontend-only). Documentar (b) como trabajo de backend futuro. |
| D9 | **P12: refuerzo de confirmación de "Anular"** | (a) checkbox "Entiendo que es permanente"; (b) escribir el texto "ANULAR"; (c) solo texto más explícito + botón destructivo | **(a) checkbox**, accesible y sin fricción excesiva. |
| D10 | **P7: hook `usePeriodoActivo` no se refresca** tras activar/cerrar un período | (a) exportar `invalidarPeriodoActivo()`/`refrescar` y llamarlo desde `PeriodosPage`; (b) dejarlo (requiere recargar) | **(a)** como mejora; al menos documentar el bug (ver §8 H2). |

---

## 2. P4 — Detalle bajo demanda de matrícula (drawer)

**Archivo único**: `src/features/matriculas/pages/MatriculasPage.tsx` (445 líneas).
Endpoint: `GET /api/matriculas/:id` (`obtenerMatricula`, ya definido).

### 2.1 Cambios por bloque

| # | Ubicación | Cambio | Criterio de aceptación |
|---|---|---|---|
| P4-1 | imports (:50-56) | Añadir `obtenerMatricula` al import de `@/services/matriculasService`. | Compila. |
| P4-2 | imports (nuevo) | Añadir `Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter` desde `@/components/ui/sheet`; iconos `Eye` (o `Info`) a `lucide-react` (:59); `ApiError` desde `@/services/apiClient`. | Compila. |
| P4-3 | estado (junto a :95) | `const [detalle, setDetalle] = useState<Matricula \| null>(null)`; `const [detalleCargando, setDetalleCargando] = useState(false)`; `const [detalleError, setDetalleError] = useState<string \| null>(null)`. | — |
| P4-4 | handler nuevo (junto a `ejecutarAccion`) | `abrirDetalle(m: Matricula)`: `setDetalle(m)` (placeholder optimista), `setDetalleCargando(true)`, `setDetalleError(null)`; `try { const res = await obtenerMatricula(m.id); res.ok ? setDetalle(res.data) : setDetalleError(res.error) } catch (e) { setDetalleError(e instanceof ApiError ? e.message : 'No se pudo cargar el detalle.') } finally { setDetalleCargando(false) }`. | El drawer abre al instante; al llegar la respuesta reemplaza datos. |
| P4-5 | celda de acciones (:312-333) | Añadir al inicio del `<div className="flex gap-1">` un botón "Ver detalle": `<Button variant="ghost" size="icon-sm" aria-label={\`Ver detalle de ${nombreAlumno}\`} onClick={() => void abrirDetalle(m)}><Eye className="size-3" aria-hidden /></Button>`. **Debe verse también para matrículas RETIRADAS** (fuera del bloque `m.estado === 'ACTIVA'`, :313). | Existe affordance de detalle en cada fila. |
| P4-6 | tras el diálogo de acción (:442) | Añadir `<Sheet open={detalle !== null} onOpenChange={(o) => { if (!o) { setDetalle(null); setDetalleError(null) } }}>` con `<SheetContent side="right" className="w-full sm:max-w-md">`. | Se abre/cierra correctamente. |
| P4-7 | interior del Sheet | Header: `SheetTitle` "Detalle de matrícula" + `SheetDescription` con el alumno. Cuerpo: alumno (nombres, apellidos, DNI, **código institucional**), clase (`gradoNombre · seccionNombre`, vía `clasesMap` o `detalle.claseId`), año lectivo (`clase.periodoCodigo`), fecha de registro (`formatearFecha`), estado (`Badge` ACTIVA=`success`/RETIRADA=`outline`), `retiradoAt` si existe, `observaciones` si existen. Estados: `detalleCargando` → skeleton/spinner; `detalleError` → `<InlineError message={detalleError} />`. | Muestra los campos del DTO; nunca queda en blanco. |
| P4-8 | a11y | El botón de detalle con `aria-label`; el Sheet ya gestiona foco/`Esc` (base-ui). Sin `<Label>`/inputs nuevos. | Navegable por teclado. |

> **Nota**: el DTO de la lista ya trae todos los campos, por lo que el drawer se ve
> completo incluso antes de la respuesta de `obtenerMatricula`. El fetch bajo
> demanda cumple P4 (dar uso al endpoint) y refresca datos.

**Esfuerzo**: S. **Riesgo**: bajo (archivo ya complejo; aislar en un `<Sheet>` al final).

---

## 3. P5 — Detalle de asignatura en Plan de estudios

**Archivo único**: `src/features/planificacion/components/PlanEstudiosTab.tsx` (573 líneas).
Endpoint: `GET /api/cursos/:id` (`obtenerCurso`, ya definido).

### 3.1 Cambios por bloque

| # | Ubicación | Cambio | Criterio de aceptación |
|---|---|---|---|
| P5-1 | imports de cursosService (:46-55) | Añadir `obtenerCurso` (y mantener el tipo `Curso`). | Compila. |
| P5-2 | imports ya presentes | `Sheet*` ya importado (:38-44); `Edit2`/iconos ya en `lucide-react` (:37). Añadir `Eye`/`BookOpen` (ya está `BookOpen`) y `ApiError` desde `@/services/apiClient`. | Compila. |
| P5-3 | estado nuevo (junto a `documento`/`docentesCurso`, ~:88-91) | `const [cursoDetalle, setCursoDetalle] = useState<CursoGrado \| null>(null)`; `const [detalleCurso, setDetalleCurso] = useState<Curso \| null>(null)`; `const [detalleCursoCargando, setDetalleCursoCargando] = useState(false)`; `const [detalleCursoError, setDetalleCursoError] = useState<string \| null>(null)`. | — |
| P5-4 | handler nuevo (junto a `abrirDocentes`, :202-206) | `abrirDetalleCurso(cg: CursoGrado)`: `setCursoDetalle(cg)`, `setDetalleCurso(null)`, `setDetalleCursoError(null)`, `setDetalleCursoCargando(true)`; `try { const res = await obtenerCurso(cg.cursoId); res.ok ? setDetalleCurso(res.data) : setDetalleCursoError(res.error) } catch (e) { setDetalleCursoError(e instanceof ApiError ? e.message : 'No se pudo cargar el detalle.') } finally { setDetalleCursoCargando(false) }`. | El drawer abre y carga. |
| P5-5 | celda "Asignatura" (:332-334) | Convertir el texto en un botón `variant="link"`/`ghost` con `className="text-left font-medium"` que llame a `abrirDetalleCurso(cg)`; `aria-label={\`Ver detalle de ${cg.cursoNombre}\`}`. Mantener el texto `{cg.cursoCodigo} — {cg.cursoNombre}`. | Al hacer clic se abre el detalle. |
| P5-6 | tras el Sheet de docentes (:570) | Añadir un segundo `<Sheet open={cursoDetalle !== null} onOpenChange=...>` con `SheetContent side="right" className="w-full sm:max-w-md"`. | Abre/cierra. |
| P5-7 | interior del Sheet | Header: nombre de la asignatura. Cuerpo: `codigo`, `nombre`, `descripcion` (o "Sin descripción"), `Badge` `activo` (Activa=`success`/"Activa", Inactiva=`outline`/"Inactiva"), y de la fila (`cursoDetalle`): `horasSemana`, `orden`; nº de docentes (`docentesDelCurso.length`). Estados de carga/error. | Muestra los campos del DTO. |
| P5-8 | manejo de 403 (D4) | Si `res.ok === false` y el mensaje es de permiso, mostrar texto claro; opcionalmente envolver el botón de la celda en `<Can permission="cursos.ver">`. | No hay error silencioso. |

> El Sheet de docentes (`:525-570`) puede convivir; se recomienda **un solo**
> componente `Sheet` si se prefiere evitar dos overlays, pero mantenerlos separados
> es más simple.

**Esfuerzo**: S. **Riesgo**: bajo. Cuidado con no romper los botones Editar/Quitar/Docentes.

---

## 4. P6 — Editar trabajos de evaluación

**Archivo único**: `src/features/calificaciones/pages/CalificacionesPage.tsx` (1040 líneas).
Endpoint: `PATCH /api/trabajos/:id` (`editarTrabajo`, ya definido).

### 4.1 Cambios por bloque

| # | Ubicación | Cambio | Criterio de aceptación |
|---|---|---|---|
| P6-1 | imports de evaluacionService (:35-44) | Añadir `editarTrabajo`. `Edit2` ya está importado (:5). | Compila. |
| P6-2 | estado nuevo (junto a :97-104) | `const [dialogTrabajoEditar, setDialogTrabajoEditar] = useState<Trabajo \| null>(null)`; `const [editTrabajoNombre, setEditTrabajoNombre] = useState('')`; `const [editTrabajoFecha, setEditTrabajoFecha] = useState('')`; `const [editTrabajoDesc, setEditTrabajoDesc] = useState('')`; `const [editandoTrabajo, setEditandoTrabajo] = useState(false)`; `const [errorDialogTrabajoEditar, setErrorDialogTrabajoEditar] = useState<string \| null>(null)`. | — |
| P6-3 | handlers (junto a `abrirDialogExamenEditar`, :361-386) | `abrirDialogTrabajoEditar(t)`: rellena nombre/fecha/desc y abre. `cerrarDialogTrabajoEditar()`: cierra y limpia. `handleEditarTrabajo()`: `editarTrabajo(dialogTrabajoEditar.id, { nombre: editTrabajoNombre.trim(), fecha: editTrabajoFecha || undefined, descripcion: editTrabajoDesc.trim() || undefined })`; si `res.ok` → cerrar + `void cargarTrabajos(claseId, competencias)`; si no → `setErrorDialogTrabajoEditar(extraerError(res))`. | Editar persiste y refresca. |
| P6-4 | acciones de la fila de trabajo (:571-583) | Añadir antes de "Calificar" un botón de edición: `<Button variant="ghost" size="icon-sm" onClick={() => abrirDialogTrabajoEditar(t)} aria-label={\`Editar trabajo ${t.nombre}\`}><Edit2 className="size-4" /></Button>`. | Aparece el botón y abre el diálogo. |
| P6-5 | diálogo nuevo (tras el de "Nuevo trabajo", :805) | `<Dialog open={dialogTrabajoEditar !== null} ...>` con: competencia (Select o `Input` **deshabilitado** mostrando `traducirCompetencia(dialogTrabajoEditar.competenciaCursoId)`), Nombre, Fecha (`type="date"`), Descripción. `Alert` destructivo si `errorDialogTrabajoEditar`. Footer: Cancelar + Guardar (`disabled={editandoTrabajo || !editTrabajoNombre.trim()}`). | El diálogo muestra los datos actuales y guarda. |
| P6-6 | feedback | Seguir el patrón local del archivo (Alert inline en el diálogo), igual que `dialogExamenEditar` (:931-968). **No** introducir toasts solo en esta acción para no mezclar patrones (CalificacionesPage no migró a P10). | Coherente con el archivo. |
| P6-7 | error de periodo cerrado | Dejar que el mensaje del backend ("El periodo ... está cerrado (solo lectura).") se muestre en el `Alert` del diálogo. | Mensaje visible. |
| P6-8 | a11y | Labels con `htmlFor`/`id` (mejora respecto a los campos actuales de trabajos, que usan `<Label>` sin `htmlFor`, :773,786,790,794). Usar `htmlFor="edit-trabajo-nombre"` etc. | Labels asociados. |

> **Alcance**: NO se edita la competencia (el PATCH no la admite) ni `activo`
> (se usa "Anular"). El listado `trabajos` se recarga con `cargarTrabajos(claseId, competencias)`.

**Esfuerzo**: S. **Riesgo**: bajo-medio (archivo de 1040 líneas; añadir bloques al final).

---

## 5. P7 — Indicador global de año lectivo activo

**Objetivo**: banner visible en **todas** las pantallas autenticadas con el año
lectivo activo + estado, y aviso de "solo lectura" cuando no hay año activo (o,
opcionalmente, cuando el año está cerrado).

**Base existente**: `usePeriodoActivo` (`src/hooks/usePeriodoActivo.ts`) ya cachea
`/periodos/activo`; `AppSidebar.tsx:78-84` ya muestra `Año Lectivo {codigo}`.

### 5.1 Enfoque recomendado (D6 = banner en AppShell; D7 = solo `/periodo-activo`)

| # | Archivo | Cambio | Criterio de aceptación |
|---|---|---|---|
| P7-1 | **NUEVO** `src/components/layout/IndicadorAnioLectivo.tsx` | Componente que usa `usePeriodoActivo()`. Renderiza una franja (patrón visual de `RecordatorioCambioContrasena.tsx:37-56`) con: icono `CalendarClock`; texto `Año lectivo {codigo} · {nombre}` + `Badge variant="success">Activo</Badge>` cuando hay período; **ámbar** (`--warning`) "Sin año lectivo activo — las escrituras están en solo lectura" cuando `periodo === null` y `!cargando`; y `null` mientras `cargando` (evita flash). | El banner aparece en toda pantalla autenticada. |
| P7-2 | `src/components/layout/AppShell.tsx` | Importar y montar `<IndicadorAnioLectivo />` dentro de `<main>` (línea :41), justo encima de `<RecordatorioCambioContrasena />`. | Visible salvo en `/login` y `/403` (fuera del AppShell). |
| P7-3 | `src/components/layout/AppSidebar.tsx` (:78-84) | **Decisión D6**: (a) conservar el badge del sidebar; (b) retirarlo para no duplicar. Recomendado (a) por ahora (el sidebar colapsa a iconos y allí el texto del banner no se ve). | Sin duplicación visual molesta. |
| P7-4 | (Opcional, D7-b) `usePeriodoActivo` / componente | Si el usuario tiene `periodos.ver`, además consultar `listarPeriodos` y, si no hay activo pero existe un `CERRADO` reciente, mostrar "Año lectivo {codigo} cerrado — solo lectura". Requiere manejar el 403 con `can('periodos.ver')`. | Distingue "cerrado" de "sin configurar". |
| P7-5 | (Opcional, D10) `src/hooks/usePeriodoActivo.ts` | Exportar `invalidarPeriodoActivo()` (pone `cachePeriodo = undefined` y notifica a suscriptores) y llamarlo desde `PeriodosPage` tras `activar`/`cerrar`. Alternativa mínima: exponer `recargar` en el hook. | El indicador se actualiza sin recargar la página. |

### 5.2 Datos y estado

- `usePeriodoActivo()` devuelve `{ periodo: PeriodoAcademico | null, cargando: boolean }`.
- No requiere permiso (endpoint `/periodos/activo` solo exige auth).
- "estado" del período: el endpoint activo siempre es `ACTIVO`; el único estado
  mostrable es "Activo". El estado "CERRADO"/"solo lectura" proviene de la ausencia
  de activo (D7-a) o de `listarPeriodos` (D7-b).
- **No** llamar a `/api/periodos` sin `can('periodos.ver')`.

**Esfuerzo**: S (D7-a) / S-M (D7-b + D10). **Riesgo**: bajo.

---

## 6. P12 — Separar "Retirar" de "Anular" matrícula

**Archivo**: `src/features/matriculas/pages/MatriculasPage.tsx` (comparte archivo con P4).
Permiso: se **reutiliza** `matriculas.anular` (D8-a). Ambos endpoints backend ya
usan ese permiso (`server/api/rutas/matriculas.ts:42,47`).

### 6.1 Cambios por bloque

| # | Ubicación | Cambio | Criterio de aceptación |
|---|---|---|---|
| P12-1 | imports iconos (:59) | Añadir `UserMinus` (retirar, reversible) y `Ban` (o `Trash2`, anular destructivo); `AlertTriangle`. | Compila. |
| P12-2 | celda de acciones (:312-333) | Reemplazar los dos botones de texto por botones con icono + texto corto o icon-sm: **Retirar** = `variant="outline"` + `UserMinus` (neutro/reversible); **Anular** = `variant="destructive"` + `Ban`/`Trash2` (destructivo). `aria-label` específico. Opcional: envolver en `Tooltip` (`@/components/ui/tooltip`) con el detalle de cada acción. | Semántica visual inequívoca (color + icono + color de texto). |
| P12-3 | diálogo de acción (:401-442) | Diferenciar títulos, iconos y copy. **Retirar**: título "Retirar matrícula", copy "El alumno dejará de estar matriculado pero **podrás volver a matricularlo**. Se conserva el historial." botón default. **Anular**: título con icono `AlertTriangle` rojo, copy "Se **eliminará permanentemente** la matrícula y no se puede deshacer. Solo es posible si el alumno no tiene calificaciones ni pagos." botón destructive. | Copy refleja reversibilidad vs permanencia. |
| P12-4 | refuerzo de confirmación de Anular (D9) | Añadir checkbox (componente `@/components/ui/checkbox`) "Entiendo que la anulación es permanente" que **habilita** el botón "Anular definitivamente". Sin marcar, el botón está `disabled`. Para "Retirar", no se requiere checkbox. | No se puede anular sin confirmación explícita. |
| P12-5 | mensajes de error | Mantener `notificarError(resultado.error)` (:184). El backend ya explica por qué no se puede anular (`evaluacion.service.ts` / `matriculas.service.ts:197,202`). | El usuario entiende el bloqueo. |
| P12-6 | (Opcional, hallazgo H1) | Añadir un `Checkbox`/toggle "Ver retiradas" que llame a `listarMatriculas(claseId, true)`; hoy el `Badge` "Retirada" es inalcanzable. | Se pueden ver matrículas retiradas. |

### 6.2 Permiso dedicado (opción D8-b, diferida / [BACKEND NUEVO])

Si se aprueba un permiso dedicado:
1. `shared/permissions.ts` (tras :36): añadir `'matriculas.retirar': 'Retirar matrículas'`.
2. `server/api/rutas/matriculas.ts:42` → `exigirPermiso('matriculas.retirar')`.
3. `shared/roles.ts`: otorgar `matriculas.retirar` a los roles que hoy tienen `matriculas.anular` (revisar `roles.ts:58-59`).
4. Frontend: separar los `<Can>` (Retirar = `matriculas.retirar`; Anular = `matriculas.anular`).
> Fuera del alcance estricto de Fase 3 salvo autorización; el plan recomienda (a).

**Esfuerzo**: M (con checkbox y copy) / S si se limita a iconos+copy.

---

## 7. Orden de implementación sugerido (para MiMo)

1. **P7** (banner global): archivo nuevo + `AppShell` + (opcional) hook. No toca
   archivos de P4/P5/P6/P12 → sin conflictos. Verificar `npm run build`.
2. **P5** (`PlanEstudiosTab.tsx`): aislado.
3. **P6** (`CalificacionesPage.tsx`): aislado (añadir bloques al final).
4. **P4 + P12 juntos** (`MatriculasPage.tsx`): **una sola pasada** por el archivo
   para evitar conflictos (comparten imports, celda de acciones y el bloque de
   diálogos). Añadir el `<Sheet>` de P4 y el checkbox/iconos de P12 en el mismo
   cambio.
5. **Verificación final** (§9): `npx tsc -b`, `npm run lint`, `npm run build`,
   `npm run test:smoke`.

---

## 8. Riesgos y hallazgos

**Riesgos de implementación**

1. **`MatriculasPage.tsx` concentra P4 + P12** → conflicto interno si se hacen en
   pasadas separadas. Mitigación: pasada única (paso 4 del orden).
2. **P7 `usePeriodoActivo` cachea por sesión** y no se invalida al activar/cerrar un
   período (`periodos.service.ts` muta en BD; el hook no). El banner puede quedar
   obsoleto. Mitigación: D10 (invalidación) o documentar el bug.
3. **P5 permiso `cursos.ver` vs `grados.ver`** → 403 para roles no administradores.
   Mitigación: D4 (mensaje o `Can`).
4. **P6 competencia no editable** → no prometer en UI lo que el PATCH no admite
   (mostrar competencia como solo lectura).
5. **P12 sin permiso dedicado** → "Anular" es la acción destructiva pero comparte
   permiso con "Retirar"; un rol con `matriculas.anular` puede anular. Mitigación:
   D8-a aceptada o D8-b (backend).
6. **CalificacionesPage y PlanEstudiosTab son grandes** (P16 pendiente); añadir más
   bloques agrava el monolito. Mitigación: encapsular en subcomponentes locales si
   crece demasiado (`DialogTrabajoEditar`, `SheetDetalleCurso`).

**Hallazgos del código (informativos)**

- **H1 — "Retirada" inalcanzable**: la tabla solo lista ACTIVAS
  (`matriculasService.ts:24-29` + `MatriculasPage.tsx:98`); el `Badge` "Retirada"
  (`:308-309`) nunca se ve. Se propone toggle "ver retiradas" (P12-6, opcional).
- **H2 — Caché de período**: `usePeriodoActivo.ts:7` (`cachePeriodo`) nunca se
  invalida; tras activar/cerrar un año, sidebar/banner quedan desfasados hasta
  recargar (ver riesgo 2).
- **H3 — Doble endpoint de período activo**: `/periodo-activo` y `/periodos/activo`
  son equivalentes; conviven `catalogoService.listarPeriodoActivo` y
  `periodosService.obtenerPeriodoActivo`. No es bloqueante, pero conviene unificar
  en una fase de limpieza (fuera de Fase 3).
- **H4 — `obtenerMatricula` redundante en datos**: la lista ya devuelve el DTO
  completo; el endpoint solo aporta "frescura" y el cumplimiento de P4.
- **H5 — CalificacionesPage no migró a toasts** (P10 la excluyó); mantener su
  patrón de `Alert` inline evita inconsistencia interna (ver P6-6).

---

## 9. Criterios de aceptación y verificación

### 9.1 Criterios funcionales

- [ ] **P4**: desde la tabla de matrículas se abre un drawer con el detalle; todos
  los campos del DTO visibles; carga/errores gestionados; se usa `obtenerMatricula`.
- [ ] **P5**: al hacer clic en una asignatura del plan se abre el detalle con
  `descripcion`/`activo` (datos que no están en la fila); se usa `obtenerCurso`.
- [ ] **P6**: "Editar" en un trabajo abre diálogo, persiste vía PATCH y refresca
  (`cargarTrabajos`); los errores del backend (p. ej. período cerrado) se muestran.
- [ ] **P7**: banner de año lectivo visible en todas las pantallas autenticadas;
  muestra `codigo`/`nombre` y estado; aviso "solo lectura" cuando no hay año activo.
- [ ] **P12**: "Retirar" y "Anular" se distinguen por icono, color y copy; "Anular"
  exige confirmación explícita (checkbox); ambas conservan `notificarExito/Error`.
- [ ] `npm run build` y `npm run test:smoke` pasan; `npx tsc -b` y `npm run lint`
  sin errores nuevos.

### 9.2 Comandos (PowerShell; `rg` no disponible)

```powershell
# P4/P5/P6 — los endpoints huérfanos ahora se consumen (>0 resultados)
Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx | Select-String -Pattern 'obtenerMatricula\('
Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx | Select-String -Pattern 'obtenerCurso\('
Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx | Select-String -Pattern 'editarTrabajo\('

# P7 — el indicador global existe y está montado
Get-ChildItem -Recurse -Path src -Include *.tsx | Select-String -Pattern 'IndicadorAnioLectivo'
Get-ChildItem -Path src\components\layout\AppShell.tsx | Select-String -Pattern 'IndicadorAnioLectivo'

# P12 — acciones diferenciadas (destructivo vs neutro) y confirmación reforzada
Get-ChildItem -Path src\features\matriculas -Recurse -Include *.tsx |
  Select-String -Pattern 'UserMinus|Ban|Entiendo que'

# Global
npx tsc -b
npm run lint
npm run build
npm run test:smoke
```

> Nota: `Select-String` con `-Include` requiere `-Recurse` o un path con comodín.
> Evitar `rg` en este entorno.

---

## 10. Trazabilidad

| Hallazgo (plan maestro §2) | Propuesta | Fase |
|---|---|---|
| C12 (endpoints sin pantalla) | P4, P5, P6 | Fase 3 |
| C11 (sin indicador global de año lectivo) | P7 | Fase 3 |
| C9 ("Retirar" vs "Anular" indistinguibles) | P12 | Fase 3 |
| C6/C8 (feedback y a11y) | P4/P5/P6 siguen `feedback.ts`/`ErrorState`; P6 añade `htmlFor` | Fase 3 (parcial) |
| C2/C3 (acceso denegado) | D4 (mensaje de permiso en P5) | Fase 3 (parcial) |
| H1 (retiradas ocultas) | P12-6 (opcional) | Fase 3 (opcional) |

---

## 11. Conteo de archivos por propuesta

| Propuesta | Archivos refactorizados | Archivos nuevos |
|---|---|---|
| P4 | 1 (`MatriculasPage.tsx`) | 0 |
| P5 | 1 (`PlanEstudiosTab.tsx`) | 0 |
| P6 | 1 (`CalificacionesPage.tsx`) | 0 |
| P7 | 1-3 (`AppShell.tsx`, opcional `AppSidebar.tsx`/`usePeriodoActivo.ts`) | 1 (`IndicadorAnioLectivo.tsx`) |
| P12 | 1 (`MatriculasPage.tsx`, compartido con P4) | 0 |
| **Total** | **4-6 archivos únicos** | **1** |

---

## 12. Estado de implementación y revisión (2026-10-10)

> Revisión de Big Pickle (planificador/revisor) sobre la implementación de MiMo V2 Pro.
> Verificación ejecutada: `npx tsc -b` (exit 0), `npm run lint` (exit 0, solo warnings
> preexistentes), `npm run build` (OK), `npm run test:smoke` (SMOKE OK).
> Estado: **Fase 3 completada** (P4, P5, P6, P7, P12). Sin hallazgos bloqueantes; los
> criterios de §9.1 se cumplen. Los pendientes son menores/observaciones (§12.4).

### 12.1 Criterios de §9.1 — resultado

| Criterio | Estado | Evidencia |
|---|---|---|
| **P4** drawer de detalle con todos los campos del DTO; carga/error; usa `obtenerMatricula` | ✅ | `MatriculasPage.tsx:210-226` (`abrirDetalle` + `obtenerMatricula`), `:524-625` (`<Sheet>`, campos DNI/código/clase/estado/`retiradoAt`/observaciones), estados `:543-551`; botón `Eye` visible en toda fila, incl. RETIRADAS (`:350-357`, fuera del bloque `m.estado === 'ACTIVA'`). |
| **P5** detalle de asignatura con `descripcion`/`activo` desde `obtenerCurso` | ✅ | `PlanEstudiosTab.tsx:217-234` (`abrirDetalleCurso` + `obtenerCurso`), `:608-690` (`<Sheet>` con nombre/código/descripción/estado + horas/orden de la fila `:662-673`); celda clicable `:360-368`. |
| **P6** "Editar" trabajo abre diálogo, persiste por PATCH y refresca; errores visibles | ✅ | Botón `:611-614`; diálogo `:847-889`; `handleEditarTrabajo` + `editarTrabajo` `:407-423`; recarga `cargarTrabajos` `:419`; error (p. ej. periodo cerrado) en `Alert` `:854-859`; competencia solo lectura `:860-868`; labels `htmlFor` `:861-878`. |
| **P7** banner de año lectivo en todas las pantallas autenticadas; aviso "solo lectura" | ✅ | `IndicadorAnioLectivo.tsx` (nuevo), montado en `AppShell.tsx:42` (sobre el `Outlet`); ámbar sin año activo `:18-31`; badge "Activo" `:33-45`; `invalidarPeriodoActivo()` en `PeriodosPage.tsx:137`. |
| **P12** "Retirar"/"Anular" inequívocos; Anular exige checkbox; toasts conservados | ✅ | `MatriculasPage.tsx:360-371` (Retirar = `outline`+`UserMinus`), `:372-383` (Anular = `destructive`+`Ban`); copy diferenciado `:471-483`; checkbox habilita botón `:486-498`/`:508-518`; `notificarExito/Error` `:181,201,204`. |
| `tsc` / `lint` / `build` / `test:smoke` | ✅ | En verde (ver nota de cabecera). |

### 12.2 Marcadores de §9.2 (verificados con `Select-String`)

- `obtenerMatricula(` → `MatriculasPage.tsx:215` (consumida). ✅
- `obtenerCurso(` → `PlanEstudiosTab.tsx:223` (consumida). ✅
- `editarTrabajo(` → `CalificacionesPage.tsx:407,411` (consumida). ✅
- `IndicadorAnioLectivo` → definido en `IndicadorAnioLectivo.tsx:13` y montado en `AppShell.tsx:7,42`. ✅
- `UserMinus` / `Ban` / `confirmacionAnulada` → presentes en `MatriculasPage.tsx:70,369,381,107,490,511`. ✅

### 12.3 Decisiones confirmadas correctas

- **Contrato ADT respetado.** Todos los consumidores nuevos usan `res.ok` / `res.ok === false`
  (`MatriculasPage.tsx:116,180,200,216`; `PlanEstudiosTab.tsx:224`; `CalificacionesPage.tsx:265,386,417`)
  y `ApiError` en los `catch` (`MatriculasPage.tsx:69,222`; `PlanEstudiosTab.tsx:57,230`).
- **P4/P12 en una sola pasada.** El `<Sheet>` (P4) convive con el `<Dialog>` de acción (P12) sin
  colisión de estado; `confirmacionAnulada` se resetea al abrir cada acción (`:366,378`) y tras
  ejecutarla (`:206`), por lo que el checkbox no "hereda" el estado de una apertura previa.
- **P5 no reusa la bandera de apertura como datos** (`open={cursoDetalle !== null}`, datos en
  `detalleCurso`), lo que evita reaperturas accidentales; el 403 de `cursos.ver` se muestra inline
  vía `InlineError` (decisión D4-a).
- **P6 mantiene el patrón local del archivo** (`Alert` inline dentro del diálogo, no toast),
  coherente con P6-6/H5; el diálogo permanece abierto ante error y cierra solo al éxito.
- **P7 eleva el indicador de forma no destructiva:** se conserva el badge del sidebar
  (`AppSidebar.tsx:78-84`, D6-a) y se añade el banner; `usePeriodoActivo` no sufrió fugas: los
  suscriptores se desregistran en el cleanup (`usePeriodoActivo.ts:58-61`).
- **Sin regresiones de Fase 2 en los archivos tocados:** se conservan los toasts
  (`notificarExito/Error`), `CampoFormulario` y labels `htmlFor` de `MatriculasPage` (`:407,422,434`);
  el copy "Asignatura" y los filtros accesibles de `CalificacionesPage` (`:511,522`); los toasts de
  `PlanEstudiosTab`. Además, el código muerto `editError`/`quitarError` señalado en
  `plan-frontend-ux-fase2.md` §11.3(3) ya **no existe** en `PlanEstudiosTab.tsx` (0 coincidencias).

### 12.4 Hallazgos de la revisión

**Bloqueantes:** ninguno.

**Menores**

1. **P4 — el drawer puede reabrirse solo si se cierra antes de que responda el fetch.**
   `detalle` es a la vez bandera de apertura (`open={detalle !== null}`, `MatriculasPage.tsx:525`)
   y datos. Si el usuario cierra el Sheet mientras `obtenerMatricula` está en vuelo, el
   `onOpenChange` pone `detalle = null` (`:526-531`), pero la respuesta tardía ejecuta
   `setDetalle(res.data)` (`:219`) y **vuelve a abrir** el Sheet. Reproducible con latencia.
   *Acción sugerida:* separar la bandera de apertura del dato (como en P5) o guardar un token/`id`
   de la petición vigente y descartar respuestas obsoletas.
2. **P4/P5 — carrera de respuestas al cambiar de fila.** Ni `abrirDetalle` (`:210-226`) ni
   `abrirDetalleCurso` (`PlanEstudiosTab.tsx:217-234`) cancelan/tokenizan; la última respuesta en
   llegar "gana". En P5 la cabecera (`cursoDetalle`) podría no corresponder al cuerpo si se pulsa
   otra fila muy rápido. *Acción sugerida:* `AbortController` o comparar el `id` solicitado antes
   de aplicar el resultado.
3. **P7/`usePeriodoActivo` — la invalidación dispara una petición por suscriptor y provoca
   parpadeo.** `invalidarPeriodoActivo()` (`usePeriodoActivo.ts:15-18`) recorre los suscriptores y
   cada `suscribir` (`:51-56`) hace `setCargando(true)` + `void cargar()`; con 2-3 consumidores
   (sidebar, banner, dashboard) se lanzan N GET concurrentes a `/periodos/activo` y el banner
   desaparece (`IndicadorAnioLectivo.tsx:16`) hasta que llega la respuesta. *Acción sugerida:*
   invalidar con una única recarga compartida (in-flight dedupe) o exponer un `recargar` único.
4. **P7 — un fallo transitorio de `/periodos/activo` se cachea como `null` y muestra el aviso
   ámbar de "solo lectura".** `usePeriodoActivo.ts:42-46` mapea `res.ok === false` a `cachePeriodo = null`,
   sin distinguir error de "sin año activo"; el banner global (`IndicadorAnioLectivo.tsx:18-31`)
   muestra entonces un mensaje alarmante por un error de red. *Acción sugerida:* diferenciar
   error de `null` (estado `error` + reintento) en el banner.
5. **P5 — falta el "nº de docentes" previsto en §3.1 (P5-7).** El Sheet muestra
   nombre/código/descripción/estado/horas/orden (`PlanEstudiosTab.tsx:640-674`) pero no
   `docentesDelCurso.length`; la cifra por fila solo se carga al abrir el drawer de docentes
   (`:103-115`), por lo que mostrarla requeriría otra fuente. Desviación menor respecto al plan.

**Observaciones**

6. **Doble indicador de año lectivo (D6-a aceptada):** banner (`IndicadorAnioLectivo.tsx`) +
   badge del sidebar (`AppSidebar.tsx:80-82`). Textos ligeramente distintos ("Año lectivo" vs.
   "Año Lectivo"); unificar capitalización sería deseable.
7. **P6 — no se puede vaciar fecha/descripción.** `handleEditarTrabajo` envía
   `fecha: editTrabajoFecha || undefined` y `descripcion: editTrabajoDesc.trim() || undefined`
   (`CalificacionesPage.tsx:411-415`); al ir `undefined`, `JSON.stringify` omite el campo y el
   servicio no lo modifica (`evaluacion.service.ts:182-183`), por lo que limpiar la fecha o la
   descripción no surte efecto. Comportamiento ya previsto en P6-3, pero conviene documentarlo.
8. **P12-6 (opcional, H1) no implementado.** Sigue sin toggle "Ver retiradas"; el `Badge`
   "Retirada" (`MatriculasPage.tsx:344-346`) permanece inalcanzable porque la lista solo trae
   ACTIVAS (`listarMatriculas(claseId)`, `:115`). Ya era opcional en el plan.
9. **P5 — affordance poco evidente.** La asignatura es un `<button>` sin borde/`variant` que solo
   se subraya en `hover` (`PlanEstudiosTab.tsx:360-368`); podría pasar por texto plano. Sugerido
   `variant="link"` o un icono de pista.
10. **P7 — `role="status"` en un banner persistente** (`IndicadorAnioLectivo.tsx:20,34`): es una
    live region `polite`; puede resultar verboso si reaparece tras cada invalidación. Aceptable,
    pero valorar `role="note"` si no se desea anuncio.
11. **A11y residual de Fase 2 aún ausente:** `MatriculasPage` no cablea
    `aria-invalid`/`aria-describedby` (0 coincidencias); ya aceptado en `plan-frontend-ux-fase2.md`
    §5.2. El nuevo botón Editar de trabajos sí tiene `aria-label` (`CalificacionesPage.tsx:612`).
12. **Cosmético:** indentación irregular de los botones de la fila de trabajos
    (`CalificacionesPage.tsx:618-620`, botón Anular) y del `<SelectItem>` de carga
    (`PlanEstudiosTab.tsx:440`). Sin impacto funcional.

### 12.5 Pendiente para fases posteriores

- **P12-6 / H1:** toggle "Ver retiradas" (`listarMatriculas(claseId, true)`).
- **D8-b [BACKEND NUEVO]:** permiso dedicado `matriculas.retirar` (hoy ambos usan
  `matriculas.anular`, `server/api/rutas/matriculas.ts:42,47`).
- **D7-b:** distinguir "año cerrado" de "sin año activo" usando `listarPeriodos` para roles con
  `periodos.ver`.
- **P16:** descomponer `CalificacionesPage` (1124 líneas) y `PlanEstudiosTab` (693 líneas); el
  patrón de subcomponentes locales (`DialogTrabajoEditar`, `SheetDetalleCurso`) sigue vigente.
- **H2/H3:** unificar el doble endpoint de período activo (`/periodo-activo` vs `/periodos/activo`)
  y endurecer la invalidación de caché (§12.4-3/4).
