# Plan de mejora de UX del frontend — Khipu Escolar

> Autor: Big Pickle (subagente de planificación/arquitectura/documentación).
> Fecha: 2026-10-10.
> Alcance: análisis de confusión de uso del frontend y su correlación con los
> endpoints ya existentes del backend. **No se modifica código fuente**; este
> documento es el plan que implementará MiMo V2 Pro.
> Documentos relacionados: `plan-frontend.md` (diagnóstico base previo),
> `AUDITORIA.md`, `PLAN.md`, `plan_cursos.md`, `DESIGN_SYSTEM.md`.

---

## 1. Contexto y alcance

- El dashboard tiene 19 módulos en `src/features/*` y 22 grupos de rutas REST en
  `server/api/rutas/*`.
- El dueño reporta que **la interfaz le resulta confusa para usar**, aun siendo
  el autor del backend. Este plan ataca esa confusión de forma incremental.
- Regla de diseño del plan: **toda mejora se apoya en endpoints que ya existen**.
  Cuando algo exige backend nuevo se marca explícitamente como **[BACKEND NUEVO]**.
- Objetivos: (a) reducir ambigüedad de navegación/terminología, (b) eliminar
  caminos y código muertos, (c) hacer consistente el feedback y la carga de
  datos, (d) cerrar la brecha entre lo que el backend ofrece y la UI expone.

---

## 2. Diagnóstico UX: confusiones y problemas

