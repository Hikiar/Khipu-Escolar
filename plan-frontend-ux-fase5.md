# Plan de implementación — Fase 5 (P14) — Conceptos de pago — Khipu Escolar

> Autor: Big Pickle (subagente de planificación/arquitectura/documentación).
> Fecha: 2026-10-10.
> Alcance: plan DETALLADO que MiMo V2 Pro seguirá para implementar la **Fase 5**
> del plan `plan-frontend-ux.md` (§4): **P14 — Gestión de conceptos de pago**.
> **No se modifica código fuente en este documento**; es la especificación de
> implementación.
> Documentos relacionados: `plan-frontend-ux.md` (plan maestro),
> `plan-frontend-ux-fase4.md` (§9 revisión previa), `docs/modelo-datos.md` (§3.5),
> `AUDITORIA.md`.
>
> **Herramientas disponibles**: en este entorno `rg` **no está disponible**; las
> verificaciones de este documento usan `Get-ChildItem` + `Select-String` de
> PowerShell (ver §7.2). Todas las rutas y líneas citadas fueron verificadas en el
> código el 2026-10-10.

---

## 0. Estado de partida verificado (con `archivo:línea`, 2026-10-10)

### 0.1 La tabla YA existe — P14 NO requiere migración de esquema

- **`conceptos_pago` ya existe** con el esquema completo:
  `server/db/schema.ts:507-522` (`conceptosPago`): `id`, `periodoId` (FK
  `periodosAcademicos.id`, `onDelete: restrict`), `codigo`, `descripcion`,
  `tipo`, `montoBase` (`real`, default 0), `fechaVencimiento` (nullable),
  `obligatorio` (boolean, default `true`); UQ
  `u_concepto_periodo_codigo` sobre `(periodoId, codigo)` (`:521`).
- **`pagos.conceptoId` ya es FK real** a `conceptosPago.id`
  (`schema.ts:531-533`, `onDelete: 'restrict'`); UQ
  `u_pago_alumno_concepto` sobre `(alumnoId, conceptoId)` (`:545`).
- La tabla nace en la migración inicial `0000_inicial.sql:116-128` y el FK en
  `:230`; los snapshots `0000..0009` la incluyen. **No hay que crear ni migrar
  tablas.**
- `docs/modelo-datos.md:153` documenta `ConceptoPago` (cronograma: Matrícula,
  Pensión…) y `:279` la regla **N4** (un concepto se cobra una vez por
  alumno/periodo; anular libera). `:202` fija la cardinalidad
  `PeriodoAcademico 1─N ConceptoPago 1─N Pago`.

> **Conclusión**: P14 NO es un cambio de esquema. La etiqueta **[BACKEND NUEVO]**
> del plan maestro es correcta en cuanto a *endpoints*, pero el esfuerzo real es
> **M** (no L): solo faltan CRUD de endpoints + UI. El rol `pago.conceptoId` ya
> apunta a la tabla correcta, por lo que **no hay riesgo de migración de datos
> existentes** (`server/data/colegio.db`).

### 0.2 Backend actual de conceptos (solo lectura)

| Elemento | Ubicación | Estado |
|---|---|---|
| `GET /api/pagos/conceptos?periodoId=X` | `server/api/rutas/pagos.ts:10-14` | Existe; exige `pagos.ver` (`:11`) y `validarQuery(queryPagosConceptos)` |
| `CREAR/EDITAR/ELIMINAR concepto` | — | **NO existen** (solo hay POST `/` y POST `/:id/anular`, `rutas/pagos.ts:22-36`) |
| `listarConceptosDePeriodo` | `server/infra/repos/pagos.ts:15-16` | Existe |
| `obtenerConceptoPorId` | `server/infra/repos/pagos.ts:18-19` | Existe |
| `listarConceptos` (servicio) | `server/domain/pagos.service.ts:115-123` | Existe; valida que el periodo exista y mapea con `aConceptoDto` (`:70-82`) |
| `ConceptoPagoDto`, `TIPOS_CONCEPTO` | `server/domain/pagos.service.ts:23-32`, `:19` | Existen (`MATRICULA \| PENSION \| OTRO`) |
| `queryPagosConceptos` | `server/api/querySchemas.ts:40-42` | Existe (`periodoId` obligatorio) |
| Schemas de pago | `server/api/schemas.ts:167-193` | Existen `registrarPagoSchema`, `fechaSchemaPago`, `montoSchema`, `metodoPagoSchema` (reutilizables) |

### 0.3 Permisos actuales

- Catálogo: `shared/permissions.ts:44-46` define `pagos.ver`, `pagos.registrar`,
  `pagos.anular`. **No existen** `conceptosPago.*`.
- Roles iniciales (`shared/roles.ts`): Director = `['*']` (`:26`);
  Secretaría = `pagos.ver` + `pagos.registrar` (`:62-63`);
  Personal = `pagos.ver` (`:78`); Profesor = ninguno de pagos.
- `hasPermission` (`shared/authorization.ts:13-41`) soporta `'*'` y wildcard de
  módulo (`modulo.*`). El Director (`'*'`) ya cubre cualquier código nuevo.
- El catálogo se siembra idempotentemente en `server/db/seed.ts:52-55`
  (`PERMISOS` → tabla `permisos`, `onConflictDoNothing`); `sincronizarRolesIniciales`
  (`seed.ts:459-490`) reconcilia la malla `rol_permisos` al arrancar. Por tanto,
  **añadir códigos al catálogo no requiere migración** (es data, no esquema).

### 0.4 Auditoría

- `auditarMutaciones` (`server/api/middleware.ts:94-115`, montado en
  `server/api/app.ts:57`) registra automáticamente todo POST/PATCH/DELETE sobre
  `/api/*`. Los endpoints nuevos **quedarán auditados sin código extra**.

### 0.5 Frontend actual

- Servicio: `src/services/pagosService.ts:1-85` — `ConceptoPago`, `listarConceptos`
  (`:53-59`), `registrarPago`, `anularPago`. **No hay** `crear/actualizar/eliminar`
  de conceptos.
- UI: `src/features/pagos/pages/PagosPage.tsx:1-731` — muestra una tarjeta
  "Conceptos de pago" (`:331-430`) **de solo lectura** para el año activo; el
  formulario de registro elige concepto (`:572-587`). Ya usa `EstadoCarga`,
  `FilasSkeleton`, `Can`, `PageHeader`.
- Navegación: grupo **Finanzas** con un solo item "Pagos"
  (`src/config/navigation.ts:92-103`). Ruta `pagos` en `src/App.tsx:127-134`
  protegida por `pagos.ver`.
