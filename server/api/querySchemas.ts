import { z } from 'zod'

/**
 * Esquemas zod de los query params (GET). Los handlers validan con el
 * middleware `validarQuery` antes de leer `req.query`.
 */

const idParam = z
  .string()
  .transform((v) => (v.trim() === '' ? undefined : v))
  .optional()

export const idObligatorio = z.string().min(1, 'El parámetro es obligatorio.')

const fechaParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.')
  .optional()

export const flagTrue = z.enum(['1', 'true']).optional()

export const estadoActivoParam = z.enum(['ACTIVO', 'INACTIVO']).optional()

export const queryAlumnos = z.object({
  estado: estadoActivoParam,
  pagina: z.coerce.number().int().min(1).optional(),
  limite: z.coerce.number().int().min(1).max(200).optional(),
})

export const queryDocentes = z.object({
  estado: estadoActivoParam,
  pagina: z.coerce.number().int().min(1).optional(),
  limite: z.coerce.number().int().min(1).max(200).optional(),
})

export const queryCursos = z.object({
  activos: z.enum(['true', 'false', '1', '0']).optional(),
})

export const queryPagosConceptos = z.object({
  periodoId: idObligatorio,
})

export const queryPagos = z.object({
  alumnoId: idObligatorio,
  periodoId: idParam,
})

export const queryTrabajos = z.object({
  claseId: z.string().min(1, 'El parámetro claseId es obligatorio.'),
  competenciaCursoId: idParam,
})

export const queryExamenes = z.object({
  claseId: z.string().min(1, 'El parámetro claseId es obligatorio.'),
})

export const queryAsistencia = z.object({
  claseId: z.string().min(1, 'El parámetro claseId es obligatorio.'),
  cursoId: idParam,
  fecha: fechaParam,
})

export const queryMatriculas = z.object({
  claseId: z.string().min(1, 'El parámetro claseId es obligatorio.'),
  todas: flagTrue,
})

export const queryResultados = z.object({
  claseId: z.string().min(1, 'El parámetro claseId es obligatorio.'),
  cursoId: z.string().min(1, 'El parámetro cursoId es obligatorio.'),
})

export const queryAsignaciones = z.object({
  claseId: idParam,
  docenteId: idParam,
})

export const queryClasesCatalogo = z.object({
  docenteId: idParam,
  periodoId: idParam,
  abiertas: flagTrue,
})

export const queryClaseCurso = z.object({
  cursoId: idObligatorio,
})

export const queryReportesMatriculas = z.object({
  periodoId: idParam,
})

export const queryReportesAsistencia = z.object({
  claseId: idParam,
  cursoId: idParam,
  fechaDesde: fechaParam,
  fechaHasta: fechaParam,
})

export const queryReportesEvaluacion = z.object({
  claseId: idParam,
  cursoId: idParam,
})

export const queryReportesPagos = z.object({
  periodoId: idParam,
})

export const queryConfiguraciones = z.object({
  cursoId: idParam,
  gradoId: idParam,
  periodoId: idParam,
})