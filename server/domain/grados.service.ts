import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq, and } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as acad from '../infra/repos/academicos.ts'

/**
 * Servicio de gestión de grados, secciones y clases.
 * Reglas de negocio:
 * - Grado: código único, nombre, nivel, orden.
 * - Sección: pertenece a un grado, nombre único por grado.
 * - Clase: combinación única de (periodo, grado, sección); tiene tutor, estado, vacantes.
 * - No se pueden eliminar grados/secciones con clases asociadas.
 * - Clases solo se pueden crear si no existe la combinación única.
 */

export interface GradoDto {
  id: string
  codigo: string
  nombre: string
  nivel: string
  orden: number
  secciones?: SeccionDto[]
}

export interface SeccionDto {
  id: string
  gradoId: string
  nombre: string
  turno: string
}

export interface ClaseDto {
  id: string
  periodoId: string
  periodoCodigo: string
  gradoId: string
  gradoCodigo: string
  gradoNombre: string
  gradoOrden: number
  nivel: string
  seccionId: string
  seccionNombre: string
  turno: string
  tutorDocenteId?: string
  estado: string
  vacantes: number
}

export interface CrearGradoInput {
  codigo: string
  nombre: string
  nivel: string
  orden?: number
}

export interface ActualizarGradoInput {
  nombre?: string
  nivel?: string
  orden?: number
}

export interface CrearSeccionInput {
  gradoId: string
  nombre: string
  turno?: string
}

export interface ActualizarSeccionInput {
  nombre?: string
  turno?: string
}

export interface CrearClaseInput {
  periodoId: string
  gradoId: string
  seccionId: string
  tutorDocenteId?: string
  vacantes?: number
}

export interface ActualizarClaseInput {
  tutorDocenteId?: string | null
  vacantes?: number
  estado?: string
}

function aGradoDto(g: typeof s.grados.$inferSelect): GradoDto {
  return {
    id: g.id,
    codigo: g.codigo,
    nombre: g.nombre,
    nivel: g.nivel,
    orden: g.orden,
  }
}

function aSeccionDto(sec: typeof s.secciones.$inferSelect): SeccionDto {
  return {
    id: sec.id,
    gradoId: sec.gradoId,
    nombre: sec.nombre,
    turno: sec.turno,
  }
}

function aClaseDto(
  f: ReturnType<typeof acad.listarClases>[number],
): ClaseDto {
  return {
    id: f.clases.id,
    periodoId: f.clases.periodoId,
    periodoCodigo: f.periodos_academicos.codigo,
    gradoId: f.clases.gradoId,
    gradoCodigo: f.grados.codigo,
    gradoNombre: f.grados.nombre,
    gradoOrden: f.grados.orden,
    nivel: f.grados.nivel,
    seccionId: f.clases.seccionId,
    seccionNombre: f.secciones.nombre,
    turno: f.secciones.turno,
    tutorDocenteId: f.clases.tutorDocenteId ?? undefined,
    estado: f.clases.estado,
    vacantes: f.clases.vacantes,
  }
}

// ─────────────────────────── Grados ───────────────────────────

export async function listarGrados(): Promise<ResultadoServicio<GradoDto[]>> {
  return exito(acad.listarGrados().map(aGradoDto))
}

export async function obtenerGrado(
  gradoId: string,
): Promise<ResultadoServicio<GradoDto>> {
  const grado = acad.obtenerGradoPorId(gradoId)
  if (!grado) {
    return fallo<GradoDto>('no-encontrado', `No existe un grado con id "${gradoId}".`)
  }
  return exito(aGradoDto(grado))
}

