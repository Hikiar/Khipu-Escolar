import { db } from '../db/client.ts'
import * as s from '../db/schema.ts'
import { eq, and, inArray } from 'drizzle-orm'
import { exito, fallo, type ResultadoServicio } from '../../shared/types/operations.ts'

/**
 * Servicio de gestión de Asignaciones de Curso (AsignacionCurso).
 * Relación N-M entre Docente, Curso y Clase.
 * PK compuesta: (claseId, cursoId, docenteId)
 */

export interface AsignacionCursoDto {
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

export interface AsignacionSimpleDto {
  claseId: string
  cursoId: string
  docenteId: string
}

export interface AsignacionMasivaDto {
  claseId: string
  docenteId: string
  registrados: number
  omitidos: number
}

function aAsignacionDto(
  f: {
    asignacion_cursos: typeof s.asignacionCursos.$inferSelect
    cursos: typeof s.cursos.$inferSelect
    docentes: typeof s.docentes.$inferSelect
    personas: typeof s.personas.$inferSelect
    clases: typeof s.clases.$inferSelect
    grados: typeof s.grados.$inferSelect
    secciones: typeof s.secciones.$inferSelect
    periodos_academicos: typeof s.periodosAcademicos.$inferSelect
  }
): AsignacionCursoDto {
  return {
    claseId: f.asignacion_cursos.claseId,
    cursoId: f.asignacion_cursos.cursoId,
    docenteId: f.asignacion_cursos.docenteId,
    curso: {
      id: f.cursos.id,
      codigo: f.cursos.codigo,
      nombre: f.cursos.nombre,
    },
    docente: {
      id: f.docentes.personaId,
      dni: f.personas.dni,
      nombres: f.personas.nombres,
      apellidos: f.personas.apellidos,
    },
    clase: {
      id: f.clases.id,
      gradoNombre: f.grados.nombre,
      seccionNombre: f.secciones.nombre,
      periodoCodigo: f.periodos_academicos.codigo,
    },
  }
}

export async function listarAsignaciones(): Promise<ResultadoServicio<AsignacionCursoDto[]>> {
  const filas = db
    .select()
    .from(s.asignacionCursos)
    .innerJoin(s.cursos, eq(s.asignacionCursos.cursoId, s.cursos.id))
    .innerJoin(s.docentes, eq(s.asignacionCursos.docenteId, s.docentes.personaId))
    .innerJoin(s.personas, eq(s.docentes.personaId, s.personas.id))
    .innerJoin(s.clases, eq(s.asignacionCursos.claseId, s.clases.id))
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .innerJoin(s.periodosAcademicos, eq(s.clases.periodoId, s.periodosAcademicos.id))
    .all()

  return exito(filas.map(aAsignacionDto))
}

export async function listarAsignacionesDeClase(
  claseId: string,
): Promise<ResultadoServicio<AsignacionCursoDto[]>> {
  const clase = db.select().from(s.clases).where(eq(s.clases.id, claseId)).get()
  if (!clase) {
    return fallo<AsignacionCursoDto[]>('no-encontrado', `No existe una clase con id "${claseId}".`)
  }

  const filas = db
    .select()
    .from(s.asignacionCursos)
    .innerJoin(s.cursos, eq(s.asignacionCursos.cursoId, s.cursos.id))
    .innerJoin(s.docentes, eq(s.asignacionCursos.docenteId, s.docentes.personaId))
    .innerJoin(s.personas, eq(s.docentes.personaId, s.personas.id))
    .innerJoin(s.clases, eq(s.asignacionCursos.claseId, s.clases.id))
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .innerJoin(s.periodosAcademicos, eq(s.clases.periodoId, s.periodosAcademicos.id))
    .where(eq(s.asignacionCursos.claseId, claseId))
    .all()

  return exito(filas.map(aAsignacionDto))
}

export async function listarAsignacionesDeDocente(
  docenteId: string,
): Promise<ResultadoServicio<AsignacionCursoDto[]>> {
  const filas = db
    .select()
    .from(s.asignacionCursos)
    .innerJoin(s.cursos, eq(s.asignacionCursos.cursoId, s.cursos.id))
    .innerJoin(s.docentes, eq(s.asignacionCursos.docenteId, s.docentes.personaId))
    .innerJoin(s.personas, eq(s.docentes.personaId, s.personas.id))
    .innerJoin(s.clases, eq(s.asignacionCursos.claseId, s.clases.id))
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .innerJoin(s.periodosAcademicos, eq(s.clases.periodoId, s.periodosAcademicos.id))
    .where(eq(s.asignacionCursos.docenteId, docenteId))
    .all()

  return exito(filas.map(aAsignacionDto))
}

export async function obtenerAsignacion(
  claseId: string,
  cursoId: string,
  docenteId: string,
): Promise<ResultadoServicio<AsignacionCursoDto>> {
  const fila = db
    .select()
    .from(s.asignacionCursos)
    .innerJoin(s.cursos, eq(s.asignacionCursos.cursoId, s.cursos.id))
    .innerJoin(s.docentes, eq(s.asignacionCursos.docenteId, s.docentes.personaId))
    .innerJoin(s.personas, eq(s.docentes.personaId, s.personas.id))
    .innerJoin(s.clases, eq(s.asignacionCursos.claseId, s.clases.id))
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .innerJoin(s.periodosAcademicos, eq(s.clases.periodoId, s.periodosAcademicos.id))
    .where(
      and(
        eq(s.asignacionCursos.claseId, claseId),
        eq(s.asignacionCursos.cursoId, cursoId),
        eq(s.asignacionCursos.docenteId, docenteId),
      ),
    )
    .get()

  if (!fila) {
    return fallo<AsignacionCursoDto>('no-encontrado', 'No existe la asignación indicada.')
  }
  return exito(aAsignacionDto(fila))
}

export async function crearAsignacion(
  input: CrearAsignacionInput,
): Promise<ResultadoServicio<AsignacionCursoDto>> {
  const { claseId, cursoId, docenteId } = input

  // Validar existencia de entidades
  const clase = db.select().from(s.clases).where(eq(s.clases.id, claseId)).get()
  if (!clase) {
    return fallo<AsignacionCursoDto>('no-encontrado', `No existe la clase "${claseId}".`)
  }

  const curso = db.select().from(s.cursos).where(eq(s.cursos.id, cursoId)).get()
  if (!curso) {
    return fallo<AsignacionCursoDto>('no-encontrado', `No existe el curso "${cursoId}".`)
  }

  const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get()
  if (!docente) {
    return fallo<AsignacionCursoDto>('no-encontrado', `No existe el docente "${docenteId}".`)
  }
  if (docente.estado !== 'ACTIVO') {
    return fallo<AsignacionCursoDto>('invalido', 'El docente está inactivo.')
  }

  // Realidad peruana: solo se puede asignar un docente cuyo título/habilitación
  // cubra el nivel del grado de la clase (separación Inicial/Primaria/Secundaria).
  const grado = db.select().from(s.grados).where(eq(s.grados.id, clase.gradoId)).get()
  const nivelHabilitado = grado
    ? db
        .select({ nivel: s.docenteNiveles.nivel })
        .from(s.docenteNiveles)
        .where(
          and(
            eq(s.docenteNiveles.docenteId, docenteId),
            eq(s.docenteNiveles.nivel, grado.nivel),
          ),
        )
        .get()
    : undefined
  if (!nivelHabilitado) {
    const nombreNivel =
      grado?.nivel === 'INICIAL' ? 'Inicial' : grado?.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'
    return fallo<AsignacionCursoDto>(
      'invalido',
      `El docente no está habilitado para dictar en nivel ${nombreNivel}. Su título es de otro nivel.`,
    )
  }

  // Verificar que el curso pertenece al plan del grado de la clase
  if (!db
    .select()
    .from(s.cursoGrados)
    .where(
      and(
        eq(s.cursoGrados.cursoId, cursoId),
        eq(s.cursoGrados.gradoId, clase.gradoId),
      ),
    ).get()) {
    return fallo<AsignacionCursoDto>('invalido', 'El curso no pertenece al plan de estudios del grado de la clase.')
  }

  // Verificar que no exista ya la asignación
  const existente = db
    .select()
    .from(s.asignacionCursos)
    .where(
      and(
        eq(s.asignacionCursos.claseId, claseId),
        eq(s.asignacionCursos.cursoId, cursoId),
        eq(s.asignacionCursos.docenteId, docenteId),
      ),
    )
    .get()

  if (existente) {
    return fallo<AsignacionCursoDto>('invalido', 'Ya existe esta asignación (docente, curso, clase).')
  }

  // Crear asignación
  db.insert(s.asignacionCursos).values({
    claseId,
    cursoId,
    docenteId,
  }).run()

  return obtenerAsignacion(claseId, cursoId, docenteId)
}

export async function eliminarAsignacion(
  claseId: string,
  cursoId: string,
  docenteId: string,
): Promise<ResultadoServicio<void>> {
  const existente = db
    .select()
    .from(s.asignacionCursos)
    .where(
      and(
        eq(s.asignacionCursos.claseId, claseId),
        eq(s.asignacionCursos.cursoId, cursoId),
        eq(s.asignacionCursos.docenteId, docenteId),
      ),
    )
    .get()

  if (!existente) {
    return fallo<void>('no-encontrado', 'No existe la asignación indicada.')
  }

  // Verificar si hay trabajos asociados a esta clase+curso (via competencias)
  const config = db
    .select()
    .from(s.configuracionesEvaluacionCurso)
    .where(
      and(
        eq(s.configuracionesEvaluacionCurso.cursoId, cursoId),
        eq(s.configuracionesEvaluacionCurso.gradoId, 
          db.select({ gradoId: s.clases.gradoId }).from(s.clases).where(eq(s.clases.id, claseId)).get()?.gradoId ?? ''
        ),
      ),
    )
    .get()

  if (config) {
    const competenciaIds = db
      .select({ id: s.competenciasCurso.id })
      .from(s.competenciasCurso)
      .where(eq(s.competenciasCurso.configuracionEvaluacionCursoId, config.id))
      .all()
      .map((c) => c.id)

    if (competenciaIds.length > 0) {
      const trabajos = db
        .select()
        .from(s.trabajosEvaluacion)
        .where(
          and(
            eq(s.trabajosEvaluacion.claseId, claseId),
            inArray(s.trabajosEvaluacion.competenciaCursoId, competenciaIds),
          ),
        )
        .all()

      if (trabajos.length > 0) {
        return fallo<void>('invalido', 'No se puede eliminar: hay trabajos asociados a esta asignación.')
      }
    }
  }

  db.delete(s.asignacionCursos)
    .where(
      and(
        eq(s.asignacionCursos.claseId, claseId),
        eq(s.asignacionCursos.cursoId, cursoId),
        eq(s.asignacionCursos.docenteId, docenteId),
      ),
    )
    .run()

  return exito(undefined)
}

/**
 * Asigna a un docente TODOS los cursos del plan de estudios del grado de la clase
 * que aún no tengan docente asignado. Pensado para el tutor generalista de Primaria
 * (dicta todos los cursos) sin pisar a los especialistas ya asignados (Inglés, EF…).
 */
export async function asignarTodosLosCursosDeClase(
  claseId: string,
  docenteId: string,
): Promise<ResultadoServicio<AsignacionMasivaDto>> {
  const clase = db.select().from(s.clases).where(eq(s.clases.id, claseId)).get()
  if (!clase) {
    return fallo<AsignacionMasivaDto>('no-encontrado', `No existe la clase "${claseId}".`)
  }

  const docente = db.select().from(s.docentes).where(eq(s.docentes.personaId, docenteId)).get()
  if (!docente) {
    return fallo<AsignacionMasivaDto>('no-encontrado', `No existe el docente "${docenteId}".`)
  }
  if (docente.estado !== 'ACTIVO') {
    return fallo<AsignacionMasivaDto>('invalido', 'El docente está inactivo.')
  }

  const grado = db.select().from(s.grados).where(eq(s.grados.id, clase.gradoId)).get()
  const nivelHabilitado = grado
    ? db
        .select({ nivel: s.docenteNiveles.nivel })
        .from(s.docenteNiveles)
        .where(
          and(
            eq(s.docenteNiveles.docenteId, docenteId),
            eq(s.docenteNiveles.nivel, grado.nivel),
          ),
        )
        .get()
    : undefined
  if (!nivelHabilitado) {
    const nombreNivel =
      grado?.nivel === 'INICIAL' ? 'Inicial' : grado?.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'
    return fallo<AsignacionMasivaDto>(
      'invalido',
      `El docente no está habilitado para dictar en nivel ${nombreNivel}. Su título es de otro nivel.`,
    )
  }

  const cursosDelPlan = db
    .select({ cursoId: s.cursoGrados.cursoId })
    .from(s.cursoGrados)
    .where(eq(s.cursoGrados.gradoId, clase.gradoId))
    .all()

  let registrados = 0
  let omitidos = 0
  for (const { cursoId } of cursosDelPlan) {
    const yaTieneDocente = db
      .select()
      .from(s.asignacionCursos)
      .where(
        and(
          eq(s.asignacionCursos.claseId, claseId),
          eq(s.asignacionCursos.cursoId, cursoId),
        ),
      )
      .get()
    if (yaTieneDocente) {
      omitidos += 1
      continue
    }
    db.insert(s.asignacionCursos).values({ claseId, cursoId, docenteId }).run()
    registrados += 1
  }

  return exito({ claseId, docenteId, registrados, omitidos })
}