| # | Problema | Evidencia (archivo:línea) | Impacto | Severidad |
|---|----------|---------------------------|---------|-----------|
| C1 | **Páginas huérfanas duplicadas.** `GradosPage`, `CursosPage` y `AsignacionesPage` están exportadas pero **nunca se importan**; las rutas `/grados`, `/cursos`, `/asignaciones` redirigen a las pestañas de Planificación. ~3.800 líneas de UI muerta que pueden divergir y confundir al mantener. | `src/features/grados/pages/GradosPage.tsx:144`, `src/features/cursos/pages/CursosPage.tsx:85`, `src/features/asignaciones/pages/AsignacionesPage.tsx:69`; redirecciones en `src/App.tsx:97-100` | Interferencia de mantenimiento y riesgo de "dos verdades" | Alta |
| C2 | **Módulos que desaparecen del menú sin explicación.** El sidebar filtra items por permisos/roles en silencio: si faltan permisos, el módulo simplemente no aparece y no hay pista del porqué. | `src/hooks/useFilteredNav.ts:14-25`, `src/components/layout/AppSidebar.tsx` | El usuario no entiende por qué "le falta" una función | Alta |
| C3 | **Doble criterio de acceso: permisos y roles mezclados.** La navegación combina `permission` **y** `roles` (p. ej. `salones.mis` con `roles:['profesor']`), pero los guards de ruta solo usan `PermissionRoute`. Un tutor con permiso pero sin el rol se queda sin menú; otro con rol pero sin permiso ve un 403. | `src/config/navigation.ts:34-40`; `src/App.tsx:50-57`; `src/hooks/useFilteredNav.ts:20-22` | Accesos incoherentes menú vs. ruta | Alta |
| C4 | **Terminología sobrecargada.** "Curso" se usa para *asignatura* (módulo Cursos/Plan de estudios) y "Clase" para el aula; en lenguaje escolar "curso" suele significar el año/grado. Columnas y descripciones mezclan "Curso", "Clase", "Grado". | `src/features/asignaciones/pages/AsignacionesPage.tsx:239,274,332`; `src/config/navigation.ts:42-47` | El usuario no sabe qué está eligiendo | Alta |
| C5 | **Descripción de módulo que promete algo inexistente.** El menú anuncia "…clases, asignaciones **y horarios**", pero no existe ninguna pestaña/pantalla de horarios. | `src/config/navigation.ts:45` vs. `src/features/planificacion/pages/PlanificacionPage.tsx:53-88` | Expectativa incumplida desde la entrada | Media |
| C6 | **Feedback inconsistente.** Los resultados se comunican de 4 formas distintas: `<Alert>` (Matrículas), `div role="alert"` (Planificación), texto inline (Mis salones), y toasts. No hay un patrón único de éxito/error. | `src/features/matriculas/pages/MatriculasPage.tsx:255`; `src/features/planificacion/pages/PlanificacionPage.tsx:48`; `src/features/mis-salones/pages/MisSalonesPage.tsx:193` | El usuario no reconoce el patrón de respuesta del sistema | Media |
| C7 | **Lógica de carga de datos duplicada.** 6+ páginas redefinen `type EstadoCarga = 'cargando'\|'ok'\|'error'` y su propio skeleton/tabla vacía, en lugar de un hook/componente común. | `MatriculasPage.tsx:59,61`; `AsignacionesPage.tsx:29`; `MisSalonesPage.tsx:42`; `PeriodosPage.tsx:45,64` | Inconsistencia visual y coste de mantenimiento | Media |
| C8 | **Formularios sin accesibilidad uniforme.** `MatriculasPage` usa `<Label>` sin `htmlFor`, sin `aria-invalid`, y valida solo al enviar vía `Alert`. `AsignacionesPage` sí tiene un `InputConLabel` correcto. | `MatriculasPage.tsx:263,424,440,452` vs. `AsignacionesPage.tsx:47-67` | Barrera de accesibilidad y errores que no se asocian al campo | Media |
| C9 | **"Retirar" vs "Anular" matrícula indistinguibles.** Ambas acciones se ofrecen juntas, comparten el mismo permiso `matriculas.anular`, y solo se diferencian por el texto del diálogo; una es reversible y la otra destructiva. | `src/features/matriculas/pages/MatriculasPage.tsx:369-391,371,482-490` | Riesgo de borrado accidental / uso indebido | Alta |
| C10 | **`apiClient` no valida el estado HTTP ni maneja red.** Hace `await respuesta.json()` sin comprobar `respuesta.ok` ni capturar fallos de red; las páginas tampoco hacen `try/catch`, así que un fallo de red no produce un estado de error controlado. | `src/services/apiClient.ts:31-36`; p. ej. `MatriculasPage.tsx:126-135` | Pantallas que quedan "colgadas" o revientan ante caída del API | Alta |
| C11 | **Ausencia de indicador global de año lectivo activo.** El período activo se consulta de forma puntual; no hay banner ni contexto global que recuerde que el año cerrado es de solo lectura. | `src/services/catalogoService.ts:155-159`; uso puntual en `MatriculasPage.tsx:180` | El usuario edita datos congelados sin darse cuenta | Media |
| C12 | **Endpoints backend sin pantalla** (ver §3.2). Hay API con valor para el usuario (auditoría, detalle de matrícula/curso, edición de trabajos) sin UI que la exponga. | `server/api/rutas/auditoria.ts`; `cursosService.ts:63`; `matriculasService.ts:32`; `evaluacionService.ts:94` | Funcionalidad pagada no visible | Media |
| C13 | **Falta gestión de conceptos de pago.** El módulo Pagos consume `GET /conceptos` pero no hay forma en UI (ni endpoint) de crear/editar conceptos de pago. | `src/services/pagosService.ts` (solo listar conceptos); `server/api/rutas/pagos.ts` | El catálogo de conceptos queda fijo en BD | Media |
| C14 | **Módulos monolíticos.** `CursosPage` (1913) y `GradosPage` (1466) —aunque huérfanos— y `CalificacionesPage` (999), `ProfesoresPage` (1073) concentran demasiada responsabilidad. | conteos en `src/features` | Difícil de revisar/ajustar | Baja |

---

## 3. Inventario backend ↔ frontend

### 3.1 Estado general

- **Auth**: `login`, `demo`, `validar`, `logout`, `cambiar-contrasena` — todos consumidos (`src/services/authService.ts`).
- **Alumnos**: listar/obtener/expediente/historial-asistencia/resultados/crear/actualizar/desactivar/reactivar — consumidos (`src/services/alumnosService.ts`, `expedienteService.ts`).
- **Reportes**: los 5 endpoints (`consultarAlumnos/Asistencia/Evaluacion/Matriculas/Pagos`) ya están cableados en `src/services/reportesService.ts` y usados por `DashboardPage.tsx:28-39` y `ReportesPage`.
  > **Nota de drift documental (resuelta el 2026-10-10 por P15):** `AUDITORIA.md` calificaba Dashboard y Reportes como "PARCIAL/placeholder"; ya se corrigió a **COMPLETO** (ver `AUDITORIA.md` §1).

### 3.2 Endpoints backend SIN uso en el frontend

Endpoints (o funciones de servicio) que existen y no se invocan desde ninguna pantalla:

| Endpoint backend | Función de servicio definida | Estado de uso |
|------------------|------------------------------|---------------|
| `GET /api/auditoria` | `listarAuditoria` (`auditoriaService.ts:31`) | **En uso desde Fase 4 (P13)** — `AuditoriaPage.tsx` |
| `GET /api/auth/me` | `obtenerUsuarioActual` (`authService.ts:61`) | **En uso desde Fase 4 (P8, D-P8-3b)** — `refrescarPerfil` (`AuthProvider.tsx:117-127`) |
| `GET /api/resultados/:alumnoId` | — (la UI usa `GET /alumnos/:id/resultados`) | Sin UI |
| `GET /api/asistencia/:id` | `obtenerAsistenciaPorId` (`asistenciaService.ts:74`) | Definida, nunca llamada |
| `GET /api/asignaciones/:claseId/:cursoId/:docenteId` | `obtenerAsignacion` (`asignacionService.ts:44`) | Definida, nunca llamada |
| `GET /api/modelos/:id` | `obtenerModelo` (`modeloService.ts:28`) | Definida, nunca llamada |
| `GET /api/matriculas/:id` | `obtenerMatricula` (`matriculasService.ts:32`) | **En uso desde Fase 3 (P4)** |
| `GET /api/grados/:id` | `obtenerGrado` (`gradosService.ts:78`) | Definida, nunca llamada |
| `GET /api/cursos/:id` | `obtenerCurso` (`cursosService.ts:63`) | **En uso desde Fase 3 (P5)** |
| `GET /api/configuraciones/:id` | `obtenerConfiguracion` (`configuracionService.ts:62`) | Definida, nunca llamada |
| `GET /api/competencias/:id` | `obtenerCompetencia` (`competenciaService.ts:35`) | Definida, nunca llamada |
| `PATCH /api/trabajos/:id` | `editarTrabajo` (`evaluacionService.ts:94`) | **En uso desde Fase 3 (P6)** |

> Criterio: no se pide eliminar estos endpoints; se documenta que hoy no aportan
> valor de UI y son candidatos a (a) exponerse como detalle bajo demanda, o
> (b) deprecarse si no se van a usar.

### 3.3 Brechas de backend (funcionalidad sin endpoint)

| Necesidad | Estado |
|-----------|--------|
| Crear/editar/desactivar **conceptos de pago** | **[BACKEND NUEVO]** solo existe `GET /conceptos` |
| Exportar reportes (CSV/PDF) | **[BACKEND NUEVO]** la UI solo consulta JSON |
| Módulo **Apoderados** (tablas ya en BD, sin rutas/servicio/UI) | **[BACKEND NUEVO]** según `AUDITORIA.md` |

---

## 4. Propuestas priorizadas

Escala de esfuerzo: **S** (≤1 día), **M** (2-4 días), **L** (>1 semana).