- Lista de periodos disponible para un selector: `listarPeriodos()`
  (`src/services/periodosService.ts:22-24`, requiere `periodos.ver` en el
  servidor, `rutas/periodos.ts:17`) y `listarPeriodoActivo()` sin permiso
  (`catalogoService.ts:155-160`).
- Patrón CRUD a imitar: `src/features/admin/pages/ModelosPage.tsx:1-408`
  (Card + Table + `Dialog` de crear/editar + `Dialog` de eliminar + `Can`) y su
  servicio `src/services/modeloService.ts:1-59`.
- Feedback unificado: `src/lib/feedback.ts` (`notificarExito`, `notificarError`).
  Componentes comunes: `EmptyState`/`ErrorState`/`FilasSkeleton` (`common/index.ts`).

### 0.6 Smoke test

- `server/test/smoke.ts:1-411` corre sobre BD temporal, con seed **completo**
  (no define `SEED_MINIMO`), por lo que ya existen `con-matric` y `con-pens-03`
  (`seed.ts:425-447`). **Hoy no se prueba ningún endpoint de pagos.** El bloque
  de auditoría está en `:206-212`; `tokenDocente` (`:178`) está disponible en el
  ámbito de `principal`.

---

## 1. Decisión de alcance (D-P14)

> El usuario autorizó continuar sin pedir permisos; las decisiones pueden tomarse
> por defecto con la recomendación.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| **D-P14-1** | **Alcance general** | (a) CRUD completo de conceptos (tabla existente) + UI; (b) solo catálogo editable embebido en Pagos; (c) solo selector en el formulario de pago | **(a)**: la tabla y el FK YA existen → no hay migración; es donde está el valor real (el catálogo hoy es fijo en BD). Ver §1.1. |
| **D-P14-2** | **Superficie del CRUD** | (a) página dedicada "Conceptos de pago" bajo Finanzas + enlace desde Pagos; (b) diálogo embebido en `PagosPage` | **(a)**: los conceptos son **por periodo** (necesitan selector de año), y `PagosPage` ya tiene 731 líneas. Sigue el precedente de `ModelosPage`/`PeriodosPage`. Se añade un botón "Gestionar conceptos" en `PagosPage` (D-P14-5) para cumplir "desde Pagos". |
| **D-P14-3** | **Permisos** | (a) nuevos `conceptosPago.ver/crear/editar/eliminar`; (b) reutilizar `pagos.registrar`/`pagos.anular` | **(a)**: separa "cobrar" de "configurar el cronograma". El `GET` pasa a aceptar `pagos.ver` **OR** `conceptosPago.ver` para no romper `PagosPage`. Solo el Director `('*')` recibe los permisos por defecto (coherente con "que el director pueda crear/editar"). |
| **D-P14-4** | **`periodoId` en edición** | (a) inmutable (solo lectura); (b) editable si el concepto no tiene pagos | **(a)**: mover un concepto de periodo reubicaría sus pagos y rompería el congelamiento (N10); el `PATCH` no incluye `periodoId`. |
| **D-P14-5** | **Descubribilidad** | (a) botón "Gestionar conceptos" en la tarjeta de conceptos de `PagosPage`; (b) solo item de menú | **(a) + item de menú**: doble entrada, coherente con el criterio "CRUD operativo desde Pagos" del maestro. |
| **D-P14-6** | **Eliminación** | (a) DELETE físico, bloqueado si hay pagos (cualquier estado); (b) añadir columna `activo` (soft-delete) | **(a)**: la tabla **no** tiene `activo` (schema.ts:507-522); añadirla sería migración. El DELETE físico con guardia de FK respeta `onDelete: restrict`. Ver §6 riesgo R2. |
| **D-P14-7** | **Congelamiento (N10)** | (a) bloquear crear/editar/eliminar si el periodo está `CERRADO`; (b) permitirlo | **(a)**: reutilizar `validarPeriodoEscribible` (`periodos.service.ts:147-153`), igual que `registrarPago`/`anularPago`. |

### 1.1 Justificación de D-P14-1 (por qué alcance completo y por qué NO es riesgoso)

1. **Cero migración de esquema.** `conceptos_pago` y `pagos.conceptoId` ya existen
   desde `0000_inicial.sql`. No se toca `server/data/colegio.db`; `ejecutarMigraciones`
   (`server/db/client.ts:34-35`) solo aplicaría migraciones pendientes (no habrá).
2. **Cero migración de datos.** Los pagos existentes ya tienen `conceptoId` válido;
   editar/crear conceptos no reescribe filas de `pagos`.
