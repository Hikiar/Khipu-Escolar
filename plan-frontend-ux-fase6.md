# Plan de implementación — Fase 6 (P16) — Descomponer los monolitos — Khipu Escolar

> Autor: Big Pickle (subagente de planificación/arquitectura/documentación).
> Fecha: 2026-10-12.
> Alcance: plan DETALLADO que MiMo V2 Pro seguirá para implementar la **Fase 6**
> del plan `plan-frontend-ux.md` (§4): **P16 — Descomponer los monolitos**
> (`CalificacionesPage`, `ProfesoresPage` y los tabs de Planificación).
> **Refactorización PURA: cero cambio de comportamiento, cero cambio visual.**
> **No se modifica código fuente en este documento**; es la especificación de
> implementación.
> Documentos relacionados: `plan-frontend-ux.md` (plan maestro §4/§5/§7),
> `plan-frontend-ux-fase2.md` (§11 residuales), `AUDITORIA.md`,
> `DESIGN_SYSTEM.md`.
>
> **Herramientas disponibles**: en este entorno `rg` **no está disponible**; las
> verificaciones de este documento usan `Get-ChildItem` + `Select-String` de
> PowerShell (ver §6). Todas las rutas y líneas citadas fueron verificadas en el
> código el 2026-10-12.

---

## 0. Verificación de la línea base (2026-10-12)

### 0.1 Comandos de seguridad ejecutados (baseline verde)

| Comando | Resultado |
|---|---|
| `npx tsc -b` | **exit 0** (sin errores de tipos) |
| `npm run lint` (`oxlint`) | **exit 0** (solo `warning`, ninguno nuevo; sin `error`) |
| `npm run build` (`tsc -b && vite build`) | **exit 0** (2407 módulos; bundle `index-*.js` ≈ 957,98 kB) |
| `npm run test:smoke` | **SMOKE OK** — 53 verificaciones en verde, 0 falladas |

> El smoke corre sobre BD temporal (`server/test/smoke.ts:16-17`) con seed
> completo; cubre login/RBAC, periodo, plan de estudios, ciclo de vida de alumno,
> secciones/clases, docente, auditoría, conceptos de pago y cuentas de docente.
> Comando de conteo: `(Select-String -Path server\test\smoke.ts -Pattern "verificar\(").Count` = 54 (1 definición + **53 llamadas**).

### 0.2 Unidad de medida del umbral (resuelta aquí)

Los conteos del encargo (§Contexto) **coinciden exactamente con las líneas no
vacías** (`(Get-Content <archivo> | Where-Object { $_.Trim() -ne '' }).Count`), no
con el total de líneas del archivo.

| Archivo | Total líneas | **Líneas no vacías** (encargo) |
|---|---|---|
| `src/features/calificaciones/pages/CalificacionesPage.tsx` | 1124 | **1065** |
| `src/features/profesores/pages/ProfesoresPage.tsx` | 1129 | **1036** |
| `src/features/planificacion/components/PlanEstudiosTab.tsx` | 709 | **667** |
| `src/features/planificacion/components/GradosTab.tsx` | 647 | **609** |
| `src/features/planificacion/components/ClasesTab.tsx` | 524 | **487** |
| `src/features/planificacion/components/AsignacionesTab.tsx` | 382 | **354** |

> **Decisión D-P16-1**: el umbral «~400 líneas» se mide en **líneas no vacías**.
> Definición operativa: `(Get-Content <f> | Where-Object { $_.Trim() -ne '' }).Count < 400`.

### 0.3 Inventario completo de archivos > 400 líneas no vacías (fuente)

```
1065  src\features\calificaciones\pages\CalificacionesPage.tsx   <- P16 (obligatorio)
1036  src\features\profesores\pages\ProfesoresPage.tsx           <- P16 (obligatorio)
 885  src\features\usuarios\pages\UsuariosPage.tsx               (fuera de alcance)
 727  src\features\reportes\pages\ReportesPage.tsx               (fuera de alcance)
 679  src\features\pagos\pages\PagosPage.tsx                     (fuera de alcance)
 674  src\components\ui\sidebar.tsx                              (vendor shadcn, fuera)
 667  src\features\planificacion\components\PlanEstudiosTab.tsx  <- P16 (obligatorio)
 646  src\features\pagos\pages\ConceptosPagoPage.tsx             (fuera de alcance)
 643  src\features\asistencia\pages\AsistenciaPage.tsx           (fuera de alcance)
 609  src\features\planificacion\components\GradosTab.tsx        <- P16 (obligatorio)
 594  src\features\matriculas\pages\MatriculasPage.tsx           (fuera de alcance)
 541  src\features\alumnos\pages\AlumnosPage.tsx                 (fuera de alcance)
 531  src\features\alumnos\pages\AlumnoFichaPage.tsx             (fuera de alcance)
 487  src\features\planificacion\components\ClasesTab.tsx        <- P16 (obligatorio)
 482  src\features\dashboard\pages\DashboardPage.tsx             (fuera de alcance)
 411  src\features\auditoria\pages\AuditoriaPage.tsx             (fuera de alcance)
```

> El encargo lista algún valor con ±4 líneas (p. ej. Asistencia 647 vs. 643 real);
> se usa el **conteo medido** de esta sección como línea base.

### 0.4 Superficie pública de los módulos objetivo (no debe cambiar)

Solo dos consumidores importan estos módulos; **no deben cambiar** sus rutas ni
sus nombres de export:

- `src/features/planificacion/pages/PlanificacionPage.tsx:8-11` importa
  `GradosTab`, `PlanEstudiosTab`, `ClasesTab`, `AsignacionesTab` desde
  `@/features/planificacion/components/*`.
- `src/App.tsx:6,13` importa `ProfesoresPage` y `CalificacionesPage` desde
  `@/features/profesores/pages/*` y `@/features/calificaciones/pages/*`.

### 0.5 Convenciones y precedentes reutilizables (verificados)

- **Precedente de extracción**: `src/features/planificacion/components/` ya aloja
  los 4 tabs (`*Tab.tsx`); `src/features/auth/components/` aloja
  `LoginForm.tsx`/`DemoRoleSelector.tsx`. Los directorios
  `src/features/{calificaciones,profesores}/{components,hooks}/` ya existen con
  `.gitkeep` (listos para poblarse).
- **Hook de feature**: `src/features/planificacion/hooks/usePlanificacion.ts:38-192`
  (estado + carga + recarga compartida por los 4 tabs y la página).
