# Plan de implementación — Fase 4 (P8, P13) — Khipu Escolar

> Autor: Big Pickle (subagente de planificación/arquitectura/documentación).
> Fecha: 2026-10-10.
> Alcance: plan DETALLADO que MiMo V2 Pro seguirá para implementar la **Fase 4**
> del plan `plan-frontend-ux.md` (§4): **P8** (explicar el acceso denegado) y
> **P13** (pantalla de auditoría). **No se modifica código fuente en este
> documento**; es la especificación de implementación.
> Documentos relacionados: `plan-frontend-ux.md` (plan maestro),
> `plan-frontend-ux-fase3.md` (§12 revisión previa), `AUDITORIA.md`,
> `DESIGN_SYSTEM.md`.
>
> **Herramientas disponibles**: en este entorno `rg` **no está disponible**; las
> verificaciones de este documento usan `Get-ChildItem` + `Select-String` de
> PowerShell (ver §6.2). Todas las rutas y líneas citadas fueron verificadas en el
> código el 2026-10-10.

---

## 0. Estado de partida (verificado en código, 2026-10-10)

- **Fases 1-3 completadas**: P1, P2, P15 (Fase 1), P3, P9, P10, P11 (Fase 2),
  P4, P5, P6, P7, P12 (Fase 3). Ver `plan-frontend-ux-fase3.md` §12.
- **`AuthUser` ya trae los permisos resueltos**: `shared/types/auth.ts:7-18`
  (`roles`, `rolIds`, `permisos: PermissionCode[]`, `persona`). `useAuth()`
  (`src/features/auth/hooks/useAuth.ts:5-11`) expone `usuario`, `can()`,
  `hasRole()`, `refrescarSesion()` (`AuthProvider.tsx:102-110`) y `logout`.
- **Autorización centralizada**: `hasPermission` (`shared/authorization.ts:13-41`)
  soporta `PERMISO_TOTAL` (`'*'`, `shared/types/rbac.ts:17`) y wildcards de módulo
  (`alumnos.*`); `filtrarItemsAutorizados` (:75-80). Re-exportada como
  `@/lib/authorization`.
- **Catálogo de permisos con descripciones**: `shared/permissions.ts:10-76`
  (`CATALOGO_PERMISOS`), `PERMISOS` (:81-88) y `obtenerPermiso(codigo)` (:90-92).
- **Navegación**: `src/config/navigation.ts:18-142` (5 grupos; **no** hay item
  "Auditoría" ni "Mi perfil"). El filtrado del menú está en
  `src/hooks/useFilteredNav.ts:11-26`; el sidebar lo pinta en
  `src/components/layout/AppSidebar.tsx:54-88`.
- **"Mi perfil" existe pero está poco enlazado**: ruta `perfil` en `App.tsx:49`
  (sin `PermissionRoute`, cualquier sesión); la página es
  `src/features/perfil/pages/MiPerfilPage.tsx:1-211`. Único enlace entrante:
  el recordatorio de contraseña (`RecordatorioCambioContrasena.tsx:43`). El
  `UserMenu` del `Header` (`Header.tsx:70-140`) solo tiene "Cerrar sesión".
- **Backend de auditoría ya operativo**: `server/api/rutas/auditoria.ts:12-18`
  (`GET /api/auditoria`, `exigirAuth` + `exigirPermiso(PERMISO_TOTAL)`), repo
  `server/infra/repos/auditoria.ts:32-39` (`listarAuditoria`, límite fijo 200),
  tabla `server/db/schema.ts:562-572` y middleware de escritura
  `server/api/middleware.ts:94-115` (`auditarMutaciones`, montado en
  `server/api/app.ts:57`; la ruta en `app.ts:80`).
- **Componentes comunes disponibles**: `Paginacion` (`common/Paginacion.tsx`),
  `TableSort` (`common/TableSort.tsx`), `FilasSkeleton`, `EmptyState`,
  `ErrorState`/`InlineError` (`common/index.ts:1-11`) y el hook `useCarga`
  (`src/hooks/useCarga.ts:11-45`).
- **`GET /api/auth/me` es huérfano**: definido en `server/api/rutas/auth.ts:38-40`
  (devuelve `{ ok: true, usuario: req.auth }`, siendo `req.auth` el `AuthUser`
  completo — ver `server/api/middleware.ts:27`). **No** hay función que lo
  consuma en `src/services/authService.ts:1-63`.

### 0.1 Contratos exactos de los endpoints objetivo (verificado)

| Endpoint | Permiso | Servicio frontend | DTO de éxito |
|---|---|---|---|
| `GET /api/auditoria` | `PERMISO_TOTAL` (`'*'`) | **(no existe `auditoriaService.ts`)** | `{ ok: true, registros: Auditoria[] }` — **sin** envoltorio `data`. `Auditoria = { id:number, usuarioId:string\|null, metodo:string, ruta:string, status:number, ip:string\|null, createdAt:string }` (`schema.ts:562-572`). |
| `GET /api/auth/me` | *(solo auth)* | **(no expuesto)** | `{ ok: true, usuario: AuthUser }` (`auth.ts:39`). |
| `GET /api/usuarios` | `usuarios.gestionar` | `listarUsuarios` (`usuariosService.ts:34-36`) | `ResultadoServicio<UsuarioConPersona[]>` (`UsuarioConPersona = Usuario & { persona: {…}\|null }`, :9-16). |

Notas de contrato:
- `GET /api/auditoria` **no acepta query params** y devuelve, como máximo, los
  **200 registros más recientes** ordenados por `id DESC` (`repos/auditoria.ts:32-39`).
  No hay filtros ni paginación en servidor → **filtrado y paginación en cliente**.
- El body de `/api/auditoria` **no** es un `ResultadoServicio` (usa `registros`,
  no `data`). `apiFetch` lo devuelve tal cual porque el cuerpo tiene `ok` booleano
  (`apiClient.ts:44-52,100-111`). El servicio frontend debe **normalizar** a
  `ResultadoServicio<T>`.
