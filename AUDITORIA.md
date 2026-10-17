# Auditoría del sistema — Dashboard Colegio

Fecha: 2026-09-08
Alcance: 20 routers API, 19 servicios de dominio, 5 repos (SQLite + Drizzle), frontend React 19 + Tailwind v4 + shadcn/ui, `docs/modelo-datos.md`.
Método: auditoría de código por capas (backend / frontend / modelo de datos) + verificación en runtime contra la API real (login director, barrido de ~40 endpoints: sin 500, solo 400/404 contratados por parámetro obligatorio / sin registro / ruta inexistente).

> **Actualización 2026-10-10 — Fase 1 de `plan-frontend-ux.md` completada (P1, P2, P15).**
> P1: las páginas huérfanas `GradosPage`, `CursosPage` y `AsignacionesPage` se movieron a
> `legacy/paginas-reemplazadas-por-planificacion/` (fuera de `src/`, no compilan ni se lintan).
> P2: `apiClient` endurecido (timeout 15 s, `ApiError`, body tolerante). P15: esta alineación
> corrige los estados de Dashboard/Reportes y las referencias a las páginas movidas.
>
> **Actualización 2026-10-10 — Fase 2 de `plan-frontend-ux.md` completada (P3, P9, P10, P11).**
> P3: terminología unificada (Grado/Sección/Clase/Asignatura/Año lectivo) en navegación y 12
> páginas. P9: tipo `EstadoCarga` único (`src/hooks/useCarga.ts`) y `FilasSkeleton` compartido
> (`src/components/common/`). P10: feedback unificado vía `src/lib/feedback.ts` (sonner);
> eliminados `alert()`/`confirm()` nativos; confirmaciones en `Dialog`. P11: `Label htmlFor`+
> `id` en filtros/diálogos y `CampoFormulario` compartido. Verificación: `tsc`, `lint`, `build`
> y `test:smoke` en verde. Detalle y residuales en `plan-frontend-ux-fase2.md` §11.
>
> **Actualización 2026-10-10 — Fase 3 de `plan-frontend-ux.md` completada (P4, P5, P6, P7, P12).**
> P4: detalle bajo demanda de matrícula (`Sheet`) que da uso a `GET /api/matriculas/:id`
> (`MatriculasPage.tsx`). P5: detalle de asignatura en Plan de estudios con `GET /api/cursos/:id`
> (`PlanEstudiosTab.tsx`). P6: edición de trabajos de evaluación vía `PATCH /api/trabajos/:id`
> (`CalificacionesPage.tsx`), con competencia en solo lectura. P7: banner global de año lectivo
> activo (`IndicadorAnioLectivo.tsx` montado en `AppShell.tsx`), con aviso ámbar de "solo lectura"
> cuando no hay año activo; `usePeriodoActivo` extendido con `invalidarPeriodoActivo()` (llamado en
> `PeriodosPage.tsx`) — **resuelve C11** y hace dinámico el año lectivo (ya no se hardcodea "2026").
> P12: "Retirar" (reversible, `UserMinus`/outline) y "Anular" (destructivo, `Ban`/destructive) con
> copy diferenciado y checkbox de confirmación obligatorio. Los endpoints antes huérfanos de §3.2
> (`obtenerMatricula`, `obtenerCurso`, `editarTrabajo`) ya se consumen. Verificación: `tsc`, `lint`,
> `build` y `test:smoke` en verde. Revisión, hallazgos menores y residuales en
> `plan-frontend-ux-fase3.md` §12. No hay hallazgos bloqueantes.
>
> **Actualización 2026-10-10 — Fase 5 de `plan-frontend-ux.md` completada (P14, conceptos de pago).**
> P14: CRUD completo de conceptos de pago sobre la tabla existente `conceptos_pago`
> (**sin migración de esquema ni de datos**): `POST/PATCH/DELETE /api/pagos/conceptos` + permisos
> `conceptosPago.*`, página "Conceptos de pago" bajo Finanzas (`ConceptosPagoPage.tsx`) y doble
> entrada desde `PagosPage` ("Gestionar conceptos"). Verificación: `tsc`, `lint`, `build` y
> `test:smoke` en verde (7 verificaciones nuevas). Revisión y hallazgos en
> `plan-frontend-ux-fase5.md` §10. En esta actualización se corrigen los hallazgos **H1** (§5) y
> **H2** (§4-M2), que estaban desactualizados.

