import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

/// Cliente real para Asignaciones de Curso (endpoints /api/asignaciones).

export interface AsignacionCurso {
  claseId: string
  cursoId: string
  docenteId: string
  curso: { id: string; codigo: string; nombre: string }
  docente: { id: string; dni: string; nombres: string; apellidos: string }
  clase: { id: string; gradoNombre: string; seccionNombre: string; periodoCodigo: string }
}

export interface CrearAsignacionInput {
  claseId: string
  cursoId: string
  docenteId: string
}

export interface AsignacionMasivaResultado {
  claseId: string
  docenteId: string
  registrados: number
  omitidos: number
}

export async function listarAsignaciones(): Promise<ResultadoServicio<AsignacionCurso[]>> {
  return apiFetch<ResultadoServicio<AsignacionCurso[]>>('/asignaciones')
}

export async function listarAsignacionesDeClase(
  claseId: string,
): Promise<ResultadoServicio<AsignacionCurso[]>> {
  return apiFetch<ResultadoServicio<AsignacionCurso[]>>(`/asignaciones?claseId=${encodeURIComponent(claseId)}`)
}

export async function listarAsignacionesDeDocente(
  docenteId: string,
): Promise<ResultadoServicio<AsignacionCurso[]>> {
  return apiFetch<ResultadoServicio<AsignacionCurso[]>>(`/asignaciones?docenteId=${encodeURIComponent(docenteId)}`)
}

export async function obtenerAsignacion(
  claseId: string,
  cursoId: string,
  docenteId: string,
): Promise<ResultadoServicio<AsignacionCurso>> {
  return apiFetch<ResultadoServicio<AsignacionCurso>>(
    `/asignaciones/${encodeURIComponent(claseId)}/${encodeURIComponent(cursoId)}/${encodeURIComponent(docenteId)}`
  )
}

export async function crearAsignacion(
  input: CrearAsignacionInput,
): Promise<ResultadoServicio<AsignacionCurso>> {
  return apiFetch<ResultadoServicio<AsignacionCurso>>('/asignaciones', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function asignarTodosLosCursosDeClase(
  claseId: string,
  docenteId: string,
): Promise<ResultadoServicio<AsignacionMasivaResultado>> {
  return apiFetch<ResultadoServicio<AsignacionMasivaResultado>>('/asignaciones/masivas', {
    method: 'POST',
    body: JSON.stringify({ claseId, docenteId }),
  })
}

export async function eliminarAsignacion(
  claseId: string,
  cursoId: string,
  docenteId: string,
): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>(
    `/asignaciones/${encodeURIComponent(claseId)}/${encodeURIComponent(cursoId)}/${encodeURIComponent(docenteId)}`,
    { method: 'DELETE' },
  )
}