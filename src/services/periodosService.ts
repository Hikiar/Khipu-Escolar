import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export type EstadoPeriodo = 'PLANIFICADO' | 'ACTIVO' | 'CERRADO'

export interface PeriodoAcademico {
  id: string
  codigo: string
  nombre: string
  fechaInicio?: string
  fechaFin?: string
  estado: EstadoPeriodo
}

export interface CrearPeriodoInput {
  codigo: string
  nombre: string
  fechaInicio?: string
  fechaFin?: string
}

export async function listarPeriodos(): Promise<ResultadoServicio<PeriodoAcademico[]>> {
  return apiFetch<ResultadoServicio<PeriodoAcademico[]>>('/periodos')
}

export async function obtenerPeriodoActivo(): Promise<ResultadoServicio<PeriodoAcademico | null>> {
  return apiFetch<ResultadoServicio<PeriodoAcademico | null>>('/periodos/activo')
}

export async function crearPeriodo(
  input: CrearPeriodoInput,
): Promise<ResultadoServicio<PeriodoAcademico>> {
  return apiFetch<ResultadoServicio<PeriodoAcademico>>('/periodos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function activarPeriodo(id: string): Promise<ResultadoServicio<PeriodoAcademico>> {
  return apiFetch<ResultadoServicio<PeriodoAcademico>>(
    `/periodos/${encodeURIComponent(id)}/activar`,
    { method: 'POST' },
  )
}

export async function cerrarPeriodo(id: string): Promise<ResultadoServicio<PeriodoAcademico>> {
  return apiFetch<ResultadoServicio<PeriodoAcademico>>(
    `/periodos/${encodeURIComponent(id)}/cerrar`,
    { method: 'POST' },
  )
}