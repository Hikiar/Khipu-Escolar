import { z } from 'zod'

/** POST /api/auth/login */
export const credencialesSchema = z.object({
  codigo: z.string().trim().min(1, 'El código institucional es obligatorio.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
})

/** POST /api/auth/demo */
export const loginDemoSchema = z.object({
  rolId: z.string().min(1, 'El id del rol es obligatorio.'),
})

/** POST /api/auth/validar y POST /api/auth/logout */
export const tokenSesionSchema = z.object({
  token: z.string().min(1, 'El token es obligatorio.'),
})

/** POST /api/auth/cambiar-contrasena (mi perfil, sesión activa). */
export const cambiarContrasenaSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es obligatoria.'),
  passwordNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
})

/** POST /api/roles */
export const crearRolSchema = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().optional(),
  permisos: z.array(z.string()).default([]),
})

/** PATCH /api/roles/:id */
export const actualizarRolSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
})

/** PUT /api/roles/:id/permisos */
export const permisosSchema = z.object({
  permisos: z.array(z.string()),
})

/** POST /api/usuarios — alta de cuenta: crea/usuario sobre persona (por DNI) y asigna rol(es). */
export const crearUsuarioSchema = z.object({
  dni: z.string().trim().min(1, 'El DNI es obligatorio.'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.'),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.'),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  rolIds: z.array(z.string()),
  password: z.string().min(1).optional(),
})

/** PUT /api/usuarios/:id/roles */
export const asignarRolesSchema = z.object({
  rolIds: z.array(z.string()),
})

// ───────────────────────────── Evaluación ─────────────────────────────

const notaSchema = z
  .number({ message: 'La nota debe ser numérica.' })
  .min(0, 'La nota mínima es 0.')
  .max(20, 'La nota máxima es 20.')
  .refine((n) => Math.round(n * 100) === n * 100, {
    message: 'La nota admite hasta 2 decimales.',
  })

/** POST /api/trabajos */
export const crearTrabajoSchema = z.object({
  claseId: z.string().min(1, 'La clase es obligatoria.'),
  competenciaCursoId: z.string().min(1, 'La competencia es obligatoria.'),
  nombre: z.string().trim().min(1, 'El nombre del trabajo es obligatorio.'),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
})

/** PATCH /api/trabajos/:id */
export const actualizarTrabajoSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
  activo: z.boolean().optional(),
})

/** POST /api/trabajos/:trabajoId/calificaciones */
export const registrarCalificacionTrabajoSchema = z.object({
  trabajoEvaluacionId: z.string().min(1),
  alumnoId: z.string().min(1),
  nota: notaSchema,
  observaciones: z.string().optional(),
})

/** POST /api/examenes */
export const crearExamenSchema = z.object({
  claseId: z.string().min(1, 'La clase es obligatoria.'),
  configuracionEvaluacionCursoId: z.string().min(1, 'La configuración es obligatoria.'),
  nombre: z.string().trim().min(1, 'El nombre del examen es obligatorio.'),
  fecha: z.string().optional(),
})

/** PATCH /api/examenes/:id */
const estadoExamenSchema = z.enum(['ACTIVO', 'INACTIVO'], {
  message: 'El estado debe ser ACTIVO o INACTIVO.',
})

export const actualizarExamenSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  fecha: z.string().optional(),
  estado: estadoExamenSchema.optional(),
})

/** POST /api/examenes/:examenId/calificaciones */
export const registrarCalificacionExamenSchema = z.object({
  examenCursoId: z.string().min(1),
  alumnoId: z.string().min(1),
  nota: notaSchema,
  observaciones: z.string().optional(),
})

// ───────────────────────────── Matrículas ─────────────────────────────

/** POST /api/matriculas */
export const registrarMatriculaSchema = z.object({
  alumnoId: z.string().min(1, 'El alumno es obligatorio.'),
  claseId: z.string().min(1, 'La clase es obligatoria.'),
  periodoId: z.string().min(1, 'El periodo es obligatorio.'),
  observaciones: z.string().optional(),
})

// ───────────────────────────── Asistencia ─────────────────────────────

const estadoAsistenciaSchema = z.enum(['PRESENTE', 'TARDE', 'FALTA', 'JUSTIFICADO'], {
  message: 'El estado debe ser PRESENTE, TARDE, FALTA o JUSTIFICADO.',
})