- Solo las mutaciones (`POST/PUT/PATCH/DELETE`) sobre `/api/*` se registran
  (`middleware.ts:99-103`); los `GET` **no** aparecen.
- El smoke test ya cubre el endpoint (`server/test/smoke.ts:206-212`): director →
  200 con `registros`; docente → 403. **No debe romperse.**

### 0.2 Hallazgos clave del código (condicionan el diseño)

1. **`usuario.permisos` es la fuente de verdad y ya está en la sesión**
   (`AuthUser.permisos`, `shared/types/auth.ts:17`). No hace falta backend para
   P8 (a): la vista de "permisos efectivos" se deriva 100 % de la sesión.
2. **El filtrado del sidebar es silencioso y combina permiso + rol**
   (`useFilteredNav.ts:20-23`): `filtrarItemsAutorizados` (por `permission`) y
   luego `.filter(item => !item.roles || item.roles.some(...))`. Este es el
   hallazgo **C3** del maestro. Cualquier mecanismo de P8 (b) debe usar
   **exactamente el mismo predicado**, o la explicación contradirá al menú.
3. **No hay punto de entrada natural a `/perfil`**: el `UserMenu`
   (`Header.tsx:70-140`) solo ofrece "Cerrar sesión"; el único enlace está en el
   recordatorio de contraseña. Sin un enlace, la sección "Módulos no disponibles"
   de P8 sería difícil de descubrir.
4. **El item de auditoría debe pedir `PERMISO_TOTAL`**: el backend exige
   literalmente `'*'` (`auditoria.ts:15`). `hasPermission(permisos, '*')` solo es
   verdadero si el usuario tiene `'*'` (no hay wildcard que cubra `'*'`,
   `authorization.ts:13-41`). En los roles iniciales solo **Director** lo tiene
   (`shared/roles.ts:26`). Un `PermissionRoute permission={PERMISO_TOTAL}`
   replica exactamente la regla del servidor.
5. **`listarAuditoria` devuelve `usuarioId` (FK), no el nombre**: para mostrar
   "quién" se necesita cruzar con `listarUsuarios()` (`usuariosService.ts:34-36`).
   Cualquier usuario con `'*'` también tiene `usuarios.gestionar` (por definición
   del wildcard total), así que el cruce siempre está permitido para quien ve la
   página.
6. **`usuarioId` puede ser `null`** (`schema.ts:564`, `onDelete: set null`; y
   `middleware.ts:106` lo deja `null` si la mutación ocurre antes de resolver
   auth, p. ej. un login fallido). La UI debe mostrar "Sistema/Anónimo".
7. **La ruta auditada es la URL completa** (`originalUrl`, `middleware.ts:108`):
   incluye query string. Conviene mostrarla en monoespaciado y truncada.
8. **`MiPerfilPage` no usa `useCarga`**: maneja el formulario con
   `useFormValidation` y estado local (`:55-81`). Las secciones nuevas de P8
   pueden servirse solo de la sesión (sin fetch) salvo el botón de refresco.
9. **`/api/auth/me` es el único endpoint huérfano que P8 puede cerrar**: el
   `refrescarSesion()` actual ya refresca permisos vía `POST /auth/validar`
   (`AuthProvider.tsx:102-110`); consumir `/me` requiere una función y un método
   nuevos (ver decisión D-P8-3).
10. **`AUDITORIA.md:89` está desactualizado**: cita "Ítems muertos 'Mi perfil /
    Preferencias' en el Header (`Header.tsx:114-115`)"; hoy esas líneas son
    contenido del `DropdownMenuContent` y no existen tales items. Anotarlo para
    la sincronización documental al cerrar la fase.

---

## 1. Decisiones de diseño pendientes (resolver antes o durante la implementación)

> Recomendación de Big Pickle entre paréntesis. El usuario autorizó continuar sin
> pedir permisos; estas decisiones pueden tomarse por defecto con la recomendación.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D-P8-1 | **P8 (b): qué mecanismo evita las "desapariciones silenciosas"** | (a) sección **"Módulos no disponibles"** en *Mi perfil*; (b) *item fantasma* deshabilitado con `tooltip` en el sidebar | **(a)** — ver justificación en §2.0. No toca el filtrado del menú (evita el riesgo C3), funciona con el sidebar colapsado y en móvil (donde el tooltip no aplica) y es navegable por teclado/lector de pantalla. |
| D-P8-2 | **P8: agrupación de los permisos efectivos** | (a) lista plana de badges; (b) agrupados por módulo con la descripción de `CATALOGO_PERMISOS` | **(b)** por módulo (prefijo antes de `.`), con la descripción legible de `obtenerPermiso()`; caso especial `'*'` → "Acceso total". |
| D-P8-3 | **P8: consumir `GET /api/auth/me` o reutilizar `refrescarSesion()`** | (a) reutilizar `refrescarSesion()` (sin `/me`, deja §3.2 abierto); (b) nueva `obtenerUsuarioActual()` + `refrescarPerfil()` en `AuthProvider` | **(b)** — cierra la brecha §3.2 del maestro y hace explícito el refresco de permisos; coste bajo y aislado. Fallback aceptable: (a). |
| D-P8-4 | **P8: punto de entrada a `/perfil`** | (a) añadir "Mi perfil" al `UserMenu` del `Header`; (b) además, enlace en el footer del sidebar | **(a)** (el menú de usuario es el lugar convencional). (b) opcional. |
| D-P8-5 | **P8 (b): mostrar el motivo por permiso o por rol** | (a) permiso (y si además falla el rol, mencionarlo); (b) solo un texto genérico | **(a)** motivo concreto: descripción del permiso requerido o los roles permitidos. |
| D-P13-1 | **P13: permiso del item y de la ruta** | (a) reutilizar `PERMISO_TOTAL` (`'*'`), igual que el backend; (b) crear `auditoria.ver` en el catálogo | **(a)** — no requiere cambio de backend ni de roles; (b) quedaría desconectada del servidor (que exige `'*'`). Documentar (b) como trabajo de backend futuro. |
| D-P13-2 | **P13: filtros y paginación** | (a) cliente sobre los 200 registros; (b) pedir `[BACKEND NUEVO]` query params/paginación | **(a)** en Fase 4 (el endpoint no los soporta); (b) como mejora futura. |
| D-P13-3 | **P13: resolver `usuarioId` → nombre** | (a) cruzar con `listarUsuarios()` (degradar a `usuarioId` si falla); (b) mostrar solo el id | **(a)** con degradación elegante. |
| D-P13-4 | **P13: columnas** | (a) fecha, usuario, acción (método), ruta, estado, IP; (b) mínimas (fecha, ruta, estado) | **(a)**; IP útil para administración. Orden por fecha descendente (ya viene así del servidor). |

