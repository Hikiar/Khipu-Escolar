import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import * as s from '../../db/schema.ts'

/**
 * Repositorios del clúster académico: grados, secciones, clases, cursos,
 * asignaciones, periodo, alumnos, docentes y matrículas (regla N1).
 */

export const listarGrados = () =>
  db.select().from(s.grados).orderBy(s.grados.orden, s.grados.nombre).all()

export const obtenerGradoPorId = (id: string) =>
  db.select().from(s.grados).where(eq(s.grados.id, id)).get() ?? null

export const listarSeccionesDeGrado = (gradoId: string) =>
  db.select().from(s.secciones).where(eq(s.secciones.gradoId, gradoId)).all()

export const listarCursos = () => db.select().from(s.cursos).orderBy(s.cursos.nombre).all()

export const obtenerCursoPorId = (id: string) =>
  db.select().from(s.cursos).where(eq(s.cursos.id, id)).get() ?? null

export const listarCursosDeGrado = (gradoId: string) =>
  db
    .select()
    .from(s.cursoGrados)
    .innerJoin(s.cursos, eq(s.cursoGrados.cursoId, s.cursos.id))
    .where(eq(s.cursoGrados.gradoId, gradoId))
    .orderBy(s.cursoGrados.orden, s.cursos.nombre)
    .all()

export const listarClases = () =>
  db
    .select()
    .from(s.clases)
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .innerJoin(s.periodosAcademicos, eq(s.clases.periodoId, s.periodosAcademicos.id))
    .all()

export const obtenerClasePorId = (id: string) =>
  db.select().from(s.clases).where(eq(s.clases.id, id)).get() ?? null

export const listarClasesDePeriodo = (periodoId: string) =>
  db.select().from(s.clases).where(eq(s.clases.periodoId, periodoId)).all()

export const listarAsignacionesDeClase = (claseId: string) =>
  db
    .select()
    .from(s.asignacionCursos)
    .innerJoin(s.cursos, eq(s.asignacionCursos.cursoId, s.cursos.id))
    .where(eq(s.asignacionCursos.claseId, claseId))
    .all()

/** N5: ¿el docente dicta el curso en esa Clase? */
export const tieneAsignacionDocente = (claseId: string, cursoId: string, docenteId: string) =>
  db
    .select({ total: s.asignacionCursos.claseId })
    .from(s.asignacionCursos)
    .where(
      and(
        eq(s.asignacionCursos.claseId, claseId),
        eq(s.asignacionCursos.cursoId, cursoId),
        eq(s.asignacionCursos.docenteId, docenteId),
      ),
    )
    .all().length > 0

/** §13.6: ¿el curso pertenece al plan de estudios del grado de la Clase? */
export const cursoEnPlanDeGrado = (cursoId: string, gradoId: string) =>
  db
    .select({ total: s.cursoGrados.cursoId })
    .from(s.cursoGrados)
    .where(and(eq(s.cursoGrados.cursoId, cursoId), eq(s.cursoGrados.gradoId, gradoId)))
    .all().length > 0

/** I6: matrícula ACTIVA de un alumno en una Clase concreta. */
export const obtenerMatriculaActivaEnClase = (alumnoId: string, claseId: string) =>
  db
    .select()
    .from(s.matriculas)
    .where(
      and(
        eq(s.matriculas.alumnoId, alumnoId),
        eq(s.matriculas.claseId, claseId),
        eq(s.matriculas.estado, 'ACTIVA'),
      ),
    )
    .get() ?? null

export const contarDocenteAsignado = (docenteId: string) =>
  db
    .select({ total: s.asignacionCursos.docenteId })
    .from(s.asignacionCursos)
    .where(eq(s.asignacionCursos.docenteId, docenteId))
    .all().length

export const insertarAlumno = (fila: typeof s.alumnos.$inferInsert) =>
  db.insert(s.alumnos).values(fila).run()

export const listarAlumnos = () =>
  db
    .select()
    .from(s.alumnos)
    .innerJoin(s.personas, eq(s.alumnos.personaId, s.personas.id))
    .orderBy(s.personas.apellidos, s.personas.nombres)
    .all()

export const obtenerAlumnoPorPersonaId = (personaId: string) =>
  db.select().from(s.alumnos).where(eq(s.alumnos.personaId, personaId)).get() ?? null

export const listarAlumnosDeClase = (claseId: string) =>
  db
    .select()
    .from(s.matriculas)
    .innerJoin(s.alumnos, eq(s.matriculas.alumnoId, s.alumnos.personaId))
    .innerJoin(s.personas, eq(s.alumnos.personaId, s.personas.id))
    .where(and(eq(s.matriculas.claseId, claseId), eq(s.matriculas.estado, 'ACTIVA')))
    .orderBy(s.personas.apellidos, s.personas.nombres)
    .all()