- **Carga**: `src/hooks/useCarga.ts` (`EstadoCarga`), `FilasSkeleton`, `ErrorState`,
  `EmptyState` (`src/components/common/index.ts:1-11`).
- **Feedback**: `src/lib/feedback.ts` (`notificarExito`, `notificarError`).
- **Narrowing**: `res.ok === false` (explícito) y `'error' in res` (helpers locales
  tipo `extraerError`, `CalificacionesPage.tsx:47-50`).
- **Guards**: `Can` (`@/components/guards/Can`).

---

## 1. Decisiones (D-P16)

| # | Decisión | Detalle |
|---|---|---|
| **D-P16-1** | **Unidad del umbral** | «~400 líneas» = **líneas no vacías** (§0.2). Comando canónico en §6. |
| **D-P16-2** | **Alcance del umbral** | Aplica a **contenedores de pantalla**: páginas (`pages/*.tsx`) y **tabs/componentes de feature de pantalla completa** (los 4 `*Tab.tsx` de Planificación). **No** aplica a los módulos extraídos (hooks y subcomponentes): un hook de feature o un diálogo puede superar 400 si es cohesivo. |
| **D-P16-3** | **¿Entra `AsignacionesTab` (354)?** | **No es obligatorio** (ya cumple). Se incluye como **Paso 18 opcional** para simetría del feature (los 4 tabs < 400) y bajo riesgo (sus diálogos son idénticos en forma a los de `ClasesTab`). **No cuenta** para el criterio de parada. |
| **D-P16-4** | **Criterio de parada** | **5 archivos** deben bajar de 400 líneas no vacías: `CalificacionesPage`, `ProfesoresPage`, `PlanEstudiosTab`, `GradosTab`, `ClasesTab`. |
| **D-P16-5** | **Ubicación y nomenclatura** | Páginas: `src/features/<feat>/pages/`. Subcomponentes: `src/features/<feat>/components/`. Hooks: `src/features/<feat>/hooks/`. Para Planificación, cada tab lleva su **subcarpeta** para evitar colisiones de nombres: `components/{plan,grados,clases,asignaciones}/`. Utilidades puras: `src/features/<feat>/utils.ts`. |
| **D-P16-6** | **Orden de extracción** | **Hook primero, luego componentes**, por archivo. Motivo: el hook expone una API cohesiva y los componentes reciben pocas props (menos prop-drilling y menos riesgo que pasar 10-15 setters). El paso del hook es un movimiento mecánico del bloque estado+efectos+handlers. |
| **D-P16-7** | **«Mover sin cambiar»** | Prohibido: reordenar efectos (su orden define el orden/race de los fetch), añadir `useMemo`/`useCallback` «de higiene» (cambian identidad), cambiar copy, clases `className`, atributos `aria-*`, orden de JSX, textos de botones ni el tipo de elemento (`<button>` vs `<Button>`). Solo se mueve código y se le pasan props. |
| **D-P16-8** | **API pública estable** | No cambian las rutas ni los nombres de export de `CalificacionesPage`, `ProfesoresPage` y los 4 `*Tab`. `App.tsx` y `PlanificacionPage.tsx` **no se tocan**. Los símbolos extraídos deben exportarse con **nombre** (no `default`). |
| **D-P16-9** | **Fuera de alcance** | Los demás archivos > 400 (§0.3) **no se tocan** en esta fase. `src/components/ui/sidebar.tsx` es vendor. |
| **D-P16-10** | **Verificación por paso** | Cada paso es autocontenido y debe terminar con `npx tsc -b`, `npm run lint`, `npm run build` y `npm run test:smoke` en verde (§6), más inspección de copy (§5). |
| **D-P16-11** | **Sin regresiones de render clave** | Conservar `key`s, `Fragment`s, `aria-expanded`/`aria-controls`, `role="region"`, `disabled`, y los guards `Can` en el mismo punto del árbol (dentro del componente que renderiza el botón). |

---

## 2. Plan por archivo (estructura actual → destino)

> Las líneas entre paréntesis son del archivo **como está hoy** (numeración del
> total de líneas). «→» indica el módulo destino.

### 2.1 `CalificacionesPage.tsx` (1124 líneas / 1065 no vacías)

**Estructura actual (zonas):**

| Zona | Líneas | Contenido |
|---|---|---|
| Helpers de módulo | 47-68 | `extraerError<T>`; `nivelLogroBadge` (devuelve JSX) |
| Estado | 70-133 | ~30 `useState` (clases/curso/config, trabajos/exámenes/resultados, diálogos, formularios, calificaciones, expandidos) |
| Loaders + efectos | 135-247 | `cargarClases`, `cargarCursos`, `cargarConfiguracion`, `cargarTrabajos`, `cargarExamenes`, `cargarResultados`, `traducirCompetencia` + 4 `useEffect` |
| Handlers | 249-474 | crear/editar/anular trabajo y examen, calificar, abrir/cerrar diálogos, reset de formularios |
| JSX | 476-1123 | PageHeader + Card contexto + Alert modelo + Tabs (3 paneles) + **8 diálogos** |

**Destino:**

| Módulo destino | Origen | Notas |
|---|---|---|
| `calificaciones/utils.ts` | 47-50 | `extraerError<T>` |
| `calificaciones/components/NivelLogroBadge.tsx` | 53-68 | `<NivelLogroBadge nivel={…} />` (mismo JSX) |
| `calificaciones/hooks/useCalificaciones.ts` | 70-474 | Controller: estados + loaders + efectos + handlers + `traducirCompetencia`. Llama `useAuth()`/`useSearchParams()` internamente. **Exento del umbral (D-P16-2)** (~420 líneas; si supera ~450, dividir en `useCalificacionesContexto` + `useCalificacionesEvaluacion`) |
| `calificaciones/components/ContextoAcademicoCard.tsx` | 484-539 | Card de selects Clase/Asignatura; props: listas, selección, setters, estado/error y `onReintentar` |
| `calificaciones/components/TrabajosTabContent.tsx` | 557-633 | Card+tabla de trabajos; props: filas, estado/error, `traducirCompetencia`, callbacks |
| `calificaciones/components/ExamenesTabContent.tsx` | 635-705 | Card+tabla de exámenes; props análogas |
| `calificaciones/components/ResultadosTabContent.tsx` | 707-795 | Tabla + filas expandibles (`Fragment`, `expandedResultados`, `toggle`) |
| `calificaciones/components/TrabajoFormDialog.tsx` | 799-845 | «Nuevo trabajo» |
| `calificaciones/components/TrabajoEditarDialog.tsx` | 847-889 | «Editar trabajo» |
| `calificaciones/components/CalificarDialog.tsx` | 891-928 **y** 961-998 | **Un** componente para trabajo y examen (título `Calificar: {nombre}`, descripción y filas idénticas); props: `alumnos`, `valores`, `onCambiar`, `error`, `guardando`, `onGuardar`, `onCerrar`. **Alternativa conservadora**: dos componentes separados si se prefiere no compartir |
| `calificaciones/components/ExamenFormDialog.tsx` | 930-959 | «Nuevo examen» |
| `calificaciones/components/ExamenEditarDialog.tsx` | 1015-1052 | «Editar examen» (estado) |
| `calificaciones/components/AnularTrabajoDialog.tsx` | 1000-1013 | Confirmación destructiva |
| `calificaciones/components/DetalleResultadoDialog.tsx` | 1054-1121 | Detalle de resultado + tabla de competencias |