---

## 2. P8 — Explicar el acceso denegado

**Objetivo**: (a) que el usuario vea sus **permisos efectivos** en *Mi perfil*;
(b) que **no haya desapariciones silenciosas** — un módulo ausente del menú debe
poder explicarse.

### 2.0 Vía elegida (D-P8-1 = sección en *Mi perfil*)

Se descarta el *item fantasma* en el sidebar por:
1. **Riesgo C3**: obligaría a reescribir `useFilteredNav`/`AppSidebar` (donde ya
   conviven permiso + rol de forma sutil) y a decidir si un item bloqueado por
   rol se pinta deshabilitado o no — exactamente el terreno del hallazgo C3.
2. **Ruido y accesibilidad**: el sidebar colapsa a iconos (`AppSidebar.tsx:59`) y
   en móvil el `tooltip` no es descubrible; una lista deshabilitada fija mete
   ruido en cada pantalla.
3. **Punto único**: *Mi perfil* es el lugar canónico, con espacio para explicar
   con texto (descripción del permiso, roles), navegable por teclado y lector.

Se conserva el comportamiento actual del menú (filtrado silencioso en la barra)
y se añade, en *Mi perfil*, la vista que lo explica. El punto de entrada se
refuerza con D-P8-4.

### 2.1 Archivos y cambios por bloque

**Archivo nuevo**: *ninguno* (se editan `useFilteredNav.ts` y `MiPerfilPage.tsx`).
**Archivos editados**: `src/hooks/useFilteredNav.ts`,
`src/features/perfil/pages/MiPerfilPage.tsx`, `src/components/layout/Header.tsx`;
y, solo con D-P8-3b, `src/services/authService.ts`,
`src/features/auth/AuthProvider.tsx` y `src/types/auth.ts` (nuevo método en
`AuthContextValue`).

| # | Archivo:línea | Cambio | Criterio de aceptación |
|---|---|---|---|
| P8-a-1 | `src/hooks/useFilteredNav.ts:11-26` | Extraer el predicado a una función pura exportada `esItemVisible(item, permisos, rolIds): boolean` (= `hasPermission(permisos, item.permission) && (!item.roles \|\| item.roles.some(r => rolIds.includes(r)))`) y refactorizar `useFilteredNav` para usarla (una sola fuente de verdad → evita el riesgo C3). | `useFilteredNav` sigue devolviendo lo mismo; el predicado se reutiliza. |
| P8-b-1 | `src/hooks/useFilteredNav.ts` (nuevo export) | Añadir `useModulosOcultos(): { group: string; item: NavItem; motivo: string }[]`, que recorre `navigationGroups` y devuelve los items donde `esItemVisible` es `false`, con el motivo (D-P8-5): si falla por permiso → `Requiere el permiso «{descripcion}» ({codigo}).` usando `obtenerPermiso()`; si falla por rol → `Disponible solo para: {roles.join(', ')}.` | Devuelve la lista de módulos ocultos con motivo legible. |
| P8-a-2 | `MiPerfilPage.tsx` (imports :1-21) | Añadir imports: `Can` no hace falta; sí `Badge` (ya :14), `Card*` (ya :4-10), `Separator` (ya :15), `ShieldCheck`/`ShieldOff`/`Lock` de `lucide-react`, `PERMISO_TOTAL` de `@/types/rbac`, `CATALOGO_PERMISOS`/`obtenerPermiso` de **`@/config/permissions`** (re-export de `shared/permissions`, `src/config/permissions.ts:5`) y `useModulosOcultos` de `@/hooks/useFilteredNav`. | Compila. |
| P8-a-3 | `MiPerfilPage.tsx` (nuevo helper, tras `LineaDato` :34-41) | `agruparPermisos(permisos: PermissionCode[]): { modulo: string; permisos: PermissionCode[] }[]` que agrupa por `codigo.split('.')[0]`, ordena módulos y permisos y devuelve `[]`-safe. | Agrupa sin duplicados. |
| P8-a-4 | `MiPerfilPage.tsx` (nueva tarjeta, tras la tarjeta "Datos de la cuenta", ~:142) | **Card "Permisos efectivos"**: si `usuario.permisos.includes(PERMISO_TOTAL)` → un `Badge` "Acceso total" + texto "Tu rol incluye todos los permisos del sistema." En caso contrario, por cada módulo un bloque `h3`/`dl` con `Badge variant="secondary"` por permiso y su descripción (`obtenerPermiso(codigo)?.descripcion`). Resumen "N permisos en M módulos". Botón "Actualizar" que llama a `refrescarPerfil()` (D-P8-3b) o `refrescarSesion()` (D-P8-3a); mostrar estado `actualizando` y `toast.success/notificarExito` al terminar. | El usuario ve y entiende sus permisos; el botón refresca. |
| P8-b-2 | `MiPerfilPage.tsx` (nueva tarjeta al final, tras "Cambiar contraseña", ~:208) | **Card "Módulos no disponibles"** con `id="modulos-no-disponibles"`: si la lista de `useModulosOcultos()` está vacía → texto "Tienes acceso a todos los módulos." En caso contrario, agrupar por `group` y, por item, mostrar `item.title` + `motivo` + descripción del módulo (`item.description`). Añadir una nota: "Estos módulos no aparecen en el menú lateral por los motivos indicados. Si necesitas acceso, contacta con dirección." | Explica cada módulo ausente con su motivo. |
| P8-a-5 | `MiPerfilPage.tsx` (a11y) | La lista de permisos como `<ul>`/`<dl>` con encabezados reales (`h3`), `aria-label` en el botón de refresco; separar con `Separator`. | Navegable por teclado; sin `role` inventados. |
| P8-d-1 | `src/components/layout/Header.tsx:132-136` | Añadir, en `DropdownMenuContent`, antes de "Cerrar sesión", un `DropdownMenuItem` con `render={<Link to="/perfil" />}`, icono `UserRound` y texto "Mi perfil". Importar `Link` de `react-router-dom` y `UserRound` de `lucide-react`. | `/perfil` es alcanzable desde el menú de usuario. |
| P8-c-1 | `src/services/authService.ts` (nuevo, tras :40) | (D-P8-3b) `export async function obtenerUsuarioActual(): Promise<ResultadoServicio<AuthUser>>` → `apiFetch<{ ok: true; usuario: AuthUser }>('/auth/me')` y **normalizar** a `{ ok: true, data: usuario }` (o `fallo(...)`), porque `/me` no usa el envoltorio `data`. | Da uso a `/auth/me`. |
| P8-c-2 | `src/features/auth/AuthProvider.tsx` (D-P8-3b) | Añadir `refrescarPerfil(): Promise<void>` que llama a `obtenerUsuarioActual()`; si `ok`, actualiza `sesion.usuario` (`setSesion(s => s ? { ...s, usuario: res.data } : s)`) y `guardarSesion(...)`. Exponerlo en `AuthContextValue` (`src/types/auth.ts:56-72`) y en el `value` (:131-149). | El perfil puede refrescar permisos sin recalcar el token. |

