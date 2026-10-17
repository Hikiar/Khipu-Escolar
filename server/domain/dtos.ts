import { resolverPermisosDeUsuario } from '../../shared/authorization.ts'
import type { AuthUser } from '../../shared/types/auth.ts'
import type { Persona, Rol, Usuario } from '../../shared/types/rbac.ts'
import type { PersonaRow, RolConPermisos, UsuarioRow } from '../infra/repos/rbac.ts'

/**
 * Transformación fila-de-bd → DTO del contrato compartido (frontend/API).
 * Las columnas camelCase del esquema coinciden con los atributos de dominio,
 * así que el mapeo es de solo campos opcionales/nulos.
 */

export function aPersonaDto(fila: PersonaRow): Persona {
  return {
    id: fila.id,
    dni: fila.dni,
    codigoInstitucional: fila.codigoInstitucional,
    nombres: fila.nombres,
    apellidos: fila.apellidos,
    correo: fila.correo ?? undefined,
    telefono: fila.telefono ?? undefined,
  }
}

export function aRolDto(rol: RolConPermisos): Rol {
  return {
    id: rol.id,
    codigo: rol.codigo,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    activo: rol.activo,
    permisos: rol.permisoIds,
  }
}

export function aUsuarioDto(usuario: UsuarioRow, roles: Rol[]): Usuario {
  return {
    id: usuario.id,
    personaId: usuario.personaId,
    username: usuario.username,
    activo: usuario.activo,
    debeCambiarPassword: usuario.debeCambiarPassword,
    rolIds: roles.map((rol) => rol.id),
    createdAt: usuario.createdAt,
    desactivadoAt: usuario.desactivadoAt ?? undefined,
  }
}

export function aAuthUserDto(
  usuario: UsuarioRow,
  persona: PersonaRow,
  roles: Rol[],
): AuthUser {
  return {
    id: usuario.id,
    username: usuario.username,
    persona: aPersonaDto(persona),
    activo: usuario.activo,
    debeCambiarPassword: usuario.debeCambiarPassword,
    roles,
    rolIds: roles.map((rol) => rol.id),
    permisos: resolverPermisosDeUsuario(roles),
  }
}