export async function crearGrado(
  input: CrearGradoInput,
): Promise<ResultadoServicio<GradoDto>> {
  const codigo = input.codigo.trim().toUpperCase()
  const nombre = input.nombre.trim()
  if (!codigo || !nombre) {
    return fallo<GradoDto>('invalido', 'Código y nombre son obligatorios.')
  }

  const existing = db.select().from(s.grados).where(eq(s.grados.codigo, codigo)).get()
  if (existing) {
    return fallo<GradoDto>('invalido', `Ya existe un grado con código "${codigo}".`)
  }

  const id = `grd-${Date.now()}`
  db.insert(s.grados).values({
    id,
    codigo,
    nombre,
    nivel: input.nivel,
    orden: input.orden ?? 0,
  }).run()

  const creado = acad.obtenerGradoPorId(id)
  if (!creado) {
    return fallo<GradoDto>('no-disponible', 'No se pudo crear el grado.')
  }
  return exito(aGradoDto(creado))
}

export async function actualizarGrado(
  gradoId: string,
  input: ActualizarGradoInput,
): Promise<ResultadoServicio<GradoDto>> {
  const grado = acad.obtenerGradoPorId(gradoId)
  if (!grado) {
    return fallo<GradoDto>('no-encontrado', `No existe un grado con id "${gradoId}".`)
  }

  const patch: Partial<typeof s.grados.$inferInsert> = {}
  if (input.nombre) patch.nombre = input.nombre.trim()
  if (input.nivel) patch.nivel = input.nivel
  if (input.orden !== undefined) patch.orden = input.orden
  if (Object.keys(patch).length > 0) {
    db.update(s.grados).set(patch).where(eq(s.grados.id, gradoId)).run()
  }

  const actualizado = acad.obtenerGradoPorId(gradoId)
  if (!actualizado) {
    return fallo<GradoDto>('no-disponible', 'No se pudo actualizar el grado.')
  }
  return exito(aGradoDto(actualizado))
}

export async function desactivarGrado(
  gradoId: string,
): Promise<ResultadoServicio<GradoDto>> {
  const grado = acad.obtenerGradoPorId(gradoId)
  if (!grado) {
    return fallo<GradoDto>('no-encontrado', `No existe un grado con id "${gradoId}".`)
  }

  // No se puede "desactivar" grado, tiene clases asociadas
  const clases = db.select().from(s.clases).where(eq(s.clases.gradoId, gradoId)).all()
  if (clases.length > 0) {
    return fallo<GradoDto>('invalido', 'No se puede eliminar: el grado tiene clases asociadas.')
  }

  db.delete(s.grados).where(eq(s.grados.id, gradoId)).run()
  return exito(aGradoDto(grado))
}

// ─────────────────────────── Secciones ───────────────────────────

export async function listarSeccionesDeGrado(
  gradoId: string,
): Promise<ResultadoServicio<SeccionDto[]>> {
  const grado = acad.obtenerGradoPorId(gradoId)
  if (!grado) {
    return fallo<SeccionDto[]>('no-encontrado', `No existe un grado con id "${gradoId}".`)
  }
  return exito(acad.listarSeccionesDeGrado(gradoId).map(aSeccionDto))
}

export async function crearSeccion(
  input: CrearSeccionInput,
): Promise<ResultadoServicio<SeccionDto>> {
  const grado = acad.obtenerGradoPorId(input.gradoId)
  if (!grado) {
    return fallo<SeccionDto>('no-encontrado', `No existe el grado "${input.gradoId}".`)
  }

  const existing = db.select().from(s.secciones).where(and(eq(s.secciones.gradoId, input.gradoId), eq(s.secciones.nombre, input.nombre))).get()
  if (existing) {
    return fallo<SeccionDto>('invalido', `Ya existe una sección "${input.nombre}" en este grado.`)
  }

  const id = `sec-${Date.now()}`
  db.insert(s.secciones).values({
    id,
    gradoId: input.gradoId,
    nombre: input.nombre.trim(),
    turno: input.turno ?? 'MAÑANA',
  }).run()

  const creada = db.select().from(s.secciones).where(eq(s.secciones.id, id)).get()
  if (!creada) {
    return fallo<SeccionDto>('no-disponible', 'No se pudo crear la sección.')
  }
  return exito(aSeccionDto(creada))
}

