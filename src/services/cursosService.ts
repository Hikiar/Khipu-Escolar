import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export interface Curso {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface CursoGrado {
  cursoId: string
  cursoCodigo: string
  cursoNombre: string
  horasSemana: number | null
  orden: number | null
}

export interface GradoCurso {
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  horasSemana: number | null
  orden: number | null
}

export interface CrearCursoInput {
  codigo: string
  nombre: string
  descripcion?: string
  grados?: { gradoId: string; horasSemana?: number; orden?: number }[]
  modeloEvaluacionId?: string
}

export interface ActualizarCursoInput {
  nombre?: string
  descripcion?: string
  activo?: boolean
}

export interface CrearCursoGradoInput {
  cursoId: string
  gradoId: string
  horasSemana?: number
  orden?: number
}

export interface ActualizarCursoGradoInput {
  horasSemana?: number
  orden?: number
}

export async function listarCursos(
  activos?: boolean,
): Promise<ResultadoServicio<Curso[]>> {
  const params = new URLSearchParams()
  if (activos !== undefined) params.set('activos', String(activos))
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<ResultadoServicio<Curso[]>>(`/cursos${query}`)
}

export async function obtenerCurso(id: string): Promise<ResultadoServicio<Curso>> {
  return apiFetch<ResultadoServicio<Curso>>(`/cursos/${encodeURIComponent(id)}`)
}

export async function crearCurso(
  input: CrearCursoInput,
): Promise<ResultadoServicio<Curso>> {
  return apiFetch<ResultadoServicio<Curso>>('/cursos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarCurso(
  id: string,
  input: ActualizarCursoInput,
): Promise<ResultadoServicio<Curso>> {
  return apiFetch<ResultadoServicio<Curso>>(`/cursos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function desactivarCurso(id: string): Promise<ResultadoServicio<Curso>> {
  return apiFetch<ResultadoServicio<Curso>>(
    `/cursos/${encodeURIComponent(id)}/desactivar`,
    { method: 'POST' },
  )
}

export async function reactivarCurso(id: string): Promise<ResultadoServicio<Curso>> {
  return apiFetch<ResultadoServicio<Curso>>(
    `/cursos/${encodeURIComponent(id)}/reactivar`,
    { method: 'POST' },
  )
}

// ───────────────────────────── Plan de Estudios (CursoGrado) ─────────────────────────────

export async function listarGradosDeCurso(
  cursoId: string,
): Promise<ResultadoServicio<GradoCurso[]>> {
  return apiFetch<ResultadoServicio<GradoCurso[]>>(`/cursos/${encodeURIComponent(cursoId)}/grados`)
}

export async function listarCursosDeGrado(
  gradoId: string,
): Promise<ResultadoServicio<CursoGrado[]>> {
  return apiFetch<ResultadoServicio<CursoGrado[]>>(`/grados/${encodeURIComponent(gradoId)}/cursos`)
}

export async function agregarCursoAGrado(
  input: CrearCursoGradoInput,
): Promise<ResultadoServicio<{ cursoId: string; gradoId: string; horasSemana: number | null; orden: number | null }>> {
  return apiFetch<ResultadoServicio<{ cursoId: string; gradoId: string; horasSemana: number | null; orden: number | null }>>(
    `/cursos/${encodeURIComponent(input.cursoId)}/grados`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function actualizarCursoGrado(
  cursoId: string,
  gradoId: string,
  input: { horasSemana?: number; orden?: number },
): Promise<ResultadoServicio<{ cursoId: string; gradoId: string; horasSemana: number | null; orden: number | null }>> {
  return apiFetch<ResultadoServicio<{ cursoId: string; gradoId: string; horasSemana: number | null; orden: number | null }>>(
    `/cursos/${encodeURIComponent(cursoId)}/grados/${encodeURIComponent(gradoId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export async function quitarCursoDeGrado(
  cursoId: string,
  gradoId: string,
): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>(
    `/cursos/${encodeURIComponent(cursoId)}/grados/${encodeURIComponent(gradoId)}`,
    { method: 'DELETE' },
  )
}