**Página resultante (~140 líneas)**: imports + `useCalificaciones()` + JSX `PageHeader` + `<ContextoAcademicoCard/>` + `Alert` de `modeloError` + `<Tabs>` con los 3 `*TabContent` + los diálogos.

### 2.2 `ProfesoresPage.tsx` (1129 líneas / 1036 no vacías)

**Estructura actual:**

| Zona | Líneas | Contenido |
|---|---|---|
| Componentes locales | 76-145 | `type FiltroEstado`; `SelectorNiveles` (78-113); `TitulosPorNivel` (115-145) |
| Estado | 148-195 | listado + filtro + form crear/editar + diálogos de estado/cuenta + flags |
| Handlers | 197-405 | `cargarDocentes`, `reintentar`, `abrirDialogoCrear/Editar`, `enviarCrear/Editar`, desactivar/reactivar/cuenta/copiar |
| JSX | 407-1128 | PageHeader + filtros + Card/tabla + **6 diálogos** |

**Destino:**

| Módulo destino | Origen | Notas |
|---|---|---|
| `profesores/components/SelectorNiveles.tsx` | 78-113 | Extraído tal cual |
| `profesores/components/TitulosPorNivel.tsx` | 115-145 | Extraído tal cual |
| `profesores/hooks/useProfesorForm.ts` | 159-173 (estado) + 219-327 (abrir crear/editar + enviar) | Estado del formulario + `abrirCrear`/`abrirEditar`/`enviarCrear`/`enviarEditar` |
| `profesores/hooks/useProfesores.ts` | 150-157 (listado/filtro) + 197-217 | `docentes`, `estado`, `error`, `filtroEstado`, `cargarDocentes`, `reintentar` |
| `profesores/components/ProfesorCrearDialog.tsx` | 669-789 | Props: `form` + `onChange` + error/enviando + onCancel/onSubmit |
| `profesores/components/ProfesorEditarDialog.tsx` | 791-897 | Igual; **conservar el orden de campos actual** (correo/teléfono/especialidad **antes** de títulos, a diferencia de crear) |
| `profesores/components/ProfesorDesactivarDialog.tsx` | 899-957 | |
| `profesores/components/ProfesorReactivarDialog.tsx` | 959-1006 | |
| `profesores/components/CuentaDocenteDialog.tsx` | 1008-1050 | |
| `profesores/components/CuentaCreadaDialog.tsx` | 1052-1126 | Copiar código/contraseña (`copiadoCuenta`) |
| `profesores/components/ProfesoresFiltros.tsx` | 423-457 | Select estado + input buscar |
| `profesores/components/ProfesoresTable.tsx` | 459-667 | Card + estados (error/cargando/vacío/sin-resultados) + tabla + `Paginacion` |

**Página resultante (~200 líneas)**.

> Nota: `useBuscador` (189-195) y `navigate` (149) permanecen en la página; la
> tabla recibe `buscador` (o campos derivados) y `onVer`.

### 2.3 `PlanEstudiosTab.tsx` (709 líneas / 667 no vacías)

**Estructura actual:**

| Zona | Líneas | Contenido |
|---|---|---|
| Estado | 65-102 | diálogos agregar/editar/quitar + formularios + catálogo + docentes + detalle (`useRef` en vuelo) |
| Handlers | 105-240 | `cargarDocentesCurso`, `abrirDialogoAgregar/Editar/Quitar`, `enviar*`, `abrirDocentes`, `abrirDetalleCurso` |
| Early return | 242-273 | Card «Selecciona un grado» |
| JSX | 275-707 | header+selector + estados + tabla + **3 diálogos + 2 Sheets** |

**Destino** (subcarpeta `planificacion/components/plan/`):

| Módulo destino | Origen | Notas |
|---|---|---|
| `planificacion/hooks/usePlanEstudios.ts` | 65-240 | Estado + handlers + `detalleCursoEnVueloRef` (M2). Consume `usePlanificacion()` |
| `plan/components/PlanEstudiosCursosTable.tsx` | 348-422 | Tabla de asignaturas del plan + botón docentes + enlace detalle |
| `plan/components/AgregarAsignaturaDialog.tsx` | 424-497 | |
| `plan/components/EditarAsignaturaDialog.tsx` | 499-543 | |
| `plan/components/QuitarAsignaturaDialog.tsx` | 545-564 | |
| `plan/components/DocentesCursoSheet.tsx` | 566-611 | |
| `plan/components/DetalleAsignaturaSheet.tsx` | 613-706 | Conserva `InlineError` y el cierre que limpia `detalleCursoEnVueloRef` |

**Tab resultante (~90 líneas)**; el early return (242-273), el header (277-308) y
el skeleton/empty (310-346) permanecen en el tab.

### 2.4 `GradosTab.tsx` (647 líneas / 609 no vacías)

**Estructura actual:**

| Zona | Líneas | Contenido |
|---|---|---|
| Estado | 58-96 | diálogos grado/sección + formularios + a eliminar |
| Handlers | 98-222 | `abrirDialogo*`, `enviarGrado/Seccion`, `manejarEliminar*`, `aplicarGradoSugerido` |
| JSX | 224-646 | header + estados + **lista de grados con secciones plegables** + **4 diálogos** |

**Destino** (subcarpeta `planificacion/components/grados/`):

