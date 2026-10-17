import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { RolId, Usuario } from '../../shared/types/rbac.ts'
import { letraCodigoInstitucionalPorRol } from '../../shared/codigosInstitucionales.ts'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as repo from '../infra/repos/rbac.ts'
import { cifrarPasswordTemporal, descifrarPasswordTemporal } from '../infra/seguridad.ts'
import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { aRolDto, aUsuarioDto } from './dtos.ts'
import { generarCodigoInstitucional } from './codigos.service.ts'

export interface UsuarioConPersona extends Usuario {
  persona: { dni: string; nombres: string; apellidos: string; codigoInstitucional: string } | null
}

/** Resultado de `crearUsuario`: incluye la contraseña cuando fue generada. */
export interface UsuarioCreado extends Usuario {
  passwordGenerada?: string
}

/**
 * Alta de una cuenta con acceso al sistema.
 * Roles con letra de código: director (D), profesor (P), secretaria (S), personal (A).
 * El user(username) SIEMPRE es el código institucional de la persona (login manual).
 */
export interface CrearUsuarioInput {
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  rolIds: RolId[]
  /** Contraseña inicial. Si se omite, se genera una aleatoria segura. */
  password?: string
}

function mapearUsuarioConPersona(
  usuario: repo.UsuarioRow,
  persona: repo.PersonaRow | null,
  roles: repo.RolConPermisos[],
): UsuarioConPersona {
  return {
    ...aUsuarioDto(usuario, roles.map(aRolDto)),
    persona: persona
      ? {
          dni: persona.dni,
          nombres: persona.nombres,
          apellidos: persona.apellidos,
          codigoInstitucional: persona.codigoInstitucional,
        }
      : null,
  }
}

export async function listarUsuarios(): Promise<ResultadoServicio<UsuarioConPersona[]>> {
  const filas = repo.listarUsuarios()
  const data: UsuarioConPersona[] = filas.map((fila) => {
    const roles = repo.obtenerRolesDeUsuario(fila.usuarios.id)
    return mapearUsuarioConPersona(
      fila.usuarios,
      fila.personas,
      roles,
    )
  })
  return exito(data)
}

export async function crearUsuario(
  input: CrearUsuarioInput,
): Promise<ResultadoServicio<UsuarioCreado>> {
  const dni = input.dni.trim()
  const nombres = input.nombres.trim()
  const apellidos = input.apellidos.trim()
  if (!dni || !nombres || !apellidos) {
    return fallo<UsuarioCreado>('invalido', 'DNI, nombres y apellidos son obligatorios.')
  }

  if (input.rolIds.length === 0) {
    return fallo<UsuarioCreado>('invalido', 'Debe asignar al menos un rol.')
  }

  const roles = repo.obtenerRolesPorIds(input.rolIds)
  if (roles.length !== input.rolIds.length) {
    return fallo<UsuarioCreado>('invalido', 'Uno o más ids de rol son inválidos.')
  }

  // Letra del código según el primer rol con letra asignada (D/P/S/A).
  const letra = input.rolIds
    .map((rolId) => letraCodigoInstitucionalPorRol(rolId))
    .find((l): l is 'D' | 'P' | 'S' | 'A' => l !== null)
  if (!letra) {
    return fallo<UsuarioCreado>(
      'invalido',
      'El rol seleccionado no tiene letra de código institucional asignada.',
    )
  }

  const passwordGenerada = !input.password?.trim()
  const password = input.password?.trim() ?? generarContraseñaAleatoria()
  if (!password) {
    return fallo<UsuarioCreado>('invalido', 'La contraseña no puede estar vacía.')
  }

  // Persona: se reutiliza si ya existe con el mismo DNI (conserva su código).
  let personaId: string
  const personaExistente = repo.obtenerPersonaPorDni(dni)
  if (personaExistente) {
    if (repo.obtenerUsuarioPorPersonaId(personaExistente.id)) {
      return fallo<UsuarioCreado>(
        'invalido',
        `La persona con DNI "${dni}" ya tiene una cuenta de usuario.`,
      )
    }
    personaId = personaExistente.id
  } else {
    personaId = `per-${Date.now()}`
    repo.insertarPersona({
      id: personaId,
      dni,
      nombres,
      apellidos,
      codigoInstitucional: generarCodigoInstitucional(letra),
      correo: input.correo?.trim() ?? null,
      telefono: input.telefono?.trim() ?? null,
      fechaNacimiento: null,
      sexo: null,
      direccion: null,
    })
  }

  const persona = repo.obtenerPersonaPorId(personaId)
  if (!persona) {
    return fallo<UsuarioCreado>('no-disponible', 'No se pudo crear la cuenta.')
  }

  // P3: nunca dejar una cuenta "huérfana" — si el rol es de profesor y la
  // persona no figura en docentes, se crea su registro docente automáticamente.
  if (letra === 'P' && !repo.esDocente(personaId)) {
    db.insert(s.docentes)
      .values({
        personaId,
        ingresoAt: new Date().toISOString(),
        estado: 'ACTIVO',
      })
      .run()
  }

  const id = `usr-${Date.now()}`
  repo.insertarUsuario({
    id,
    personaId,
    username: persona.codigoInstitucional,
    passwordHash: bcrypt.hashSync(password, 10),
    // Secretos en reposo: la temporal queda cifrada para poder re-mostrarla
    // mientras no se cambie; si el operador definió la clave, no aplica.
    passwordTemporalCifrada: passwordGenerada ? cifrarPasswordTemporal(password) : null,
    debeCambiarPassword: passwordGenerada,
    createdAt: new Date().toISOString(),
    activo: true,
  })
  await repo.reasignarRolesDeUsuario(id, input.rolIds)

  const creado = repo.obtenerUsuarioPorId(id)
  if (!creado) return fallo<UsuarioCreado>('no-disponible', 'No se pudo crear el usuario.')
  const dto = aUsuarioDto(creado, roles.map(aRolDto))
  return exito(passwordGenerada ? { ...dto, passwordGenerada: password } : dto)
}

