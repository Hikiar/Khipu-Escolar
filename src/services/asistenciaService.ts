import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export type EstadoAsistencia = 'PRESENTE' | 'TARDE' | 'FALTA' | 'JUSTIFICADO'

export interface AsistenciaDetalle {
  id: string
  asistenciaId: string
  alumnoId: string
  estado: EstadoAsistencia
  horaEntrada?: string
  horaSalida?: string
  observaciones?: string
  alumno: { nombreCompleto: string } | null
}

export interface Asistencia {
  id: string
  claseId: string
  /** Presente solo en registros de alcance CURSO. */
  cursoId?: string
  fecha: string
  registradoPor: string
  observaciones?: string
  detalles: AsistenciaDetalle[]
}

export interface AsistenciaResumen {
  id: string
  claseId: string
  /** Presente solo en registros de alcance CURSO. */
  cursoId?: string
  fecha: string
  registradoPor: string
  observaciones?: string
  resumen: {
    presentes: number
    tardes: number
    faltas: number
    justificados: number
  }
}

export interface AlcanceCurso {
  id: string
  codigo: string
  nombre: string
}

/** Alcances que el usuario autenticado puede registrar en una clase. */
export interface AlcancesClase {
  aula: boolean
  cursos: AlcanceCurso[]
}

export interface DetalleInput {
  alumnoId: string
  estado: EstadoAsistencia
  horaEntrada?: string
  horaSalida?: string
  observaciones?: string
}

export async function obtenerAsistencia(
  claseId: string,
  fecha: string,
  cursoId?: string,
): Promise<ResultadoServicio<Asistencia>> {
  let query = `/asistencia?claseId=${encodeURIComponent(claseId)}&fecha=${encodeURIComponent(fecha)}`
  if (cursoId) query += `&cursoId=${encodeURIComponent(cursoId)}`
  return apiFetch<ResultadoServicio<Asistencia>>(query)
}

export async function obtenerAsistenciaPorId(
  id: string,
): Promise<ResultadoServicio<Asistencia>> {
  return apiFetch<ResultadoServicio<Asistencia>>(`/asistencia/${encodeURIComponent(id)}`)
}

export async function listarAsistencias(
  claseId: string,
  cursoId?: string,
): Promise<ResultadoServicio<AsistenciaResumen[]>> {
  let query = `/asistencia?claseId=${encodeURIComponent(claseId)}`
  if (cursoId) query += `&cursoId=${encodeURIComponent(cursoId)}`
  return apiFetch<ResultadoServicio<AsistenciaResumen[]>>(query)
}

/** Alcances de asistencia disponibles para el usuario en una clase. */
export async function listarAlcancesDeClase(
  claseId: string,
): Promise<ResultadoServicio<AlcancesClase>> {
  return apiFetch<ResultadoServicio<AlcancesClase>>(
    `/asistencia/alcances/${encodeURIComponent(claseId)}`,
  )
}

export async function crearAsistencia(input: {
  claseId: string
  cursoId?: string
  fecha: string
  observaciones?: string
  detalles: DetalleInput[]
}): Promise<ResultadoServicio<Asistencia>> {
  return apiFetch<ResultadoServicio<Asistencia>>('/asistencia', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarAsistencia(
  id: string,
  input: {
    observaciones?: string
    detalles: DetalleInput[]
  },
): Promise<ResultadoServicio<Asistencia>> {
  return apiFetch<ResultadoServicio<Asistencia>>(`/asistencia/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