| Módulo destino | Origen | Notas |
|---|---|---|
| `planificacion/hooks/useGradosTab.ts` | 58-222 | Estado + handlers. Consume `usePlanificacion()` |
| `grados/GradoCard.tsx` | 290-430 | Card de un grado + sección plegable (`role="region"`, `aria-expanded`/`aria-controls`, tabla de secciones y sus estados) |
| `grados/GradoFormDialog.tsx` | 438-545 | Crear/editar grado (selector CNEB, código/nombre/nivel/orden) |
| `grados/SeccionFormDialog.tsx` | 547-599 | Crear/editar sección |
| `grados/EliminarGradoDialog.tsx` | 601-621 | |
| `grados/EliminarSeccionDialog.tsx` | 623-644 | |

**Tab resultante (~110 líneas)**: header + skeleton/empty + `NIVELES.map(...)` que
renderiza `<GradoCard/>` + 4 diálogos.

> El `NIVELES` local (96) y el mapa por nivel (280-434) permanecen en el tab.

### 2.5 `ClasesTab.tsx` (524 líneas / 487 no vacías)

**Estructura actual:**

| Zona | Líneas | Contenido |
|---|---|---|
| Estado + sync URL | 51-105 | `useSearchParams` (2 efectos), grado local/global, docentes, secciones, período, diálogos |
| Efectos/handlers | 107-229 | `cargarDocentes`, `cargarSeccionesParaGrado`, carga de clases filtradas, `useMemo clasesMostradas`, `abrir/enviar/eliminar` |
| JSX | 231-522 | header + filtros + estados + tabla + **2 diálogos** |

**Destino** (subcarpeta `planificacion/components/clases/`):

| Módulo destino | Origen | Notas |
|---|---|---|
| `planificacion/hooks/useClasesTab.ts` | 51-229 | Estado + **efectos de sync con URL** + handlers + `clasesMostradas`. Consume `usePlanificacion()` |
| `clases/ClaseFormDialog.tsx` | 383-498 | |
| `clases/EliminarClaseDialog.tsx` | 500-521 | |
| `clases/ClasesTabla.tsx` | 279-381 | skeleton/empty/tabla |

**Tab resultante (~90 líneas)**.

> **Atención**: el hook debe conservar los **dos** efectos de URL (60-70 y 73-77) y
> el orden `cargarDocentes` → `cargarSeccionesParaGrado` → filtro de clases.

### 2.6 `AsignacionesTab.tsx` (382 líneas / 354 no vacías) — **opcional (Paso 18)**

Ya cumple. Si se normaliza (D-P16-3), extraer a
`planificacion/components/asignaciones/`:

| Módulo destino | Origen |
|---|---|
| `planificacion/hooks/useAsignacionesTab.ts` | 28-167 (estado + loaders + handlers) |
| `asignaciones/AsignacionFormDialog.tsx` | 269-358 |
| `asignaciones/EliminarAsignacionDialog.tsx` | 360-379 |

**Tab resultante (~120 líneas)**. No incluido en el criterio de parada.

---

## 3. Orden de pasos ejecutables

> Regla: **un paso = un movimiento verificable**; al final de cada paso los 4
> comandos de §6 deben quedar verdes. El orden por archivo es por **riesgo
> ascendente** (aislado → compartido → mayor). Cada paso puede ser un commit.

| Paso | Archivo foco | Acción | Resultado |
|---|---|---|---|
| **1** | `ProfesoresPage` | Mover `SelectorNiveles` y `TitulosPorNivel` a `profesores/components/`. | Aísla los helpers; página −68 líneas |
| **2** | `ProfesoresPage` | Extraer `useProfesores` (listado/filtro) y `useProfesorForm` (formulario crear/editar). | Página −~90 |
| **3** | `ProfesoresPage` | Extraer `ProfesorCrearDialog` y `ProfesorEditarDialog`. | Página −~227 |
| **4** | `ProfesoresPage` | Extraer `ProfesorDesactivarDialog`, `ProfesorReactivarDialog`, `CuentaDocenteDialog`, `CuentaCreadaDialog`. | Página −~225 |
| **5** | `ProfesoresPage` | Extraer `ProfesoresFiltros` y `ProfesoresTable`. | **`ProfesoresPage` < 400 ✅** |
| **6** | `ClasesTab` | Extraer `useClasesTab` (estado + efectos URL + handlers). | Tab −~178 |
| **7** | `ClasesTab` | Extraer `ClaseFormDialog`, `EliminarClaseDialog`, `ClasesTabla`. | **`ClasesTab` < 400 ✅** |
| **8** | `GradosTab` | Extraer `useGradosTab`. | Tab −~160 |
| **9** | `GradosTab` | Extraer `GradoFormDialog`, `SeccionFormDialog`, `EliminarGradoDialog`, `EliminarSeccionDialog`. | Tab −~205 |
| **10** | `GradosTab` | Extraer `GradoCard` (card + secciones plegables). | **`GradosTab` < 400 ✅** |
| **11** | `PlanEstudiosTab` | Extraer `usePlanEstudios` (estado + catálogo + docentes + detalle). | Tab −~176 |
| **12** | `PlanEstudiosTab` | Extraer `AgregarAsignaturaDialog`, `EditarAsignaturaDialog`, `QuitarAsignaturaDialog`, `DocentesCursoSheet`, `DetalleAsignaturaSheet`. | Tab −~279 |
| **13** | `PlanEstudiosTab` | Extraer `PlanEstudiosCursosTable`. | **`PlanEstudiosTab` < 400 ✅** |
| **14** | `CalificacionesPage` | Mover `extraerError` a `calificaciones/utils.ts`; `nivelLogroBadge` → `NivelLogroBadge.tsx`. | Aísla helpers |
| **15** | `CalificacionesPage` | Extraer `useCalificaciones` (estado + loaders + efectos + handlers). | Página −~404 |
| **16** | `CalificacionesPage` | Extraer los 7 diálogos (`TrabajoFormDialog`, `TrabajoEditarDialog`, `CalificarDialog`, `ExamenFormDialog`, `ExamenEditarDialog`, `AnularTrabajoDialog`, `DetalleResultadoDialog`). | Página −~280 |
| **17** | `CalificacionesPage` | Extraer `ContextoAcademicoCard`, `TrabajosTabContent`, `ExamenesTabContent`, `ResultadosTabContent`. | **`CalificacionesPage` < 400 ✅** |
| **18** | `AsignacionesTab` *(opcional)* | Extraer `useAsignacionesTab` + `AsignacionFormDialog` + `EliminarAsignacionDialog`. | Los 4 tabs del feature < 400 (simetría) |

