import type { PermissionCode, Rol } from '@/types/rbac'
import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente real de la API Express 5 (endpoints /api/roles/*).
/// Roles configurables: crear, editar, activar/desactivar y asignar permisos.

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
  return apiFetch<ResultadoServicio<Rol[]>>('/roles')
}

export async function listarRolesActivos(): Promise<ResultadoServicio<Rol[]>> {
  return apiFetch<ResultadoServicio<Rol[]>>('/roles/activos')
}

export async function crearRol(
  input: CrearRolInput,
): Promise<ResultadoServicio<Rol>> {
  return apiFetch<ResultadoServicio<Rol>>('/roles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarRol(
  rolId: string,
  input: ActualizarRolInput,
): Promise<ResultadoServicio<Rol>> {
  return apiFetch<ResultadoServicio<Rol>>(`/roles/${rolId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function actualizarPermisosDeRol(
  rolId: string,
  permisos: PermissionCode[],
): Promise<ResultadoServicio<Rol>> {
  return apiFetch<ResultadoServicio<Rol>>(`/roles/${rolId}/permisos`, {
    method: 'PUT',
    body: JSON.stringify({ permisos }),
  })
}