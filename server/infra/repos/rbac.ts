import { eq, inArray, lt } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import * as s from '../../db/schema.ts'

/**
 * Repositorios de RBAC (personas, usuarios, roles, sesiones).
 * Retornan filas crudas de Drizzle; el mapeo a DTO de dominio ocurre en los servicios.
 */

export type UsuarioRow = typeof s.usuarios.$inferSelect
export type PersonaRow = typeof s.personas.$inferSelect
export type RolRow = typeof s.roles.$inferSelect
export type PermisoRow = typeof s.permisos.$inferSelect
export type SesionRow = typeof s.sesiones.$inferSelect

// ─────────────────────────── Personas ───────────────────────────

export const insertarPersona = (fila: typeof s.personas.$inferInsert) =>
  db.insert(s.personas).values(fila).run()

export const actualizarPersona = (id: string, parche: Partial<PersonaRow>) =>
  db.update(s.personas).set(parche).where(eq(s.personas.id, id)).run()

export const obtenerPersonaPorId = (id: string) =>
  db.select().from(s.personas).where(eq(s.personas.id, id)).get() ?? null

/** Busca una Persona por DNI (I1: el DNI es único en `personas`). */
export const obtenerPersonaPorDni = (dni: string) =>
  db.select().from(s.personas).where(eq(s.personas.dni, dni)).get() ?? null

export const listarPersonas = () => db.select().from(s.personas).all()

/** ¿La persona está registrada como docente? (tabla docentes). */
export const esDocente = (personaId: string) =>
  Boolean(db.select().from(s.docentes).where(eq(s.docentes.personaId, personaId)).get())

/** ¿La persona está registrada como alumno? (tabla alumnos). */
export const esAlumno = (personaId: string) =>
  Boolean(db.select().from(s.alumnos).where(eq(s.alumnos.personaId, personaId)).get())

// ─────────────────────────── Usuarios ───────────────────────────

export const obtenerUsuarioPorUsername = (username: string) =>
  db.select().from(s.usuarios).where(eq(s.usuarios.username, username)).get() ?? null

export const obtenerUsuarioPorId = (id: string) =>
  db.select().from(s.usuarios).where(eq(s.usuarios.id, id)).get() ?? null

export const obtenerUsuarioPorPersonaId = (personaId: string) =>
  db.select().from(s.usuarios).where(eq(s.usuarios.personaId, personaId)).get() ?? null

export const listarUsuarios = () =>
  db
    .select()
    .from(s.usuarios)
    .innerJoin(s.personas, eq(s.usuarios.personaId, s.personas.id))
    .orderBy(s.usuarios.createdAt)
    .all()

export const insertarUsuario = (fila: typeof s.usuarios.$inferInsert) =>
  db.insert(s.usuarios).values(fila).run()

export const actualizarUsuario = (id: string, parche: Partial<typeof s.usuarios.$inferInsert>) =>
  db.update(s.usuarios).set(parche).where(eq(s.usuarios.id, id)).run()

export const actualizarPasswordDeUsuario = (usuarioId: string, passwordHash: string) =>
  db.update(s.usuarios).set({ passwordHash }).where(eq(s.usuarios.id, usuarioId)).run()

export const eliminarUsuario = (id: string) =>
  db.delete(s.usuarios).where(eq(s.usuarios.id, id)).run()

export const contarRolEnUso = (rolId: string) =>
  db
    .select({ total: s.usuarioRoles.usuarioId })
    .from(s.usuarioRoles)
    .where(eq(s.usuarioRoles.rolId, rolId))
    .all().length

// ─────────────────────────── Roles de usuario ───────────────────────────

export const obtenerCodigosRolesDeUsuario = (usuarioId: string): string[] =>
  db
    .select({ codigo: s.roles.codigo })
    .from(s.usuarioRoles)
    .innerJoin(s.roles, eq(s.usuarioRoles.rolId, s.roles.id))
    .where(eq(s.usuarioRoles.usuarioId, usuarioId))
    .all()
    .map((fila) => fila.codigo)

export const obtenerRolesDeUsuario = (usuarioId: string): RolConPermisos[] => {
  const filas = db
    .select()
    .from(s.usuarioRoles)
    .innerJoin(s.roles, eq(s.usuarioRoles.rolId, s.roles.id))
    .where(eq(s.usuarioRoles.usuarioId, usuarioId))
    .all()
  return mapearRolesConPermisos(filas.map((fila) => fila.roles))
}

