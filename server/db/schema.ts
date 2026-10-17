import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, real, uniqueIndex, primaryKey, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

/**
 * Esquema relacional de Fase 3.
 * Espejo 1:1 de `docs/modelo-datos.md` (fuente de verdad). Convenciones:
 * - Nombres de tabla en plural (snake_case).
 * - Columnas camelCase, mismas que los atributos del modelo conceptual.
 * - `createdAt`/timestamps ISO-8601 en texto (coincide con los contratos del frontend).
 * - Índice único parcial sobre matrículas ACTIVAS (regla N1).
 */

// ─────────────────────────── RBAC ───────────────────────────

export const personas = sqliteTable('personas', {
  id: text('id').primaryKey(),
  dni: text('dni').notNull().unique(),
  /** Código institucional [LETRA][AÑO 2D][CORRELATIVO 6D]. Permanente: nunca se modifica ni reutiliza. */
  codigoInstitucional: text('codigoInstitucional').notNull().unique(),
  nombres: text('nombres').notNull(),
  apellidos: text('apellidos').notNull(),
  correo: text('correo'),
  telefono: text('telefono'),
  fechaNacimiento: text('fechaNacimiento'),
  sexo: text('sexo'),
  direccion: text('direccion'),
})

/** Secuencia por letra y año para los códigos institucionales (evita reutilizar números). */
export const secuenciaCodigos = sqliteTable(
  'secuencia_codigos',
  {
    letra: text('letra').notNull(),
    anio: integer('anio').notNull(),
    ultimo: integer('ultimo').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.letra, table.anio] })],
)

export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey(),
  personaId: text('personaId')
    .notNull()
    .unique()
    .references(() => personas.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  passwordHash: text('passwordHash').notNull(),
  /** Obliga a cambiar la contraseña en el próximo ingreso (alta, reset o restablecimiento). */
  debeCambiarPassword: integer('debeCambiarPassword', { mode: 'boolean' })
    .notNull()
    .default(false),
  /**
   * Contraseña temporal actual cifrada en reposo (AES-256-GCM) para poder
   * re-mostrarla al usuario mientras `debeCambiarPassword` siga activo.
   * Se crea en alta/restablecimiento y se borra al cambiar la contraseña.
   */
  passwordTemporalCifrada: text('passwordTemporalCifrada'),
  createdAt: text('createdAt').notNull(),
  desactivadoAt: text('desactivadoAt'),
})

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion').notNull().default(''),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
})

export const permisos = sqliteTable('permisos', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  modulo: text('modulo').notNull(),
  descripcion: text('descripcion').notNull(),
})

export const rolPermisos = sqliteTable(
  'rol_permisos',
  {
    rolId: text('rolId')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    // PermissionCode es string abierto (incluso '*'); el catálogo puede crecer sin FK.
    permisoId: text('permisoId').notNull(),
  },
  (table) => [primaryKey({ columns: [table.rolId, table.permisoId] })],
)

export const usuarioRoles = sqliteTable(
  'usuario_roles',
  {
    usuarioId: text('usuarioId')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    rolId: text('rolId')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.usuarioId, table.rolId] })],
)

// ─────────────────────────── Académicas ───────────────────────────

export const alumnos = sqliteTable('alumnos', {
  personaId: text('personaId')
    .primaryKey()
    .references(() => personas.id, { onDelete: 'cascade' }),
  codigoAlumno: text('codigoAlumno').unique(),
  ingresoAt: text('ingresoAt'),
  estado: text('estado').notNull().default('ACTIVO'),
})

export const docentes = sqliteTable('docentes', {
  personaId: text('personaId')
    .primaryKey()
    .references(() => personas.id, { onDelete: 'cascade' }),
  especialidad: text('especialidad'),
  titulo: text('titulo'),
  ingresoAt: text('ingresoAt'),
  estado: text('estado').notNull().default('ACTIVO'),
})

/** Niveles curriculares donde dicta un docente (multi-nivel, p. ej. EF en inicial+primaria+secundaria). */
export const docenteNiveles = sqliteTable(
  'docente_niveles',
  {
    docenteId: text('docenteId')
      .notNull()
      .references(() => docentes.personaId, { onDelete: 'cascade' }),
    nivel: text('nivel').notNull(),
  },
  (table) => [primaryKey({ columns: [table.docenteId, table.nivel] })],
)

/**
 * Títulos profesionales por nivel (realidad peruana: se rige según el título de
 * Inicial, Primaria o Secundaria; un docente puede tener título en varios niveles).
 * A lo sumo un título por nivel, de ahí la PK compuesta.
 */