export async function desactivarUsuario(
  usuarioId: string,
): Promise<ResultadoServicio<Usuario>> {
  const usuario = repo.obtenerUsuarioPorId(usuarioId)
  if (!usuario) {
    return fallo<Usuario>('no-encontrado', `No existe un usuario con id "${usuarioId}".`)
  }

  if (!usuario.activo) {
    return fallo<Usuario>('invalido', 'El usuario ya está desactivado.')
  }

  repo.actualizarUsuario(usuarioId, {
    activo: false,
    desactivadoAt: new Date().toISOString(),
  })
  repo.eliminarSesionesDeUsuario(usuarioId)

  const actualizado = repo.obtenerUsuarioPorId(usuarioId)
  if (!actualizado) return fallo<Usuario>('no-disponible', 'No se pudo desactivar el usuario.')
  const roles = repo.obtenerRolesDeUsuario(usuarioId)
  return exito(aUsuarioDto(actualizado, roles.map(aRolDto)))
}

/** Vuelve a ACTIVO un usuario desactivado. */
export async function reactivarUsuario(
  usuarioId: string,
): Promise<ResultadoServicio<Usuario>> {
  const usuario = repo.obtenerUsuarioPorId(usuarioId)
  if (!usuario) {
    return fallo<Usuario>('no-encontrado', `No existe un usuario con id "${usuarioId}".`)
  }

  if (usuario.activo) {
    return fallo<Usuario>('invalido', 'El usuario ya está activo.')
  }

  repo.actualizarUsuario(usuarioId, {
    activo: true,
    desactivadoAt: null,
  })

  const actualizado = repo.obtenerUsuarioPorId(usuarioId)
  if (!actualizado) return fallo<Usuario>('no-disponible', 'No se pudo reactivar el usuario.')
  const roles = repo.obtenerRolesDeUsuario(usuarioId)
  return exito(aUsuarioDto(actualizado, roles.map(aRolDto)))
}

export async function asignarRoles(
  usuarioId: string,
  rolIds: RolId[],
): Promise<ResultadoServicio<Usuario>> {
  const usuario = repo.obtenerUsuarioPorId(usuarioId)
  if (!usuario) {
    return fallo<Usuario>('no-encontrado', `No existe un usuario con id "${usuarioId}".`)
  }

  const roles = repo.obtenerRolesPorIds(rolIds)
  if (roles.length !== rolIds.length) {
    return fallo<Usuario>('invalido', 'Uno o más ids de rol son inválidos.')
  }

  await repo.reasignarRolesDeUsuario(usuarioId, rolIds)
  const rolesActualizados = repo.obtenerRolesDeUsuario(usuarioId)
  return exito(aUsuarioDto(usuario, rolesActualizados.map(aRolDto)))
}

