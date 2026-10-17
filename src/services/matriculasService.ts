import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export interface Matricula {
  id: string
  alumnoId: string
  alumno?: { dni: string; nombres: string; apellidos: string; codigoInstitucional: string }
  claseId: string
  periodoId: string
  registradoPor: string
  fechaRegistro: string
  estado: 'ACTIVA' | 'RETIRADA'
  retiradoAt?: string
  observaciones?: string
}

export interface RegistrarMatriculaInput {
  alumnoId: string
  claseId: string
  periodoId: string
  observaciones?: string
}

export async function listarMatriculas(
  claseId: string,
  todas = false,
): Promise<ResultadoServicio<Matricula[]>> {
  const params = `claseId=${encodeURIComponent(claseId)}${todas ? '&todas=1' : ''}`
  return apiFetch<ResultadoServicio<Matricula[]>>(`/matriculas?${params}`)
}

export async function obtenerMatricula(
  id: string,
): Promise<ResultadoServicio<Matricula>> {
  return apiFetch<ResultadoServicio<Matricula>>(`/matriculas/${encodeURIComponent(id)}`)
}

export async function crearMatricula(
  input: RegistrarMatriculaInput,
): Promise<ResultadoServicio<Matricula>> {
  return apiFetch<ResultadoServicio<Matricula>>('/matriculas', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function retirarMatricula(
  id: string,
): Promise<ResultadoServicio<Matricula>> {
  return apiFetch<ResultadoServicio<Matricula>>(
    `/matriculas/${encodeURIComponent(id)}/retirar`,
    { method: 'POST' },
  )
}

export async function anularMatricula(
  id: string,
): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>(
    `/matriculas/${encodeURIComponent(id)}/anular`,
    { method: 'POST' },
  )
}
