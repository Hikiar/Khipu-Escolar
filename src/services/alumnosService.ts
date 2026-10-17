import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente real de la API Express 5 (endpoints /api/alumnos/*).

export interface Alumno {
  id: string
  dni: string
  nombres: string
  apellidos: string
  correo: string | null
  telefono: string | null
  codigoInstitucional: string
  ingresoAt: string
  estado: 'ACTIVO' | 'INACTIVO'
}

export interface CrearAlumnoInput {
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  ingresoAt?: string
}

export interface ActualizarAlumnoInput {
  dni?: string
  nombres?: string
  apellidos?: string
  correo?: string
  telefono?: string
  estado?: 'ACTIVO' | 'INACTIVO'
}

export async function listarAlumnos(
  estado?: 'ACTIVO' | 'INACTIVO',
): Promise<ResultadoServicio<Alumno[]>> {
  const query = estado ? `?estado=${estado}` : ''
  return apiFetch<ResultadoServicio<Alumno[]>>(`/alumnos${query}`)
}

export async function obtenerAlumno(
  id: string,
): Promise<ResultadoServicio<Alumno>> {
  return apiFetch<ResultadoServicio<Alumno>>(`/alumnos/${id}`)
}

export async function crearAlumno(
  input: CrearAlumnoInput,
): Promise<ResultadoServicio<Alumno>> {
  return apiFetch<ResultadoServicio<Alumno>>('/alumnos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarAlumno(
  id: string,
  input: ActualizarAlumnoInput,
): Promise<ResultadoServicio<Alumno>> {
  return apiFetch<ResultadoServicio<Alumno>>(`/alumnos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function desactivarAlumno(
  id: string,
): Promise<ResultadoServicio<Alumno>> {
  return apiFetch<ResultadoServicio<Alumno>>(`/alumnos/${id}/desactivar`, {
    method: 'POST',
  })
}

export async function reactivarAlumno(
  id: string,
): Promise<ResultadoServicio<Alumno>> {
  return apiFetch<ResultadoServicio<Alumno>>(`/alumnos/${id}/reactivar`, {
    method: 'POST',
  })
}