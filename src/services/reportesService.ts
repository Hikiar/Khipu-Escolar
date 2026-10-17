import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente de reportes agregados (solo lectura, endpoints /api/reportes...).
/// Tipos espejo de `server/domain/reportes.service.ts`.

export interface ResumenMatriculas {
  totalAlumnos: number
  activos: number
  inactivos: number
  porGrado: { gradoId: string; gradoNombre: string; total: number }[]
  porClase: { claseId: string; gradoNombre: string; seccionNombre: string; total: number; vacantes: number }[]
}

export interface ResumenAsistencia {
  totalRegistros: number
  porEstado: { presentes: number; tardes: number; faltas: number; justificados: number }
  porClase: { claseId: string; fecha: string; presentes: number; tardes: number; faltas: number; justificados: number }[]
}

export interface ResumenEvaluacion {
  totalTrabajos: number
  totalExamenes: number
  totalCalificaciones: number
  promedioGeneral: number | null
  porClaseCurso: { claseId: string; cursoId: string; modelo: string; promedio: number | null; nivelLogro: string | null; alumnos: number }[]
}

export interface ResumenPagos {
  totalConceptos: number
  totalPagos: number
  montoTotal: number
  porEstado: { REGISTRADO: number; ANULADO: number }
  porConcepto: { conceptoId: string; codigo: string; descripcion: string; montoBase: number; pagados: number; montoRecaudado: number }[]
}

export interface ResumenAlumnos {
  total: number
  porEstado: { ACTIVO: number; INACTIVO: number }
  porGrado: { gradoId: string; gradoNombre: string; total: number }[]
}

function conConsulta(params: Record<string, string | undefined>): string {
  const partes = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  return partes.length
    ? `?${partes.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&')}`
    : ''
}

export async function consultarMatriculas(
  periodoId?: string,
): Promise<ResultadoServicio<ResumenMatriculas>> {
  return apiFetch<ResultadoServicio<ResumenMatriculas>>(
    `/reportes/matriculas${conConsulta({ periodoId })}`,
  )
}

export async function consultarAsistencia(
  opciones: { claseId?: string; cursoId?: string; fechaDesde?: string; fechaHasta?: string } = {},
): Promise<ResultadoServicio<ResumenAsistencia>> {
  return apiFetch<ResultadoServicio<ResumenAsistencia>>(
    `/reportes/asistencia${conConsulta(opciones)}`,
  )
}

export async function consultarEvaluacion(
  opciones: { claseId?: string; cursoId?: string } = {},
): Promise<ResultadoServicio<ResumenEvaluacion>> {
  return apiFetch<ResultadoServicio<ResumenEvaluacion>>(
    `/reportes/evaluacion${conConsulta(opciones)}`,
  )
}

export async function consultarPagos(
  periodoId?: string,
): Promise<ResultadoServicio<ResumenPagos>> {
  return apiFetch<ResultadoServicio<ResumenPagos>>(`/reportes/pagos${conConsulta({ periodoId })}`)
}

export async function consultarAlumnos(): Promise<ResultadoServicio<ResumenAlumnos>> {
  return apiFetch<ResultadoServicio<ResumenAlumnos>>('/reportes/alumnos')
}