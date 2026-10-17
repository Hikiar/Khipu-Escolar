# Plan de correcciones post-auditoría

Fuente: `AUDITORIA.md` (2026-09-08). El orden ejecuta primero lo que más reduce riesgo y menos rework provoca.

## Fase 0 — Seguridad e integridad (N5, I1) — Base obligatoria

Corrige el bloque "Críticos" de la auditoría. Cambia el contrato para dejar de confiar en el cliente.

- **0.1** Derivar el registrador/`docenteId` de `req.auth` (no del body):
  - `asistencia.ts` (rutas) → pasa usuario autenticado al servicio; `registrarAsistencia` y `actualizarAsistencia`.
  - `evaluacion.service.ts` (`crearTrabajo`, `actualizarTrabajo`, `registrarCalificacionTrabajo`) y `examenes.service.ts` (ídem examen) → reciben `docenteId` desde `req.auth`.
  - Quitar `registradoPor` / `docenteId` de `schemas.ts`.
- **0.2** Revalidar N5 en `actualizarAsistencia` (hoy no lo hace).
- **0.3** Repo `obtenerPersonaPorDni(dni)` en `rbac.ts` y usarlo en `alumnos.service.ts` / `docentes.service.ts` → 400 coherente (I1).
- **0.4** Corregir subconsulta de `eliminarAsignacion` (`asignacion.service.ts:264-268`) con `.get()?.id`.
- **Verificación:** `tsc -b`, `lint`, `build`, smoke HTTP (director + docente usr-002: flujos AULA/CURSO, duplicados, no-asignado, PUT asistencia ajeno → 400).

## Fase 1 — Periodos académicos (N2, N10)

- Servicio de periodos: `listarPeriodos`, `crearPeriodo`, `activarPeriodo` (valida uno solo ACTIVO), `cerrarPeriodo` (congela escritura).
- Guard de periodo CERRADO en escrituras de matrículas/asistencia/calificaciones/pagos.
- UI mínima de periodos (administrativo).
- **Verificación:** smoke HTTP (activa dos periodos → 400; cierra → escritura rechazada).

## Fase 2 — Reportes y Dashboard (reportes PARCIAL) + corrección A4/M5 — COMPLETA

- **2.1 ✅** `reporteEvaluacion`: filtrar trabajos/exámenes por curso y derivar `modelo` de la configuración real; eliminar duplicado de interfaces y bandas (unificar en `promedios.service.ts`).
- **2.2 ✅** `reporteAsistencia`: aceptar `cursoId` (alcance CURSO).
- **2.3 ✅** `reporteMatriculas`: totales filtrados por periodo.
- **2.4 ✅** Frontend: `src/services/reportesService.ts` + `ReportesPage` con las 5 consultas y exportación CSV.
- **2.5 ✅** `DashboardPage`: KPIs reutilizando los reportes (vacantes, asistencia por curso/alcance, pagos por concepto, resultados por clase).
- **Verificación ✅:** tsc/lint/build limpios (solo warnings preexistentes) + smoke de los 5 reportes + A4/M5 probado con datos temporales (cur-mate/cur-com: agrupado por curso y promedio general 13/B; filtro por curso aísla `cur-mate` 15/A) + restauración de la DB. `reportes.ver` es legítimamente de director/profesor/secretaria/personal (roles.ts). Cualidades detectadas de la DB demo: `asignacion_cursos` vacía por seed-early-return; considerar `npm run db:init` en Fase 3.

## Fase 3 — Constreñimientos DB + higiene de API — COMPLETA

- **I2 ✅** Migración 0004: `unique()` en `usuarios.personaId` (aplicada vía `node server/db/init.ts`; índice `usuarios_personaId_unique` verificado en la DB demo).
- **M2 ✅** Pre-checks de repos eliminados de rutas (`pagos.ts`, `trabajos.ts`, `examenes.ts`); validación de existencia movida a `listarCalificacionesDeTrabajo` / `listarCalificacionesDeExamen` en el servicio (→ 404 coherente).
- **B10 ✅** Endpoints muertos `/catalogo/alumnos` y `/catalogo/cursos` eliminados (+ `listarAlumnos`/`listarCursos`/tipo `AlumnoDto` de `catalogo.service.ts`).
- **B2 ✅** Schema muerto `eliminarAsignacionSchema` eliminado.
- **B5 ✅** `import()` dinámicos → estáticos en `competencia.service.ts`.
- **B6 ✅** Enums como `z.enum`: nivel de grado (INICIAL/PRIMARIA/SECUNDARIA), turno (MAÑANA/TARDE), estado de clase (ABIERTA/CERRADA), estado de examen (ACTIVO/INACTIVO) + UI de Calificaciones normalizada a mayúsculas.
- **B7 ✅** Permiso huérfano `reportes.exportar` eliminado de `shared/permissions.ts`.
- **B9 ✅** Middleware `validarQuery` (zod) + `server/api/querySchemas.ts` aplicado en las rutas con query params; 400 con detalles en caso de parámetro inválido. (Nota: en Express 5 `req.query` es de solo lectura; el middleware solo valida, no reasigna.)
- **M1 ✅** Script `npm run db:init` añadido.
- **M6 ✅** `crearUsuario` devuelve `passwordGenerada` cuando no se envió contraseña (verificado con login en el flujo).
- **Verificación ✅:** tsc/lint/build limpios (solo warnings preexistentes) + smoke: B9 (400/200), M2 (404), B6 (400), M6 (crear→login→limpieza). DB restaurada (4 usuarios, sin filas `tmp-*`).