> **Alternativa D-P8-3a** (si se prefiere no tocar `AuthProvider`): el botón
> "Actualizar" llama a `refrescarSesion()` (ya existe) y **no** se consume
> `/api/auth/me`; en ese caso documentar `/me` como huérfano justificado.

> **Detalle de imports compartidos**: `@/types/rbac` re-exporta `shared/types/rbac`
> (`src/types/rbac.ts:5`); `@/types/operations` re-exporta `shared/types/operations`;
> `@/config/permissions` re-exporta `CATALOGO_PERMISOS`/`PERMISOS`/`obtenerPermiso`
> (`src/config/permissions.ts:5`). Vite expone además el alias `@shared` →
> `./shared` (`vite.config.ts:14`), pero se recomienda usar los re-exports `@/…`
> para seguir la convención del proyecto.

### 2.2 Datos y estado (P8)

- (a) Se deriva de `usuario.permisos` y `usuario.roles` (sesión, sin fetch).
- (b) `useModulosOcultos()` usa el mismo `navigationGroups` y el mismo predicado
  que el sidebar → coherencia garantizada.
- Caso `'*'` (Director): (a) muestra "Acceso total"; (b) muestra "Tienes acceso a
  todos los módulos" (excepto el ruido de un futuro item con `permission` no
  cubierto — hoy no existe).

**Esfuerzo**: M. **Riesgo**: bajo-medio (toca el predicado de navegación; por eso
se extrae a función pura y se cubre con verificación).

---

## 3. P13 — Pantalla de auditoría (log de acciones)

**Objetivo**: exponer `GET /api/auditoria` como una página de solo lectura con
tabla filtrable por fecha/usuario/acción, protegida por `PERMISO_TOTAL`.

### 3.1 Contrato del servicio frontend

**Archivo nuevo**: `src/services/auditoriaService.ts`.

```ts
import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

/** Registro de la bitácora (espejo de la tabla `auditoria`, schema.ts:562-572). */
export interface RegistroAuditoria {
  id: number
  usuarioId: string | null
  metodo: string       // POST | PUT | PATCH | DELETE
  ruta: string         // p.ej. "/api/matriculas/abc/retirar"
  status: number       // 200 | 201 | 400 | 403 | 404 | 500 ...
  ip: string | null
  createdAt: string    // ISO
}

/** El endpoint NO usa el envoltorio `data`; usa `registros` (auditoria.ts:17). */
type RespuestaAuditoria =
  | { ok: true; registros: RegistroAuditoria[] }
  | { ok: false; error: string }

export async function listarAuditoria(): Promise<ResultadoServicio<RegistroAuditoria[]>> {
  const res = await apiFetch<RespuestaAuditoria>('/auditoria')
  if (res.ok === true) return { ok: true, data: res.registros }
  return { ok: false, motivo: 'no-disponible', error: 'No se pudo cargar la auditoría.' }
}
```

> `ResultadoServicio` y `fallo()` viven en `shared/types/operations.ts:4-17`
> (re-export en `@/types/operations`). `fallo('no-disponible', …)` es la forma
> canónica; el fragmento inline de arriba es equivalente.

### 3.2 UI — `src/features/auditoria/pages/AuditoriaPage.tsx` (archivo nuevo)

Patrón a imitar: `RolesPage.tsx` / `UsuariosPage.tsx` (estado local `EstadoCarga`,
`cargar` con `useCallback`, `useEffect`, `Alert`+Reintentar, `Card`+`Table`+
`FilasSkeleton`). Alternativa: `useCarga` (dos recursos en paralelo → usar
`Promise.all` en un `cargar` local es más simple).