> **Nota de encaje**: por D-P16-6 el hook va antes que los componentes. En
> `CalificacionesPage` (Pasos 15→17) el hook se extrae antes que los diálogos y
> los paneles, de modo que estos reciben props del hook sin cambios de estado
> intermedios.
>
> **Verificación intermedia** (sugerida): tras cada paso, ejecutar los 4 comandos
> de §6. Los pasos 2-4 y 6, 8, 11, 15 no cambian la salida visible, pero mueven
> mucho código: son los de mayor valor de revisión de diff.

---

## 4. Riesgos específicos

> Ordenados por probabilidad × impacto. `archivo:línea` en el estado actual.

1. **Orden de efectos y de fetch (CalificacionesPage:151, 158-166, 217-220, 222-239).**
   El efecto grande (222-239) depende de `configModelo`, `cargarTrabajos`,
   `cargarExamenes` y `cargarResultados`, y decide si cargar trabajos o exámenes
   según `modeloCodigo`. Al mover a `useCalificaciones` **el orden y las
   dependencias deben ser idénticos**; reordenarlos cambia el orden de peticiones
   y puede introducir carreras (p. ej. `cargarResultados` antes que
   `competencias`). No dividir el efecto.
2. **Cierres sobre estado (closures).** `handleCrearTrabajo`/`handleEditarTrabajo`
   usan `claseId`, `competencias`, `usuario` (249-272, 407-423). Al pasar a hook,
   mantener `useCallback` con las **mismas dependencias**; si se omiten deps,
   `cargarTrabajos` verá `competencias` obsoletas.
3. **Identidad de `useCallback`/`useMemo`.** `cargarClases` (135-149) depende de
   `[usuario, can]`; `cargarTodo` invalida por `configModelo`. No añadir/quitar
   deps «para que compile». En `ClasesTab:145-150` `clasesMostradas` y en
   `AsignacionesTab:82-86` `docentesFiltrados` son `useMemo`: conservar deps.
4. **Sync con la URL (ClasesTab:53-77).** Los **dos** efectos `useSearchParams`
   deben permanecer en el hook y no fusionarse. Fusionarlos cambia el número de
   re-render y el historial de navegación (la URL es observable).
5. **Diálogos controlados por el padre.** Patrón `open={X !== null}` +
   `onOpenChange`. Los componentes extraídos deben ser **puros respecto del
   estado** (reciben `open`, `onCerrar`, datos, flags y callbacks); **no** mover
   la mutación ni el `useState` al diálogo, porque eso cambia el ciclo de vida
   (p. ej. `dialogCalifTrabajo` se reutiliza tras cargar notas, `CalificacionesPage:891-928`).
   Mantener el estado en el hook/padre.
6. **`useRef` anti-carrera (PlanEstudiosTab:102, 219-240).** `detalleCursoEnVueloRef`
   descarta respuestas cruzadas al abrir detalle (M2). Debe moverse íntegro al
   hook y **el cierre del Sheet debe limpiarlo** (617-622, 695-700).
7. **Filas expandibles (CalificacionesPage:741-789).** `Fragment key`,
   `expandedResultados: Set` y `toggleExpanded` (467-474) deben conservarse; al
   extraer `ResultadosTabContent` el `Set` y el toggle se pasan por props (el
   estado permanece en el hook). No convertir el `<button>` del chevron (750-756)
   en `<Button>` (cambio visual/tamaño).
8. **Guards `Can` dentro de la zona correcta.** Hay `Can` embebidos en botones de
   fila y de cabecera (p. ej. `CalificacionesPage:565,611,643,686,921,991`;
   `ProfesoresPage:414,511,600,612,622,634`). Al extraer un botón, el `Can` debe
   viajar **dentro** del componente o pasarse la `permission`; nunca perderlo.
9. **Orden de campos de formulario al reusar un diálogo.** «Crear profesor»
   (669-789) y «Editar profesor» (791-897) **no** tienen el mismo orden de campos
   (en editar, correo/teléfono/especialidad van antes de `TitulosPorNivel`; en
   crear, `TitulosPorNivel` va antes). Por eso se proponen **dos** componentes;
   unificarlos cambiaría el orden visual.
10. **`CalificarDialog` compartido (891-928 vs 961-998).** El único texto que
    difiere es el nombre del trabajo/examen (título). Si se adopta un único
    componente, el JSX es idéntico; si hay cualquier duda, usar **dos**
    componentes. Riesgo de que un `aria-*`/`className` difiera sin notarse.
11. **`nivelLogroBadge` devuelve JSX.** Al convertirlo en `<NivelLogroBadge/>`
    el JSX resultante es idéntico (mismo `Badge`, icono y etiquetas). Es el único
    helper que no es puro: no moverlo a `utils.ts` (solo `extraerError` es puro).
12. **Textos y terminología.** Prohibido cambiar copy; hay terminología canónica
    (Grado, Sección, Clase, Asignatura, Año lectivo). Cualquier reescritura de
    copy rompe la revisión de P3/P11 y el criterio de «cero cambio visual».
13. **`oxlint` y Fast-Refresh.** Exportar hooks/utilidades desde un archivo de
    componente dispara `react(only-export-components)`. Por eso `utils.ts` y los
    hooks van en archivos propios. Mantener los `warning` preexistentes
    (`ClasesTab.tsx:416` `no-unused-expressions`) sin intentar «arreglarlos»
    (sería un cambio fuera de alcance).
14. **Ciclos de importación.** Los componentes importan del hook/util; el hook
    importa servicios y `usePlanificacion`. Nunca importar la página desde un
    componente.

---

## 5. Criterios de aceptación

### 5.1 Criterio de parada (medible)

- [ ] `CalificacionesPage.tsx` < 400 líneas no vacías.
- [ ] `ProfesoresPage.tsx` < 400.
- [ ] `PlanEstudiosTab.tsx` < 400.
- [ ] `GradosTab.tsx` < 400.
- [ ] `ClasesTab.tsx` < 400.
- [ ] *(Opcional)* `AsignacionesTab.tsx` < 400 (ya en 354).

### 5.2 Invariantes (cero cambio)

- [ ] **Export/API estable**: `App.tsx` y `PlanificacionPage.tsx` **sin cambios**;
      los imports existentes siguen resolviendo.