| P | Propuesta | Endpoint / base | Esfuerzo | Criterios de aceptación |
|---|-----------|-----------------|----------|-------------------------|
| P1 ✅ | **Eliminar o mover a `legacy/` las páginas huérfanas** `GradosPage`, `CursosPage`, `AsignacionesPage` y sus tests, dejando una única fuente en `planificacion/*`. | ninguno | S | `rg` no encuentra imports a esas páginas; build y tests pasan; rutas siguen redirigiendo a `/planificacion`. |
| P2 ✅ | **Endurecer `apiClient`**: comprobar `respuesta.ok`, envolver en `try/catch`, timeout y mensaje uniforme; exponer un `ApiError`. | ninguno | S | Un fallo de red o un 500 produce un estado de error controlado en las páginas; sin "cuelgues". |
| P3 ✅ | **Unificar terminología**: "Grado", "Sección", "Clase (aula)", "Asignatura (curso)", "Año lectivo". | ninguno | M | Ninguna etiqueta de UI mezcla los términos; `navigation.ts:45` sin "horarios". *(Implementado en Fase 2; quedan residuales de "Curso"/"salón" fuera del inventario original — ver `plan-frontend-ux-fase2.md` §11.)* |
| P4 ✅ | **Detalle bajo demanda de matrícula** (drawer) usando endpoint ya disponible. | `GET /api/matriculas/:id` | S | Desde la tabla se abre el detalle; da uso al endpoint huérfano. *(Fase 3; revisión en `plan-frontend-ux-fase3.md` §12.)* |
| P5 ✅ | **Detalle de asignatura** en Plan de estudios (o quitar la función si no se usará). | `GET /api/cursos/:id` | S | El detalle carga por id; elimina función muerta. *(Fase 3; revisión en `plan-frontend-ux-fase3.md` §12.)* |
| P6 ✅ | **Habilitar edición de trabajos de evaluación** desde Calificaciones. | `PATCH /api/trabajos/:id` | S | Editar un trabajo persiste y refresca; da uso a `editarTrabajo`. *(Fase 3; revisión en `plan-frontend-ux-fase3.md` §12.)* |
| P7 ✅ | **Indicador global de año lectivo activo** en `Header` (banner + nombre + estado). | `GET /api/periodo-activo`, `GET /api/periodos` | S/M | Banner visible en todas las pantallas; aviso de "solo lectura" al abrir un año cerrado. *(Fase 3; banner en `AppShell`, revisión en `plan-frontend-ux-fase3.md` §12.)* |
| P8 ✅ | **Explicar el acceso denegado**: en `Mi perfil` mostrar permisos efectivos + sección "Módulos no disponibles" con el motivo (vía elegida: D-P8-1). | sesión (`usuario.permisos`) / `GET /api/auth/me` | M | El usuario puede ver por qué no ve un módulo; no hay desapariciones silenciosas. *(Fase 4 completada; plan §2, revisión y hallazgos en `plan-frontend-ux-fase4.md` §9.)* |
| P9 ✅ | **Componente/hook único de carga** (`useCarga` + `<EstadoCarga>`) que absorba los 6 duplicados. | ninguno | M | Ninguna página redefine `EstadoCarga`; skeletons y "sin datos" idénticos. *(Fase 2: tipo+skeleton unificados; adopción plena de `useCarga` diferida.)* |
| P10 ✅ | **Feedback unificado con toasts (sonner)** para todas las mutaciones y `Alert` para errores de carga. | ninguno | M | Éxito = toast; error de carga = `Alert` con reintento; patrón único. *(Fase 2: 0 `alert()`/`confirm()` nativos; `src/lib/feedback.ts`.)* |
| P11 ✅ | **Formularios accesibles**: `Label htmlFor`, `aria-invalid`, error por campo (zod + react-hook-form). | ninguno | M | Todos los inputs con label asociado y error anunciado; axe sin hallazgos críticos. *(Fase 2: prioridades 1-2; residual en filtro "Clase" de Asistencia.)* |
| P12 ✅ | **Separar "Retirar" de "Anular" matrícula** (icono, color, confirmación reforzada, permiso dedicado). | `matriculas.anular` | M | Acciones diferenciadas visual y semánticamente; "Anular" pide confirmación destructiva. *(Fase 3; permiso dedicado (D8-b) diferido a backend, revisión en `plan-frontend-ux-fase3.md` §12.)* |
| P13 ✅ | **Pantalla de auditoría** (log de acciones) para administradores. | `GET /api/auditoria` | M | Item de menú "Auditoría"; tabla filtrable por fecha/usuario/acción. *(Fase 4 completada; plan §3, revisión y hallazgos en `plan-frontend-ux-fase4.md` §9.)* |
| P14 ✅ | **Gestión de conceptos de pago** (*cablear UI*). | **[BACKEND NUEVO]** `POST/PATCH/DELETE /api/pagos/conceptos` | L (revisado: M) | CRUD de conceptos operativo desde Pagos. *(Fase 5 completada; plan detallado y revisión en `plan-frontend-ux-fase5.md` §10. La tabla `conceptos_pago` y la FK `pagos.conceptoId` ya existían → sin migración; esfuerzo real M. Sin hallazgos bloqueantes.)* |
| P15 ✅ | **Alinear `AUDITORIA.md` con la realidad** (Dashboard/Reportes ya no son placeholders). | ninguno | S | El doc refleja el estado verificado en código. |
| P16 ✅ | **Descomponer los monolitos** (`CalificacionesPage`, `ProfesoresPage`, y los tabs de Planificación). *(Fase 6 completada; revisión y hallazgos en `plan-frontend-ux-fase6.md` §9.)* | ninguno | L | Páginas < ~400 líneas, con subcomponentes/hooks extraídos. |