## Fase 4 — UX rápido + accesibilidad — COMPLETA

- **4.1 ✅** Buscador + paginación en tablas: hook `src/hooks/useBuscador.ts` (filtro + paginación local, 10/página) y `src/components/common/Paginacion.tsx` con `aria-label`; integrado en Alumnos y Profesores (búsqueda, reseteo de página al filtrar, empty state con CTA, "sin resultados" con "Limpiar búsqueda", contadores "X resultados de Y").
- **4.2 ✅** Botones "Cancelar" en diálogos crear de Profesores y Pagos; empty state con CTA en Alumnos; `clearTimeout` + cleanup en Matrículas.
- **4.3 ✅** Año lectivo dinámico: `GET /api/periodos/activo` + hook `usePeriodoActivo` (badge del sidebar, subtítulo del Dashboard, diálogo crear-config era `periodosCatalogo` en Cursos); ítems muertos del Header retirados; alerts falsos de Usuarios/Roles reescritos.
- **4.4 ✅** `window.confirm/alert` → Dialog de confirmación en Grados (desactivar) y Modelos (eliminar).
- **4.5 ✅** a11y: `AlertTriangle` con `aria-hidden` (Calificaciones, Modelos), `aria-label` en botones, botón-emoji `📚` → `BookOpen`, tabs shadcn en Grados, botón expandir enfocable con `aria-expanded/aria-controls`, checkbox shadcn en Modelos.
- **4.6 ✅** `AsistenciaPage`: `can('asistencia.registrar')` consistente.
- **Verificación ✅:** tsc/lint/build limpios (solo warnings preexistentes de `set-state-in-effect`/fast-refresh) + smoke HTTP de la Fase 4 en suite global.

## Producción — listos para desplegar — COMPLETA

- **Prod.1 ✅** Respaldo/restauración: `server/db/backup.ts` (SQLite online backup, timestamp), scripts `npm run backup` y `npm run backup:restore`.
- **Prod.2 ✅** Config por entorno: `server/config.ts` (PORT, DATABASE_PATH, SESION_EXPIRACION_HORAS, BACKUPS_DIR) + `.env.example`; `.env` ignorado por git; Node las carga con `--env-file-if-exists=.env` en todos los scripts.
- **Prod.3 ✅** Deploy: `db:init` automático en el arranque (`inicializarBaseDatos()` en `server/index.ts`: migraciones + seed solo si BD vacía); `npm run start` levanta API + UI (`dist`) con SPA fallback en un solo proceso.
- **Prod.4 ✅** Auditoría: migración 0005 + tabla `auditoria` + middleware `auditarMutaciones` (cada POST/PUT/PATCH/DELETE con usuario, ruta, status, IP) + `GET /api/auditoria` solo con permiso total.
- **Prod.5 ✅** Tests de humo: `server/test/smoke.ts` (`npm run test:smoke`) sobre BD temporal: login, 401/403/400, RBAC, periodo activo, plan de estudios, ciclo de vida de alumno, auditoría. Todas las verificaciones en verde.
- **Prod.6 ✅** Paginación backend opt-in: `?pagina=N&limite=M` en `/api/alumnos` y `/api/docentes` devuelve `{ items, total, pagina, totalPaginas }` (frontend sin cambios: sigue usando listas completas).

## Fase 5 — Rendimiento

- Batch `POST /calificaciones` (array) y `Promise.allSettled` en guardado; `Promise.all` en carga por competencia.
- `React.lazy()` + `Suspense` por ruta.
- Memo/estado local por fila en Asistencia y Calificaciones.
- **Verificación:** build + smoke del endpoint batch.

## Fase 6 — Futuro (fuera de este plan salvo pedido)

Apoderados (UI), carga horaria por docente, calificaciones por áreas asignadas, EF — Psicomotriz, exportación SIAGIE, perfil/cambio de contraseña propio, tesorería por recibo.

## Nueva funcionalidad (post-Plan) — Reactivación y eliminación física de secciones/clases

- **Backend**: `reactivarAlumno`, `reactivarDocente`, `reactivarCurso`, `reactivarUsuario` (POST `/:id/reactivar`); `eliminarSeccion` + `eliminarClase` con guard de dependencias (matrículas, asistencias, asignaciones, evaluaciones, calificaciones); DELETE `/api/secciones/:id` y `/api/clases/:id` con permiso `grados.eliminar`.
- **Frontend**: botones "Reactivar" en Alumnos, Profesores, Cursos, Usuarios (diálogos de confirmación); botón "Eliminar" en secciones y clases (Grados) y renombrado "Desactivar" → "Eliminar" para grados; `UsuariosPage` con columna Acciones (Desactivar/Reactivar).
- **Smoke tests**: 8 verificaciones nuevas (reactivar alumno, crear→eliminar sección/clase, guardas de dependencias). Total 23/23 ✓.

---
**Estado:** Fases 1–2, Fase 3, Fase 4 y Producción completas (periodos; reportes/dashboard+A4/M5; constreñimientos DB + higiene de API; UX + accesibilidad; deploy: backups, env por entorno, db:init automático + start prod, auditoría, smoke tests, paginación backend). **Nueva funcionalidad post-Plan completada**: reactivación de alumnos/profesores/cursos/usuarios + eliminación física de secciones y clases con guards. Siguiente pendiente (si se pide): Fase 5 — Rendimiento.