3. **El valor es real y visible**: hoy `C13` del maestro ("el catálogo queda fijo en
   BD") solo se resuelve con CRUD. El selector en el formulario de pago ya funciona;
   el hueco es configurar el cronograma por año.
4. **Coste contenido**: 1 endpoint router + 3 funciones de servicio + 4 de repo +
   2 schemas zod; en frontend 3 funciones de servicio + 1 página + 2 líneas de
   cableado + 1 botón.

> **Alternativa mínima (si se quisiera recortar)**: implementar solo `POST` +
> `PATCH` (sin DELETE) y un diálogo embebido. **No recomendada**: dejar sin borrar
> obliga a conservar conceptos erróneos y el guardia de FK ya hace trivial el DELETE.

---

## 2. Plan BACKEND por archivo (rutas:líneas concretas)

> Orden lógico dentro del backend: schema zod → repo → dominio → rutas → permisos.
> Ningún cambio en `server/db/schema.ts` ni en `server/db/migrations/`.

### 2.1 Permisos — `shared/permissions.ts`

| # | Archivo:línea | Cambio |
|---|---|---|
| B-1 | `shared/permissions.ts:46` (tras `pagos.anular`) | Añadir al `CATALOGO_PERMISOS`: `'conceptosPago.ver': 'Ver conceptos de pago'`, `'conceptosPago.crear': 'Crear conceptos de pago'`, `'conceptosPago.editar': 'Editar conceptos de pago'`, `'conceptosPago.eliminar': 'Eliminar conceptos de pago'`. |

> **No** se modifica `shared/roles.ts`: el Director (`'*'`, `roles.ts:26`) ya los
> tiene. (Opcional futuro: conceder `conceptosPago.*` a Secretaría añadiendo los
> códigos a `roles.ts:50-65`; `sincronizarRolesIniciales` lo propagaría al arrancar.)
> El catálogo se re-siembra solo (`seed.ts:52-55`), sin migración.

### 2.2 Schemas zod — `server/api/schemas.ts`

Insertar en la sección **Pagos** (tras `registrarPagoSchema`, `:193`):

```ts
const tipoConceptoSchema = z.enum(['MATRICULA', 'PENSION', 'OTRO'], {
  message: 'El tipo debe ser MATRICULA, PENSION u OTRO.',
})

const montoBaseSchema = z
  .number({ message: 'El monto base debe ser numérico.' })
  .min(0, 'El monto base no puede ser negativo.')
  .refine((n) => Math.round(n * 100) === n * 100, {
    message: 'El monto base admite hasta 2 decimales.',
  })

const fechaVencimientoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de vencimiento debe tener el formato YYYY-MM-DD.')

/** POST /api/pagos/conceptos */
export const crearConceptoPagoSchema = z.object({
  periodoId: z.string().min(1, 'El periodo es obligatorio.'),
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria.'),
  tipo: tipoConceptoSchema,
  montoBase: montoBaseSchema,
  fechaVencimiento: fechaVencimientoSchema.optional(),
  obligatorio: z.boolean().optional(),
})

/** PATCH /api/pagos/conceptos/:id  (periodoId NO editable — D-P14-4) */
export const actualizarConceptoPagoSchema = z.object({
  codigo: z.string().trim().min(1).optional(),
  descripcion: z.string().trim().min(1).optional(),
  tipo: tipoConceptoSchema.optional(),
  montoBase: montoBaseSchema.optional(),
  fechaVencimiento: fechaVencimientoSchema.nullable().optional(),
  obligatorio: z.boolean().optional(),
})
```

> `validarCuerpo` (`middleware.ts:69-87`) ya reemplaza `req.body` por el dato
> parseado y responde 400 con `detalles` si falla. `periodoId` no está en el
> schema de actualización; zod lo descarta silenciosamente.

### 2.3 Repositorio — `server/infra/repos/pagos.ts`

Añadir en la sección **Conceptos** (tras `:19`). Importar `desc`/`and`/`eq` (ya
importa `and, eq` en `:1`).

```ts
export const obtenerConceptoDePeriodoYCodigo = (periodoId: string, codigo: string) =>
  db
    .select()
    .from(s.conceptosPago)
    .where(and(eq(s.conceptosPago.periodoId, periodoId), eq(s.conceptosPago.codigo, codigo)))
    .get() ?? null

export const insertarConcepto = (fila: typeof s.conceptosPago.$inferInsert) =>
  db.insert(s.conceptosPago).values(fila).run()

export const modificarConcepto = (
  id: string,
  parche: Partial<typeof s.conceptosPago.$inferInsert>,
): typeof s.conceptosPago.$inferSelect | null => {
  db.update(s.conceptosPago).set(parche).where(eq(s.conceptosPago.id, id)).run()
  return obtenerConceptoPorId(id)
}

export const eliminarConcepto = (id: string) =>
  db.delete(s.conceptosPago).where(eq(s.conceptosPago.id, id)).run()

/** Cuenta los pagos (cualquier estado) que referencian el concepto (guardia del FK restrict). */
export const contarPagosDeConcepto = (conceptoId: string) =>
  db.select({ id: s.pagos.id }).from(s.pagos).where(eq(s.pagos.conceptoId, conceptoId)).all().length
```

### 2.4 Dominio — `server/domain/pagos.service.ts`

Añadir interfaces de entrada (tras `:60`) y 3 funciones (tras `listarConceptos`,
`:123`). `aConceptoDto` (`:70-82`) ya existe y se reutiliza; `validarPeriodoEscribible`
ya está importado (`:6`); `acad.obtenerPeriodoPorId` se usa en `:118`.

```ts
export interface CrearConceptoPagoInput {
  periodoId: string
  codigo: string
  descripcion: string
  tipo: TipoConcepto
  montoBase: number
  fechaVencimiento?: string
  obligatorio?: boolean
}

export interface ActualizarConceptoPagoInput {
  codigo?: string
  descripcion?: string
  tipo?: TipoConcepto
  montoBase?: number
  fechaVencimiento?: string | null
  obligatorio?: boolean
}

export async function crearConcepto(
  input: CrearConceptoPagoInput,
): Promise<ResultadoServicio<ConceptoPagoDto>> {
  const codigo = input.codigo.trim()
  const descripcion = input.descripcion.trim()
  if (!codigo) return fallo('invalido', 'El código del concepto es obligatorio.')
  if (!descripcion) return fallo('invalido', 'La descripción del concepto es obligatoria.')
  if (!(TIPOS_CONCEPTO as readonly string[]).includes(input.tipo)) {
    return fallo('invalido', 'El tipo de concepto no es válido (MATRICULA/PENSION/OTRO).')
  }
  if (!Number.isFinite(input.montoBase) || input.montoBase < 0) {
    return fallo('invalido', 'El monto base no puede ser negativo.')
  }
  if (Math.round(input.montoBase * 100) !== input.montoBase * 100) {
    return fallo('invalido', 'El monto base admite hasta 2 decimales.')
  }
  if (input.fechaVencimiento && !esFechaValida(input.fechaVencimiento)) {
    return fallo('invalido', 'La fecha de vencimiento no es válida.')
  }
  if (!acad.obtenerPeriodoPorId(input.periodoId)) {
    return fallo('no-encontrado', 'No existe el periodo indicado.')
  }
  const errorPeriodo = validarPeriodoEscribible(input.periodoId)
  if (errorPeriodo) return fallo('invalido', errorPeriodo)   // N10

  if (pgr.obtenerConceptoDePeriodoYCodigo(input.periodoId, codigo)) {
    return fallo('invalido', 'Ya existe un concepto con ese código en el periodo.')
  }

  const id = `con-${Date.now()}`
  pgr.insertarConcepto({
    id,
    periodoId: input.periodoId,
    codigo,
    descripcion,
    tipo: input.tipo,
    montoBase: input.montoBase,
    fechaVencimiento: input.fechaVencimiento ?? null,
    obligatorio: input.obligatorio ?? true,
  })
  return exito(aConceptoDto(pgr.obtenerConceptoPorId(id)) as ConceptoPagoDto)
}

export async function actualizarConcepto(
  id: string,
  patch: ActualizarConceptoPagoInput,
): Promise<ResultadoServicio<ConceptoPagoDto>> {
  const concepto = pgr.obtenerConceptoPorId(id)
  if (!concepto) return fallo('no-encontrado', 'No existe el concepto de pago indicado.')
  const errorPeriodo = validarPeriodoEscribible(concepto.periodoId)   // N10
  if (errorPeriodo) return fallo('invalido', errorPeriodo)

  const parche: Partial<typeof concepto> = {}
  if (patch.codigo !== undefined) {
    const codigo = patch.codigo.trim()
    if (!codigo) return fallo('invalido', 'El código no puede estar vacío.')
    if (codigo !== concepto.codigo &&
        pgr.obtenerConceptoDePeriodoYCodigo(concepto.periodoId, codigo)) {
      return fallo('invalido', 'Ya existe un concepto con ese código en el periodo.')
    }
    parche.codigo = codigo
  }
  if (patch.descripcion !== undefined) {
    const descripcion = patch.descripcion.trim()
    if (!descripcion) return fallo('invalido', 'La descripción no puede estar vacía.')
    parche.descripcion = descripcion
  }
  if (patch.tipo !== undefined) {
    if (!(TIPOS_CONCEPTO as readonly string[]).includes(patch.tipo)) {
      return fallo('invalido', 'El tipo de concepto no es válido.')
    }
    parche.tipo = patch.tipo
  }
  if (patch.montoBase !== undefined) {
    if (!Number.isFinite(patch.montoBase) || patch.montoBase < 0) {
      return fallo('invalido', 'El monto base no puede ser negativo.')
    }
    if (Math.round(patch.montoBase * 100) !== patch.montoBase * 100) {
      return fallo('invalido', 'El monto base admite hasta 2 decimales.')
    }
    parche.montoBase = patch.montoBase
  }
  if (patch.fechaVencimiento !== undefined) {
    if (patch.fechaVencimiento !== null && !esFechaValida(patch.fechaVencimiento)) {
      return fallo('invalido', 'La fecha de vencimiento no es válida.')
    }
    parche.fechaVencimiento = patch.fechaVencimiento
  }
  if (patch.obligatorio !== undefined) parche.obligatorio = patch.obligatorio

  const actualizado = pgr.modificarConcepto(id, parche)
  if (!actualizado) return fallo('no-disponible', 'No se pudo actualizar el concepto.')
  return exito(aConceptoDto(actualizado) as ConceptoPagoDto)
}

export async function eliminarConcepto(
  id: string,
): Promise<ResultadoServicio<void>> {
  const concepto = pgr.obtenerConceptoPorId(id)
  if (!concepto) return fallo('no-encontrado', 'No existe el concepto de pago indicado.')
  const errorPeriodo = validarPeriodoEscribible(concepto.periodoId)   // N10
  if (errorPeriodo) return fallo('invalido', errorPeriodo)

  if (pgr.contarPagosDeConcepto(id) > 0) {
    return fallo('invalido', 'No se puede eliminar: el concepto tiene pagos asociados (N4).')
  }
  pgr.eliminarConcepto(id)
  return exito(undefined)
}
```

> `esFechaValida` ya existe en el mismo archivo (`:62-68`). Alternativamente
> omitir la re-validación de fecha (zod ya valida el formato), pero mantenerla
> conserva la robustez del dominio.

### 2.5 Rutas — `server/api/rutas/pagos.ts`

Importar los schemas nuevos (`:6`) y añadir rutas **tras** el `GET /conceptos`
(`:14`) — antes del `GET /` para que no haya dudas de orden:

```ts
// POST /api/pagos/conceptos  (cronograma por periodo)
routerPagos.post(
  '/conceptos',
  validarCuerpo(crearConceptoPagoSchema),
  exigirAuth,
  exigirPermiso('conceptosPago.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearConcepto(req.body))
  },
)

// PATCH /api/pagos/conceptos/:id
routerPagos.patch(
  '/conceptos/:id',
  validarCuerpo(actualizarConceptoPagoSchema),
  exigirAuth,
  exigirPermiso('conceptosPago.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarConcepto(String(req.params.id), req.body))
  },
)

// DELETE /api/pagos/conceptos/:id
routerPagos.delete(
  '/conceptos/:id',
  exigirAuth,
  exigirPermiso('conceptosPago.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.eliminarConcepto(String(req.params.id)))
  },
)
```

**Modificar el `GET` existente** (`:11`) para no romper `PagosPage`:

```ts
routerPagos.get(
  '/conceptos',
  exigirAuth,
  exigirPermiso('pagos.ver', 'conceptosPago.ver'),   // OR: cualquiera de los dos
  validarQuery(queryPagosConceptos),
  async (req, res) => { /* igual que antes */ },
)
```

> `exigirPermiso(...requeridos)` usa `.some` (`middleware.ts:40`) → semántica OR.
> El orden recomendado de rutas: `/conceptos` (GET/POST), `/conceptos/:id`
> (PATCH/DELETE), luego `/` (GET/POST) y `/:id/anular`. No hay conflicto de patrones
> (`/conceptos` es 1 segmento; `/:id/anular` es 2).

> **Sin cambios** en `server/api/app.ts` (el router ya está montado en `:66`) ni en
> el middleware de auditoría (audita POST/PATCH/DELETE automáticamente).

---

## 3. Plan FRONTEND por archivo

### 3.1 Servicio — `src/services/pagosService.ts`

Añadir tras `listarConceptos` (`:59`):

```ts
export interface CrearConceptoInput {
  periodoId: string
  codigo: string
  descripcion: string
  tipo: TipoConcepto
  montoBase: number
  fechaVencimiento?: string
  obligatorio?: boolean
}

export interface ActualizarConceptoInput {
  codigo?: string
  descripcion?: string
  tipo?: TipoConcepto
  montoBase?: number
  fechaVencimiento?: string | null
  obligatorio?: boolean
}

export async function crearConcepto(
  input: CrearConceptoInput,
): Promise<ResultadoServicio<ConceptoPago>> {
  return apiFetch<ResultadoServicio<ConceptoPago>>('/pagos/conceptos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarConcepto(
  id: string,
  patch: ActualizarConceptoInput,
): Promise<ResultadoServicio<ConceptoPago>> {
  return apiFetch<ResultadoServicio<ConceptoPago>>(
    `/pagos/conceptos/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  )
}