> **Estado 2026-10-10:** Fase 1 completada — P1, P2 y P15. Ver `AUDITORIA.md` para el detalle.
> **Fase 2 completada — P3, P9, P10, P11** (plan detallado en `plan-frontend-ux-fase2.md`;
> hallazgos de la revisión y residuales en su §11). Verificación: `npx tsc -b`, `npm run lint`,
> `npm run build` y `npm run test:smoke` en verde.
> **Fase 3 completada — P4, P5, P6, P7, P12** (plan detallado en `plan-frontend-ux-fase3.md`;
> criterios §9.1 y hallazgos de la revisión en su §12). Verificación: `npx tsc -b`, `npm run lint`,
> `npm run build` y `npm run test:smoke` en verde. Sin hallazgos bloqueantes.
> **Fase 4 completada — P8, P13** (plan detallado en `plan-frontend-ux-fase4.md`; revisión y
> hallazgos en su §9). (P8) *Mi perfil* muestra permisos efectivos + "Módulos no disponibles"
> con el motivo, y refresca permisos vía `/api/auth/me`; (P13) pantalla de auditoría sobre
> `GET /api/auditoria` restringida a `PERMISO_TOTAL`. Verificación: `npx tsc -b`, `npm run lint`,
> `npm run build` y `npm run test:smoke` en verde. **Sin hallazgos bloqueantes**; queda 1 hallazgo
> mayor no bloqueante (refresco de perfil que no propaga el fallo) y ajustes de copy/a11y (§9.4).
> Pendiente de fases posteriores: adopción plena de `useCarga` en las páginas con estado manual
> (P9 §3.2-D), errores por campo con `aria-invalid`/`aria-describedby` en formularios con
> validación manual (P11, p. ej. MatriculasPage), toggle "Ver retiradas" (P12-6/H1), permiso
> dedicado `matriculas.retirar` (D8-b, backend) y desglose de monolitos (P16).
> **Fase 5 completada — P14** (plan detallado y revisión en `plan-frontend-ux-fase5.md` §10):
> la tabla `conceptos_pago` y la FK `pagos.conceptoId` ya existían
> (`server/db/schema.ts:507-522,531-533`), por lo que **no hubo migración de esquema ni de datos**.
> Se añadieron los endpoints `POST/PATCH/DELETE /api/pagos/conceptos` con permisos
> `conceptosPago.*`, la página "Conceptos de pago" bajo Finanzas (`ConceptosPagoPage.tsx`) y el
> botón "Gestionar conceptos" en `PagosPage`. Verificación: `npx tsc -b`, `npm run lint`,
> `npm run build` y `npm run test:smoke` en verde (7 verificaciones nuevas). **Sin hallazgos
> bloqueantes**; 1 mayor no bloqueante (manejo de errores de transporte en las mutaciones,
> deuda pre-existente de P9/P10 replicada) y residuales menores (§10.2).
> **Fase 6 completada — P16** (plan detallado y revisión en
> `plan-frontend-ux-fase6.md` §9): refactorización **pura** de `CalificacionesPage`
> (1065), `ProfesoresPage` (1036), `PlanEstudiosTab` (667), `GradosTab` (609) y
> `ClasesTab` (487) mediante hooks de feature (`useCalificaciones` +
> `useCalificacionesContexto`/`useCalificacionesEvaluacion`, `useProfesores`/
> `useProfesorForm`, `usePlanEstudios`, `useGradosTab`, `useClasesTab`) y
> subcomponentes en `src/features/<feat>/components/`. Los 6 contenedores quedaron
> **< 400 líneas no vacías** (`CalificacionesPage` 268, `ProfesoresPage` 222,
> `PlanEstudiosTab` 217, `GradosTab` 145, `ClasesTab` 96, `AsignacionesTab` 164).
> Verificación: `npx tsc -b`, `npm run lint`, `npm run build` y `npm run test:smoke`
> (SMOKE OK, 53 verificaciones) en verde. **Sin bloqueantes ni hallazgos
> pendientes**: los 2 hallazgos de la revisión quedaron **resueltos el
> 2026-10-17** y **re-verificados** en verde con los 4 comandos — H1 (copy:
> se restauró `Cree la primera clase para este grado` en
> `clases/ClasesTabla.tsx:73`) y H2 (regresión confirmada en el select "Grado"
> de `ClaseFormDialog`: se poblaba con `seccionesParaSelect`; hoy recibe
> `grados` vía prop nueva —`ClaseFormDialog.tsx:34,47,90-94`,
> `ClasesTab.tsx:90`— y lista grados con el mismo formato que el filtro
> hermano). H3 (warning `no-unused-expressions` que dejó de emitirse) se
> confirmó benigno. Detalle y causa raíz: `plan-frontend-ux-fase6.md` §9.6-§9.8.