const fechaSchema = z
  .string({ message: 'La fecha debe ser texto.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.')

const detalleAsistenciaSchema = z.object({
  alumnoId: z.string().min(1, 'El alumno es obligatorio.'),
  estado: estadoAsistenciaSchema,
  horaEntrada: z.string().optional(),
  horaSalida: z.string().optional(),
  observaciones: z.string().optional(),
})

/** POST /api/asistencia */
export const registrarAsistenciaSchema = z.object({
  claseId: z.string().min(1, 'La clase es obligatoria.'),
  // Ausente/undefined = asistencia general de AULA; presente = asistencia de CURSO.
  cursoId: z.string().min(1, 'El curso no es válido.').optional(),
  fecha: fechaSchema,
  observaciones: z.string().optional(),
  detalles: z.array(detalleAsistenciaSchema).min(1, 'Debe indicar al menos un alumno.'),
})

/** PUT /api/asistencia/:id */
export const actualizarAsistenciaSchema = z.object({
  observaciones: z.string().optional(),
  detalles: z.array(detalleAsistenciaSchema).min(1, 'Debe indicar al menos un alumno.'),
})

// ───────────────────────────── Pagos ─────────────────────────────

const fechaSchemaPago = z
  .string({ message: 'La fecha debe ser texto.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.')

const montoSchema = z
  .number({ message: 'El monto debe ser numérico.' })
  .positive('El monto debe ser mayor a 0.')
  .refine((n) => Math.round(n * 100) === n * 100, {
    message: 'El monto admite hasta 2 decimales.',
  })

const metodoPagoSchema = z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'], {
  message: 'El método de pago debe ser EFECTIVO, TRANSFERENCIA o TARJETA.',
})

/** POST /api/pagos */
export const registrarPagoSchema = z.object({
  alumnoId: z.string().min(1, 'El alumno es obligatorio.'),
  conceptoId: z.string().min(1, 'El concepto es obligatorio.'),
  monto: montoSchema,
  metodoPago: metodoPagoSchema,
  fecha: fechaSchemaPago,
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
})

// ───────────────────── Conceptos de pago (cronograma) ─────────────────────

const tipoConceptoSchema = z.enum(['MATRICULA', 'PENSION', 'OTRO'], {
  message: 'El tipo debe ser MATRICULA, PENSION u OTRO.',
})

const montoBaseSchema = z
  .number({ message: 'El monto base debe ser numérico.' })
  .min(0, 'El monto base no puede ser negativo.')
  .refine((n) => Math.round(n * 100) === n * 100, {
    message: 'El monto base admite hasta 2 decimales.',
  })

const fechaVencimientoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de vencimiento debe tener el formato YYYY-MM-DD.')

/** POST /api/pagos/conceptos */
export const crearConceptoPagoSchema = z.object({
  periodoId: z.string().min(1, 'El periodo es obligatorio.'),
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria.'),
  tipo: tipoConceptoSchema,
  montoBase: montoBaseSchema,
  fechaVencimiento: fechaVencimientoSchema.optional(),
  obligatorio: z.boolean().optional(),
})

/** PATCH /api/pagos/conceptos/:id  (periodoId NO editable — D-P14-4) */
export const actualizarConceptoPagoSchema = z.object({
  codigo: z.string().trim().min(1).optional(),
  descripcion: z.string().trim().min(1).optional(),
  tipo: tipoConceptoSchema.optional(),
  montoBase: montoBaseSchema.optional(),
  fechaVencimiento: fechaVencimientoSchema.nullable().optional(),
  obligatorio: z.boolean().optional(),
})

// ───────────────────────────── Alumnos ─────────────────────────────

const dniSchema = z.string().trim().min(1, 'El DNI es obligatorio.')

export const crearAlumnoSchema = z.object({
  dni: dniSchema,
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.'),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.'),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  ingresoAt: z.string().optional(),
})

export const actualizarAlumnoSchema = z.object({
  dni: dniSchema.optional(),
  nombres: z.string().trim().min(1).optional(),
  apellidos: z.string().trim().min(1).optional(),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
})

// ───────────────────────────── Docentes ─────────────────────────────

const nivelesDocenteSchema = z.array(
  z.enum(['INICIAL', 'PRIMARIA', 'SECUNDARIA'], {
    message: 'El nivel debe ser INICIAL, PRIMARIA o SECUNDARIA.',
  }),
)

const titulosDocenteSchema = z.array(
  z.object({
    nivel: z.enum(['INICIAL', 'PRIMARIA', 'SECUNDARIA'], {
      message: 'El nivel del título debe ser INICIAL, PRIMARIA o SECUNDARIA.',
    }),
    titulo: z.string().trim().min(1, 'Descripción del título requerida.'),
  }),
)

export const crearDocenteSchema = z.object({
  dni: dniSchema,
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.'),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.'),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  especialidad: z.string().optional(),
  titulos: titulosDocenteSchema.optional(),
  ingresoAt: z.string().optional(),
  niveles: nivelesDocenteSchema.min(1, 'Debe indicar al menos un nivel donde dicta.'),
})

export const actualizarDocenteSchema = z.object({
  dni: dniSchema.optional(),
  nombres: z.string().trim().min(1).optional(),
  apellidos: z.string().trim().min(1).optional(),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  especialidad: z.string().optional(),
  titulos: titulosDocenteSchema.optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
  niveles: nivelesDocenteSchema.min(1).optional(),
})

// ───────────────────────────── Cursos ─────────────────────────────