/** Deliberadamente sin límite de tiempo: no se usa para hashing de sesión. */
export interface RestablecerContrasenaResultado {
  usuario: Usuario
  passwordGenerada: string
}

/**
 * Genera una nueva contraseña aleatoria, la asigna y obliga a cambiarla en el
 * próximo ingreso. Inválida todas las sesiones activas (el usuario debe reingresar).
 */
export async function restablecerContrasena(
  usuarioId: string,
): Promise<ResultadoServicio<RestablecerContrasenaResultado>> {
  const usuario = repo.obtenerUsuarioPorId(usuarioId)
  if (!usuario) {
    return fallo<RestablecerContrasenaResultado>(
      'no-encontrado',
      `No existe un usuario con id "${usuarioId}".`,
    )
  }

  if (!usuario.activo) {
    return fallo<RestablecerContrasenaResultado>(
      'invalido',
      'No se puede restablecer la contraseña de un usuario desactivado.',
    )
  }

  const passwordGenerada = generarContraseñaAleatoria()
  repo.actualizarPasswordDeUsuario(usuarioId, bcrypt.hashSync(passwordGenerada, 10))
  repo.actualizarUsuario(usuarioId, {
    debeCambiarPassword: true,
    passwordTemporalCifrada: cifrarPasswordTemporal(passwordGenerada),
    desactivadoAt: null,
  })
  // Seguridad: al restablecer, todas las sesiones previas dejan de ser válidas.
  repo.eliminarSesionesDeUsuario(usuarioId)

  const actualizado = repo.obtenerUsuarioPorId(usuarioId)
  if (!actualizado) {
    return fallo<RestablecerContrasenaResultado>('no-disponible', 'No se pudo restablecer la contraseña.')
  }
  const roles = repo.obtenerRolesDeUsuario(usuarioId)
  return exito({
    usuario: aUsuarioDto(actualizado, roles.map(aRolDto)),
    passwordGenerada,
  })
}

/** Re-expone la contraseña temporal vigente (cifrada en reposo) para compartirla de nuevo. */
export interface PasswordTemporalResultado {
  usuario: Usuario
  passwordTemporal: string
}

/**
 * Devuelve la contraseña temporal actual de la cuenta.
 * Solo disponible mientras `debeCambiarPassword` siga activo y exista el
 * valor cifrado; al cambiar la clave se elimina y deja de estar disponible.
 */
export async function verPasswordTemporal(
  usuarioId: string,
): Promise<ResultadoServicio<PasswordTemporalResultado>> {
  const usuario = repo.obtenerUsuarioPorId(usuarioId)
  if (!usuario) {
    return fallo<PasswordTemporalResultado>('no-encontrado', `No existe un usuario con id "${usuarioId}".`)
  }
  if (!usuario.debeCambiarPassword || !usuario.passwordTemporalCifrada) {
    return fallo<PasswordTemporalResultado>(
      'invalido',
      'Esta cuenta ya no tiene una contraseña temporal vigente.',
    )
  }

  const passwordTemporal = descifrarPasswordTemporal(usuario.passwordTemporalCifrada)
  const roles = repo.obtenerRolesDeUsuario(usuarioId)
  return exito({
    usuario: aUsuarioDto(usuario, roles.map(aRolDto)),
    passwordTemporal,
  })
}

/** Info de una persona existente (por DNI) para el alta de cuentas. */
export interface PersonaParaCuenta {
  persona: { id: string; dni: string; nombres: string; apellidos: string; codigoInstitucional: string }
  tieneCuenta: boolean
  esDocente: boolean
  esAlumno: boolean
}

export async function buscarPersonaParaCuenta(
  dni: string,
): Promise<ResultadoServicio<PersonaParaCuenta | null>> {
  const dniLimpio = dni.trim()
  if (!dniLimpio) {
    return fallo<PersonaParaCuenta | null>('invalido', 'El DNI es obligatorio.')
  }

  const persona = repo.obtenerPersonaPorDni(dniLimpio)
  if (!persona) {
    return exito(null)
  }

  return exito({
    persona: {
      id: persona.id,
      dni: persona.dni,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      codigoInstitucional: persona.codigoInstitucional,
    },
    tieneCuenta: Boolean(repo.obtenerUsuarioPorPersonaId(persona.id)),
    esDocente: repo.esDocente(persona.id),
    esAlumno: repo.esAlumno(persona.id),
  })
}

function generarContraseñaAleatoria(longitud = 12): string {
  return randomBytes(longitud)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, longitud)
}
