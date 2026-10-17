import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import type { AuthUser } from '../../shared/types/auth.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as pgr from '../infra/repos/pagos.ts'
import * as rbac from '../infra/repos/rbac.ts'
import { validarPeriodoEscribible } from './periodos.service.ts'

/**
 * Servicio de pagos del clúster financiero.
 * Reglas: N4 (un concepto se cobra una vez por alumno/periodo; anular el pago
 * libera el concepto para re-registro reutilizando la fila), I7 (registradoPor),
 * y coherencia §13.6 (ConceptoPago debe pertenecer al periodo vigente).
 */

export type TipoConcepto = 'MATRICULA' | 'PENSION' | 'OTRO'
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'
export type EstadoPago = 'REGISTRADO' | 'ANULADO'

export const TIPOS_CONCEPTO = ['MATRICULA', 'PENSION', 'OTRO'] as const
export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'] as const
export const ESTADOS_PAGO = ['REGISTRADO', 'ANULADO'] as const

export interface ConceptoPagoDto {
  id: string
  periodoId: string
  codigo: string
  descripcion: string
  tipo: TipoConcepto
  montoBase: number
  fechaVencimiento?: string
  obligatorio: boolean
}

export interface PagoDto {
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

export interface PagoConEntidadDto extends PagoDto {
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

export interface CrearConceptoPagoInput {
  periodoId: string
  codigo: string
  descripcion: string
  tipo: TipoConcepto
  montoBase: number
  fechaVencimiento?: string
  obligatorio?: boolean
}

export interface ActualizarConceptoPagoInput {
  codigo?: string
  descripcion?: string
  tipo?: TipoConcepto
  montoBase?: number
  fechaVencimiento?: string | null
  obligatorio?: boolean
}

function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false
  const d = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const [y, m, dd] = fecha.split('-').map(Number)
  return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === dd
}

function aConceptoDto(f: Awaited<ReturnType<typeof pgr.obtenerConceptoPorId>>): ConceptoPagoDto | null {
  if (!f) return null
  return {
    id: f.id,
    periodoId: f.periodoId,
    codigo: f.codigo,
    descripcion: f.descripcion,
    tipo: f.tipo as TipoConcepto,
    montoBase: f.montoBase,
    fechaVencimiento: f.fechaVencimiento ?? undefined,
    obligatorio: f.obligatorio ?? true,
  }
}

type FilaPago = NonNullable<Awaited<ReturnType<typeof pgr.obtenerPagoPorId>>>

function aPagoDto(f: FilaPago): PagoDto {
  return {
    id: f.id,
    alumnoId: f.alumnoId,
    conceptoId: f.conceptoId,
    registradoPor: f.registradoPor,
    monto: f.monto,
    metodoPago: f.metodoPago as MetodoPago,
    referencia: f.referencia ?? undefined,
    fecha: f.fecha,
    estado: f.estado as EstadoPago,
    observaciones: f.observaciones ?? undefined,
  }
}

function aPagoConEntidadDto(
  f: FilaPago,
  concepto: { nombre: string; codigo: string } | null,
  alumno: { nombreCompleto: string } | null,
): PagoConEntidadDto {
  return { ...aPagoDto(f), concepto, alumno }
}

function nombreDeAlumno(alumnoId: string): { nombreCompleto: string } | null {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  const persona = alumno ? rbac.obtenerPersonaPorId(alumno.personaId) : null
  return persona ? { nombreCompleto: `${persona.nombres} ${persona.apellidos}` } : null
}

export async function listarConceptos(
  periodoId: string,
): Promise<ResultadoServicio<ConceptoPagoDto[]>> {
  if (!acad.obtenerPeriodoPorId(periodoId)) {
    return fallo<ConceptoPagoDto[]>('no-encontrado', 'No existe el periodo indicado.')
  }
  const filas = pgr.listarConceptosDePeriodo(periodoId)
  return exito(filas.map((f) => aConceptoDto(f)).filter((d): d is ConceptoPagoDto => d !== null))
}

export async function crearConcepto(
  input: CrearConceptoPagoInput,
): Promise<ResultadoServicio<ConceptoPagoDto>> {
  const codigo = input.codigo.trim()
  const descripcion = input.descripcion.trim()
  if (!codigo) return fallo('invalido', 'El código del concepto es obligatorio.')
  if (!descripcion) return fallo('invalido', 'La descripción del concepto es obligatoria.')
  if (!(TIPOS_CONCEPTO as readonly string[]).includes(input.tipo)) {
    return fallo('invalido', 'El tipo de concepto no es válido (MATRICULA/PENSION/OTRO).')
  }
  if (!Number.isFinite(input.montoBase) || input.montoBase < 0) {
    return fallo('invalido', 'El monto base no puede ser negativo.')
  }
  if (Math.round(input.montoBase * 100) !== input.montoBase * 100) {
    return fallo('invalido', 'El monto base admite hasta 2 decimales.')
  }
  if (input.fechaVencimiento && !esFechaValida(input.fechaVencimiento)) {
    return fallo('invalido', 'La fecha de vencimiento no es válida.')
  }
  if (!acad.obtenerPeriodoPorId(input.periodoId)) {
    return fallo('no-encontrado', 'No existe el periodo indicado.')
  }
  // N10: un periodo cerrado congela el cronograma.
  const errorPeriodo = validarPeriodoEscribible(input.periodoId)
  if (errorPeriodo) return fallo('invalido', errorPeriodo)

  if (pgr.obtenerConceptoDePeriodoYCodigo(input.periodoId, codigo)) {
    return fallo('invalido', 'Ya existe un concepto con ese código en el periodo.')
  }

  const id = `con-${Date.now()}`
  pgr.insertarConcepto({
    id,
    periodoId: input.periodoId,
    codigo,
    descripcion,
    tipo: input.tipo,
    montoBase: input.montoBase,
    fechaVencimiento: input.fechaVencimiento ?? null,
    obligatorio: input.obligatorio ?? true,
  })
  const dto = aConceptoDto(pgr.obtenerConceptoPorId(id))
  if (!dto) return fallo('no-disponible', 'No se pudo crear el concepto.')
  return exito(dto)
}

export async function actualizarConcepto(
  id: string,
  patch: ActualizarConceptoPagoInput,
): Promise<ResultadoServicio<ConceptoPagoDto>> {
  const concepto = pgr.obtenerConceptoPorId(id)
  if (!concepto) return fallo('no-encontrado', 'No existe el concepto de pago indicado.')
  // N10: un periodo cerrado congela el cronograma.
  const errorPeriodo = validarPeriodoEscribible(concepto.periodoId)
  if (errorPeriodo) return fallo('invalido', errorPeriodo)

  const parche: Partial<typeof concepto> = {}
  if (patch.codigo !== undefined) {
    const codigo = patch.codigo.trim()
    if (!codigo) return fallo('invalido', 'El código no puede estar vacío.')
    if (
      codigo !== concepto.codigo &&
      pgr.obtenerConceptoDePeriodoYCodigo(concepto.periodoId, codigo)
    ) {
      return fallo('invalido', 'Ya existe un concepto con ese código en el periodo.')
    }
    parche.codigo = codigo
  }
  if (patch.descripcion !== undefined) {
    const descripcion = patch.descripcion.trim()
    if (!descripcion) return fallo('invalido', 'La descripción no puede estar vacía.')
    parche.descripcion = descripcion
  }
  if (patch.tipo !== undefined) {
    if (!(TIPOS_CONCEPTO as readonly string[]).includes(patch.tipo)) {
      return fallo('invalido', 'El tipo de concepto no es válido.')
    }
    parche.tipo = patch.tipo
  }
  if (patch.montoBase !== undefined) {
    if (!Number.isFinite(patch.montoBase) || patch.montoBase < 0) {
      return fallo('invalido', 'El monto base no puede ser negativo.')
    }
    if (Math.round(patch.montoBase * 100) !== patch.montoBase * 100) {
      return fallo('invalido', 'El monto base admite hasta 2 decimales.')
    }
    parche.montoBase = patch.montoBase
  }
  if (patch.fechaVencimiento !== undefined) {
    if (patch.fechaVencimiento !== null && !esFechaValida(patch.fechaVencimiento)) {
      return fallo('invalido', 'La fecha de vencimiento no es válida.')
    }
    parche.fechaVencimiento = patch.fechaVencimiento
  }
  if (patch.obligatorio !== undefined) parche.obligatorio = patch.obligatorio

  const actualizado = pgr.modificarConcepto(id, parche)
  if (!actualizado) return fallo('no-disponible', 'No se pudo actualizar el concepto.')
  const dto = aConceptoDto(actualizado)
  if (!dto) return fallo('no-disponible', 'No se pudo actualizar el concepto.')
  return exito(dto)
}

export async function eliminarConcepto(id: string): Promise<ResultadoServicio<void>> {
  const concepto = pgr.obtenerConceptoPorId(id)
  if (!concepto) return fallo('no-encontrado', 'No existe el concepto de pago indicado.')
  // N10: un periodo cerrado congela el cronograma.
  const errorPeriodo = validarPeriodoEscribible(concepto.periodoId)
  if (errorPeriodo) return fallo('invalido', errorPeriodo)

  // N4 / FK restrict: un concepto con pagos no se puede borrar.
  if (pgr.contarPagosDeConcepto(id) > 0) {
    return fallo('invalido', 'No se puede eliminar: el concepto tiene pagos asociados.')
  }
  pgr.eliminarConcepto(id)
  return exito(undefined)
}

export async function registrarPago(
  input: RegistrarPagoInput,
  autor: AuthUser,
): Promise<ResultadoServicio<PagoDto>> {
  if (!Number.isFinite(input.monto) || input.monto <= 0) {
    return fallo<PagoDto>('invalido', 'El monto debe ser mayor a 0.')
  }
  if (Math.round(input.monto * 100) !== input.monto * 100) {
    return fallo<PagoDto>('invalido', 'El monto admite hasta 2 decimales.')
  }
  if (!esFechaValida(input.fecha)) {
    return fallo<PagoDto>('invalido', 'La fecha debe tener el formato YYYY-MM-DD y ser válida.')
  }
  if (!(METODOS_PAGO as readonly string[]).includes(input.metodoPago)) {
    return fallo<PagoDto>('invalido', 'El método de pago no es válido (EFECTIVO/TRANSFERENCIA/TARJETA).')
  }

  const concepto = pgr.obtenerConceptoPorId(input.conceptoId)
  if (!concepto) return fallo<PagoDto>('no-encontrado', 'No existe el concepto de pago indicado.')

  // N10: un periodo cerrado congela los pagos.
  const errorPeriodo = validarPeriodoEscribible(concepto.periodoId)
  if (errorPeriodo) return fallo<PagoDto>('invalido', errorPeriodo)

  const alumno = acad.obtenerAlumnoPorPersonaId(input.alumnoId)
  if (!alumno) return fallo<PagoDto>('no-encontrado', 'No existe el alumno indicado.')

  const existente = pgr.obtenerPagoDeAlumnoYConcepto(input.alumnoId, input.conceptoId)
  if (existente && existente.estado === 'REGISTRADO') {
    return fallo<PagoDto>(
      'invalido',
      'El alumno ya tiene un pago REGISTRADO para este concepto (N4).',
    )
  }

  const ahora = Date.now()
  if (existente) {
    // N4: anular libera el concepto → se reactiva la misma fila (UQ completa).
    const reactivado = pgr.modificarPago(existente.id, {
      registradoPor: autor.id,
      monto: input.monto,
      metodoPago: input.metodoPago,
      referencia: input.referencia ?? null,
      fecha: input.fecha,
      estado: 'REGISTRADO',
      observaciones: input.observaciones ?? null,
    })
    if (!reactivado) return fallo<PagoDto>('no-disponible', 'No se pudo registrar el pago.')
    return exito(aPagoDto(reactivado))
  }

  const id = `pgo-${ahora}`
  pgr.insertarPago({
    id,
    alumnoId: input.alumnoId,
    conceptoId: input.conceptoId,
    registradoPor: autor.id,
    monto: input.monto,
    metodoPago: input.metodoPago,
    referencia: input.referencia ?? null,
    fecha: input.fecha,
    estado: 'REGISTRADO',
    observaciones: input.observaciones ?? null,
  })
  const creado = pgr.obtenerPagoPorId(id)
  if (!creado) return fallo<PagoDto>('no-disponible', 'No se pudo crear el pago.')
  return exito(aPagoDto(creado))
}

export async function anularPago(pagoId: string): Promise<ResultadoServicio<PagoDto>> {
  const pago = pgr.obtenerPagoPorId(pagoId)
  if (!pago) return fallo<PagoDto>('no-encontrado', 'No existe el pago indicado.')
  if (pago.estado !== 'REGISTRADO') {
    return fallo<PagoDto>('invalido', 'El pago ya está anulado.')
  }

  // N10: un periodo cerrado congela los pagos.
  const concepto = pgr.obtenerConceptoPorId(pago.conceptoId)
  if (concepto) {
    const errorPeriodo = validarPeriodoEscribible(concepto.periodoId)
    if (errorPeriodo) return fallo<PagoDto>('invalido', errorPeriodo)
  }

  const anulado = pgr.modificarPago(pagoId, { estado: 'ANULADO' })
  if (!anulado) return fallo<PagoDto>('no-disponible', 'No se pudo anular el pago.')
  return exito(aPagoDto(anulado))
}

export async function listarPagosDeAlumno(
  alumnoId: string,
  periodoId?: string,
): Promise<ResultadoServicio<PagoConEntidadDto[]>> {
  if (!acad.obtenerAlumnoPorPersonaId(alumnoId)) {
    return fallo<PagoConEntidadDto[]>('no-encontrado', 'No existe el alumno indicado.')
  }

  const filas = periodoId
    ? pgr.listarPagosDeAlumnoEnPeriodo(alumnoId, periodoId)
    : pgr.listarPagosDeAlumno(alumnoId)

  const dtos: PagoConEntidadDto[] = filas.map((f) =>
    aPagoConEntidadDto(
      f.pagos,
      { nombre: f.conceptos_pago.descripcion, codigo: f.conceptos_pago.codigo },
      nombreDeAlumno(f.pagos.alumnoId),
    ),
  )
  return exito(dtos)
}