## 1. ¿Está todo conectado y completo?

**Sí en conectividad:** cliente HTTP único (`apiFetch` con Bearer token), todas las páginas consumen la API real (cero mocks en producción), 20 routers autenticados con `exigirAuth` + `exigirPermiso`. Dominio nuevo (docente_niveles, asistencia de doble alcance) integrado y verificado: `/docentes` devuelve `niveles`, `/asistencia/alcances/:claseId` responde `aula` / `cursos` correctamente.

| Módulo | Estado |
|---|---|
| Alumnos, Profesores, Cursos, Grados, Matrículas, Asistencia, Calificaciones, Pagos, Usuarios, Roles, Modelos | **COMPLETO** |
| Reportes | **COMPLETO** — `reportesService.ts` consume los 5 endpoints (`/reportes/alumnos`, `/matriculas`, `/asistencia`, `/evaluacion`, `/pagos`) y `ReportesPage.tsx` (791 líneas) los renderiza con exportación CSV en cliente |
| Dashboard | **COMPLETO** — `DashboardPage.tsx` (505 líneas) con KPIs reales (alumnos activos, cupos disponibles, tasa de asistencia, recaudado), resultados por clase/curso, pagos por concepto, matrículas por aula y distribución de asistencia; consume `reportesService` |
| Apoderados | **PENDIENTE** — tablas `apoderados`/`alumno_apoderados` en BD, sin servicio/rutas/UI |

## 2. Críticos (seguridad/correctitud)

1. **Suplantación (N5 eludible).** `registradoPor` / `docenteId` vienen del body y nunca se cruzan con `req.auth`:
   - `server/domain/asistencia.service.ts:217-239`
   - `server/domain/evaluacion.service.ts:245-254`
   - `server/domain/examenes.service.ts:205-214`
   - exigidos por `server/api/schemas.ts:69,85,95,110,121,149,184`
   Un docente puede registrar asistencia/calificaciones como otro docente y falsificar la traza I7. **Fix:** derivar el registrador de `req.auth` en la ruta (servicio recibe el usuario autenticado) y quitar esos campos del body.

2. **`actualizarAsistencia` no revalida N5** (`asistencia.service.ts:288-327`): cualquiera con `asistencia.registrar` sobrescribe registros de otros tutores/docentes.

3. **DELETE asignación con subconsulta inválida** (`asignacion.service.ts:264-268`): se pasa un query-builder de Drizzle crudo como valor de `eq()` → **500** en `DELETE /api/asignaciones/...`.

4. **Chequeo de DNI duplicado inútil** (`server/infra/repos/rbac.ts:24-25` filtra por `id`, no por `dni`): la violación de I1 revienta el UNIQUE → **500** en vez del 400 esperado (alumnos y docentes, crear y editar).

## 3. Altos (correctitud)