export const docenteTitulos = sqliteTable(
  'docente_titulos',
  {
    docenteId: text('docenteId')
      .notNull()
      .references(() => docentes.personaId, { onDelete: 'cascade' }),
    nivel: text('nivel').notNull(),
    titulo: text('titulo').notNull(),
  },
  (table) => [primaryKey({ columns: [table.docenteId, table.nivel] })],
)

export const apoderados = sqliteTable('apoderados', {
  personaId: text('personaId')
    .primaryKey()
    .references(() => personas.id, { onDelete: 'cascade' }),
  parentesco: text('parentesco').notNull(),
  esContactoEmergencia: integer('esContactoEmergencia', { mode: 'boolean' })
    .notNull()
    .default(false),
})

export const alumnoApoderados = sqliteTable(
  'alumno_apoderados',
  {
    alumnoId: text('alumnoId')
      .notNull()
      .references(() => alumnos.personaId, { onDelete: 'cascade' }),
    apoderadoId: text('apoderadoId')
      .notNull()
      .references(() => apoderados.personaId, { onDelete: 'cascade' }),
    parentesco: text('parentesco'),
    prioridad: integer('prioridad').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.alumnoId, table.apoderadoId] })],
)

export const periodosAcademicos = sqliteTable('periodos_academicos', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  fechaInicio: text('fechaInicio'),
  fechaFin: text('fechaFin'),
  estado: text('estado').notNull().default('PLANIFICADO'),
  bandasLiteral: text('bandasLiteral'),
})

export const grados = sqliteTable('grados', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  nivel: text('nivel').notNull(),
  orden: integer('orden').notNull().default(0),
})

export const secciones = sqliteTable(
  'secciones',
  {
    id: text('id').primaryKey(),
    gradoId: text('gradoId')
      .notNull()
      .references(() => grados.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    turno: text('turno').notNull().default('MAÑANA'),
  },
  (table) => [uniqueIndex('u_secciones_grado_nombre').on(table.gradoId, table.nombre)],
)

export const clases = sqliteTable(
  'clases',
  {
    id: text('id').primaryKey(),
    periodoId: text('periodoId')
      .notNull()
      .references(() => periodosAcademicos.id, { onDelete: 'restrict' }),
    gradoId: text('gradoId')
      .notNull()
      .references(() => grados.id, { onDelete: 'restrict' }),
    seccionId: text('seccionId')
      .notNull()
      .references(() => secciones.id, { onDelete: 'restrict' }),
    tutorDocenteId: text('tutorDocenteId').references(
      (): AnySQLiteColumn => docentes.personaId,
      { onDelete: 'set null' },
    ),
    estado: text('estado').notNull().default('ABIERTA'),
    vacantes: integer('vacantes').notNull().default(30),
  },
  (table) => [
    uniqueIndex('u_clases_periodo_grado_seccion').on(
      table.periodoId,
      table.gradoId,
      table.seccionId,
    ),
  ],
)

export const cursos = sqliteTable('cursos', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
})

export const cursoGrados = sqliteTable(
  'curso_grados',
  {
    cursoId: text('cursoId')
      .notNull()
      .references(() => cursos.id, { onDelete: 'cascade' }),
    gradoId: text('gradoId')
      .notNull()
      .references(() => grados.id, { onDelete: 'cascade' }),
    horasSemana: integer('horasSemana'),
    orden: integer('orden'),
  },
  (table) => [primaryKey({ columns: [table.cursoId, table.gradoId] })],
)

export const asignacionCursos = sqliteTable(
  'asignacion_cursos',
  {
    claseId: text('claseId')
      .notNull()
      .references(() => clases.id, { onDelete: 'cascade' }),
    cursoId: text('cursoId')
      .notNull()
      .references(() => cursos.id, { onDelete: 'cascade' }),
    docenteId: text('docenteId')
      .notNull()
      .references(() => docentes.personaId, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.claseId, table.cursoId, table.docenteId] })],
)

export const matriculas = sqliteTable(
  'matriculas',
  {
    id: text('id').primaryKey(),
    alumnoId: text('alumnoId')
      .notNull()
      .references(() => alumnos.personaId, { onDelete: 'restrict' }),
    claseId: text('claseId')
      .notNull()
      .references(() => clases.id, { onDelete: 'restrict' }),
    periodoId: text('periodoId')
      .notNull()
      .references(() => periodosAcademicos.id, { onDelete: 'restrict' }),
    registradoPor: text('registradoPor')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
    fechaRegistro: text('fechaRegistro').notNull(),
    estado: text('estado').notNull().default('ACTIVA'),
    retiradoAt: text('retiradoAt'),
    observaciones: text('observaciones'),
  },
  (table) => [
    // N1: a lo sumo UNA matrícula ACTIVA por alumno/periodo (las RETIRADAS no bloquean).
    uniqueIndex('u_matriculas_alumno_periodo_activa')
      .on(table.alumnoId, table.periodoId)
      .where(sql`${table.estado} = 'ACTIVA'`),
  ],
)