export async function eliminarConcepto(id: string): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>(
    `/pagos/conceptos/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )
}
```

### 3.2 Página nueva — `src/features/pagos/pages/ConceptosPagoPage.tsx`

Patrón a imitar: `ModelosPage.tsx:1-408` (Card + Table + dialog de crear/editar +
dialog de eliminar + `Can`) **+** un selector de periodo (como `ReportesPage`).

Estructura y criterios:

| # | Elemento | Detalle | Criterio |
|---|---|---|---|
| F-1 | Carga de periodos | `Promise.all([listarPeriodos(), listarPeriodoActivo()])` en un `cargar` local; si `listarPeriodos` falla (p. ej. 403), degradar a `[periodoActivo]` (no romper la página). Preseleccionar el activo. | La página funciona aun sin `periodos.ver`. |
| F-2 | `PageHeader` | Título "Conceptos de pago", descripción "Catálogo de conceptos del cronograma por año lectivo.", icono `Receipt`. Acción "Nuevo concepto" (`Can permission="conceptosPago.crear"`, deshabilitado si el periodo seleccionado está `CERRADO`). | Visible. |
| F-3 | Selector de periodo | `Select` con todos los periodos; `Badge` de estado (`ACTIVO`/`CERRADO`/`PLANIFICADO`). Al cambiar, recargar conceptos con `listarConceptos(periodoId)` (`pagosService.ts:53`). `Label htmlFor` (P11). | Cambia el cronograma mostrado. |
| F-4 | Aviso N10 | Si el periodo seleccionado es `CERRADO`, `Alert` informativa "Año lectivo cerrado: solo lectura." y botones de acción deshabilitados. | El usuario entiende por qué no edita. |
| F-5 | Tabla | Columnas: **Código** (mono), **Descripción**, **Tipo** (`Badge`, reusar `etiquetaConcepto` — extraer a helper compartido o duplicar), **Monto base** (`Intl.NumberFormat('es-PE', currency PEN)`), **Vencimiento** (fecha o "—"), **Obligatorio** (`Badge` Sí/No), **Acciones** (editar `Can conceptosPago.editar`, eliminar `Can conceptosPago.eliminar`). | Columnas del DTO visibles. |
| F-6 | Estados | `cargando` → `<Table aria-busy="true">` + `FilasSkeleton`; `error` → `<ErrorState onRetry>` (o `Alert` + Reintentar); `ok` sin datos → `<EmptyState>` "No hay conceptos para este año lectivo." | Ningún estado en blanco. |
| F-7 | Dialog crear/editar | Campos: `periodoId` (Select; **solo en crear** — en editar, periodo en solo lectura), `codigo` (mayúsculas, `maxLength`), `descripcion`, `tipo` (Select `MATRICULA/PENSION/OTRO`), `montoBase` (number, min 0, step 0.01), `fechaVencimiento` (date vacío = null), `obligatorio` (Checkbox). `Label htmlFor` + `aria-invalid`/`aria-describedby` en error (P11). Botón Cancelar + Guardar; feedback de éxito con `notificarExito` (`feedback.ts:9`). | Crea/edita y refresca la tabla. |
| F-8 | Dialog eliminar | Confirmación destructiva con código+descripción; error inline si el backend devuelve `no se puede eliminar: … pagos asociados`; `notificarError` (`feedback.ts:13`). | Elimina y refresca; el error de FK se explica. |
| F-9 | a11y | `aria-label` en botones-icono de fila ("Editar {codigo}", "Eliminar {codigo}"), `Label htmlFor` en todos los campos, `role="alert"` en errores de diálogo (vía `Alert`). | Sin hallazgos críticos. |

> **Reutilización**: exportar `etiquetaConcepto(t: TipoConcepto)` hoy local en
> `PagosPage.tsx:95-99` a un módulo compartido (p. ej. `src/features/pagos/utils.ts`)
> **o** duplicarla; exportarla es preferible (evita divergencia de copy).

### 3.3 Descubribilidad — `src/features/pagos/pages/PagosPage.tsx`

| # | Archivo:línea | Cambio |
|---|---|---|
| F-10 | `PagosPage.tsx:331-341` (CardHeader de "Conceptos de pago") | Añadir en el `CardHeader` un botón/enlace "Gestionar conceptos" con `render={<Link to="/conceptos-pago" />}` envuelto en `<Can permission="conceptosPago.ver">`, icono `Settings2`/`Receipt`. Importar `Link` y `Can` (ya está `Can` en `:40`). |
| F-11 | `PagosPage.tsx:95-99` | (Opcional según F-5) mover `etiquetaConcepto` a util compartido e importarlo aquí. |

### 3.4 Navegación y ruta

| # | Archivo:línea | Cambio |
|---|---|---|
| F-12 | `src/config/navigation.ts:92-103` (grupo **Finanzas**) | Añadir item `{ title: 'Conceptos de pago', href: '/conceptos-pago', icon: Receipt, description: 'Catálogo de conceptos del cronograma por año lectivo', permission: 'conceptosPago.ver' }`. Importar `Receipt` de `lucide-react` (`:1-16`). |
| F-13 | `src/App.tsx` (imports `:1-25`; ruta nueva junto a `pagos`, `:127-134`) | Importar `ConceptosPagoPage` de `@/features/pagos/pages/ConceptosPagoPage` y añadir `<Route path="conceptos-pago" element={<PermissionRoute permission="conceptosPago.ver"><ConceptosPagoPage /></PermissionRoute>} />`. |

> No requiere cambios en `AppSidebar`/`useFilteredNav`: el item se filtra por
> `permission` con el mismo predicado `esItemVisible` (Fase 4). El Director (`'*'`)
> lo ve; Secretaría/Personal/Profesor no lo ven.

---

## 4. Pruebas — `server/test/smoke.ts`

Añadir un bloque **después** del bloque de auditoría (`:206-212`), donde
`token`, `periodo.json?.data?.id` y `tokenDocente` están en ámbito. Usar el helper
`pedir` (`:41-56`).

```ts
// Conceptos de pago (P14) — CRUD + autorización
const periodoIdSmoke = periodo.json?.data?.id
const codigoConcepto = `SMOKE-${Date.now()}`
const crearConcepto = await pedir('POST', '/api/pagos/conceptos', token, {
  periodoId: periodoIdSmoke,
  codigo: codigoConcepto,
  descripcion: 'Concepto smoke',
  tipo: 'OTRO',
  montoBase: 12.5,
})
verificar('crear concepto de pago', crearConcepto.status === 200 && crearConcepto.json?.ok === true, crearConcepto.json)
const conceptoId = crearConcepto.json?.data?.id

if (typeof conceptoId === 'string') {
  const duplicado = await pedir('POST', '/api/pagos/conceptos', token, {
    periodoId: periodoIdSmoke, codigo: codigoConcepto, descripcion: 'dup', tipo: 'OTRO', montoBase: 1,
  })
  verificar('código de concepto duplicado en el periodo → 400', duplicado.status === 400)

  const patch = await pedir('PATCH', `/api/pagos/conceptos/${conceptoId}`, token, { montoBase: 20 })
  verificar('editar concepto de pago', patch.status === 200 && patch.json?.data?.montoBase === 20, patch.json)

  const listar = await pedir('GET', `/api/pagos/conceptos?periodoId=${periodoIdSmoke}`, token)
  verificar('listar conceptos incluye el nuevo',
    listar.status === 200 && Array.isArray(listar.json?.data) && listar.json.data.some((c: any) => c.id === conceptoId))

  // Eliminar sin pagos asociados → OK
  const eliminar = await pedir('DELETE', `/api/pagos/conceptos/${conceptoId}`, token)
  verificar('eliminar concepto sin pagos', eliminar.status === 200 && eliminar.json?.ok === true, eliminar.json)

  if (tokenDocente) {
    const crearDocente = await pedir('POST', '/api/pagos/conceptos', tokenDocente, {
      periodoId: periodoIdSmoke, codigo: `X-${Date.now()}`, descripcion: 'x', tipo: 'OTRO', montoBase: 1,
    })
    verificar('docente sin conceptosPago.crear → 403', crearDocente.status === 403)
  }
}

// (Opcional) Eliminar un concepto CON pagos → bloqueado por FK restrict.
// Registrar un pago del alumno smoke sobre el concepto seed 'con-matric'.
if (alumnoId) {
  await pedir('POST', '/api/pagos', token, {
    alumnoId, conceptoId: 'con-matric', monto: 10, metodoPago: 'EFECTIVO', fecha: '2026-03-10',
  })
  const borrarConPagos = await pedir('DELETE', '/api/pagos/conceptos/con-matric', token)
  verificar('eliminar concepto con pagos → 400', borrarConPagos.status === 400, borrarConPagos.json)
}
```

> El seed completo ya crea `con-matric`/`con-pens-03` (`seed.ts:425-447`) y
> `alumnoId` sigue ACTIVO tras el ciclo de vida (`:114-133`). El pago de prueba
> no afecta a otras aserciones (el smoke no prueba pagos hoy).

---

## 5. Orden de implementación sugerido (para MiMo)

1. **Permisos**: `shared/permissions.ts` (B-1). Sin efecto en runtime hasta el
   siguiente arranque del server (re-siembra idempotente).
2. **Backend núcleo**: `schemas.ts` (B-2) → `repos/pagos.ts` (B-3) →
   `domain/pagos.service.ts` (B-4) → `api/rutas/pagos.ts` (B-5). Verificar con
   `npx tsc -b`.
3. **Smoke**: `server/test/smoke.ts` (§4) → `npm run test:smoke` (debe seguir
   en verde).
4. **Frontend servicio**: `src/services/pagosService.ts` (§3.1).
5. **Página**: `src/features/pagos/pages/ConceptosPagoPage.tsx` (§3.2).
6. **Cableado**: `navigation.ts` (F-12) + `App.tsx` (F-13) + botón en
   `PagosPage.tsx` (F-10).
7. **Verificación final** (§7.2): `npx tsc -b`, `npm run lint`, `npm run build`,
   `npm run test:smoke`.

> Backend y frontend solo se tocan secuencialmente en `pagosService.ts` (no hay
> solape de archivos entre pasos). El paso 3 requiere el backend del paso 2.

---

## 6. Riesgos y notas

**Migración de BD — Bajo/Ninguno**

- **R0 — No hay migración de esquema ni de datos.** `conceptos_pago` y el FK
  `pagos.conceptoId` existen desde `0000_inicial.sql`. `ejecutarMigraciones`
  (`server/db/client.ts:34-35`) no ejecutará nada nuevo. No se toca
  `server/data/colegio.db` ni sus backups.
- **R1 — Re-siembra de permisos**: añadir códigos a `CATALOGO_PERMISOS` inserta
  filas en `permisos` en el arranque (`seed.ts:52-55`, `onConflictDoNothing`) y
  `sincronizarRolesIniciales` reconcilia `rol_permisos`; es idempotente y ya
  ocurre hoy.
- **R2 — DELETE físico con FK `restrict`**: si se intentara borrar un concepto con
  pagos sin la guardia de dominio, SQLite lanzaría y el server devolvería 500.
  Mitigación: `contarPagosDeConcepto` antes de borrar (B-4) → 400 explicativo.
  (Por eso D-P14-6 = DELETE físico, no soft-delete: no hay columna `activo`.)
- **R3 — `periodoId` inmutable** (D-P14-4): evita reubicar pagos entre periodos y
  romper N10; el schema de PATCH no lo admite.

**Riesgos de implementación**

1. **Conflicto de rutas Express**: mantener el orden `/conceptos` y
   `/conceptos/:id` antes de `/` y `/:id/anular`. No hay solapamiento real.
2. **`GET /pagos/conceptos` OR de permisos**: usar `exigirPermiso('pagos.ver',
   'conceptosPago.ver')` para no romper `PagosPage` (que solo tiene `pagos.ver`).
3. **Selector de periodos y `periodos.ver`**: `listarPeriodos()` exige
   `periodos.ver` (`rutas/periodos.ts:17`); degradar a `[periodoActivo]` si falla
   (F-1). El Director no lo notará (`'*'`).
4. **Códigos duplicados**: la UQ es `(periodoId, codigo)` (no global); el chequeo
   de duplicado debe usar `obtenerConceptoDePeriodoYCodigo` (período incluido) y
   excluir el propio id al editar.
5. **`montoBase = 0`** es válido (columna `default 0`); usar `.min(0)`, no
   `.positive()` (a diferencia de `monto` de un pago, que sí es `> 0`).
6. **`etiquetaConcepto` duplicada**: exportarla a util compartido o asumir el
   riesgo de divergencia de copy (F-11).
7. **`Autocomplete` de permisos en `Can`/`PermissionRoute`**: `conceptosPago.*` no
   está tipado como literal cerrado (PermissionCode es `string`), no rompe tipos.
8. **Auditoría**: los POST/PATCH/DELETE quedan auditados automáticamente
   (`middleware.ts:94-115`); no requiere acción.

**Hallazgos informativos (deuda previa, no bloqueante para P14)**

- **H1 — `AUDITORIA.md:85` desactualizado**: dice "Botón 'Cancelar' faltante en
  diálogo Crear pago (`PagosPage.tsx:667`)"; el botón **sí existe**
  (`PagosPage.tsx:652-658`). Sincronizar al cerrar la fase.
- **H2 — `AUDITORIA.md:73` desactualizado**: cita "repos directos en rutas
  (`pagos.ts:45`…)", pero `rutas/pagos.ts` tiene 36 líneas. Revisar al cerrar.
- **H3 — No hay tests de pagos en el smoke**: este trabajo los introduce por
  primera vez (solo conceptos); el registro/anulación de pagos sigue sin cubrirse.

---

## 7. Criterios de aceptación y verificación

### 7.1 Criterios funcionales

- [ ] **Backend (B-1..B-5)**: existen `POST /api/pagos/conceptos`,
  `PATCH /api/pagos/conceptos/:id` y `DELETE /api/pagos/conceptos/:id` con
  permisos `conceptosPago.crear/editar/eliminar`; `GET` acepta `pagos.ver` **o**
  `conceptosPago.ver`.
- [ ] Validaciones: código y descripción obligatorios; `tipo` en
  `MATRICULA/PENSION/OTRO`; `montoBase >= 0` con ≤2 decimales; UQ
  `(periodoId, codigo)`; periodo existente y **no CERRADO** (N10).
- [ ] DELETE bloqueado (400) si el concepto tiene pagos asociados; `periodoId`
  no editable.
- [ ] **Frontend**: item "Conceptos de pago" en **Finanzas** (permiso
  `conceptosPago.ver`); ruta `/conceptos-pago` protegida; página con selector de
  periodo + CRUD + estados carga/error/vacío + a11y (`Label htmlFor`, `aria-label`).
- [ ] `PagosPage` muestra "Gestionar conceptos" (solo con `conceptosPago.ver`) que
  navega a `/conceptos-pago`.
- [ ] **Smoke**: las verificaciones nuevas pasan y las existentes siguen en verde.
- [ ] `npx tsc -b`, `npm run lint`, `npm run build`, `npm run test:smoke` en verde.

### 7.2 Comandos (PowerShell; `rg` no disponible)

```powershell
# Backend — endpoints y permisos
Get-ChildItem -Path server\api\rutas\pagos.ts |
  Select-String -Pattern "conceptos|conceptosPago"
Get-ChildItem -Path server\domain\pagos.service.ts |
  Select-String -Pattern "crearConcepto|actualizarConcepto|eliminarConcepto"
Get-ChildItem -Path server\infra\repos\pagos.ts |
  Select-String -Pattern "insertarConcepto|modificarConcepto|eliminarConcepto|contarPagosDeConcepto|obtenerConceptoDePeriodoYCodigo"
Get-ChildItem -Path server\api\schemas.ts |
  Select-String -Pattern "crearConceptoPagoSchema|actualizarConceptoPagoSchema"
Get-ChildItem -Path shared\permissions.ts |
  Select-String -Pattern "conceptosPago"

# Frontend — servicio, página, navegación y ruta
Get-ChildItem -Path src\services\pagosService.ts |
  Select-String -Pattern "crearConcepto|actualizarConcepto|eliminarConcepto"
Get-ChildItem -Recurse -Path src\features\pagos -Include *.tsx |
  Select-String -Pattern "ConceptosPagoPage|Gestionar conceptos|/conceptos-pago"
Get-ChildItem -Path src\config\navigation.ts |
  Select-String -Pattern "Conceptos de pago|conceptos-pago|conceptosPago"
Get-ChildItem -Path src\App.tsx |
  Select-String -Pattern "ConceptosPagoPage|conceptos-pago|conceptosPago"

# Smoke — bloque de conceptos
Get-ChildItem -Path server\test\smoke.ts |
  Select-String -Pattern "concepto de pago|conceptosPago.crear|eliminar concepto"

# Global
npx tsc -b
npm run lint
npm run build
npm run test:smoke
```

> Nota: `Select-String` con `-Include` requiere `-Recurse` o un path con comodín.
> Evitar `rg` en este entorno.

---

## 8. Trazabilidad

| Hallazgo (plan maestro §2) | Propuesta | Fase |
|---|---|---|
| C13 (falta gestión de conceptos de pago / catálogo fijo en BD) | P14 | Fase 5 |
| §3.3 brecha `[BACKEND NUEVO]` conceptos | P14 (endpoints CRUD) | Fase 5 |
| C12 (endpoints sin pantalla) | P14 expone la gestión en UI | Fase 5 |
| C6/C8 (feedback/a11y) | P14 usa `notificarExito/Error`, `Label htmlFor`, `aria-label` | Fase 5 |
| Drift docs (`AUDITORIA.md:73,85`) | H1, H2 — sincronizar al cerrar | Fase 5 (docs) |

---

## 9. Conteo de archivos por propuesta

| Propuesta | Archivos editados | Archivos nuevos |
|---|---|---|
| Backend | 5 (`shared/permissions.ts`, `server/api/schemas.ts`, `server/infra/repos/pagos.ts`, `server/domain/pagos.service.ts`, `server/api/rutas/pagos.ts`) | 0 |
| Frontend | 3 (`src/services/pagosService.ts`, `src/config/navigation.ts`, `src/App.tsx`) + `PagosPage.tsx` (botón) + `smoke.ts` (test) | 1 (`ConceptosPagoPage.tsx`) |
| **Total** | **9** | **1** |

> **Sin migraciones de BD.** No se modifica `server/db/schema.ts` ni
> `server/db/migrations/`.

---

## 10. Revisión de la implementación (2026-10-10)

> Revisor: Big Pickle (subagente de revisión). Método: lectura del código
> implementado + re-ejecución de `npm run test:smoke` → **SMOKE OK** (7/7
> verificaciones nuevas de conceptos en verde). **No se modificó código fuente.**
> Las rutas `archivo:línea` citadas abajo corresponden al código tal como quedó
> implementado.

### 10.1 Confirmaciones explícitas (todas ✅)

| Pregunta de verificación | Resultado |
|---|---|
| UQ `(periodoId, codigo)` al **crear** | ✅ `pagos.service.ts:170` consulta `obtenerConceptoDePeriodoYCodigo(input.periodoId, codigo)` antes de insertar |
| UQ al **editar** excluyendo el propio id | ✅ `pagos.service.ts:204-209`: solo busca colisión si `codigo !== concepto.codigo` (evita el falso positivo de "no cambiar el código" y detecta la colisión con otro concepto) |
| **N10** en las 3 mutaciones | ✅ `:167` (crear), `:197` (editar), `:251` (eliminar) llaman `validarPeriodoEscribible(...)` |
| Guardia **FK** en DELETE | ✅ `:255` `contarPagosDeConcepto(id) > 0` → `fallo('invalido', …)` (400); respeta `onDelete: 'restrict'` sin provocar 500 |
| `periodoId` **inmutable** en PATCH | ✅ `schemas.ts:224-231` no declara `periodoId`; zod v4 descarta la clave desconocida |
| **Orden de rutas** Express | ✅ `rutas/pagos.ts:18-59` (`/conceptos`, `/conceptos/:id`) va antes de `/` (`:64-78`) y `/:id/anular` (`:81-83`). `/conceptos` (1 segmento) no captura `/conceptos/:id` (2) ni `/:id/anular` (param + literal). Sin solape |
| **OR de permisos** en GET | ✅ `rutas/pagos.ts:21` `exigirPermiso('pagos.ver', 'conceptosPago.ver')`; `middleware.ts:40` usa `.some(...)` → semántica OR correcta (no rompe `PagosPage`) |
| **Smoke**: scope y aislamiento | ✅ `periodoIdSmoke` (`smoke.ts:215`), `alumnoId` (`:97`) y `tokenDocente` (`:178`) están en ámbito; el pago sobre `con-matric` (periodo ACTIVO `per-2026`, `seed.ts:209-214,427-429`) no altera aserciones previas (la auditoría corre antes, `:206-212`) ni posteriores |
| `PagosPage` `render={<Link>}` | ✅ `Button` (Base UI) soporta `render`; `PagosPage.tsx:335` compila y navega a `/conceptos-pago` |
| `etiquetaConcepto/Metodo` sin divergencia | ✅ fuente única `src/features/pagos/utils.ts`; `PagosPage.tsx:67` y `ConceptosPagoPage.tsx:65` importan de ahí; no quedan definiciones locales |
| Verificación global | ✅ `npx tsc -b`, `npm run lint`, `npm run build`, `npm run test:smoke` (SMOKE OK; 7 pruebas nuevas) |

### 10.2 Hallazgos clasificados

**BLOQUEANTES: ninguno.** La lógica backend (validaciones, UQ, N10, FK, OR de
permisos, orden de rutas) es correcta y el smoke pasa con las 7 pruebas nuevas.

**MAYOR**

- **M1 — Las mutaciones de `ConceptosPagoPage` no capturan errores de transporte.**
  `handleSubmit` (`ConceptosPagoPage.tsx:199-236`) y `confirmarEliminar`
  (`:239-253`) hacen `await crearConcepto/actualizarConcepto/eliminarConcepto` sin
  `try/catch`. `apiClient` **lanza** `ApiError` ante fallo de red/timeout
  (`src/services/apiClient.ts:77-82,112-117`), por lo que una excepción deja
  `formEnviando`/`eliminando` en `true` y el diálogo bloqueado en
  "Creando…/Eliminando…" (botón deshabilitado, sin `setFormEnviando(false)`).
  Es el mismo patrón de `PagosPage.tsx:148` y `ModelosPage.tsx:119-133`
  (deuda pre-existente de P9/P10 reconocida en `plan-frontend-ux.md:142`), pero se
  replica en la página nueva. Recomendado: `try/catch` → `setFormError(res/err)` o
  `notificarError` (`src/lib/feedback.ts:13`).

**MENOR**

- **m1 — Sin guarda de secuencia en `cargarConceptos` (`:131-143`).** Si se cambia
  de año lectivo rápidamente, una respuesta tardía de A puede sobrescribir el
  estado ya cargado de B (race condition de UI). Recomendado: token de secuencia
  o `AbortSignal` (`apiClient` ya acepta `signal`).
- **m2 — Esqueleto permanente si no hay años lectivos (`:93,145-151,352-369`).**
  `estado` inicia en `'cargando'`; si `listarPeriodos()` falla (o `[]`) **y**
  `obtenerPeriodoActivo()` devuelve `null`, `periodoSeleccionado` queda `''`,
  `cargarConceptos` no se invoca y la tabla muestra `FilasSkeleton` indefinidamente,
  sin `EmptyState` "no hay años lectivos". Hoy casi inalcanzable (solo el Director
  `'*'` ve la página y tiene `periodos.ver`), pero conviene un estado explícito.
- **m3 — Falta `aria-invalid`/`aria-describedby` por campo en el diálogo
  (`:464-487`).** El error se anuncia vía `Alert` (`role="alert"`,
  `ui/alert.tsx:29`), pero los `Input` no se marcan inválidos ni se asocian al
  mensaje; residual de P11 ya conocido en formularios con validación manual
  (ver `plan-frontend-ux.md:127-128`).
- **m4 — `cargarConceptos` no captura excepciones (`:135`).** Ante fallo de
  transporte en la *carga*, el `ErrorState`/Reintentar nunca aparece (mismo patrón
  que el resto de páginas sin `try/catch`).

**NOTA**

- **n1 — El botón "Gestionar conceptos" solo aparece con un alumno seleccionado**
  (`PagosPage.tsx:319,334-339`): la tarjeta que lo contiene está dentro del bloque
  `alumnoIdSeleccionado &&`. Mitigado por el item de menú "Conceptos de pago"
  (doble entrada D-P14-5).
- **n2 — Id `con-${Date.now()}`** (`pagos.service.ts:174`): dos altas en el mismo
  milisegundo colisionarían en la PK (500). Probabilidad muy baja; patrón idéntico
  a `pgo-${Date.now()}` (`:313`).
- **n3 — Errores de mutación inline** (`ConceptosPagoPage.tsx:464-469,607-613`) en
  vez de `notificarError`. Coincide con el patrón real de `ModelosPage.tsx:139,154`,
  no con el literal del plan (§F-8); sin divergencia funcional.
- **n4 — Degradación del selector** (`ConceptosPagoPage.tsx:119-129`) es correcta
  pero hoy inalcanzable con los roles sembrados (solo el Director ve la página y
  tiene `periodos.ver`); queda como defensa válida ante roles personalizados.
- **n5 — H3 del plan persiste:** el smoke cubre conceptos, pero sigue sin cubrir
  `POST /api/pagos` y `/api/pagos/:id/anular` (solo se usa un pago como preparación
  del guardia de FK, `smoke.ts:278-292`).

### 10.3 Sincronización de documentos (hecha en esta revisión)

- `plan-frontend-ux.md`: **P14 marcado ✅ (Fase 5 completada)** y párrafo de estado
  actualizado; hallazgos de la revisión resumidos en su §6-10.
- `AUDITORIA.md`: **H1** (§5, botón "Cancelar" de Crear pago — ya existe) y **H2**
  (§4-M2, cita obsoleta `pagos.ts:45`) corregidos; añadida nota de Fase 5.
