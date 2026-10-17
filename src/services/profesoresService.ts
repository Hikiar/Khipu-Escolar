import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'
import type { NivelCurricular } from '@/lib/nivelesCurso'

export interface TituloDocente {
  nivel: NivelCurricular
  titulo: string
}

export interface Docente {
  id: string
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  codigoInstitucional: string
  especialidad?: string
  titulos: TituloDocente[]
  ingresoAt: string
  estado: 'ACTIVO' | 'INACTIVO'
  niveles: NivelCurricular[]
  tieneCuenta: boolean
}

export interface CrearDocenteInput {
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  especialidad?: string
  titulos?: TituloDocente[]
  ingresoAt?: string
  niveles: NivelCurricular[]
}

export interface ActualizarDocenteInput {
  dni?: string
  nombres?: string
  apellidos?: string
  correo?: string
  telefono?: string
  especialidad?: string
  titulos?: TituloDocente[]
  estado?: 'ACTIVO' | 'INACTIVO'
  niveles?: NivelCurricular[]
}

export async function listarDocentes(
  estado?: 'ACTIVO' | 'INACTIVO',
): Promise<ResultadoServicio<Docente[]>> {
  const query = estado ? `?estado=${estado}` : ''
  return apiFetch<ResultadoServicio<Docente[]>>(`/docentes${query}`)
}

export async function obtenerDocente(
  id: string,
): Promise<ResultadoServicio<Docente>> {
  return apiFetch<ResultadoServicio<Docente>>(`/docentes/${id}`)
}

export async function crearDocente(
  input: CrearDocenteInput,
): Promise<ResultadoServicio<Docente>> {
  return apiFetch<ResultadoServicio<Docente>>('/docentes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarDocente(
  id: string,
  input: ActualizarDocenteInput,
): Promise<ResultadoServicio<Docente>> {
  return apiFetch<ResultadoServicio<Docente>>(`/docentes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function desactivarDocente(
  id: string,
): Promise<ResultadoServicio<Docente>> {
  return apiFetch<ResultadoServicio<Docente>>(`/docentes/${id}/desactivar`, {
    method: 'POST',
  })
}

export async function reactivarDocente(
  id: string,
): Promise<ResultadoServicio<Docente>> {
  return apiFetch<ResultadoServicio<Docente>>(`/docentes/${id}/reactivar`, {
    method: 'POST',
  })
}

/** Alta de la cuenta de acceso de un docente (reusa su persona y su código). */
export interface CrearCuentaDocenteResultado {
  id: string
  username: string
  rolIds: string[]
  activo: boolean
  passwordGenerada?: string
}

export async function crearCuentaDocente(
  id: string,
): Promise<ResultadoServicio<CrearCuentaDocenteResultado>> {
  return apiFetch<ResultadoServicio<CrearCuentaDocenteResultado>>(`/docentes/${id}/cuenta`, {
    method: 'POST',
  })
}