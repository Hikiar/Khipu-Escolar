import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import { exito, fallo, paginar, type ListadoConTotal, type Paginacion, type ResultadoServicio } from '../../shared/types/operations.ts'
import * as acad from '../infra/repos/academicos.ts'
import * as rbac from '../infra/repos/rbac.ts'
import { generarCodigoInstitucional } from './codigos.service.ts'

type AlumnoRow = typeof s.alumnos.$inferSelect
type PersonaRow = typeof s.personas.$inferSelect

/**
 * Servicio de gestión de alumnos.
 * Reglas de negocio:
 * - Un alumno está vinculado a una Persona (1:1 por personaId).
 * - El alta requiere Persona existente y DNI único (en persona).
 * - El código institucional se genera automáticamente (E) y es permanente.
 * - La edición permite actualizar datos de Persona y estado.
 * - Desactivar = estado 'INACTIVO' (no borrado lógico).
 * - Eliminar no está permitido si tiene matrículas, apoderados o asistencias/calificaciones.
 */

export interface AlumnoDto {
  id: string // personaId
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  codigoInstitucional: string
  ingresoAt?: string
  estado: 'ACTIVO' | 'INACTIVO'
}

export interface CrearAlumnoInput {
  dni: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  ingresoAt?: string
}

export interface ActualizarAlumnoInput {
  dni?: string
  nombres?: string
  apellidos?: string
  correo?: string
  telefono?: string
  estado?: 'ACTIVO' | 'INACTIVO'
}

function aAlumnoDto(
  alumno: AlumnoRow,
  persona: PersonaRow | null,
): AlumnoDto {
  return {
    id: alumno.personaId,
    dni: persona?.dni ?? '',
    nombres: persona?.nombres ?? '',
    apellidos: persona?.apellidos ?? '',
    correo: persona?.correo ?? undefined,
    telefono: persona?.telefono ?? undefined,
    codigoInstitucional: persona?.codigoInstitucional ?? '',
    ingresoAt: alumno.ingresoAt ?? undefined,
    estado: alumno.estado as 'ACTIVO' | 'INACTIVO',
  }
}

export async function listarAlumnos(
  estado?: 'ACTIVO' | 'INACTIVO',
  paginacion?: Paginacion,
): Promise<ResultadoServicio<AlumnoDto[] | ListadoConTotal<AlumnoDto>>> {
  const filas = acad.listarAlumnos()
  const data = filas
    .filter((f) => !estado || f.alumnos.estado === estado)
    .map((f) => aAlumnoDto(f.alumnos, f.personas))
  return exito(paginacion ? paginar(data, data.length, paginacion) : data)
}

export async function obtenerAlumno(
  alumnoId: string,
): Promise<ResultadoServicio<AlumnoDto>> {
  const fila = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!fila) {
    return fallo<AlumnoDto>('no-encontrado', `No existe un alumno con id "${alumnoId}".`)
  }
  const persona = rbac.obtenerPersonaPorId(alumnoId)
  return exito(aAlumnoDto(fila, persona))
}

export async function crearAlumno(
  input: CrearAlumnoInput,
): Promise<ResultadoServicio<AlumnoDto>> {
  const dni = input.dni.trim()
  const nombres = input.nombres.trim()
  const apellidos = input.apellidos.trim()
  if (!dni || !nombres || !apellidos) {
    return fallo<AlumnoDto>('invalido', 'DNI, nombres y apellidos son obligatorios.')
  }

  const personaExistente = rbac.obtenerPersonaPorDni(dni)
  if (personaExistente) {
    return fallo<AlumnoDto>('invalido', `Ya existe una persona con DNI "${dni}".`)
  }

  const personaId = `per-${Date.now()}`
  rbac.insertarPersona({
    id: personaId,
    dni,
    codigoInstitucional: generarCodigoInstitucional('E'),
    nombres,
    apellidos,
    correo: input.correo?.trim() ?? null,
    telefono: input.telefono?.trim() ?? null,
    fechaNacimiento: null,
    sexo: null,
    direccion: null,
  })

  acad.insertarAlumno({
    personaId,
    ingresoAt: input.ingresoAt ?? new Date().toISOString(),
    estado: 'ACTIVO',
  })

  const creado = acad.obtenerAlumnoPorPersonaId(personaId)
  const persona = rbac.obtenerPersonaPorId(personaId)
  if (!creado || !persona) {
    return fallo<AlumnoDto>('no-disponible', 'No se pudo crear el alumno.')
  }
  return exito(aAlumnoDto(creado, persona))
}