export const obtenerPeriodoPorId = (id: string) =>
  db.select().from(s.periodosAcademicos).where(eq(s.periodosAcademicos.id, id)).get() ?? null

export const obtenerPeriodoActivo = () =>
  db.select().from(s.periodosAcademicos).where(eq(s.periodosAcademicos.estado, 'ACTIVO')).all()

export type MatriculaRow = typeof s.matriculas.$inferSelect

/** Matrícula `estado = 'ACTIVA'` de un alumno en un periodo (regla N1). */
export const obtenerMatriculaActivaDeAlumno = (alumnoId: string, periodoId: string) =>
  db
    .select()
    .from(s.matriculas)
    .where(
      and(
        eq(s.matriculas.alumnoId, alumnoId),
        eq(s.matriculas.periodoId, periodoId),
        eq(s.matriculas.estado, 'ACTIVA'),
      ),
    )
    .get() ?? null

export const listarMatriculas = () =>
  db
    .select()
    .from(s.matriculas)
    .innerJoin(s.alumnos, eq(s.matriculas.alumnoId, s.alumnos.personaId))
    .innerJoin(s.personas, eq(s.alumnos.personaId, s.personas.id))
    .innerJoin(s.clases, eq(s.matriculas.claseId, s.clases.id))
    .innerJoin(s.grados, eq(s.clases.gradoId, s.grados.id))
    .innerJoin(s.secciones, eq(s.clases.seccionId, s.secciones.id))
    .orderBy(s.personas.apellidos, s.personas.nombres)
    .all()

export const insertarMatricula = (fila: typeof s.matriculas.$inferInsert) =>
  db.insert(s.matriculas).values(fila).run()

export const anularMatricula = (id: string, retiradoAt: string) =>
  db
    .update(s.matriculas)
    .set({ estado: 'RETIRADA', retiradoAt })
    .where(eq(s.matriculas.id, id))
    .run()

export const eliminarMatricula = (id: string) =>
  db.delete(s.matriculas).where(eq(s.matriculas.id, id)).run()

export const obtenerMatriculaPorId = (id: string) =>
  db.select().from(s.matriculas).where(eq(s.matriculas.id, id)).get() ?? null

export const contarVacantesUsadasDeClase = (claseId: string) =>
  db
    .select({ total: s.matriculas.id })
    .from(s.matriculas)
    .where(and(eq(s.matriculas.claseId, claseId), eq(s.matriculas.estado, 'ACTIVA')))
    .all().length

/** Clases donde el docente tiene AsignacionCurso o es tutor de aula (vista de profesor). */
export const listarClasesDeDocente = (docenteId: string) => {
  const idsPorAsignacion = db
    .select({ claseId: s.asignacionCursos.claseId })
    .from(s.asignacionCursos)
    .where(eq(s.asignacionCursos.docenteId, docenteId))
    .all()
    .map((f) => f.claseId)

  const idsPorTutoria = db
    .select({ claseId: s.clases.id })
    .from(s.clases)
    .where(eq(s.clases.tutorDocenteId, docenteId))
    .all()
    .map((f) => f.claseId)

  const ids = new Set([...idsPorAsignacion, ...idsPorTutoria])
  return listarClases().filter((f) => ids.has(f.clases.id))
}

/** ¿El docente dicta algún curso en esa Clase o es su tutor de aula? (scope N4/N5). */
export const docenteEnClase = (docenteId: string, claseId: string) => {
  const clase = obtenerClasePorId(claseId)
  if (clase?.tutorDocenteId === docenteId) return true
  return (
    db
      .select({ total: s.asignacionCursos.claseId })
      .from(s.asignacionCursos)
      .where(
        and(
          eq(s.asignacionCursos.claseId, claseId),
          eq(s.asignacionCursos.docenteId, docenteId),
        ),
      )
      .all().length > 0
  )
}

/** ¿El alumno tiene matrícula ACTIVA en alguna Clase del docente? (scope de ficha). */
export const alumnoEnClasesDeDocente = (alumnoId: string, docenteId: string) => {
  const matriculas = db
    .select({ claseId: s.matriculas.claseId })
    .from(s.matriculas)
    .where(
      and(eq(s.matriculas.alumnoId, alumnoId), eq(s.matriculas.estado, 'ACTIVA')),
    )
    .all()
  return matriculas.some((m) => docenteEnClase(docenteId, m.claseId))
}