- [ ] **Cero cambio visual/copy**: spot-check de cadenas canónicas (§5.3) presentes
      exactamente igual; sin diferencias en `className`/`aria-*` de los nodos
      movidos.
- [ ] **Cero `alert()`/`confirm()` nativos**; sin nuevos `role="alert"` manuales
      (los `Alert` de `ui/` ya lo aportan).
- [ ] **Hooks/componentes extraídos** viven en `components/` y `hooks/` con
      export nombrado.
- [ ] Los 5 (o 6) contenedores siguen funcionando igual (verificación estática +
      smoke + inspección manual sugerida en §6.4).

### 5.3 Spot-check de copy (debe aparecer igual, antes y después)

| Archivo | Cadena |
|---|---|
| `CalificacionesPage` | `No hay trabajos registrados para esta clase y curso.` |
| `CalificacionesPage` | `El usuario no tiene asignación docente.` |
| `CalificacionesPage` | `Ingrese las notas de cada alumno (0 a 20)` |
| `ProfesoresPage` | `Aún no hay profesores registrados.` |
| `ProfesoresPage` | `Registrar el primer profesor` |
| `PlanEstudiosTab` | `Selecciona un grado` |
| `PlanEstudiosTab` | `Añadir asignatura al plan` |
| `GradosTab` | `Grados y Secciones` |
| `GradosTab` | `No hay grados registrados` |
| `ClasesTab` | `Cree la primera clase para este grado` |

> **Estado (2026-10-17): 10/10 cadenas presentes exactamente.** En particular,
> `Cree la primera clase para este grado` aparece en `clases/ClasesTabla.tsx:73`
> (copy restaurado al resolver **H1**; ver §9.4 y §9.8).

### 5.4 Aceptación global (plan maestro §5)

- [ ] `npx tsc -b`, `npm run lint` (exit 0), `npm run build`, `npm run test:smoke`
      (= SMOKE OK, 53 verificaciones) en verde **tras cada paso** y al cierre.

---

## 6. Verificación

### 6.1 Conteo del criterio de parada (PowerShell; `rg` no disponible)

```powershell
$objetivo = @(
  'src\features\calificaciones\pages\CalificacionesPage.tsx',
  'src\features\profesores\pages\ProfesoresPage.tsx',
  'src\features\planificacion\components\PlanEstudiosTab.tsx',
  'src\features\planificacion\components\GradosTab.tsx',
  'src\features\planificacion\components\ClasesTab.tsx',
  'src\features\planificacion\components\AsignacionesTab.tsx'
)
foreach ($f in $objetivo) {
  $n = (Get-Content -LiteralPath $f | Where-Object { $_.Trim() -ne '' }).Count
  $ok = if ($n -lt 400) { 'OK' } else { 'PENDIENTE' }
  Write-Output ("{0,5}  {1,-12}  {2}" -f $n, $ok, $f)
}
```

Esperado: `CalificacionesPage`, `ProfesoresPage`, `PlanEstudiosTab`, `GradosTab`,
`ClasesTab` `< 400` (y `AsignacionesTab` si se hizo el Paso 18).

### 6.2 Verificación de estado (sin cambios de comportamiento)

```powershell
# No deben quedar las funciones/definiciones locales que se movieron a componentes
Get-ChildItem -Path src\features\calificaciones\pages\CalificacionesPage.tsx |
  Select-String -Pattern "function extraerError|function nivelLogroBadge"
Get-ChildItem -Path src\features\profesores\pages\ProfesoresPage.tsx |
  Select-String -Pattern "function SelectorNiveles|function TitulosPorNivel"

# Los nuevos módulos deben existir y exportarse con nombre
Get-ChildItem -Recurse -Path src\features\calificaciones -Include *.ts,*.tsx |
  Select-String -Pattern "export function useCalificaciones|export function NivelLogroBadge"
Get-ChildItem -Recurse -Path src\features\profesores -Include *.ts,*.tsx |
  Select-String -Pattern "export function useProfesorForm|export function useProfesores"

# Invariante de API pública: App.tsx y PlanificacionPage.tsx no cambiaron
Get-ChildItem -Path src\App.tsx,src\features\planificacion\pages\PlanificacionPage.tsx |
  Select-String -Pattern "CalificacionesPage|ProfesoresPage|GradosTab|PlanEstudiosTab|ClasesTab|AsignacionesTab"

# Sin alert()/confirm() nativos
Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx |
  Select-String -Pattern "\balert\(|\bconfirm\(" |
  Select-String -NotMatch "ui\\alert|AlertDescription|sonner"

# Spot-check de copy (deben seguir apareciendo)
foreach ($s in @(
  'No hay trabajos registrados para esta clase y curso.',
  'El usuario no tiene asignación docente.',
  'Aún no hay profesores registrados.',
  'Registrar el primer profesor',
  'Selecciona un grado',
  'Grados y Secciones',
  'Cree la primera clase para este grado'
)) {
  $hit = Select-String -Path src\features\*\pages\*.tsx,src\features\*\components\*.tsx -Pattern ([regex]::Escape($s)) -SimpleMatch
  Write-Output ("{0}  {1}" -f $(if ($hit) {'OK   '} else {'FALTA'}), $s)
}
```

### 6.3 Comandos de seguridad (obligatorios tras cada paso)

```powershell
npx tsc -b
npm run lint
npm run build
npm run test:smoke
```

Esperado: `tsc -b` exit 0; `lint` exit 0 (solo warnings preexistentes); `build`
exit 0; `test:smoke` termina con `SMOKE OK` y 0 falladas.

### 6.4 Inspección manual recomendada (no automatizable aquí)

No hay tests de UI; el smoke cubre API, no render. Se sugiere levantar
`npm run dev` y recorrer los 5 contenedores antes de cerrar la fase
(`/calificaciones`, `/profesores`, `/planificacion` con sus 4 tabs) comprobando:
selección clase/asignatura y tabs, alta/edición/anulación de trabajo y examen,
calificar, expandir resultados y abrir detalle; filtros/búsqueda/paginación de
profesores; y los 4 tabs de Planificación (crear/editar/eliminar grado y sección,
plan de estudios con docentes/detalle, clases, asignaciones).

---

## 7. Trazabilidad