export async function actualizarAlumno(
  alumnoId: string,
  input: ActualizarAlumnoInput,
): Promise<ResultadoServicio<AlumnoDto>> {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!alumno) {
    return fallo<AlumnoDto>('no-encontrado', `No existe un alumno con id "${alumnoId}".`)
  }
  const persona = rbac.obtenerPersonaPorId(alumnoId)
  if (!persona) {
    return fallo<AlumnoDto>('no-encontrado', 'Persona asociada no encontrada.')
  }

  // Validate DNI uniqueness if changing
  if (input.dni && input.dni !== persona.dni) {
    const exists = rbac.obtenerPersonaPorDni(input.dni)
    if (exists) {
      return fallo<AlumnoDto>('invalido', `El DNI "${input.dni}" ya está en uso.`)
    }
  }

  const personaPatch: Partial<typeof s.personas.$inferInsert> = {}
  if (input.dni) personaPatch.dni = input.dni.trim()
  if (input.nombres) personaPatch.nombres = input.nombres.trim()
  if (input.apellidos) personaPatch.apellidos = input.apellidos.trim()
  if (input.correo !== undefined) personaPatch.correo = input.correo?.trim() ?? null
  if (input.telefono !== undefined) personaPatch.telefono = input.telefono?.trim() ?? null
  if (Object.keys(personaPatch).length > 0) {
    rbac.actualizarPersona(alumnoId, personaPatch)
  }

  const alumnoPatch: Partial<typeof s.alumnos.$inferInsert> = {}
  if (input.estado) alumnoPatch.estado = input.estado
  if (Object.keys(alumnoPatch).length > 0) {
    db.update(s.alumnos).set(alumnoPatch).where(eq(s.alumnos.personaId, alumnoId)).run()
  }

  const actualizado = acad.obtenerAlumnoPorPersonaId(alumnoId)
  const personaActualizada = rbac.obtenerPersonaPorId(alumnoId)
  if (!actualizado || !personaActualizada) {
    return fallo<AlumnoDto>('no-disponible', 'No se pudo actualizar el alumno.')
  }
  return exito(aAlumnoDto(actualizado, personaActualizada))
}

export async function desactivarAlumno(
  alumnoId: string,
): Promise<ResultadoServicio<AlumnoDto>> {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!alumno) {
    return fallo<AlumnoDto>('no-encontrado', `No existe un alumno con id "${alumnoId}".`)
  }
  if (alumno.estado === 'INACTIVO') {
    return fallo<AlumnoDto>('invalido', 'El alumno ya está inactivo.')
  }

  // Verificar restricciones: matrículas activas, apoderados, etc.
  const allMatriculas = acad.listarMatriculas().filter(m => m.matriculas.alumnoId === alumnoId && m.matriculas.estado === 'ACTIVA')
  if (allMatriculas.length > 0) {
    return fallo<AlumnoDto>('invalido', 'No se puede desactivar: el alumno tiene matrículas activas.')
  }

  // Check apoderados
  const apods = db.select().from(s.alumnoApoderados).where(eq(s.alumnoApoderados.alumnoId, alumnoId)).all()
  if (apods.length > 0) {
    return fallo<AlumnoDto>('invalido', 'No se puede desactivar: el alumno tiene apoderados registrados.')
  }

  db.update(s.alumnos).set({ estado: 'INACTIVO' }).where(eq(s.alumnos.personaId, alumnoId)).run()
  const actualizado = acad.obtenerAlumnoPorPersonaId(alumnoId)
  const persona = rbac.obtenerPersonaPorId(alumnoId)
  if (!actualizado || !persona) {
    return fallo<AlumnoDto>('no-disponible', 'No se pudo desactivar el alumno.')
  }
  return exito(aAlumnoDto(actualizado, persona))
}

/** Vuelve a ACTIVO un alumno desactivado (los datos históricos se conservan). */
export async function reactivarAlumno(
  alumnoId: string,
): Promise<ResultadoServicio<AlumnoDto>> {
  const alumno = acad.obtenerAlumnoPorPersonaId(alumnoId)
  if (!alumno) {
    return fallo<AlumnoDto>('no-encontrado', `No existe un alumno con id "${alumnoId}".`)
  }
  if (alumno.estado === 'ACTIVO') {
    return fallo<AlumnoDto>('invalido', 'El alumno ya está activo.')
  }

  db.update(s.alumnos).set({ estado: 'ACTIVO' }).where(eq(s.alumnos.personaId, alumnoId)).run()
  const actualizado = acad.obtenerAlumnoPorPersonaId(alumnoId)
  const persona = rbac.obtenerPersonaPorId(alumnoId)
  if (!actualizado || !persona) {
    return fallo<AlumnoDto>('no-disponible', 'No se pudo reactivar el alumno.')
  }
  return exito(aAlumnoDto(actualizado, persona))
}

