import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export interface Trabajo {
  id: string
  claseId: string
  competenciaCursoId: string
  nombre: string
  descripcion?: string
  fecha?: string
  activo: boolean
}

export interface CalificacionTrabajo {
  id: string
  trabajoEvaluacionId: string
  alumnoId: string
  nota: number
  fechaRegistro: string
  observaciones?: string
  registradoPor: string
}

export interface CalificacionTrabajoConNombre extends CalificacionTrabajo {
  alumno: { nombreCompleto: string } | null
}

export interface Examen {
  id: string
  claseId: string
  configuracionEvaluacionCursoId: string
  nombre: string
  fecha?: string
  estado: string
}

export interface CalificacionExamen {
  id: string
  examenCursoId: string
  alumnoId: string
  nota: number
  fechaRegistro: string
  observaciones?: string
  registradoPor: string
}

export interface CalificacionExamenConNombre extends CalificacionExamen {
  alumno: { nombreCompleto: string } | null
}

export interface PromedioCompetencia {
  competenciaId: string
  codigo: string
  nombre: string
  orden: number
  promedio: number | null
  nivelLogro: string | null
  trabajosCalificados: number
}

export interface ResultadoCurso {
  alumnoId: string
  alumno: { dni: string; nombres: string; apellidos: string } | null
  claseId: string
  cursoId: string
  modelo: string
  promedio: number | null
  nivelLogro: string | null
  competencias: PromedioCompetencia[]
}

export async function listarTrabajos(
  claseId: string,
  competenciaCursoId?: string,
): Promise<ResultadoServicio<Trabajo[]>> {
  const params = new URLSearchParams({ claseId })
  if (competenciaCursoId) params.set('competenciaCursoId', competenciaCursoId)
  return apiFetch<ResultadoServicio<Trabajo[]>>(`/trabajos?${params}`)
}

export async function crearTrabajo(input: {
  claseId: string
  competenciaCursoId: string
  nombre: string
  descripcion?: string
  fecha?: string
}): Promise<ResultadoServicio<Trabajo>> {
  return apiFetch<ResultadoServicio<Trabajo>>('/trabajos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function editarTrabajo(
  id: string,
  patch: { nombre?: string; descripcion?: string; fecha?: string; activo?: boolean },
): Promise<ResultadoServicio<Trabajo>> {
  return apiFetch<ResultadoServicio<Trabajo>>(`/trabajos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function anularTrabajo(
  id: string,
): Promise<ResultadoServicio<Trabajo>> {
  return apiFetch<ResultadoServicio<Trabajo>>(`/trabajos/${id}/anular`, {
    method: 'POST',
  })
}

export async function listarCalificacionesTrabajo(
  trabajoId: string,
): Promise<ResultadoServicio<CalificacionTrabajoConNombre[]>> {
  return apiFetch<ResultadoServicio<CalificacionTrabajoConNombre[]>>(
    `/trabajos/${trabajoId}/calificaciones`,
  )
}

export async function registrarCalificacionTrabajo(input: {
  trabajoEvaluacionId: string
  alumnoId: string
  nota: number
  observaciones?: string
}): Promise<ResultadoServicio<CalificacionTrabajo>> {
  return apiFetch<ResultadoServicio<CalificacionTrabajo>>(
    `/trabajos/${input.trabajoEvaluacionId}/calificaciones`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function listarExamenes(
  claseId: string,
): Promise<ResultadoServicio<Examen[]>> {
  const params = new URLSearchParams({ claseId })
  return apiFetch<ResultadoServicio<Examen[]>>(`/examenes?${params}`)
}

export async function crearExamen(input: {
  claseId: string
  configuracionEvaluacionCursoId: string
  nombre: string
  fecha?: string
}): Promise<ResultadoServicio<Examen>> {
  return apiFetch<ResultadoServicio<Examen>>('/examenes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function editarExamen(
  id: string,
  patch: { nombre?: string; fecha?: string; estado?: string },
): Promise<ResultadoServicio<Examen>> {
  return apiFetch<ResultadoServicio<Examen>>(`/examenes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function listarCalificacionesExamen(
  examenId: string,
): Promise<ResultadoServicio<CalificacionExamenConNombre[]>> {
  return apiFetch<ResultadoServicio<CalificacionExamenConNombre[]>>(
    `/examenes/${examenId}/calificaciones`,
  )
}

export async function registrarCalificacionExamen(input: {
  examenCursoId: string
  alumnoId: string
  nota: number
  observaciones?: string
}): Promise<ResultadoServicio<CalificacionExamen>> {
  return apiFetch<ResultadoServicio<CalificacionExamen>>(
    `/examenes/${input.examenCursoId}/calificaciones`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function calcularResultados(
  claseId: string,
  cursoId: string,
): Promise<ResultadoServicio<ResultadoCurso[]>> {
  const params = new URLSearchParams({ claseId, cursoId })
  return apiFetch<ResultadoServicio<ResultadoCurso[]>>(`/resultados?${params}`)
}