---

## 5. Checklist de aceptación global

- [x] No quedan páginas exportadas sin importar (P1).
- [x] `apiClient` nunca deja una promesa sin resolver por red/HTTP (timeout 15 s + `ApiError`); el estado de error visible en páginas sin `try/catch` queda pendiente (P9/P10).
- [x] Terminología única y validada por revisión de copy (P3). *(Residuales menores de "Curso"/"salón" fuera del inventario original; ver `plan-frontend-ux-fase2.md` §11.)*
- [x] Todo endpoint listado en §3.2 tiene UI **o** justificación explícita de deprecación (P4-P6 ✅ Fase 3; P13 auditoría y P8 `/auth/me` ✅ Fase 4 — *residuo «🚧 en curso, Fase 4» corregido el 2026-10-17: la Fase 4 está completada según §4-P8/P13, la nota de Fase 4 y el check de «Módulos no disponibles» más abajo*; el resto queda documentado como candidato a detalle/deprecación).
- [x] Existe un único patrón de carga y un único patrón de feedback (P9, P10). *(Adopción plena de `useCarga` diferida a fase posterior.)*
- [x] Formularios con labels asociados y errores por campo (P11). *(Prioridades 1-2; residuales en campos de diálogo de prioridad 3.)*
- [x] "Retirar" y "Anular" son inequívocos (P12 ✅ Fase 3).
- [x] Banner de año lectivo activo presente (P7 ✅ Fase 3).
- [x] El usuario puede entender por qué un módulo no aparece (P8 ✅ Fase 4; revisión en `plan-frontend-ux-fase4.md` §9).
- [x] `AUDITORIA.md` y docs alineados con el código (P15).
- [x] Los módulos monolíticos están descompuestos en hooks/subcomponentes (P16 ✅ Fase 6; revisión en `plan-frontend-ux-fase6.md` §9).
- [x] `npm run build` y la suite de tests pasan sin regresiones.

---

## 6. Riesgos y notas para la implementación

1. **Orden sugerido:** P1, P2, P15 (limpieza/robustez, bajo riesgo) → P3, P9, P10, P11 (consistencia) → P4-P7, P12 (valor directo) → P8, P13 → P14, P16 (mayor alcance/backend).
2. **P14 requiere backend** (no existían endpoints de mutación de conceptos de pago); no debe intentarse solo desde el frontend. La tabla `conceptos_pago` y la FK `pagos.conceptoId` ya existen desde `0000_inicial.sql` → **sin migración**; el plan detallado está en `plan-frontend-ux-fase5.md` (§0.1, §2).
3. **Cuidado con C3** al tocar `useFilteredNav`: hoy el filtrado por `roles` puede ocultar "Mis salones" a quien sí tiene el permiso de ruta. Unificar a permisos o documentar la regla; no romper accesos existentes.
4. **No eliminar endpoints** sin confirmar consumidores externos; §3.2 documenta "sin uso en UI", no "obsoleto".
5. **Documentación desactualizada (resuelto):** `AUDITORIA.md` marcaba Dashboard/Reportes como placeholder; corregido el 2026-10-10 (P15).
6. **Fase 2 (P3, P9, P10, P11) — hallazgos de revisión (2026-10-10):** todos los criterios
   verificables de §8 de `plan-frontend-ux-fase2.md` se cumplen (0 `alert()`/`confirm()`, único
   `EstadoCarga`, único `FilasSkeleton`, sin `role="alert"` en PlanificacionPage). Quedan:
   (a) copys residuales de "Curso" en encabezados/etiquetas que el inventario §2 no listó
   (Dashboard `312/328`, AlumnoFicha `315`, ProfesorFicha `135/152/162`, CSV de Reportes `550/562`,
   AsignacionesTab `143/254`); (b) tabla "Asistencia" con `<Label>` sin `htmlFor` en el filtro
   "Clase" (`AsistenciaPage.tsx:407`); (c) estado muerto `editError`/`quitarError` en
   `PlanEstudiosTab` tras migrar a toasts *(resuelto en Fase 3 — ver §6-7)*; (d) declaración de estado a mitad de componente en
   `GradosTab` (`gradoPorEliminar`, línea 149). Ninguno es bloqueante; el detalle está en
   `plan-frontend-ux-fase2.md` §11.