| # | Elemento | Detalle | Criterio |
|---|---|---|---|
| P13-1 | Carga | `Promise.all([listarAuditoria(), listarUsuarios()])`. Si la auditoría falla → estado `error`. Si `listarUsuarios` falla o devuelve error, seguir en `ok` con un `Map<id,string>` vacío y mostrar `usuarioId` crudo (D-P13-3). | La tabla se pinta aunque el cruce de usuarios falle. |
| P13-2 | `PageHeader` | Título "Auditoría", descripción "Bitácora de acciones registradas en el sistema (solo dirección).", icono `ScrollText` (o `History`). | Visible. |
| P13-3 | `Alert` informativa | Explica: solo se registran mutaciones (POST/PUT/PATCH/DELETE); se muestran los **200 registros más recientes**; log de solo lectura. | El usuario entiende el alcance. |
| P13-4 | Filtros (Card o barra) | **Usuario**: `Select` ("Todos" + usuarios, valor = `usuarioId`). **Acción**: `Select` (Todos/POST/PUT/PATCH/DELETE). **Estado**: `Select` (Todos, Éxito 2xx, Error 4xx, Fallo 5xx). **Ruta**: `Input` texto (substring, insensible a mayúsculas). **Desde/Hasta**: dos `Input type="date"`. Botón "Limpiar filtros". Todos con `Label htmlFor` + `id` (P11). | Filtros funcionales y accesibles. |
| P13-5 | Derivación | `filtrados = useMemo(...)` aplicando usuario, método, rango de fechas (`createdAt.slice(0,10)` comparado como string ISO) y ruta. Luego orden (por defecto `createdAt` desc; `TableSort` opcional) y paginación local. | Respetuoso con listas vacías. |
| P13-6 | Tabla — columnas | **Fecha y hora** (`formatearFecha`, patrón `MiPerfilPage.tsx:43-49`), **Usuario** (`username` + nombre de persona si existe; "Sistema/Anónimo" si `usuarioId === null`), **Acción** (`Badge` del método: POST=`info`, PUT/PATCH=`secondary`, DELETE=`destructive`), **Ruta** (monoespaciado, truncada con `title`), **Estado** (`Badge`: 2xx=`success`, 3xx=`info`, 4xx=`warning`, 5xx=`destructive`), **IP**. | Columnas del DTO visibles. |
| P13-7 | Paginación | `Paginacion` (`common/Paginacion.tsx`), 25 filas/página; resumen "Mostrando X–Y de Z". Si `filtrados.length === 0` no se pinta. | Igual patrón que tablas largas. |
| P13-8 | Estados | `cargando` → `<Table aria-busy="true">` + `<FilasSkeleton columnas={6} />`; `error` → `Alert` destructivo + `Button` Reintentar (o `ErrorState`); `ok` sin datos → `EmptyState` "No hay registros de auditoría"; `ok` con filtros y 0 resultados → texto "Ningún registro coincide con los filtros." | Ningún estado queda en blanco. |
| P13-9 | a11y | `aria-busy` en carga, `Label htmlFor` en filtros, `TableSort` (si se usa) para `aria-sort`, encabezados `TableHead` con `scope` si el componente lo permite. | Sin hallazgos críticos. |

### 3.3 Cableado

| # | Archivo:línea | Cambio | Criterio |
|---|---|---|---|
| P13-10 | `src/config/navigation.ts` (grupo "Administración", :102-141) | Añadir item `{ title: 'Auditoría', href: '/auditoria', icon: ScrollText, description: 'Bitácora de acciones registradas en el sistema', permission: PERMISO_TOTAL }`. Importar `ScrollText` (lucide-react) y `PERMISO_TOTAL` de `@/types/rbac`. | Aparece solo para quien tiene `'*'`. |
| P13-11 | `src/App.tsx` (:1-23 imports; ruta nueva junto a :157-172) | Importar `AuditoriaPage` y `PERMISO_TOTAL`; añadir `<Route path="auditoria" element={<PermissionRoute permission={PERMISO_TOTAL}><AuditoriaPage /></PermissionRoute>} />`. | Ruta protegida por `'*'`; sin permiso → 403. |

> No requiere cambios de backend, `shared/permissions.ts` ni `shared/roles.ts`.

**Esfuerzo**: M. **Riesgo**: bajo (página nueva + 2 líneas de cableado; el
endpoint ya está probado por el smoke test).

---

## 4. Orden de implementación sugerido (para MiMo)

1. **P8-a-b (predicado + sección)**: `useFilteredNav.ts` (`esItemVisible` +
   `useModulosOcultos`) → `MiPerfilPage.tsx` (dos tarjetas). Aislado. Verificar
   `npm run build`.
2. **P8-c-d (refresco + entrada)**: `authService.ts` + `AuthProvider.tsx` +
   `types/auth.ts` (si D-P8-3b) y `Header.tsx` (item "Mi perfil"). Separado del
   paso 1 para aislar el cambio de contexto.
3. **P13**: `auditoriaService.ts` (nuevo) → `AuditoriaPage.tsx` (nuevo) →
   `navigation.ts` + `App.tsx`. No comparte archivos con P8 → sin conflictos.
4. **Verificación final** (§6.2): `npx tsc -b`, `npm run lint`, `npm run build`,
   `npm run test:smoke`.

> P8 y P13 no comparten archivos: pueden hacerse en cualquier orden. El único
> archivo tocado por dos sub-propuestas de P8 es `MiPerfilPage.tsx` (pasos 1 y 2
> conviene agruparlos).

---

## 5. Riesgos y hallazgos

**Riesgos de implementación**

1. **C3 (permiso vs. rol) — duplicar el predicado.** Si `useModulosOcultos`
   redefine la condición, la explicación puede contradecir al menú. Mitigación:
   función pura `esItemVisible` compartida (P8-a-1).
2. **Item "Auditoría" en el catálogo de permisos.** Tentación de crear
   `auditoria.ver`; el backend seguiría exigiendo `'*'`. Mitigación: D-P13-1 (a).
3. **`refrescarPerfil` mal escrito** podría dejar la sesión sin `usuario` o
   perder `token/expiresAt`. Mitigación: actualizar solo `usuario` dentro de la
   `Sesion` existente y persistir con `guardarSesion`.
4. **El cruce con `listarUsuarios`** puede fallar/403; degradar a `usuarioId`
   (P13-1). No bloquear la tabla por ese fallo.
5. **Solo 200 registros**: la UI debe decirlo (P13-3) para no dar impresión de
   histórico completo. Filtros/paginación en cliente (D-P13-2).
6. **`MiPerfilPage` crece**: pasar de 211 a ~330 líneas. Aceptable; si crece más,
   extraer subcomponentes locales (`TarjetaPermisos`, `TarjetaModulosOcultos`).