export const crearCursoSchema = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().optional(),
  grados: z
    .array(
      z.object({
        gradoId: z.string().min(1, 'El grado es obligatorio.'),
        horasSemana: z.number().int().positive().optional(),
        orden: z.number().int().optional(),
      }),
    )
    .optional(),
  modeloEvaluacionId: z.string().min(1, 'El modelo de evaluación es obligatorio.').optional(),
})

export const actualizarCursoSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
})

// ───────────────────────────── Grados / Secciones / Clases ─────────────────────────────

const nivelGradoSchema = z.enum(['INICIAL', 'PRIMARIA', 'SECUNDARIA'], {
  message: 'El nivel debe ser INICIAL, PRIMARIA o SECUNDARIA.',
})

const turnoSeccionSchema = z.enum(['MAÑANA', 'TARDE'], {
  message: 'El turno debe ser MAÑANA o TARDE.',
})

const estadoClaseSchema = z.enum(['ABIERTA', 'CERRADA'], {
  message: 'El estado debe ser ABIERTA o CERRADA.',
})

export const crearGradoSchema = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  nivel: nivelGradoSchema,
  orden: z.number().int().optional(),
})

export const actualizarGradoSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  nivel: nivelGradoSchema.optional(),
  orden: z.number().int().optional(),
})

export const crearSeccionSchema = z.object({
  gradoId: z.string().min(1, 'El grado es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  turno: turnoSeccionSchema.optional(),
})

export const actualizarSeccionSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  turno: turnoSeccionSchema.optional(),
})

export const crearClaseSchema = z.object({
  periodoId: z.string().min(1, 'El periodo es obligatorio.'),
  gradoId: z.string().min(1, 'El grado es obligatorio.'),
  seccionId: z.string().min(1, 'La sección es obligatoria.'),
  tutorDocenteId: z.string().optional(),
  vacantes: z.number().int().positive().optional(),
})

export const actualizarClaseSchema = z.object({
  tutorDocenteId: z.string().optional(),
  vacantes: z.number().int().positive().optional(),
  estado: estadoClaseSchema.optional(),
})

// ───────────────────────────── Plan de Estudios (CursoGrado) ─────────────────────────────

export const agregarCursoAGradoSchema = z.object({
  cursoId: z.string().min(1, 'El curso es obligatorio.'),
  gradoId: z.string().min(1, 'El grado es obligatorio.'),
  horasSemana: z.number().int().positive().optional(),
  orden: z.number().int().optional(),
})

export const actualizarCursoGradoSchema = z.object({
  horasSemana: z.number().int().positive().optional(),
  orden: z.number().int().optional(),
})

// ───────────────────────────── Reportes (solo lectura) ─────────────────────────────
// Sin schemas de escritura; solo query params validados en los handlers.

// ───────────────────────────── Configuración de Evaluación ─────────────────────────────

/** POST /api/configuraciones */
export const crearConfiguracionSchema = z.object({
  cursoId: z.string().min(1, 'El curso es obligatorio.'),
  gradoId: z.string().min(1, 'El grado es obligatorio.'),
  periodoId: z.string().min(1, 'El periodo es obligatorio.'),
  modeloEvaluacionId: z.string().min(1, 'El modelo de evaluación es obligatorio.'),
})

/** PATCH /api/configuraciones/:id */
export const actualizarConfiguracionSchema = z.object({
  modeloEvaluacionId: z.string().min(1).optional(),
  activo: z.boolean().optional(),
})

// ───────────────────────────── Competencias ─────────────────────────────

/** POST /api/configuraciones/:configId/competencias */
export const crearCompetenciaSchema = z.object({
  configuracionEvaluacionCursoId: z.string().min(1, 'La configuración es obligatoria.'),
  codigo: z.string().trim().min(1, 'El código de la competencia es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre de la competencia es obligatorio.'),
  descripcion: z.string().optional(),
  orden: z.number().int().optional(),
})

/** PATCH /api/competencias/:id */
export const actualizarCompetenciaSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
})

// ───────────────────────────── Modelos de Evaluación ─────────────────────────────

/** POST /api/modelos */
export const crearModeloSchema = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().optional(),
})

/** PATCH /api/modelos/:id */
export const actualizarModeloSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
})

// ───────────────────────────── Asignaciones de Curso ─────────────────────────────

/** POST /api/asignaciones */
export const crearAsignacionSchema = z.object({
  claseId: z.string().min(1, 'La clase es obligatoria.'),
  cursoId: z.string().min(1, 'El curso es obligatorio.'),
  docenteId: z.string().min(1, 'El docente es obligatorio.'),
})

/** POST /api/asignaciones/masivas — asigna a un docente todos los cursos del aula que aún no tengan docente. */
export const asignacionMasivaSchema = z.object({
  claseId: z.string().min(1, 'La clase es obligatoria.'),
  docenteId: z.string().min(1, 'El docente es obligatorio.'),
})

// ───────────────────────────── Periodos académicos ─────────────────────────────

/** POST /api/periodos */
export const crearPeriodoSchema = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.'),
  fechaInicio: fechaSchema.optional(),
  fechaFin: fechaSchema.optional(),
})