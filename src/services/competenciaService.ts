import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export interface CompetenciaCurso {
  id: string
  configuracionEvaluacionCursoId: string
  codigo: string
  nombre: string
  descripcion?: string
  orden: number
  activo: boolean
}

export interface CrearCompetenciaInput {
  configuracionEvaluacionCursoId: string
  codigo: string
  nombre: string
  descripcion?: string
  orden?: number
}

export interface ActualizarCompetenciaInput {
  nombre?: string
  descripcion?: string
  orden?: number
  activo?: boolean
}

export async function listarCompetenciasDeConfig(
  configId: string,
): Promise<ResultadoServicio<CompetenciaCurso[]>> {
  return apiFetch<ResultadoServicio<CompetenciaCurso[]>>(`/configuraciones/${encodeURIComponent(configId)}/competencias`)
}

export async function obtenerCompetencia(
  id: string,
): Promise<ResultadoServicio<CompetenciaCurso>> {
  return apiFetch<ResultadoServicio<CompetenciaCurso>>(`/competencias/${encodeURIComponent(id)}`)
}

export async function crearCompetencia(
  input: CrearCompetenciaInput,
): Promise<ResultadoServicio<CompetenciaCurso>> {
  return apiFetch<ResultadoServicio<CompetenciaCurso>>(`/configuraciones/${encodeURIComponent(input.configuracionEvaluacionCursoId)}/competencias`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarCompetencia(
  id: string,
  patch: ActualizarCompetenciaInput,
): Promise<ResultadoServicio<CompetenciaCurso>> {
  return apiFetch<ResultadoServicio<CompetenciaCurso>>(`/competencias/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function anularCompetencia(
  id: string,
): Promise<ResultadoServicio<CompetenciaCurso>> {
  return apiFetch<ResultadoServicio<CompetenciaCurso>>(`/competencias/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}