7. **Fase 3 completada (P4, P5, P6, P7, P12) — hallazgos de revisión (2026-10-10):** plan y
   revisión detallados en `plan-frontend-ux-fase3.md` (§9 y §12). Diseño condicionado por:
   (a) la lista de matrículas ya devuelve el DTO completo, por lo que `obtenerMatricula` es
   redundante en datos (se usa por frescura y cobertura de P4); (b) `MatriculasPage` solo lista
   ACTIVAS, el `Badge` "Retirada" (`MatriculasPage.tsx:344-346`) sigue inalcanzable (P12-6
   opcional no implementado); (c) `usePeriodoActivo` alimenta sidebar + banner y ya se invalida
   tras activar/cerrar (`PeriodosPage.tsx:137`); (d) `/periodo-activo` y `/periodos/activo` son
   endpoints equivalentes; (e) D8-a reutiliza `matriculas.anular` (no existe permiso dedicado);
   (f) `PlanEstudiosTab` (gated por `grados.ver`) puede recibir 403 de `obtenerCurso` en roles sin
   `cursos.ver`, mostrado inline (D4-a). Resueltos: el banner global de año lectivo (P7) y la
   diferenciación Retirar/Anular con confirmación (P12). Residenciales menores: reapertura del
   drawer P4 si se cierra antes de la respuesta (`MatriculasPage.tsx:210-226,525`), peticiones
   duplicadas/parpadeo en la invalidación de `usePeriodoActivo` (`usePeriodoActivo.ts:15-18,51-56`),
   un fallo transitorio del período se cachea como `null` y muestra el aviso ámbar
   (`usePeriodoActivo.ts:42-46`), y ausencia del "nº de docentes" en el detalle P5. Ninguno es
   bloqueante; el detalle con `archivo:línea` está en `plan-frontend-ux-fase3.md` §12.4. El código
   muerto `editError`/`quitarError` de `PlanEstudiosTab` (señalado en §6-6) quedó eliminado.
8. **Fase 4 (P8, P13) — decisiones y riesgos clave (planificación, 2026-10-10):** el detalle con
   `archivo:línea` está en `plan-frontend-ux-fase4.md` (§1 decisiones, §5 riesgos). Puntos que
   condicionan la implementación: (a) `usuario.permisos` ya está en la sesión
   (`shared/types/auth.ts:17`), por lo que "permisos efectivos" no requiere backend; (b) la vía
   elegida para evitar desapariciones silenciosas es una sección "Módulos no disponibles" en
   *Mi perfil* (D-P8-1), **no** items fantasma, para no tocar el filtrado del sidebar (riesgo C3)
   y por accesibilidad/móvil; (c) `useModulosOcultos` y `useFilteredNav` deben compartir un único
   predicado `esItemVisible` para no contradecir al menú; (d) `GET /api/auditoria` exige
   `PERMISO_TOTAL` (`'*'`), no acepta query params y devuelve solo los 200 registros más recientes
   (`server/infra/repos/auditoria.ts:32-39`) → filtros/paginación en cliente; (e) `/api/auth/me`
   es el último endpoint huérfano que P8 puede cerrar (D-P8-3b) vía `obtenerUsuarioActual()` +
   `refrescarPerfil()`; (f) `AUDITORIA.md:89` cita ítems "Mi perfil/Preferencias" inexistentes en
   el `Header` actual (sincronizado en la revisión de Fase 4; ver §6-9).
9. **Fase 4 completada (P8, P13) — hallazgos de revisión (2026-10-10):** plan y revisión detallados
   en `plan-frontend-ux-fase4.md` (§2-§3 y §9). El predicado `esItemVisible` es compartido por
   `useFilteredNav` y `useModulosOcultos` (riesgo C3 mitigado); `/api/auth/me` dejó de ser huérfano.
   **Sin bloqueantes.** Pendientes no bloqueantes: (a) **MAYOR** — `refrescarPerfil` no propaga el
   fallo `ok:false`, por lo que *Mi perfil* muestra un toast de éxito aunque el refresco falle
   (`AuthProvider.tsx:117-127` + `MiPerfilPage.tsx:97-107`); (b) clase CSS inexistente
   `text-warning-foreground` en el motivo (`MiPerfilPage.tsx:355`); (c) el motivo del ítem
   "Auditoría" para no-directores muestra «`*`» (`navigation.ts:147` + `useFilteredNav.ts:26-34`);
   (d) `aria-label` del menú de usuario desactualizado (`Header.tsx:87`); (e) el Director ve
   "Mis salones" en "Módulos no disponibles" pese a "Acceso total" (honesto, pero ruidoso). El
   detalle con `archivo:línea` está en `plan-frontend-ux-fase4.md` §9.4.