| Hallazgo (plan maestro §2) | Propuesta | Fase |
|---|---|---|
| C1 (páginas huérfanas ~3.800 líneas) | P1 (cerrada); P16 descompone lo vivo | Fase 1 / Fase 6 |
| C14 (módulos monolíticos: `CalificacionesPage`, `ProfesoresPage`) | P16 | Fase 6 |
| C7 (lógica de carga duplicada) | P9 (parcial); P16 extrae hooks de feature | Fase 2 / Fase 6 |
| C6/C8 (feedback/a11y) | P16 no cambia copy ni a11y (invariante) | Fase 6 |
| §4 P16 «Páginas < ~400 líneas» | P16 (5 contenedores) | Fase 6 |

## 8. Conteo de archivos por propuesta

| Archivo | Nuevos módulos | Archivo editado |
|---|---|---|
| `CalificacionesPage.tsx` | 1 `utils.ts` + 1 hook + 13 componentes | 1 |
| `ProfesoresPage.tsx` | 2 hooks + 9 componentes | 1 |
| `PlanEstudiosTab.tsx` | 1 hook + 6 componentes | 1 |
| `GradosTab.tsx` | 1 hook + 5 componentes | 1 |
| `ClasesTab.tsx` | 1 hook + 3 componentes | 1 |
| `AsignacionesTab.tsx` *(opc.)* | 1 hook + 2 componentes | 1 |
| **Total (sin opc.)** | **6 hooks + 37 componentes + 1 util** | **5** |

> Sin migraciones, sin cambios de servicios, sin cambios en backend ni en el
> smoke test (la refactorización no altera contratos de API).

---

## 9. Revisión y cierre (2026-10-14)

> Revisión de la implementación de la Fase 6 (P16) por **Big Pickle**
> (planificación/revisión). **No se modificó código fuente.** Verificación
> estática (lecturas selectivas) + re-ejecución de los comandos de §6.3.

### 9.1 Comandos de seguridad (§6.3) — re-ejecutados

| Comando | Resultado |
|---|---|
| `npx tsc -b` | **exit 0** |
| `npm run lint` (`oxlint`) | **exit 0** (solo `warning`; sin `error`) |
| `npm run build` (`tsc -b && vite build`) | **exit 0** (2455 módulos; `index-_9UOPd6x.js` 978,87 kB) |
| `npm run test:smoke` | **SMOKE OK** — 53 verificaciones, 0 falladas |

### 9.2 Criterio de parada (§5.1 / §6.1) — líneas no vacías

| Archivo | Antes (§0.2) | Después | < 400 |
|---|---|---|---|
| `CalificacionesPage.tsx` | 1065 | **268** | ✅ |
| `ProfesoresPage.tsx` | 1036 | **222** | ✅ |
| `PlanEstudiosTab.tsx` | 667 | **217** | ✅ |
| `GradosTab.tsx` | 609 | **145** | ✅ |
| `ClasesTab.tsx` | 487 | **95** | ✅ |
| `AsignacionesTab.tsx` (opc., Paso 18) | 354 | **164** | ✅ |

Los 6 contenedores cumplen el umbral; §5.1 se satisface.

### 9.3 Invariantes (§5.2 / §6.2)

- **API pública estable** ✅ — `App.tsx` (imports `ProfesoresPage` L6, `CalificacionesPage` L13; usados L88/L124) y `PlanificacionPage.tsx` (imports `GradosTab`/`PlanEstudiosTab`/`ClasesTab`/`AsignacionesTab` L8-11; usados L76/80/84/88) sin cambios.
- **Marcadores de extracción** ✅ — `useCalificaciones.ts:4`, `NivelLogroBadge.tsx:4`, `useCalificacionesContexto.ts:12`, `useCalificacionesEvaluacion.ts:20`, `useProfesores.ts:7`, `useProfesorForm.ts:17`. No quedan definiciones locales duplicadas en las páginas.
- **Sin `alert()`/`confirm()` nativos** ✅ (único match: `src/components/ui/alert.tsx:21 function Alert(`).
- **Hooks/componentes** en `components/`/`hooks/` con export nombrado ✅.
- **Orden de efectos preservado** ✅ — `useCalificaciones` invoca contexto (cargarClases → reset por `claseId` → configuración) antes que evaluación (`cargarTodo`); `useClasesTab` conserva los dos efectos de URL y el orden `cargarDocentes` → `cargarSeccionesParaGrado` → filtro.

### 9.4 Spot-check de copy (§5.3)

- **Revisión (2026-10-14):** 9 de 10 cadenas presentes **exactamente** (con
  acentos); la única discrepancia era la fila siguiente → hallazgo **H1**.
- **Re-verificación (2026-10-17):** **10 de 10** cadenas presentes
  **exactamente**. El copy canónico se restauró durante la corrección de H1
  (§9.8).

| Cadena esperada (§5.3) | Estado (2026-10-17) | Ubicación real |
|---|---|---|
| `Cree la primera clase para este grado` | **OK** (antes el código tenía `Crea la primera clase para este grado`) | `clases/ClasesTabla.tsx:73` |

→ Hallazgo **H1 RESUELTO (2026-10-17)**; ver §9.6 y §9.8.

### 9.5 Inventario de artefactos (18 pasos)

Todos los módulos previstos existen (líneas no vacías entre paréntesis):

- **Calificaciones** (Pasos 14-17): `utils.ts` + 3 hooks (`useCalificaciones` 14, `useCalificacionesContexto` 89, `useCalificacionesEvaluacion` 425) + 12 componentes. La división del hook en 3 es la contingencia prevista en §2.1 (D-P16-2).
- **Profesores** (Pasos 1-5): 2 hooks (`useProfesores` 43, `useProfesorForm` 160) + 10 componentes.
- **PlanEstudios** (Pasos 11-13): 1 hook (`usePlanEstudios` 238) + 6 componentes.
- **Grados** (Pasos 8-10): 1 hook (`useGradosTab` 201) + 5 componentes.
- **Clases** (Pasos 6-7): 1 hook (`useClasesTab` 201) + 3 componentes.
- **Asignaciones** (Paso 18, opc.): 1 hook (`useAsignacionesTab` 162) + 2 componentes.

> **Nota**: el conteo real es **9 hooks + 38 componentes + 1 util**; §8 estimaba
> «6 hooks + 37 componentes + 1 util». La diferencia principal es la división del
> hook de Calificaciones en 3 (prevista en §2.1) y el recuento de componentes.

### 9.6 Hallazgos

Estado al cierre de la revisión (2026-10-14) y tras las correcciones
post-revisión (2026-10-17, ver §9.8):