// ─────────────────────────── Asistencia ───────────────────────────

export const asistencias = sqliteTable(
  'asistencias',
  {
    id: text('id').primaryKey(),
    claseId: text('claseId')
      .notNull()
      .references(() => clases.id, { onDelete: 'cascade' }),
    // Alcance: NULL = asistencia general del aula (la registra el tutor);
    // con cursoId = asistencia por curso (la registra el docente asignado).
    cursoId: text('cursoId').references(() => cursos.id, { onDelete: 'restrict' }),
    fecha: text('fecha').notNull(),
    registradoPor: text('registradoPor')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
    observaciones: text('observaciones'),
  },
  (table) => [
    // N6 por alcance: un registro de AULA por (clase, fecha); un registro de
    // CURSO por (clase, curso, fecha). Ambas pueden coexistir el mismo día.
    uniqueIndex('u_asis_clase_fecha_aula')
      .on(table.claseId, table.fecha)
      .where(sql`${table.cursoId} IS NULL`),
    uniqueIndex('u_asis_clase_curso_fecha')
      .on(table.claseId, table.cursoId, table.fecha)
      .where(sql`${table.cursoId} IS NOT NULL`),
  ],
)

export const asistenciaDetalles = sqliteTable(
  'asistencia_detalles',
  {
    id: text('id').primaryKey(),
    asistenciaId: text('asistenciaId')
      .notNull()
      .references(() => asistencias.id, { onDelete: 'cascade' }),
    alumnoId: text('alumnoId')
      .notNull()
      .references(() => alumnos.personaId, { onDelete: 'restrict' }),
    estado: text('estado').notNull(),
    horaEntrada: text('horaEntrada'),
    horaSalida: text('horaSalida'),
    observaciones: text('observaciones'),
  },
  (table) => [
    uniqueIndex('u_asistencia_detalle_asistencia_alumno').on(
      table.asistenciaId,
      table.alumnoId,
    ),
  ],
)

// ─────────────────────────── Evaluación (Fase 2) ───────────────────────────

export const modelosEvaluacion = sqliteTable('modelos_evaluacion', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
})

export const configuracionesEvaluacionCurso = sqliteTable(
  'configuraciones_evaluacion_curso',
  {
    id: text('id').primaryKey(),
    cursoId: text('cursoId')
      .notNull()
      .references(() => cursos.id, { onDelete: 'restrict' }),
    gradoId: text('gradoId')
      .notNull()
      .references(() => grados.id, { onDelete: 'restrict' }),
    periodoId: text('periodoId')
      .notNull()
      .references(() => periodosAcademicos.id, { onDelete: 'restrict' }),
    modeloEvaluacionId: text('modeloEvaluacionId')
      .notNull()
      .references(() => modelosEvaluacion.id, { onDelete: 'restrict' }),
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    // UQ (curso, grado, periodo): una sola configuración por curso dentro del grado/año.
    uniqueIndex('u_config_eval_curso_grado_periodo').on(
      table.cursoId,
      table.gradoId,
      table.periodoId,
    ),
  ],
)

export const competenciasCurso = sqliteTable(
  'competencias_curso',
  {
    id: text('id').primaryKey(),
    configuracionEvaluacionCursoId: text('configuracionEvaluacionCursoId')
      .notNull()
      .references(() => configuracionesEvaluacionCurso.id, { onDelete: 'cascade' }),
    codigo: text('codigo').notNull(),
    nombre: text('nombre').notNull(),
    descripcion: text('descripcion'),
    orden: integer('orden').notNull().default(0),
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    uniqueIndex('u_competencia_config_codigo').on(
      table.configuracionEvaluacionCursoId,
      table.codigo,
    ),
  ],
)