10. **Fase 5 completada (P14) — hallazgos de revisión (2026-10-10):** plan y revisión detallados
    en `plan-frontend-ux-fase5.md` (§10). Confirmado por código y por `test:smoke`: UQ
    `(periodoId, codigo)` en crear y editar (excluyendo el propio id), N10 en las 3 mutaciones,
    guardia FK en DELETE (400), `periodoId` inmutable en PATCH, OR de permisos en el GET, orden
    correcto de rutas Express y doble entrada (menú + botón) sin divergencia de copy
    (`src/features/pagos/utils.ts`). **Sin bloqueantes.** Pendientes no bloqueantes: (a) **MAYOR**
    — las mutaciones de `ConceptosPagoPage` no capturan fallos de transporte de `apiFetch`
    (diálogo puede quedar en "Creando…/Eliminando…", `ConceptosPagoPage.tsx:199-236,239-253`),
    deuda pre-existente de P9/P10 replicada; (b) **MENOR** — sin guarda de secuencia en
    `cargarConceptos` (`:131-143`); (c) **MENOR** — esqueleto permanente si no hay años lectivos
    (`:93,145-151,352-369`); (d) **MENOR** — falta `aria-invalid`/`aria-describedby` por campo en
    el diálogo (`:464-487`); (e) **NOTA** — el botón "Gestionar conceptos" solo aparece con alumno
    seleccionado (`PagosPage.tsx:319,334-339`); (f) H3 persiste — el smoke sigue sin cubrir
    `POST /pagos` y `/:id/anular`. `AUDITORIA.md` H1/H2 sincronizados (§4-M2 y §5).
11. **Fase 6 completada (P16) — hallazgos de revisión (2026-10-14) y correcciones
    post-revisión (2026-10-17):** plan y revisión detallados en
    `plan-frontend-ux-fase6.md` (§9; correcciones, causa raíz y re-verificación en
    §9.8). Los 6 contenedores quedaron < 400 líneas no vacías; API pública estable
    (`App.tsx`/`PlanificacionPage.tsx` sin cambios); sin `alert()`/`confirm()`; los
    4 comandos de §6.3 en verde (SMOKE OK, 53 verificaciones), **re-ejecutados en
    verde el 2026-10-17 tras las correcciones**. **Sin bloqueantes ni pendientes.**
    Hallazgos: (a) **MAYOR — RESUELTO (2026-10-17)** — el select "Grado" de
    `ClaseFormDialog` se poblaba con `seccionesParaSelect` en vez de `grados`;
    era regresión real (violaba D-P16-7; el formulario legado usaba
    `<GradosAgrupados grados={gradosParaSelect} />`). Corregido con la prop nueva
    `grados: Grado[]` (`ClaseFormDialog.tsx:34,47,90-94`) cableada desde
    `ClasesTab.tsx:90`; el `onValueChange` sigue reseteando `seccionId` y cargando
    las secciones del grado; (b) **MENOR (copy) — RESUELTO (2026-10-17)** — se
    restauró `Cree la primera clase para este grado` (`ClasesTabla.tsx:73`);
    spot-check 10/10; (c) **MENOR — benigno confirmado** — el warning preexistente
    `no-unused-expressions` ya no se emite. El conteo real de artefactos es 9 hooks
    + 38 componentes + 1 util (§8 estimaba 6 + 37 + 1; la diferencia es la
    división del hook de Calificaciones en 3, prevista en §2.1).

---

## 7. Trazabilidad

| Hallazgo | Propuesta que lo resuelve |
|----------|---------------------------|
| C1, C14 | P1, P16 |
| C10 | P2 |
| C4, C5 | P3 |
| C6, C7 | P9, P10 |
| C8 | P11 |
| C9 | P12 |
| C11 | P7 |
| C2, C3 | P8 |
| C12 | P4, P5, P6, P13 |
| C13 | P14 |
| Drift docs | P15 |