7. **No romper el smoke test** de auditoría (`smoke.ts:206-212`): P13 no toca el
   backend, así que solo debe mantenerse el paso de `test:smoke`.

**Hallazgos del código (informativos)**

- **H1 — `/api/auth/me` huérfano**: es el único endpoint que P8 puede cerrar
  (D-P8-3b); si se elige (a), queda documentado como justificación de deprecación.
- **H2 — El sidebar no tiene enlace a `/perfil`** (Header `UserMenu` solo ofrece
  logout, `Header.tsx:70-140`). P8-d-1 lo corrige.
- **H3 — `AUDITORIA.md:89` desactualizado** (cita ítems "Mi perfil/Preferencias"
  inexistentes en `Header.tsx:114-115`). Sincronizar al cerrar la fase (mismo
  criterio que P15).
- **H4 — El endpoint expone `usuarioId` sin nombre**: el cruce con usuarios es
  obligatorio para la UI legible (D-P13-3). No hay join en el backend.
- **H5 — Formato de respuesta inhomogéneo**: `/api/auditoria` responde
  `{ registros }` en vez de `ResultadoServicio<{ data }>`; el servicio lo
  normaliza (documentar en el código).

---

## 6. Criterios de aceptación y verificación

### 6.1 Criterios funcionales

- [ ] **P8 (a)**: *Mi perfil* muestra "Permisos efectivos" agrupados por módulo
  con descripción; con `'*'` muestra "Acceso total"; el botón refresca.
- [ ] **P8 (b)**: *Mi perfil* muestra "Módulos no disponibles" con el motivo de
  cada módulo oculto (permiso requerido o rol), coherente con el sidebar.
- [ ] **P8 (c/d)**: `/api/auth/me` se consume (o se documenta) y `/perfil` es
  alcanzable desde el menú de usuario.
- [ ] **P13**: existe item de menú "Auditoría" (solo con `'*'`), ruta protegida y
  página con tabla filtrable por fecha/usuario/acción + paginación; estados
  carga/error/vacío.
- [ ] `npm run build` y `npm run test:smoke` pasan; `npx tsc -b` y `npm run lint`
  sin errores nuevos.

### 6.2 Comandos (PowerShell; `rg` no disponible)

```powershell
# P8 — módulos ocultos y permisos efectivos
Get-ChildItem -Path src\hooks\useFilteredNav.ts |
  Select-String -Pattern 'esItemVisible|useModulosOcultos'
Get-ChildItem -Path src\features\perfil -Recurse -Include *.tsx |
  Select-String -Pattern 'Permisos efectivos|Módulos no disponibles|useModulosOcultos'
Get-ChildItem -Path src\components\layout\Header.tsx |
  Select-String -Pattern 'Mi perfil|/perfil'
# P8 (D-P8-3b) — /auth/me consumido
Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx |
  Select-String -Pattern 'auth/me|obtenerUsuarioActual|refrescarPerfil'

# P13 — servicio, página, menú y ruta
Get-ChildItem -Path src\services -Include *.ts |
  Select-String -Pattern 'listarAuditoria'
Get-ChildItem -Recurse -Path src -Include *.tsx |
  Select-String -Pattern 'AuditoriaPage|/auditoria'
Get-ChildItem -Path src\config\navigation.ts |
  Select-String -Pattern 'Auditoría|auditoria'
Get-ChildItem -Path src\App.tsx |
  Select-String -Pattern 'AuditoriaPage|auditoria|PERMISO_TOTAL'

# Global
npx tsc -b
npm run lint
npm run build
npm run test:smoke
```

> Nota: `Select-String` con `-Include` requiere `-Recurse` o un path con comodín.
> Evitar `rg` en este entorno.

---

## 7. Trazabilidad

| Hallazgo (plan maestro §2) | Propuesta | Fase |
|---|---|---|
| C2 (módulos que desaparecen sin explicación) | P8 (b) | Fase 4 |
| C3 (permisos y roles mezclados) | P8 (b) — predicado único `esItemVisible` | Fase 4 (mitigación) |
| C12 (endpoints sin pantalla) | P13 (auditoría); P8 (c) cierra `/auth/me` | Fase 4 |
| C6/C8 (feedback/a11y) | P8/P13 siguen `feedback.ts`/`EmptyState`/`ErrorState`; P13 `Label htmlFor` | Fase 4 (parcial) |
| Drift docs (`AUDITORIA.md:89`) | H3 — sincronizar al cerrar la fase | Fase 4 (docs) |

---

## 8. Conteo de archivos por propuesta

| Propuesta | Archivos refactorizados | Archivos nuevos |
|---|---|---|
| P8 | 2-4 (`useFilteredNav.ts`, `MiPerfilPage.tsx`, `Header.tsx`, y `authService.ts`/`AuthProvider.tsx`/`types/auth.ts` solo con D-P8-3b) | 0 |
| P13 | 2 (`navigation.ts`, `App.tsx`) | 2 (`auditoriaService.ts`, `AuditoriaPage.tsx`) |
| **Total** | **4-6 archivos únicos** | **2** |

---

## 9. Estado de implementación y revisión (2026-10-10)

> Revisión de Big Pickle (planificador/revisor) sobre la implementación de MiMo V2 Pro.
> Verificación ejecutada por MiMo y **re-verificada** aquí con `Select-String`:
> `npx tsc -b` (exit 0), `npm run lint` (exit 0; solo warnings preexistentes de
> `CalificacionesPage`/`ClasesTab`), `npm run build` (OK), `npm run test:smoke`
> (SMOKE OK). Todos los marcadores de §6.2 están presentes.
> Estado: **Fase 4 completada** (P8, P13).
> **Sin hallazgos bloqueantes.** Los criterios de §6.1 se cumplen; el resto son
> correctitud fina (§9.4) y limpieza de copy/a11y.

### 9.1 Criterios de §6.1 — resultado