| # | Severidad | Hallazgo | Ubicación | Estado |
|---|---|---|---|---|
| **H1** | Menor (copy) | El plan §5.3/§6.2 (baseline verificado el 2026-10-12, previo a la implementación) espera `Cree la primera clase para este grado`; el código tras el Paso 7 tenía `Crea la primera clase para este grado`. Las otras 9 cadenas coincidían exactamente. Era **regresión de copy** introducida en la extracción (violaba D-P16-7). **Corrección aplicada**: copy restaurado a `Cree…` en el estado vacío de la tabla. | `clases/ClasesTabla.tsx:73` | **RESUELTO (2026-10-17)** |
| **H2** | **Mayor (posible regresión)** | El select **"Grado"** del diálogo de clase se poblaba con `seccionesParaSelect` (secciones) en vez de `grados`. El hook ya exponía `grados` (`useClasesTab.ts:16` vía `usePlanificacion`, retorno en `:198`) y el filtro hermano lo usaba (`ClasesTab.tsx:59-63`), pero el diálogo no lo recibía. Efecto: el campo "Grado" mostraba el nombre de una sección y el desplegable listaba secciones (todas con `value = gradoId`). **Confirmado contra el original**: el formulario legado equivalente sí listaba grados (`legacy/paginas-reemplazadas-por-planificacion/GradosPage.tsx:1361-1375` usa `<GradosAgrupados grados={gradosParaSelect} />`; helper aún vivo en `src/components/common/GradosAgrupados.tsx:20`) → **regresión real**, violaba D-P16-7. **Corrección aplicada**: nueva prop `grados: Grado[]` y el select lista `grados` con el mismo formato que el filtro hermano; el `onValueChange` sigue reseteando `seccionId` y llamando `cargarSeccionesParaGrado`. | `clases/ClaseFormDialog.tsx:90-94` (antes `:88-90`); prop cableada en `ClasesTab.tsx:90` | **RESUELTO (2026-10-17)** |
| **H3** | Menor | El warning preexistente `ClasesTab.tsx:416 no-unused-expressions` (plan §4-riesgo 13) ya no se emite tras el refactor. **Confirmado benigno** en la re-verificación (2026-10-17): `npm run lint` no lo reporta. Cambio fuera de alcance, sin efecto observable. | — | Benigno, confirmado |

### 9.7 Veredicto

- **Criterios medibles (§5.1, §5.2, §6.3): cumplidos.** Los 6 contenedores < 400 líneas no vacías; API pública estable; sin `alert()`/`confirm()`; los 4 comandos en verde (SMOKE OK, 53 verificaciones).
- **Sin bloqueantes ni hallazgos pendientes.** H1 (copy) y H2 (select "Grado") fueron **resueltos el 2026-10-17** y **re-verificados** con los 4 comandos en verde (§9.8); H3 se confirmó benigno.
- **P16 puede darse por cerrado.**

### 9.8 Correcciones post-revisión (H1/H2) — 2026-10-17

Aplicadas por el agente implementador tras la revisión §9 y re-verificadas por
Big Pickle. **Cero cambio de API pública**: `App.tsx` y `PlanificacionPage.tsx`
sin cambios.

**Causa raíz de H2 (regresión confirmada).** Durante la extracción del Paso 7
(`ClaseFormDialog`), el campo "Grado" quedó cableado a `seccionesParaSelect`
(en vez de `grados`), incumpliendo **D-P16-7** («mover sin cambiar»). El hook ya
exponía `grados` (obtenido de `usePlanificacion()` en `useClasesTab.ts:16` y
retornado en `:198`) y el filtro hermano del tab lo usaba correctamente
(`ClasesTab.tsx:59-63`, mismo formato `codigo — nombre (nivel)`), pero el
diálogo no recibía esa prop. El formulario legado equivalente sí listaba grados
(`legacy/paginas-reemplazadas-por-planificacion/GradosPage.tsx:1361-1375` usaba
`<GradosAgrupados grados={gradosParaSelect} />`; el helper sigue vivo en
`src/components/common/GradosAgrupados.tsx:20`).

**Correcciones aplicadas:**

| # | Archivo | Cambio |
|---|---|---|
| H2 | `clases/ClaseFormDialog.tsx` | Import `type { CrearClaseInput, Grado }` (`:21`); nueva prop `grados: Grado[]` (destructurada en `:34`, tipo declarado en `:47` junto a `docentes`); el `<Select>` "Grado" lista `grados.map(...)` con `{g.codigo} — {g.nombre} ({g.nivel})` (`:90-94`), idéntico al filtro hermano. El `onValueChange` (`:85`) sigue reseteando `seccionId` y llamando `cargarSeccionesParaGrado`. El select "Sección" no cambia (sigue en `seccionesParaSelect`). |
| H2 | `ClasesTab.tsx` | Pasa `grados={cl.grados}` a `<ClaseFormDialog>` (`:90`). |
| H1 | `clases/ClasesTabla.tsx` | Copy restaurado en el estado vacío: `Crea…` → `Cree la primera clase para este grado` (`:73`). |

**Re-verificación (2026-10-17) — todo en verde:**

| Comando | Resultado |
|---|---|
| `npx tsc -b` | **exit 0** (sin errores de tipos) |
| `npm run lint` (`oxlint`) | **exit 0** (solo warnings preexistentes `react(set-state-in-effect)` / `only-export-components` / `refs`; **sin** `no-unused-expressions` → confirma H3) |
| `npm run build` (`tsc -b && vite build`) | **exit 0** — `✓ built in 1.73s` |
| `npm run test:smoke` | **SMOKE OK** — 53 verificaciones, 0 falladas |

**Tamaño y contenedores tras el fix:**

| Archivo | Total | No vacías | Nota |
|---|---|---|---|
| `clases/ClaseFormDialog.tsx` | 171 | 162 | +9 totales vs. la versión con H2 (162 no vacías ya en la revisión) |
| `ClasesTab.tsx` | 103 | **96** | +1 no vacía por `grados={cl.grados}` (antes 95 en §9.2); sigue < 400 |
| `clases/ClasesTabla.tsx` | 148 | 145 | copy restaurado (misma línea) |

Los 6 contenedores siguen < 400 líneas no vacías (sin cambios salvo
`ClasesTab` 95 → 96): `CalificacionesPage` 268, `ProfesoresPage` 222,
`PlanEstudiosTab` 217, `GradosTab` 145, `AsignacionesTab` 164.
