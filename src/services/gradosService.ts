import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export interface Grado {
  id: string
  codigo: string
  nombre: string
  nivel: string
  orden: number
}

export interface Seccion {
  id: string
  gradoId: string
  nombre: string
  turno: string
}

export interface Clase {
  id: string
  periodoId: string
  periodoCodigo: string
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  gradoOrden: number
  nivel: string
  seccionId: string
  seccionNombre: string
  turno: string
  tutorDocenteId: string | null
  estado: string
  vacantes: number
}

export interface CrearGradoInput {
  codigo: string
  nombre: string
  nivel: string
  orden?: number
}

export interface ActualizarGradoInput {
  nombre?: string
  nivel?: string
  orden?: number
}

export interface CrearSeccionInput {
  gradoId: string
  nombre: string
  turno?: string
}

export interface ActualizarSeccionInput {
  nombre?: string
  turno?: string
}

export interface CrearClaseInput {
  periodoId: string
  gradoId: string
  seccionId: string
  tutorDocenteId?: string
  vacantes?: number
}

export interface ActualizarClaseInput {
  tutorDocenteId?: string | null
  vacantes?: number
  estado?: string
}

export async function listarGrados(): Promise<ResultadoServicio<Grado[]>> {
  return apiFetch<ResultadoServicio<Grado[]>>('/grados')
}

export async function obtenerGrado(id: string): Promise<ResultadoServicio<Grado>> {
  return apiFetch<ResultadoServicio<Grado>>(`/grados/${id}`)
}

export async function crearGrado(input: CrearGradoInput): Promise<ResultadoServicio<Grado>> {
  return apiFetch<ResultadoServicio<Grado>>('/grados', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarGrado(id: string, input: ActualizarGradoInput): Promise<ResultadoServicio<Grado>> {
  return apiFetch<ResultadoServicio<Grado>>(`/grados/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function desactivarGrado(id: string): Promise<ResultadoServicio<Grado>> {
  return apiFetch<ResultadoServicio<Grado>>(`/grados/${id}/desactivar`, {
    method: 'POST',
  })
}

export async function listarSeccionesDeGrado(gradoId: string): Promise<ResultadoServicio<Seccion[]>> {
  return apiFetch<ResultadoServicio<Seccion[]>>(`/grados/${gradoId}/secciones`)
}

export async function crearSeccion(input: CrearSeccionInput): Promise<ResultadoServicio<Seccion>> {
  return apiFetch<ResultadoServicio<Seccion>>(`/grados/${input.gradoId}/secciones`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarSeccion(id: string, input: ActualizarSeccionInput): Promise<ResultadoServicio<Seccion>> {
  return apiFetch<ResultadoServicio<Seccion>>(`/secciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function eliminarSeccion(id: string): Promise<ResultadoServicio<Seccion>> {
  return apiFetch<ResultadoServicio<Seccion>>(`/secciones/${id}`, {
    method: 'DELETE',
  })
}

export async function listarClases(): Promise<ResultadoServicio<Clase[]>> {
  return apiFetch<ResultadoServicio<Clase[]>>('/clases')
}

export async function listarClasesDePeriodo(periodoId: string): Promise<ResultadoServicio<Clase[]>> {
  return apiFetch<ResultadoServicio<Clase[]>>(`/clases?periodoId=${encodeURIComponent(periodoId)}`)
}

export async function crearClase(input: CrearClaseInput): Promise<ResultadoServicio<Clase>> {
  return apiFetch<ResultadoServicio<Clase>>('/clases', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarClase(id: string, input: ActualizarClaseInput): Promise<ResultadoServicio<Clase>> {
  return apiFetch<ResultadoServicio<Clase>>(`/clases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function eliminarClase(id: string): Promise<ResultadoServicio<Clase>> {
  return apiFetch<ResultadoServicio<Clase>>(`/clases/${id}`, {
    method: 'DELETE',
  })
}