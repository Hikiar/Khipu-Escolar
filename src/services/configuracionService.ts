import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export interface ConfiguracionEvaluacion {
  id: string
  cursoId: string
  cursoCodigo: string
  cursoNombre: string
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  periodoId: string
  periodoCodigo: string
  periodoNombre: string
  modeloEvaluacionId: string
  modeloEvaluacionCodigo: string
  modeloEvaluacionNombre: string
  activo: boolean
}

export interface CompetenciaCurso {
  id: string
  configuracionEvaluacionCursoId: string
  codigo: string
  nombre: string
  descripcion?: string
  orden: number
  activo: boolean
}

export interface ModeloEvaluacion {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface CrearConfiguracionInput {
  cursoId: string
  gradoId: string
  periodoId: string
  modeloEvaluacionId: string
}

export interface ActualizarConfiguracionInput {
  modeloEvaluacionId?: string
  activo?: boolean
}

export async function listarConfiguraciones(
  filtros?: { cursoId?: string; gradoId?: string; periodoId?: string },
): Promise<ResultadoServicio<ConfiguracionEvaluacion[]>> {
  const params = new URLSearchParams()
  if (filtros?.cursoId) params.set('cursoId', filtros.cursoId)
  if (filtros?.gradoId) params.set('gradoId', filtros.gradoId)
  if (filtros?.periodoId) params.set('periodoId', filtros.periodoId)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<ResultadoServicio<ConfiguracionEvaluacion[]>>(`/configuraciones${query}`)
}

export async function obtenerConfiguracion(
  id: string,
): Promise<ResultadoServicio<ConfiguracionEvaluacion>> {
  return apiFetch<ResultadoServicio<ConfiguracionEvaluacion>>(`/configuraciones/${encodeURIComponent(id)}`)
}

export async function crearConfiguracion(
  input: CrearConfiguracionInput,
): Promise<ResultadoServicio<ConfiguracionEvaluacion>> {
  return apiFetch<ResultadoServicio<ConfiguracionEvaluacion>>('/configuraciones', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarConfiguracion(
  id: string,
  patch: ActualizarConfiguracionInput,
): Promise<ResultadoServicio<ConfiguracionEvaluacion>> {
  return apiFetch<ResultadoServicio<ConfiguracionEvaluacion>>(`/configuraciones/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function eliminarConfiguracion(
  id: string,
): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>(`/configuraciones/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function listarConfiguracionesDeCurso(
  cursoId: string,
): Promise<ResultadoServicio<ConfiguracionEvaluacion[]>> {
  return apiFetch<ResultadoServicio<ConfiguracionEvaluacion[]>>(`/cursos/${encodeURIComponent(cursoId)}/configuraciones`)
}