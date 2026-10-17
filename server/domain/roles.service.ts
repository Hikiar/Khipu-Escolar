import type { PermissionCode, Rol } from '../../shared/types/rbac.ts'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as repo from '../infra/repos/rbac.ts'
import { aRolDto } from './dtos.ts'

export interface CrearRolInput {
  codigo: string
  nombre: string
  descripcion?: string
  permisos: PermissionCode[]
}

export interface ActualizarRolInput {
  nombre?: string
  descripcion?: string
  activo?: boolean
}

export async function listarRoles(): Promise<ResultadoServicio<Rol[]>> {
  const filas = repo.listarRoles()
  return exito(filas.map(aRolDto))
}

export async function listarRolesActivos(): Promise<ResultadoServicio<Rol[]>> {
  const filas = repo.listarRoles().filter((r) => r.activo)
  return exito(filas.map(aRolDto))
}

export async function crearRol(input: CrearRolInput): Promise<ResultadoServicio<Rol>> {
  const codigo = input.codigo.trim()
  const nombre = input.nombre.trim()

  if (!codigo || !nombre) {
    return fallo<Rol>('invalido', 'Código y nombre son obligatorios.')
  }

  const existente = repo.obtenerRolPorCodigo(codigo)
  if (existente) {
    return fallo<Rol>('invalido', `Ya existe un rol con el código "${codigo}".`)
  }

  const id = `rol-${Date.now()}`
  repo.insertarRol(
    { id, codigo, nombre, descripcion: input.descripcion ?? '', activo: true },
    input.permisos,
  )

  const creado = repo.obtenerRolPorId(id)
  if (!creado) return fallo<Rol>('no-disponible', 'No se pudo crear el rol.')
  return exito(aRolDto(creado))
}

export async function actualizarRol(
  rolId: string,
  input: ActualizarRolInput,
): Promise<ResultadoServicio<Rol>> {
  const existente = repo.obtenerRolPorId(rolId)
  if (!existente) {
    return fallo<Rol>('no-encontrado', `No existe un rol con id "${rolId}".`)
  }

  const parche: { nombre?: string; descripcion?: string; activo?: boolean } = {}
  if (input.nombre !== undefined) parche.nombre = input.nombre.trim()
  if (input.descripcion !== undefined) parche.descripcion = input.descripcion
  if (input.activo !== undefined) parche.activo = input.activo

  repo.actualizarRol(rolId, parche)
  const actualizado = repo.obtenerRolPorId(rolId)
  if (!actualizado) return fallo<Rol>('no-disponible', 'No se pudo actualizar el rol.')
  return exito(aRolDto(actualizado))
}

export async function actualizarPermisosDeRol(
  rolId: string,
  permisos: PermissionCode[],
): Promise<ResultadoServicio<Rol>> {
  const existente = repo.obtenerRolPorId(rolId)
  if (!existente) {
    return fallo<Rol>('no-encontrado', `No existe un rol con id "${rolId}".`)
  }

  repo.reemplazarPermisosDeRol(rolId, permisos)
  const actualizado = repo.obtenerRolPorId(rolId)
  if (!actualizado) return fallo<Rol>('no-disponible', 'No se pudieron actualizar los permisos.')
  return exito(aRolDto(actualizado))
}