- **`reporteEvaluacion` mezcla cursos:** `reportes.service.ts:181-208` acumula trabajos/exámenes de toda la clase bajo cada curso (promedios duplicados) y hardcodea `modelo: 'COMPETENCIAS'` (línea 217).
- **`reporteAsistencia` ignora el alcance CURSO** (`reportes.service.ts:128-129`): solo ve registros AULA aunque existan por curso.
- **Configuración de evaluación sin UI viva:** el código huérfano `CursosPage.tsx` (que contenía la UI de configuración) fue movido a `legacy/paginas-reemplazadas-por-planificacion/` el 2026-10-10 (Fase 1, P1 de `plan-frontend-ux.md`). En la fuente viva (`src/features/planificacion/`) no hay pantalla de configuración de evaluación: `crearConfiguracion`/`actualizarConfiguracion`/`eliminarConfiguracion` (`configuracionService.ts:68,77,87`) están definidas pero ninguna página las usa. La brecha persiste.
- **N2 / N10 — actualizado 2026-10-10:** ya existe gestión de periodos (`PeriodosPage.tsx`, con activar/cerrar) y N10 se aplica en el backend (p. ej. `evaluacion.service.ts:170-175` rechaza escrituras en un periodo cerrado). La Fase 3 (P7) expone el año lectivo activo de forma global (`IndicadorAnioLectivo.tsx`) y refresca el indicador al activar/cerrar (`invalidarPeriodoActivo()`). Queda como mejora distinguir "año cerrado" de "sin año activo" (D7-b). *(El enunciado original de esta sección era del 2026-09-08 y quedó desactualizado.)*
- **I2 sin garantía en BD:** `usuarios.personaId` no es `unique` (1 Usuario ↔ 1 Persona solo por capa).
- **N7 bandas:** `BANDAS_CNEB` hardcodeada en `promedios.service.ts:40-45` y duplicada en `reportes.service.ts:57-62`; `bandasLiteral` del periodo no se lee.

## 4. Medios

- **M1** Arranque no migra ni siembra (solo `node server/db/init.ts` a mano; no hay script `db:init` en package.json).
- **M2** Violación de capas: repos directos en rutas (`trabajos.ts:46`, `examenes.ts:37-41`). *(La cita previa a `pagos.ts:45` quedó obsoleta: la Fase 5 (P14) reescribió `server/api/rutas/pagos.ts`, que ahora solo invoca el servicio, sin acceso directo a repos.)*
- **M3** `docenteId` se valida pero nunca se persiste (trabajos/exámenes) — se resuelve con el fix de suplantación.
- **M4** Barridos O(n): `modelo.service.ts:47,88,115`, `matriculas.service.ts:52-54`.
- **M5** `reporteMatriculas`: totales globales sin filtro de periodo (`reportes.service.ts:75-78`).
- **M6** Usuario creado sin password queda bloqueado para siempre (`usuarios.service.ts:73`).
- **B10** Endpoints muertos: `/catalogo/alumnos` y `/catalogo/cursos` (sombreados por montaje previo en `app.ts:42-44`).
- Menores: schema muerto `eliminarAsignacionSchema`, interfaces duplicadas (`reportes.service.ts:19-53` vs `331-364`; `cursosService.ts:12-26` vs `95-121`), `import()` dinámicos en competencia, enums como strings sin `z.enum`, permiso huérfano `reportes.exportar`, lecturas de query sin zod, `sesiones` acumulan filas sin scheduler.

## 5. UI/UX (priorizado)

**Rápido:**
- Buscador y paginación en tablas (ninguna lista los tiene; Alumnos y Profesores primero).
- Botón "Cancelar" **presente** en el diálogo Crear pago (`PagosPage.tsx:651-658`); la observación original (`PagosPage.tsx:667`) quedó desactualizada. Verificar el de Crear profesor (`ProfesoresPage.tsx:560`).
- Empty state de Alumnos sin CTA (`AlumnosPage.tsx:279-283`).
- `clearTimeout` para el éxito auto-oculto (`MatriculasPage.tsx:200-202`) — **obsoleto**: la Fase 2 (P10) migró el éxito a toast y eliminó el estado/temporizador.
- Alert "datos de demostración" falso en Usuarios/Roles (la API es real); "Año Lectivo 2026" hardcodeado en sidebar y dashboard — **resuelto**: el sidebar (`AppSidebar.tsx:80-82`) y el dashboard (`DashboardPage.tsx:477-479`) muestran `periodo.codigo` en vivo, y la Fase 3 (P7) añadió el banner global (`IndicadorAnioLectivo.tsx`).
- Ítems muertos "Mi perfil / Preferencias" en el Header (`Header.tsx:114-115`) — **resuelto**: la Fase 4 (P8, D-P8-4) añadió el ítem real "Mi perfil" al menú de usuario (`Header.tsx:133-136`, vía `DropdownMenuItem render={<Link to="/perfil" />}`); "Preferencias" nunca existió.