| Criterio | Estado | Evidencia |
|---|---|---|
| **P8 (a)** "Permisos efectivos" agrupados por módulo, `'*'` → "Acceso total", botón refresca | ✅ | `MiPerfilPage.tsx:255-318` (Card), `agruparPermisos` `:57-74` (excluye `PERMISO_TOTAL`, agrupa por prefijo y ordena), caso `'*'` `:280-289`, botón `:267-276` → `actualizarPerfil` `:97-107`. |
| **P8 (b)** "Módulos no disponibles" con motivo coherente con el sidebar | ✅ | `MiPerfilPage.tsx:320-368` (`id="modulos-no-disponibles"`, agrupado por grupo, `h3` reales); datos de `useModulosOcultos` `useFilteredNav.ts:66-81`. |
| **P8 (c/d)** `/api/auth/me` consumido y `/perfil` alcanzable desde el menú | ✅ | `obtenerUsuarioActual` `authService.ts:61-65`; `refrescarPerfil` `AuthProvider.tsx:117-127`; interfaz `shared/types/auth.ts:71`; item "Mi perfil" `Header.tsx:133-136`. |
| **P13** item de menú (solo `'*'`), ruta protegida, tabla filtrable + paginación, estados carga/error/vacío | ✅ | `navigation.ts:142-148`; `App.tsx:175-182`; `AuditoriaPage.tsx:99-180` (`Promise.all`, filtros, paginación 25); estados `:320-364`. |
| `tsc` / `lint` / `build` / `test:smoke` en verde | ✅ | Ver nota de cabecera. No hay cambios de backend → el bloque de auditoría del smoke (`smoke.ts:206-212`, director 200 / docente 403) no se ve afectado. |

### 9.2 Correctitud del predicado y coherencia sidebar ↔ explicación

- **`esItemVisible` replica exactamente la lógica previa.** `useFilteredNav.ts:15-23`
  = `hasPermission(permisos, item.permission) && (!item.roles || item.roles.some(rol => rolIds.includes(rol)))`,
  que es la composición anterior de `filtrarItemsAutorizados(items, permisos)`
  (`shared/authorization.ts:75-80`) + el filtro de roles. `useFilteredNav`
  (`:46-59`) devuelve idéntico resultado (mismos grupos, mismos items, mismos
  grupos vacíos descartados).
- **Sin divergencia sidebar/explicación.** `useModulosOcultos` (`:66-81`) usa la
  **misma** función `esItemVisible` y el **mismo** `navigationGroups`, de modo que
  la explicación no puede contradecir al menú. `Header.useCurrentNavItem`
  (`Header.tsx:34-47`) y `AppSidebar` (`:55`) siguen consumiendo `useFilteredNav`
  y no añaden lógica propia. **Riesgo C3 mitigado.**
- **`/api/auditoria` exige `'*'` de forma consistente** en `exigirPermiso`
  (backend), `PermissionRoute` y el item de navegación: `hasPermission` solo
  devuelve `true` para `'*'` si el usuario lleva literalmente `'*'`
  (`shared/authorization.ts:13-41`). Correcto.

### 9.3 Decisiones confirmadas correctas

- **D-P8-3 (b)** cerrada correctamente: `/auth/me` deja de ser huérfano (H1
  resuelto); `obtenerUsuarioActual` normaliza `{ ok, usuario }` → `ResultadoServicio`
  con `fallo<AuthUser>('no-disponible', …)` (`authService.ts:57-65`).
- **D-P8-4 (a)**: "Mi perfil" entra en el `UserMenu` con `render={<Link/>}` +
  `UserRound` (`Header.tsx:133-136`), dentro del `BrowserRouter`.
- **D-P13-2/3/4**: filtros y paginación en cliente sobre los 200 registros; cruce
  con `listarUsuarios` con degradación a `usuarioId`; 6 columnas.
- **Normalización de `/auditoria`** (`auditoriaService.ts:26-34`): el `fallo` es
  correcto y `apiFetch` devuelve el body tal cual porque tiene `ok` booleano
  (`apiClient.ts:44-52,100-111`).
- **El `.catch(() => null)` de `listarUsuarios` no oculta errores de la auditoría
  principal**: solo cubre el recurso auxiliar; si `listarAuditoria()` falla, el
  estado pasa a `error` (`AuditoriaPage.tsx:104-112`).
- **A11y**: `h3` reales y `role="list"` en *Mi perfil* (`:299,300,346,347`),
  `aria-label` en los `<section>` (`:298,345`) y en el botón de refresco (`:272`);
  `Label htmlFor` + `id` en todos los filtros de auditoría
  (`AuditoriaPage.tsx:214,219,234,239,253,258,271,281,291`);
  `aria-busy="true"` en la tabla de carga (`:337`).
- **No rompe el smoke**: P13 solo añade frontend; el endpoint y su permiso no
  cambian.

### 9.4 Hallazgos de la revisión

**Bloqueantes:** ninguno.

**MAYOR**

1. **`refrescarPerfil` no distingue éxito de fallo → *Mi perfil* muestra un toast
   de éxito aunque el refresco falle.** `refrescarPerfil` (`AuthProvider.tsx:117-127`)
   descarta `res.ok` y devuelve `void`; solo propaga excepciones de transporte.
   Cuando `/auth/me` responde `{ ok:false, error:'SESSION_EXPIRED' }` (p. ej. token
   ya inválido, `middleware.ts:16-25,37`), `obtenerUsuarioActual` devuelve `fallo`
   (`authService.ts:64`) y **no lanza**, así que `actualizarPerfil`
   (`MiPerfilPage.tsx:97-107`) cae en la rama de éxito y dispara
   `notificarExito('Perfil actualizado', …)` sin haber actualizado nada. Es un
   feedback engañoso (contrario al criterio C6 de feedback honesto).
   *Acción sugerida:* que `refrescarPerfil` devuelva el `ResultadoServicio<AuthUser>`
   (o lance en `ok:false`) y que `actualizarPerfil` muestre el error cuando `ok`
   sea `false`.

**MENOR**

2. **Clase CSS inexistente `text-warning-foreground` en el motivo.**
   `MiPerfilPage.tsx:355` usa `text-warning-foreground`, pero el tema solo define
   `--color-warning` (`src/index.css:31`); no existe `--color-warning-foreground`.
   La utilidad no se genera → el motivo no recibe el color previsto (cae al color
   heredado). *Acción sugerida:* usar `text-warning` (token existente) o
   `text-muted-foreground`.
