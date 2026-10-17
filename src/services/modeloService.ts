import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export interface ModeloEvaluacion {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface CrearModeloInput {
  codigo: string
  nombre: string
  descripcion?: string
}

export interface ActualizarModeloInput {
  nombre?: string
  descripcion?: string
  activo?: boolean
}

export async function listarModelos(): Promise<ResultadoServicio<ModeloEvaluacion[]>> {
  return apiFetch<ResultadoServicio<ModeloEvaluacion[]>>('/modelos')
}

export async function obtenerModelo(
  id: string,
): Promise<ResultadoServicio<ModeloEvaluacion>> {
  return apiFetch<ResultadoServicio<ModeloEvaluacion>>(`/modelos/${encodeURIComponent(id)}`)
}

export async function crearModelo(
  input: CrearModeloInput,
): Promise<ResultadoServicio<ModeloEvaluacion>> {
  return apiFetch<ResultadoServicio<ModeloEvaluacion>>('/modelos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarModelo(
  id: string,
  patch: ActualizarModeloInput,
): Promise<ResultadoServicio<ModeloEvaluacion>> {
  return apiFetch<ResultadoServicio<ModeloEvaluacion>>(`/modelos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function eliminarModelo(
  id: string,
): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>(`/modelos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}