/** Primer usuario ACTIVO que tenga el rol dado (usado por el login demo). */
export const obtenerPrimerUsuarioActivoConRol = (rolId: string) => {
  const filas = db
    .select()
    .from(s.usuarioRoles)
    .innerJoin(s.usuarios, eq(s.usuarioRoles.usuarioId, s.usuarios.id))
    .where(eq(s.usuarioRoles.rolId, rolId))
    .all()
  return filas.map((fila) => fila.usuarios).find((usuario) => usuario.activo) ?? null
}

/** Reemplaza la malla de roles de un usuario (transacción). */
export async function reasignarRolesDeUsuario(usuarioId: string, rolIds: string[]) {
  return db.transaction((tx) => {
    tx.delete(s.usuarioRoles).where(eq(s.usuarioRoles.usuarioId, usuarioId)).run()
    if (rolIds.length > 0) {
      tx.insert(s.usuarioRoles)
        .values(rolIds.map((rolId) => ({ usuarioId, rolId })))
        .run()
    }
  })
}

// ─────────────────────────── Roles ───────────────────────────

export type RolConPermisos = RolRow & { permisoIds: string[] }

export const listarRoles = (): RolConPermisos[] => {
  const filasRoles = db.select().from(s.roles).orderBy(s.roles.codigo).all()
  return mapearRolesConPermisos(filasRoles)
}

export const obtenerRolPorId = (id: string): RolConPermisos | null => {
  const fila = db.select().from(s.roles).where(eq(s.roles.id, id)).get()
  return fila ? mapearRolesConPermisos([fila])[0] : null
}

export const obtenerRolPorCodigo = (codigo: string): RolConPermisos | null => {
  const fila = db.select().from(s.roles).where(eq(s.roles.codigo, codigo)).get()
  return fila ? mapearRolesConPermisos([fila])[0] : null
}

export const obtenerRolesPorIds = (ids: string[]): RolConPermisos[] => {
  if (ids.length === 0) return []
  const filas = db.select().from(s.roles).where(inArray(s.roles.id, ids)).all()
  return mapearRolesConPermisos(filas)
}

function mapearRolesConPermisos(filas: RolRow[]): RolConPermisos[] {
  if (filas.length === 0) return []
  const rolIds = filas.map((rol) => rol.id)
  const malla = db
    .select()
    .from(s.rolPermisos)
    .where(inArray(s.rolPermisos.rolId, rolIds))
    .all()
  const porRol = new Map<string, string[]>()
  for (const fila of malla) {
    const lista = porRol.get(fila.rolId) ?? []
    lista.push(fila.permisoId)
    porRol.set(fila.rolId, lista)
  }
  return filas.map((rol) => ({ ...rol, permisoIds: porRol.get(rol.id) ?? [] }))
}

export const insertarRol = (
  datos: Pick<RolRow, 'id' | 'codigo' | 'nombre' | 'descripcion' | 'activo'>,
  permisoIds: string[],
) =>
  db.transaction((tx) => {
    tx.insert(s.roles).values(datos).run()
    if (permisoIds.length > 0) {
      tx.insert(s.rolPermisos)
        .values(permisoIds.map((permisoId) => ({ rolId: datos.id, permisoId })))
        .run()
    }
  })

export const actualizarRol = (
  id: string,
  parche: Partial<Pick<RolRow, 'nombre' | 'descripcion' | 'activo'>>,
) => db.update(s.roles).set(parche).where(eq(s.roles.id, id)).run()

export const eliminarRol = (id: string) => db.delete(s.roles).where(eq(s.roles.id, id)).run()

export const reemplazarPermisosDeRol = (rolId: string, permisoIds: string[]) =>
  db.transaction((tx) => {
    tx.delete(s.rolPermisos).where(eq(s.rolPermisos.rolId, rolId)).run()
    if (permisoIds.length > 0) {
      tx.insert(s.rolPermisos)
        .values(permisoIds.map((permisoId) => ({ rolId, permisoId })))
        .run()
    }
  })

// ─────────────────────────── Sesiones (tokens opacos) ───────────────────────────

export const insertarSesion = (fila: SesionRow) => db.insert(s.sesiones).values(fila).run()

export const obtenerSesionPorToken = (token: string) =>
  db.select().from(s.sesiones).where(eq(s.sesiones.token, token)).get() ?? null

export const eliminarSesionPorToken = (token: string) =>
  db.delete(s.sesiones).where(eq(s.sesiones.token, token)).run()

export const eliminarSesionesDeUsuario = (usuarioId: string) =>
  db.delete(s.sesiones).where(eq(s.sesiones.usuarioId, usuarioId)).run()

export const limpiarSesionesExpiradas = (antesDe: string) =>
  db.delete(s.sesiones).where(lt(s.sesiones.expiresAt, antesDe)).run()