3. **El motivo de "Auditoría" para no-directores muestra un código críptico
   «*».** El item de navegación usa `permission: PERMISO_TOTAL` (`navigation.ts:147`)
   y `'*'` no está en `CATALOGO_PERMISOS`, por lo que `obtenerPermiso('*')` es
   `undefined` y `explicarMotivo` (`useFilteredNav.ts:26-34`) cae al fallback
   `Requiere el permiso «*».` Cualquier usuario sin `'*'` (profesor, secretaría,
   personal) ve esa cadena en "Módulos no disponibles", justo lo que P8 pretende
   explicar. *Acción sugerida:* caso especial para `PERMISO_TOTAL` → p. ej.
   "Requiere acceso de dirección (todos los permisos).".
4. **El `aria-label` del menú de usuario quedó desactualizado.**
   `Header.tsx:87` dice `"Abrir menú de usuario (cerrar sesión)"`, pero desde
   D-P8-4 el menú ya no solo cierra sesión (ahora abre "Mi perfil" y "Cerrar
   sesión"). *Acción sugerida:* `"Abrir menú de usuario"`.
5. **El Director ve "Módulos no disponibles: Mis salones" pese a mostrar
   "Acceso total".** `salones.mis` restringe por rol (`navigation.ts:41`); el
   Director tiene `'*'` pero no el rol `profesor`, así que `useModulosOcultos`
   (`useFilteredNav.ts:66-81`) lo incluye y la tarjeta no queda vacía: se ve
   "Acceso total" en *Permisos* y "Mis salones — Disponible solo para: profesor."
   abajo. La información es **verdadera** (el sidebar realmente lo oculta), pero
   contradice la expectativa de §2.2 ("con `'*'` muestra 'Tienes acceso a todos
   los módulos'") y añade ruido. *Acción sugerida (elegir una):* (i) mantenerlo
   (honesto) y anotarlo; o (ii) si el usuario tiene `'*'`, explicar que las únicas
   ausencias son restricciones de rol. No es bloqueante.
6. **`refrescarPerfil` ejecuta `guardarSesion` dentro del updater de `setSesion`.**
   `AuthProvider.tsx:120-125` escribe en `localStorage` dentro de la función de
   actualización; bajo `StrictMode` (`main.tsx:9`) React puede invocar el updater
   dos veces en desarrollo (la escritura es idempotente, sin corrupción). El
   patrón existente `refrescarSesion` (`:103-111`) hace el efecto fuera del
   updater. *Acción sugerida:* calcular la sesión y llamar a `guardarSesion` antes
   de `setSesion`, o usar el valor de `sesion` del closure.

**NOTA / OBSERVACIONES**

7. **El estado vacío de auditoría usa `<p>` en lugar de `EmptyState`.** P13-8 pedía
   `EmptyState`; la implementación usa párrafos centrados
   (`AuditoriaPage.tsx:354-364`). Funcionalmente equivalente; sólo pierde el
   componente común.
8. **Un fallo de transporte de `listarAuditoria()` deja el esqueleto cargando.**
   `cargar` (`AuditoriaPage.tsx:99-117`) no envuelve en `try/catch`; si
   `listarAuditoria` **lanza** `ApiError` (caída de red), la promesa se rechaza y
   el estado se queda en `'cargando'` (el `Alert` de error solo se alcanza con
   `{ ok:false }`). Es el **mismo patrón preexistente** de `UsuariosPage.tsx:79-96`
   y `RolesPage`, no una regresión de Fase 4; el plan lo pedía así ("patrón a
   imitar"). Se anota para una eventual adopción de `useCarga`/`try-catch`
   transversal.
9. **Filtro de fechas con posible off-by-one por zona horaria.**
   `AuditoriaPage.tsx:161-163` compara `createdAt.slice(0,10)` (parte de fecha del
   ISO en **UTC**, `repos/auditoria.ts:27` usa `new Date().toISOString()`) contra
   el `value` local de `<input type="date">`. En horario de Perú (UTC-5), un evento
   de tarde/noche puede caer en el día UTC siguiente. Menor, solo en el borde.
10. **No hay orden por columna** (`TableSort` era opcional en P13-5). Los registros
    llegan `id DESC`; aceptable.
11. **Etiqueta de módulo con `capitalize`.** `MiPerfilPage.tsx:299` aplica
    `capitalize` (texto real en minúsculas) → un lector de pantalla lee "usuarios".
    Cosmético.
12. **`explicarMotivo` lista roles por id.** `useFilteredNav.ts:33` usa
    `item.roles.join(', ')` → "profesor" en vez del nombre "Profesor".
    Cosmético.

### 9.5 Hallazgos documentales resueltos

- **H1 resuelto:** `/api/auth/me` deja de ser huérfano (D-P8-3b).
- **H3 resuelto:** `AUDITORIA.md:89` citaba ítems "Mi perfil / Preferencias"
  inexistentes en el Header; sincronizado en esta revisión (ahora existe "Mi perfil"
  real en `Header.tsx:133-136`).
- **`plan-frontend-ux.md`:** P8 y P13 marcados como completados de Fase 4; filas de
  §3.2 (`/api/auditoria`, `/api/auth/me`) actualizadas a "en uso".

### 9.6 Pendiente / recomendaciones para una iteración futura

- Corregir el hallazgo **MAYOR** (propagar el fallo de `refrescarPerfil`).
- Ajustes de copy/a11y (hallazgos 2-6).
- Si se aborda `P16`, extraer `TarjetaPermisos`/`TarjetaModulosOcultos` de
  `MiPerfilPage.tsx` (~371 líneas ya) y `Filtros`/`TablaAuditoria` de
  `AuditoriaPage.tsx` (~432 líneas).
- `P13 (b) [BACKEND NUEVO]`: query params + paginación en servidor para no limitar
  el histórico a los últimos 200 registros.