export const trabajosEvaluacion = sqliteTable('trabajos_evaluacion', {
  id: text('id').primaryKey(),
  claseId: text('claseId')
    .notNull()
    .references(() => clases.id, { onDelete: 'cascade' }),
  competenciaCursoId: text('competenciaCursoId')
    .notNull()
    .references(() => competenciasCurso.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  fecha: text('fecha'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
})

export const calificacionesTrabajo = sqliteTable(
  'calificaciones_trabajo',
  {
    id: text('id').primaryKey(),
    trabajoEvaluacionId: text('trabajoEvaluacionId')
      .notNull()
      .references(() => trabajosEvaluacion.id, { onDelete: 'cascade' }),
    alumnoId: text('alumnoId')
      .notNull()
      .references(() => alumnos.personaId, { onDelete: 'restrict' }),
    nota: real('nota').notNull(),
    fechaRegistro: text('fechaRegistro').notNull(),
    observaciones: text('observaciones'),
    registradoPor: text('registradoPor')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('u_calif_trabajo_trabajo_alumno').on(
      table.trabajoEvaluacionId,
      table.alumnoId,
    ),
  ],
)

export const examenesCurso = sqliteTable(
  'examenes_curso',
  {
    id: text('id').primaryKey(),
    claseId: text('claseId')
      .notNull()
      .references(() => clases.id, { onDelete: 'cascade' }),
    configuracionEvaluacionCursoId: text('configuracionEvaluacionCursoId')
      .notNull()
      .references(() => configuracionesEvaluacionCurso.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    fecha: text('fecha'),
    estado: text('estado').notNull().default('ACTIVO'),
  },
  (table) => [
    // N12 + coherencia: máximo UN examen por (configuración, Clase).
    uniqueIndex('u_examen_clase_config').on(
      table.claseId,
      table.configuracionEvaluacionCursoId,
    ),
  ],
)

export const calificacionesExamen = sqliteTable(
  'calificaciones_examen',
  {
    id: text('id').primaryKey(),
    examenCursoId: text('examenCursoId')
      .notNull()
      .references(() => examenesCurso.id, { onDelete: 'cascade' }),
    alumnoId: text('alumnoId')
      .notNull()
      .references(() => alumnos.personaId, { onDelete: 'restrict' }),
    nota: real('nota').notNull(),
    fechaRegistro: text('fechaRegistro').notNull(),
    observaciones: text('observaciones'),
    registradoPor: text('registradoPor')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('u_calif_examen_examen_alumno').on(
      table.examenCursoId,
      table.alumnoId,
    ),
  ],
)

// ─────────────────────────── Pagos ───────────────────────────

export const conceptosPago = sqliteTable(
  'conceptos_pago',
  {
    id: text('id').primaryKey(),
    periodoId: text('periodoId')
      .notNull()
      .references(() => periodosAcademicos.id, { onDelete: 'restrict' }),
    codigo: text('codigo').notNull(),
    descripcion: text('descripcion').notNull(),
    tipo: text('tipo').notNull(),
    montoBase: real('montoBase').notNull().default(0),
    fechaVencimiento: text('fechaVencimiento'),
    obligatorio: integer('obligatorio', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [uniqueIndex('u_concepto_periodo_codigo').on(table.periodoId, table.codigo)],
)

export const pagos = sqliteTable(
  'pagos',
  {
    id: text('id').primaryKey(),
    alumnoId: text('alumnoId')
      .notNull()
      .references(() => alumnos.personaId, { onDelete: 'restrict' }),
    conceptoId: text('conceptoId')
      .notNull()
      .references(() => conceptosPago.id, { onDelete: 'restrict' }),
    registradoPor: text('registradoPor')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
    monto: real('monto').notNull(),
    metodoPago: text('metodoPago').notNull(),
    referencia: text('referencia'),
    fecha: text('fecha').notNull(),
    estado: text('estado').notNull().default('REGISTRADO'),
    observaciones: text('observaciones'),
  },
  (table) => [
    uniqueIndex('u_pago_alumno_concepto').on(table.alumnoId, table.conceptoId),
  ],
)

// ─────────────────────────── Sesiones (tokens opacos) ───────────────────────────

export const sesiones = sqliteTable('sesiones', {
  token: text('token').primaryKey(),
  usuarioId: text('usuarioId')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  createdAt: text('createdAt').notNull(),
  expiresAt: text('expiresAt').notNull(),
})

// ─────────────────────────── Auditoría (bitácora de mutaciones) ───────────────────────────

export const auditoria = sqliteTable('auditoria', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: text('usuarioId').references(() => usuarios.id, { onDelete: 'set null' }),
  metodo: text('metodo').notNull(),
  ruta: text('ruta').notNull(),
  status: integer('status').notNull(),
  ip: text('ip'),
  createdAt: text('createdAt').notNull(),
})

export type Auditoria = typeof auditoria.$inferSelect