export async function actualizarSeccion(
  seccionId: string,
  input: ActualizarSeccionInput,
): Promise<ResultadoServicio<SeccionDto>> {
  const seccion = db.select().from(s.secciones).where(eq(s.secciones.id, seccionId)).get() ?? null
  if (!seccion) {
    return fallo<SeccionDto>('no-encontrado', `No existe una sección con id "${seccionId}".`)
  }

  const patch: Partial<typeof s.secciones.$inferInsert> = {}
  if (input.nombre) patch.nombre = input.nombre.trim()
  if (input.turno) patch.turno = input.turno
  if (Object.keys(patch).length > 0) {
    db.update(s.secciones).set(patch).where(eq(s.secciones.id, seccionId)).run()
  }

  const actualizada = db.select().from(s.secciones).where(eq(s.secciones.id, seccionId)).get()
  if (!actualizada) {
    return fallo<SeccionDto>('no-disponible', 'No se pudo actualizar la sección.')
  }
  return exito(aSeccionDto(actualizada))
}

/** Elimina una sección solo si no tiene clases asociadas. */
export async function eliminarSeccion(
  seccionId: string,
): Promise<ResultadoServicio<SeccionDto>> {
  const seccion = db.select().from(s.secciones).where(eq(s.secciones.id, seccionId)).get() ?? null
  if (!seccion) {
    return fallo<SeccionDto>('no-encontrado', `No existe una sección con id "${seccionId}".`)
  }

  const clases = db.select().from(s.clases).where(eq(s.clases.seccionId, seccionId)).all()
  if (clases.length > 0) {
    return fallo<SeccionDto>('invalido', 'No se puede eliminar: la sección tiene clases asociadas.')
  }

  db.delete(s.secciones).where(eq(s.secciones.id, seccionId)).run()
  return exito(aSeccionDto(seccion))
}

// ─────────────────────────── Clases ───────────────────────────

export async function listarClases(): Promise<ResultadoServicio<ClaseDto[]>> {
  return exito(acad.listarClases().map(aClaseDto))
}

export async function listarClasesDePeriodo(
  periodoId: string,
): Promise<ResultadoServicio<ClaseDto[]>> {
  const all = acad.listarClases().filter(c => c.clases.periodoId === periodoId)
  return exito(all.map(aClaseDto))
}

export async function crearClase(
  input: CrearClaseInput,
): Promise<ResultadoServicio<ClaseDto>> {
  const periodo = acad.obtenerPeriodoPorId(input.periodoId)
  if (!periodo) {
    return fallo<ClaseDto>('no-encontrado', `No existe el periodo "${input.periodoId}".`)
  }
  const grado = acad.obtenerGradoPorId(input.gradoId)
  if (!grado) {
    return fallo<ClaseDto>('no-encontrado', `No existe el grado "${input.gradoId}".`)
  }
  const seccion = db.select().from(s.secciones).where(eq(s.secciones.id, input.seccionId)).get() ?? null
  if (!seccion) {
    return fallo<ClaseDto>('no-encontrado', `No existe la sección "${input.seccionId}".`)
  }

  // Verificar unicidad (periodo, grado, seccion)
  const existing = db.select().from(s.clases).where(and(eq(s.clases.periodoId, input.periodoId), eq(s.clases.gradoId, input.gradoId), eq(s.clases.seccionId, input.seccionId))).get()
  if (existing) {
    return fallo<ClaseDto>('invalido', 'Ya existe una clase con esa combinación (periodo, grado, sección).')
  }

  if (input.tutorDocenteId) {
    const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, input.tutorDocenteId)).get() ?? null
    if (!docente) {
      return fallo<ClaseDto>('no-encontrado', `El docente tutor no existe.`)
    }
  }

  const id = `cla-${Date.now()}`
  db.insert(s.clases).values({
    id,
    periodoId: input.periodoId,
    gradoId: input.gradoId,
    seccionId: input.seccionId,
    tutorDocenteId: input.tutorDocenteId ?? null,
    estado: 'ABIERTA',
    vacantes: input.vacantes ?? 30,
  }).run()

  const creada = acad.obtenerClasePorId(id)
  if (!creada) {
    return fallo<ClaseDto>('no-disponible', 'No se pudo crear la clase.')
  }
  // Need to get full joined data
  const full = acad.listarClases().find(c => c.clases.id === id)
  if (!full) {
    return fallo<ClaseDto>('no-disponible', 'No se pudo crear la clase.')
  }
  return exito(aClaseDto(full))
}

