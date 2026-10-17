import { eq } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { obtenerPeriodoActivo, obtenerPeriodoPorId } from '../infra/repos/academicos.ts'

/**
 * Gestión de periodos académicos (N2, N10).
 *
 * N2: existe un único periodo ACTIVO a la vez. Activar uno nuevo cierra el anterior.
 * N10: cerrar un periodo lo congela (solo lectura) para matrículas, asistencia,
 * calificaciones y pagos.
 */

export type EstadoPeriodo = 'PLANIFICADO' | 'ACTIVO' | 'CERRADO'

export interface PeriodoAcademicoDto {
  id: string
  codigo: string
  nombre: string
  fechaInicio?: string
  fechaFin?: string
  estado: string
}

type FilaPeriodo = typeof s.periodosAcademicos.$inferSelect

function aDto(fila: FilaPeriodo): PeriodoAcademicoDto {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    fechaInicio: fila.fechaInicio ?? undefined,
    fechaFin: fila.fechaFin ?? undefined,
    estado: fila.estado,
  }
}

export function listarPeriodos(): ResultadoServicio<PeriodoAcademicoDto[]> {
  const filas = db.select().from(s.periodosAcademicos).orderBy(s.periodosAcademicos.codigo).all()
  return exito(filas.map(aDto))
}

/** Periodo académico ACTIVO actual (o null si no hay ninguno en curso). */
export function obtenerPeriodoActivoDto(): ResultadoServicio<PeriodoAcademicoDto | null> {
  const activos = obtenerPeriodoActivo()
  return exito(activos.length > 0 ? aDto(activos[0]) : null)
}

export interface CrearPeriodoInput {
  codigo: string
  nombre: string
  fechaInicio?: string
  fechaFin?: string
}

export function crearPeriodo(
  input: CrearPeriodoInput,
): ResultadoServicio<PeriodoAcademicoDto> {
  const codigo = input.codigo.trim()
  const nombre = input.nombre.trim()
  if (!codigo) return fallo<PeriodoAcademicoDto>('invalido', 'El código es obligatorio.')
  if (!nombre) return fallo<PeriodoAcademicoDto>('invalido', 'El nombre es obligatorio.')

  const formatoFecha = /^\d{4}-\d{2}-\d{2}$/
  if (input.fechaInicio && !formatoFecha.test(input.fechaInicio)) {
    return fallo<PeriodoAcademicoDto>('invalido', 'fechaInicio debe tener el formato YYYY-MM-DD.')
  }
  if (input.fechaFin && !formatoFecha.test(input.fechaFin)) {
    return fallo<PeriodoAcademicoDto>('invalido', 'fechaFin debe tener el formato YYYY-MM-DD.')
  }
  if (input.fechaInicio && input.fechaFin && input.fechaFin < input.fechaInicio) {
    return fallo<PeriodoAcademicoDto>('invalido', 'fechaFin no puede ser anterior a fechaInicio.')
  }

  const existente = db
    .select()
    .from(s.periodosAcademicos)
    .where(eq(s.periodosAcademicos.codigo, codigo))
    .get()
  if (existente) {
    return fallo<PeriodoAcademicoDto>('invalido', `Ya existe un periodo con código "${codigo}".`)
  }

  const id = `per-${Date.now()}`
  db.insert(s.periodosAcademicos)
    .values({
      id,
      codigo,
      nombre,
      fechaInicio: input.fechaInicio ?? null,
      fechaFin: input.fechaFin ?? null,
      estado: 'PLANIFICADO',
    })
    .run()

  const creado = obtenerPeriodoPorId(id)
  if (!creado) return fallo<PeriodoAcademicoDto>('no-disponible', 'No se pudo crear el periodo.')
  return exito(aDto(creado))
}

/** N2: activa un periodo cerrando el anterior ACTIVO (invariante de única ACTIVE). */
export function activarPeriodo(id: string): ResultadoServicio<PeriodoAcademicoDto> {
  const periodo = obtenerPeriodoPorId(id)
  if (!periodo) return fallo<PeriodoAcademicoDto>('no-encontrado', 'No existe el periodo indicado.')
  if (periodo.estado === 'CERRADO') {
    return fallo<PeriodoAcademicoDto>('invalido', 'No se puede activar un periodo cerrado.')
  }
  if (periodo.estado === 'ACTIVO') {
    return fallo<PeriodoAcademicoDto>('invalido', 'El periodo ya está activo.')
  }

  for (const anterior of obtenerPeriodoActivo()) {
    if (anterior.id !== id) {
      db.update(s.periodosAcademicos)
        .set({ estado: 'CERRADO' })
        .where(eq(s.periodosAcademicos.id, anterior.id))
        .run()
    }
  }

  db.update(s.periodosAcademicos).set({ estado: 'ACTIVO' }).where(eq(s.periodosAcademicos.id, id)).run()
  const actualizado = obtenerPeriodoPorId(id)
  if (!actualizado) return fallo<PeriodoAcademicoDto>('no-disponible', 'No se pudo activar el periodo.')
  return exito(aDto(actualizado))
}

/** N10: cierra un periodo y lo congela (matrículas, asistencia, notas y pagos pasan a solo lectura). */
export function cerrarPeriodo(id: string): ResultadoServicio<PeriodoAcademicoDto> {
  const periodo = obtenerPeriodoPorId(id)
  if (!periodo) return fallo<PeriodoAcademicoDto>('no-encontrado', 'No existe el periodo indicado.')
  if (periodo.estado === 'CERRADO') {
    return fallo<PeriodoAcademicoDto>('invalido', 'El periodo ya está cerrado.')
  }

  db.update(s.periodosAcademicos).set({ estado: 'CERRADO' }).where(eq(s.periodosAcademicos.id, id)).run()
  const actualizado = obtenerPeriodoPorId(id)
  if (!actualizado) return fallo<PeriodoAcademicoDto>('no-disponible', 'No se pudo cerrar el periodo.')
  return exito(aDto(actualizado))
}

/**
 * Guard N10: retorna un mensaje de error si el periodo NO admite escrituras, o null
 * si está abierto (PLANIFICADO / ACTIVO). Debe llamarse antes de mutar
 * matrículas, asistencia, calificaciones o pagos asociados a `periodoId`.
 */
export function validarPeriodoEscribible(periodoId: string): string | null {
  const periodo = obtenerPeriodoPorId(periodoId)
  if (!periodo) return 'El periodo indicado no existe.'
  if (periodo.estado === 'CERRADO') {
    return `El periodo "${periodo.codigo}" está cerrado (solo lectura).`
  }
  return null
}