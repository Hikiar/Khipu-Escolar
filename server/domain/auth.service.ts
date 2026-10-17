import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type {
  CredencialesLogin,
  ResultadoAutenticacion,
  Sesion,
} from '../../shared/types/auth.ts'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as repo from '../infra/repos/rbac.ts'
import { leerConfig } from '../config.ts'
import { aAuthUserDto, aRolDto } from './dtos.ts'

/**
 * Servicio de autenticación.
 * Sessions: token opaco aleatorio persistido en `sesiones` con expiración configurable.
 * El AuthUser se reconstruye en cada lectura (permisos siempre al día).
 */

const EXPIRACION_SESION_MS = leerConfig().sesionExpiracionHoras * 60 * 60 * 1000

function construirAuthUser(usuario: repo.UsuarioRow) {
  const persona = repo.obtenerPersonaPorId(usuario.personaId)
  if (!persona) return null
  const roles = repo.obtenerRolesDeUsuario(usuario.id).filter((rol) => rol.activo)
  return aAuthUserDto(usuario, persona, roles.map(aRolDto))
}

function emitirSesion(usuario: repo.UsuarioRow): Sesion | null {
  const authUser = construirAuthUser(usuario)
  if (!authUser) return null

  const ahora = Date.now()
  repo.limpiarSesionesExpiradas(new Date(ahora - EXPIRACION_SESION_MS).toISOString())

  const token = randomUUID()
  const sesion: Sesion = {
    token,
    usuario: authUser,
    createdAt: new Date(ahora).toISOString(),
    expiresAt: new Date(ahora + EXPIRACION_SESION_MS).toISOString(),
  }
  repo.insertarSesion({
    token,
    usuarioId: usuario.id,
    createdAt: sesion.createdAt,
    expiresAt: sesion.expiresAt,
  })
  return sesion
}

/** Login manual: código institucional (username de la cuenta) + contraseña contra la BD (bcrypt). */
export async function iniciarSesion(
  credenciales: CredencialesLogin,
): Promise<ResultadoAutenticacion> {
  const codigo = credenciales.codigo.trim()
  const usuario = repo.obtenerUsuarioPorUsername(codigo)
  if (!usuario) return { ok: false, error: 'INVALID_CREDENTIALS' }

  const passwordValida = bcrypt.compareSync(credenciales.password, usuario.passwordHash)
  if (!passwordValida) return { ok: false, error: 'INVALID_CREDENTIALS' }

  if (!usuario.activo) return { ok: false, error: 'USER_INACTIVE' }

  const sesion = emitirSesion(usuario)
  return sesion
    ? { ok: true, sesion }
    : { ok: false, error: 'SERVER_ERROR' }
}

/** Login de desarrollo por rol (selector DEV ONLY). Nunca en producción. */
export async function iniciarSesionDemo(rolId: string): Promise<ResultadoAutenticacion> {
  const usuario = repo.obtenerPrimerUsuarioActivoConRol(rolId)
  if (!usuario) return { ok: false, error: 'USER_INACTIVE' }

  const sesion = emitirSesion(usuario)
  return sesion
    ? { ok: true, sesion }
    : { ok: false, error: 'SERVER_ERROR' }
}

/** Valida una sesión por token: expiración + usuario activo; devuelve sesión fresca. */
export async function validarSesion(token: string): Promise<ResultadoAutenticacion> {
  const sesion = repo.obtenerSesionPorToken(token)
  if (!sesion) return { ok: false, error: 'SESSION_EXPIRED' }

  if (Date.parse(sesion.expiresAt) < Date.now()) {
    repo.eliminarSesionPorToken(token)
    return { ok: false, error: 'SESSION_EXPIRED' }
  }

  const usuario = repo.obtenerUsuarioPorId(sesion.usuarioId)
  if (!usuario || !usuario.activo) return { ok: false, error: 'USER_INACTIVE' }

  const authUser = construirAuthUser(usuario)
  if (!authUser) return { ok: false, error: 'SERVER_ERROR' }

  return {
    ok: true,
    sesion: {
      token,
      usuario: authUser,
      createdAt: sesion.createdAt,
      expiresAt: sesion.expiresAt,
    },
  }
}

/** Invalida la sesión en BD (logout). */
export async function cerrarSesion(token: string): Promise<void> {
  repo.eliminarSesionPorToken(token)
}

/**
 * Cambio de contraseña del usuario autenticado (mi perfil).
 * Exige la contraseña actual (bcrypt), mínimo 8 caracteres y que difiera.
 */
export async function cambiarContrasena(
  usuarioId: string,
  passwordActual: string,
  passwordNueva: string,
): Promise<ResultadoServicio<void>> {
  const usuario = repo.obtenerUsuarioPorId(usuarioId)
  if (!usuario) return fallo<void>('no-encontrado', 'La cuenta no existe.')

  const passwordValida = bcrypt.compareSync(passwordActual, usuario.passwordHash)
  if (!passwordValida) {
    return fallo<void>('invalido', 'La contraseña actual no es correcta.')
  }
  if (passwordNueva.length < 8) {
    return fallo<void>('invalido', 'La nueva contraseña debe tener al menos 8 caracteres.')
  }
  if (passwordNueva === passwordActual) {
    return fallo<void>('invalido', 'La nueva contraseña debe ser diferente a la actual.')
  }

  repo.actualizarPasswordDeUsuario(usuarioId, bcrypt.hashSync(passwordNueva, 10))
  // El cambio de clave (primer ingreso o voluntario) levanta el recordatorio y
  // la contraseña temporal deja de estar vigente (se elimina el valor cifrado).
  repo.actualizarUsuario(usuarioId, { debeCambiarPassword: false, passwordTemporalCifrada: null })
  return exito(undefined)
}