export async function actualizarClase(
  claseId: string,
  input: ActualizarClaseInput,
): Promise<ResultadoServicio<ClaseDto>> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) {
    return fallo<ClaseDto>('no-encontrado', `No existe una clase con id "${claseId}".`)
  }

  const patch: Partial<typeof s.clases.$inferInsert> = {}
  if (input.tutorDocenteId !== undefined) {
    if (input.tutorDocenteId) {
      const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, input.tutorDocenteId)).get() ?? null
      if (!docente) {
        return fallo<ClaseDto>('no-encontrado', `El docente tutor no existe.`)
      }
    }
    patch.tutorDocenteId = input.tutorDocenteId ?? null
  }
  if (input.vacantes !== undefined) patch.vacantes = input.vacantes
  if (input.estado) patch.estado = input.estado
  if (Object.keys(patch).length > 0) {
    db.update(s.clases).set(patch).where(eq(s.clases.id, claseId)).run()
  }

  const actualizada = acad.obtenerClasePorId(claseId)
  if (!actualizada) {
    return fallo<ClaseDto>('no-disponible', 'No se pudo actualizar la clase.')
  }
  const full = acad.listarClases().find(c => c.clases.id === claseId)
  if (!full) {
    return fallo<ClaseDto>('no-disponible', 'No se pudo actualizar la clase.')
  }
  return exito(aClaseDto(full))
}

/** Elimina una clase solo si no tiene actividad académica asociada. */
export async function eliminarClase(
  claseId: string,
): Promise<ResultadoServicio<ClaseDto>> {
  const clase = acad.obtenerClasePorId(claseId)
  if (!clase) {
    return fallo<ClaseDto>('no-encontrado', `No existe una clase con id "${claseId}".`)
  }
  const full = acad.listarClases().find((c) => c.clases.id === claseId)
  if (!full) {
    return fallo<ClaseDto>('no-disponible', 'No se pudo leer la clase.')
  }

  const conActividad =
    db.select().from(s.matriculas).where(eq(s.matriculas.claseId, claseId)).all().length +
    db.select().from(s.asistencias).where(eq(s.asistencias.claseId, claseId)).all().length +
    db.select().from(s.asignacionCursos).where(eq(s.asignacionCursos.claseId, claseId)).all().length +
    db.select().from(s.trabajosEvaluacion).where(eq(s.trabajosEvaluacion.claseId, claseId)).all().length +
    db.select().from(s.examenesCurso).where(eq(s.examenesCurso.claseId, claseId)).all().length
  if (conActividad > 0) {
    return fallo<ClaseDto>(
      'invalido',
      'No se puede eliminar: la clase tiene matrículas, asistencia, notas o asignaciones.',
    )
  }

  db.delete(s.clases).where(eq(s.clases.id, claseId)).run()
  return exito(aClaseDto(full))
}

export interface CrearGradoInput {
  codigo: string
  nombre: string
  nivel: string
  orden?: number
}

export interface ActualizarGradoInput {
  nombre?: string
  nivel?: string
  orden?: number
}

export interface CrearSeccionInput {
  gradoId: string
  nombre: string
  turno?: string
}

export interface ActualizarSeccionInput {
  nombre?: string
  turno?: string
}

export interface CrearClaseInput {
  periodoId: string
  gradoId: string
  seccionId: string
  tutorDocenteId?: string
  vacantes?: number
}

export interface ActualizarClaseInput {
  tutorDocenteId?: string | null
  vacantes?: number
  estado?: string
}