**Medio:**
- Bugs son anticuados: `window.confirm`/`alert` nativos **resueltos** en la Fase 2 de `plan-frontend-ux.md` (P10, 2026-10-10): `GradosTab` y `ClasesTab` usan `Dialog` + toasts; `ModelosPage` ya usaba diálogo. Quedan **0** `alert()`/`confirm()` nativos en `src/`. (El antiguo `GradosPage` fue movido a `legacy/` el 2026-10-10.)
- Asistencia: permisos con `includes` / `can('*')` en vez de `can()` y el contrato compartido (`AsistenciaPage.tsx:121,170`) — el backend ya filtra por docente.
- Monolitos: `CalificacionesPage` (1124 líneas, ~10 diálogos) y `ProfesoresPage` (1166 líneas). Los tabs vivos de Planificación también son grandes (`GradosTab` 626, `PlanEstudiosTab` 693, `ClasesTab` 536, `AsignacionesTab` 448). El antiguo `CursosPage` (2103 líneas) fue movido a `legacy/` el 2026-10-10 (Fase 1, P1). `PlanEstudiosTab` y `CalificacionesPage` crecieron en Fase 3 (P5/P6); ver P16. Extraer subcomponentes/tabs.
- Reportes + Dashboard: implementar KPIs (matrículas→vacantes, asistencia por curso/alcance, pagos por concepto, resultados por clase) con exportación CSV/PDF — lo que distingue a Q10/CONDESI/SIEGIE de un CRUD.

**Accesibilidad:** 10× `AlertTriangle` sin `aria-hidden` (Calificaciones), botón de fila expandible sin `aria-label` (`CalificacionesPage.tsx:750-755`), botón-emoji `📚` estructural (Asistencia), checkbox crudo (Modelos). La Fase 3 (P4/P5/P6/P12) añadió `aria-label` a los botones nuevos (ver detalle de matrícula, editar/anular trabajo, Retirar/Anular) y labels `htmlFor` en el diálogo de edición de trabajos; el botón "Anular trabajo" y "Editar trabajo" ya tienen `aria-label` (`CalificacionesPage.tsx:612,618`). Pendiente: `aria-invalid`/`aria-describedby` en formularios con validación manual (p. ej. `MatriculasPage`). Las referencias a "tabs manuales (Grados)" y "fila clickeable (Cursos)" apuntaban a páginas hoy movidas a `legacy/` (2026-10-10); el `GradosTab` vivo ya usa `aria-expanded`/`aria-controls` en sus filas expandibles, pero conviene re-auditar los tabs vivos.

**Rendimiento:** N+1 secuenciales en Calificaciones (lectura por competencia y escritura por alumno); `React.lazy()` por ruta para páginas pesadas.

## 6. Bueno encontrado

Capa de autorización centralizada (`hasPermission` con wildcards + `PermissionRoute` 403 + `Can`), estados carga/error/retry consistentes, FKs y índices parciales correctos (N1, N4, N6, N12, I8), login accesible (`aria-live`, `aria-invalid`), seed idempotente, DTOs correctos en `/docentes` (incluye `niveles`).

## 7. Orden sugerido de corrección

1. **Seguridad N5** (spoofing → derivar de `req.auth`; revalidar N5 en PUT asistencia; subconsulta asignación; chequeo DNI por `dni`).
2. **Reportes/Dashboard** (fix `reporteEvaluacion` y `reporteAsistencia`; UI de reportes + KPIs del dashboard).
3. **Periodos académicos** (N2 un solo ACTIVO, N10 congelar al cerrar).
4. **UX rápidos + accesibilidad** (buscador/paginación, botones Cancelar, empty state CTA, a11y).
5. **Rendimiento** (N+1 en Calificaciones, code-splitting).