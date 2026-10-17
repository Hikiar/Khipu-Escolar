import type { ResultadoServicio } from '@/types/operations'
import { apiFetch } from './apiClient'

export type TipoConcepto = 'MATRICULA' | 'PENSION' | 'OTRO'
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'
export type EstadoPago = 'REGISTRADO' | 'ANULADO'

export const METODOS_PAGO: readonly MetodoPago[] = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA',
]

export interface ConceptoPago {
  id: string
  periodoId: string
  codigo: string
  descripcion: string
  tipo: TipoConcepto
  montoBase: number
  fechaVencimiento?: string
  obligatorio: boolean
}

export interface Pago {
  id: string
  alumnoId: string
  conceptoId: string
  registradoPor: string
  monto: number
  metodoPago: MetodoPago
  referencia?: string
  fecha: string
  estado: EstadoPago
  observaciones?: string
}

export interface PagoConEntidad extends Pago {
  concepto: { nombre: string; codigo: string } | null
  alumno: { nombreCompleto: string } | null
}

export interface RegistrarPagoInput {
  alumnoId: string
  conceptoId: string
  monto: number
  metodoPago: MetodoPago
  fecha: string
  referencia?: string
  observaciones?: string
}

export async function listarConceptos(
  periodoId: string,
): Promise<ResultadoServicio<ConceptoPago[]>> {
  return apiFetch<ResultadoServicio<ConceptoPago[]>>(
    `/pagos/conceptos?periodoId=${encodeURIComponent(periodoId)}`,
  )
}

export interface CrearConceptoInput {
  periodoId: string
  codigo: string
  descripcion: string
  tipo: TipoConcepto
  montoBase: number
  fechaVencimiento?: string
  obligatorio?: boolean
}

export interface ActualizarConceptoInput {
  codigo?: string
  descripcion?: string
  tipo?: TipoConcepto
  montoBase?: number
  /** `null` borra la fecha de vencimiento. */
  fechaVencimiento?: string | null
  obligatorio?: boolean
}

export async function crearConcepto(
  input: CrearConceptoInput,
): Promise<ResultadoServicio<ConceptoPago>> {
  return apiFetch<ResultadoServicio<ConceptoPago>>('/pagos/conceptos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function actualizarConcepto(
  id: string,
  patch: ActualizarConceptoInput,
): Promise<ResultadoServicio<ConceptoPago>> {
  return apiFetch<ResultadoServicio<ConceptoPago>>(
    `/pagos/conceptos/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  )
}

export async function eliminarConcepto(id: string): Promise<ResultadoServicio<void>> {
  return apiFetch<ResultadoServicio<void>>(
    `/pagos/conceptos/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )
}

export async function listarPagosDeAlumno(
  alumnoId: string,
  periodoId?: string,
): Promise<ResultadoServicio<PagoConEntidad[]>> {
  const params = `alumnoId=${encodeURIComponent(alumnoId)}${periodoId ? `&periodoId=${encodeURIComponent(periodoId)}` : ''}`
  return apiFetch<ResultadoServicio<PagoConEntidad[]>>(`/pagos?${params}`)
}

export async function registrarPago(
  input: RegistrarPagoInput,
): Promise<ResultadoServicio<Pago>> {
  return apiFetch<ResultadoServicio<Pago>>('/pagos', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function anularPago(
  pagoId: string,
): Promise<ResultadoServicio<Pago>> {
  return apiFetch<ResultadoServicio<Pago>>(
    `/pagos/${encodeURIComponent(pagoId)}/anular`,
    { method: 'POST' },
  )
}
