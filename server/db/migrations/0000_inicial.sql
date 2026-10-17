CREATE TABLE `alumno_apoderados` (
	`alumnoId` text NOT NULL,
	`apoderadoId` text NOT NULL,
	`parentesco` text,
	`prioridad` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`alumnoId`, `apoderadoId`),
	FOREIGN KEY (`alumnoId`) REFERENCES `alumnos`(`personaId`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`apoderadoId`) REFERENCES `apoderados`(`personaId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `alumnos` (
	`personaId` text PRIMARY KEY NOT NULL,
	`codigoAlumno` text,
	`ingresoAt` text,
	`estado` text DEFAULT 'ACTIVO' NOT NULL,
	FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `alumnos_codigoAlumno_unique` ON `alumnos` (`codigoAlumno`);--> statement-breakpoint
CREATE TABLE `apoderados` (
	`personaId` text PRIMARY KEY NOT NULL,
	`parentesco` text NOT NULL,
	`esContactoEmergencia` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `asignacion_cursos` (
	`claseId` text NOT NULL,
	`cursoId` text NOT NULL,
	`docenteId` text NOT NULL,
	PRIMARY KEY(`claseId`, `cursoId`, `docenteId`),
	FOREIGN KEY (`claseId`) REFERENCES `clases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cursoId`) REFERENCES `cursos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`docenteId`) REFERENCES `docentes`(`personaId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `asistencia_detalles` (
	`id` text PRIMARY KEY NOT NULL,
	`asistenciaId` text NOT NULL,
	`alumnoId` text NOT NULL,
	`estado` text NOT NULL,
	`horaEntrada` text,
	`horaSalida` text,
	`observaciones` text,
	FOREIGN KEY (`asistenciaId`) REFERENCES `asistencias`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`alumnoId`) REFERENCES `alumnos`(`personaId`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_asistencia_detalle_asistencia_alumno` ON `asistencia_detalles` (`asistenciaId`,`alumnoId`);--> statement-breakpoint
CREATE TABLE `asistencias` (
	`id` text PRIMARY KEY NOT NULL,
	`claseId` text NOT NULL,
	`fecha` text NOT NULL,
	`registradoPor` text NOT NULL,
	`observaciones` text,
	FOREIGN KEY (`claseId`) REFERENCES `clases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`registradoPor`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_asistencias_clase_fecha` ON `asistencias` (`claseId`,`fecha`);--> statement-breakpoint
CREATE TABLE `calificaciones_examen` (
	`id` text PRIMARY KEY NOT NULL,
	`examenCursoId` text NOT NULL,
	`alumnoId` text NOT NULL,
	`nota` real NOT NULL,
	`fechaRegistro` text NOT NULL,
	`observaciones` text,
	`registradoPor` text NOT NULL,
	FOREIGN KEY (`examenCursoId`) REFERENCES `examenes_curso`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`alumnoId`) REFERENCES `alumnos`(`personaId`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`registradoPor`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_calif_examen_examen_alumno` ON `calificaciones_examen` (`examenCursoId`,`alumnoId`);--> statement-breakpoint
CREATE TABLE `calificaciones_trabajo` (
	`id` text PRIMARY KEY NOT NULL,
	`trabajoEvaluacionId` text NOT NULL,
	`alumnoId` text NOT NULL,
	`nota` real NOT NULL,
	`fechaRegistro` text NOT NULL,
	`observaciones` text,
	`registradoPor` text NOT NULL,
	FOREIGN KEY (`trabajoEvaluacionId`) REFERENCES `trabajos_evaluacion`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`alumnoId`) REFERENCES `alumnos`(`personaId`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`registradoPor`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_calif_trabajo_trabajo_alumno` ON `calificaciones_trabajo` (`trabajoEvaluacionId`,`alumnoId`);--> statement-breakpoint
CREATE TABLE `clases` (
	`id` text PRIMARY KEY NOT NULL,
	`periodoId` text NOT NULL,
	`gradoId` text NOT NULL,
	`seccionId` text NOT NULL,
	`tutorDocenteId` text,
	`estado` text DEFAULT 'ABIERTA' NOT NULL,
	`vacantes` integer DEFAULT 30 NOT NULL,
	FOREIGN KEY (`periodoId`) REFERENCES `periodos_academicos`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`gradoId`) REFERENCES `grados`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`seccionId`) REFERENCES `secciones`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tutorDocenteId`) REFERENCES `docentes`(`personaId`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_clases_periodo_grado_seccion` ON `clases` (`periodoId`,`gradoId`,`seccionId`);--> statement-breakpoint
CREATE TABLE `competencias_curso` (
	`id` text PRIMARY KEY NOT NULL,
	`configuracionEvaluacionCursoId` text NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`orden` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`configuracionEvaluacionCursoId`) REFERENCES `configuraciones_evaluacion_curso`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_competencia_config_codigo` ON `competencias_curso` (`configuracionEvaluacionCursoId`,`codigo`);--> statement-breakpoint
CREATE TABLE `conceptos_pago` (
	`id` text PRIMARY KEY NOT NULL,
	`periodoId` text NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`tipo` text NOT NULL,
	`montoBase` real DEFAULT 0 NOT NULL,
	`fechaVencimiento` text,
	`obligatorio` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`periodoId`) REFERENCES `periodos_academicos`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_concepto_periodo_codigo` ON `conceptos_pago` (`periodoId`,`codigo`);--> statement-breakpoint
CREATE TABLE `configuraciones_evaluacion_curso` (
	`id` text PRIMARY KEY NOT NULL,
	`cursoId` text NOT NULL,
	`gradoId` text NOT NULL,
	`periodoId` text NOT NULL,
	`modeloEvaluacionId` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`cursoId`) REFERENCES `cursos`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`gradoId`) REFERENCES `grados`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`periodoId`) REFERENCES `periodos_academicos`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`modeloEvaluacionId`) REFERENCES `modelos_evaluacion`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_config_eval_curso_grado_periodo` ON `configuraciones_evaluacion_curso` (`cursoId`,`gradoId`,`periodoId`);--> statement-breakpoint
CREATE TABLE `curso_grados` (
	`cursoId` text NOT NULL,
	`gradoId` text NOT NULL,
	`horasSemana` integer,
	`orden` integer,
	PRIMARY KEY(`cursoId`, `gradoId`),
	FOREIGN KEY (`cursoId`) REFERENCES `cursos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gradoId`) REFERENCES `grados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cursos` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cursos_codigo_unique` ON `cursos` (`codigo`);--> statement-breakpoint
CREATE TABLE `docentes` (
	`personaId` text PRIMARY KEY NOT NULL,
	`especialidad` text,
	`titulo` text,
	`ingresoAt` text,
	`estado` text DEFAULT 'ACTIVO' NOT NULL,
	FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `examenes_curso` (
	`id` text PRIMARY KEY NOT NULL,
	`claseId` text NOT NULL,
	`configuracionEvaluacionCursoId` text NOT NULL,
	`nombre` text NOT NULL,
	`fecha` text,
	`estado` text DEFAULT 'ACTIVO' NOT NULL,
	FOREIGN KEY (`claseId`) REFERENCES `clases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`configuracionEvaluacionCursoId`) REFERENCES `configuraciones_evaluacion_curso`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_examen_clase_config` ON `examenes_curso` (`claseId`,`configuracionEvaluacionCursoId`);--> statement-breakpoint
CREATE TABLE `grados` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`nivel` text NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grados_codigo_unique` ON `grados` (`codigo`);--> statement-breakpoint
CREATE TABLE `matriculas` (
	`id` text PRIMARY KEY NOT NULL,
	`alumnoId` text NOT NULL,
	`claseId` text NOT NULL,
	`periodoId` text NOT NULL,
	`registradoPor` text NOT NULL,
	`fechaRegistro` text NOT NULL,
	`estado` text DEFAULT 'ACTIVA' NOT NULL,
	`retiradoAt` text,
	`observaciones` text,
	FOREIGN KEY (`alumnoId`) REFERENCES `alumnos`(`personaId`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`claseId`) REFERENCES `clases`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`periodoId`) REFERENCES `periodos_academicos`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`registradoPor`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_matriculas_alumno_periodo_activa` ON `matriculas` (`alumnoId`,`periodoId`) WHERE "matriculas"."estado" = 'ACTIVA';--> statement-breakpoint
CREATE TABLE `modelos_evaluacion` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modelos_evaluacion_codigo_unique` ON `modelos_evaluacion` (`codigo`);--> statement-breakpoint
CREATE TABLE `pagos` (
	`id` text PRIMARY KEY NOT NULL,
	`alumnoId` text NOT NULL,
	`conceptoId` text NOT NULL,
	`registradoPor` text NOT NULL,
	`monto` real NOT NULL,
	`metodoPago` text NOT NULL,
	`referencia` text,
	`fecha` text NOT NULL,
	`estado` text DEFAULT 'REGISTRADO' NOT NULL,
	`observaciones` text,
	FOREIGN KEY (`alumnoId`) REFERENCES `alumnos`(`personaId`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`conceptoId`) REFERENCES `conceptos_pago`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`registradoPor`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_pago_alumno_concepto` ON `pagos` (`alumnoId`,`conceptoId`);--> statement-breakpoint
CREATE TABLE `periodos_academicos` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`fechaInicio` text,
	`fechaFin` text,
	`estado` text DEFAULT 'PLANIFICADO' NOT NULL,
	`bandasLiteral` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `periodos_academicos_codigo_unique` ON `periodos_academicos` (`codigo`);--> statement-breakpoint
CREATE TABLE `permisos` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`modulo` text NOT NULL,
	`descripcion` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permisos_codigo_unique` ON `permisos` (`codigo`);--> statement-breakpoint
CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`dni` text NOT NULL,
	`nombres` text NOT NULL,
	`apellidos` text NOT NULL,
	`correo` text,
	`telefono` text,
	`fechaNacimiento` text,
	`sexo` text,
	`direccion` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_dni_unique` ON `personas` (`dni`);--> statement-breakpoint
CREATE TABLE `rol_permisos` (
	`rolId` text NOT NULL,
	`permisoId` text NOT NULL,
	PRIMARY KEY(`rolId`, `permisoId`),
	FOREIGN KEY (`rolId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permisoId`) REFERENCES `permisos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text DEFAULT '' NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_codigo_unique` ON `roles` (`codigo`);--> statement-breakpoint
CREATE TABLE `secciones` (
	`id` text PRIMARY KEY NOT NULL,
	`gradoId` text NOT NULL,
	`nombre` text NOT NULL,
	`turno` text DEFAULT 'MAÑANA' NOT NULL,
	FOREIGN KEY (`gradoId`) REFERENCES `grados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_secciones_grado_nombre` ON `secciones` (`gradoId`,`nombre`);--> statement-breakpoint
CREATE TABLE `sesiones` (
	`token` text PRIMARY KEY NOT NULL,
	`usuarioId` text NOT NULL,
	`createdAt` text NOT NULL,
	`expiresAt` text NOT NULL,
	FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trabajos_evaluacion` (
	`id` text PRIMARY KEY NOT NULL,
	`claseId` text NOT NULL,
	`competenciaCursoId` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`fecha` text,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`claseId`) REFERENCES `clases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competenciaCursoId`) REFERENCES `competencias_curso`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usuario_roles` (
	`usuarioId` text NOT NULL,
	`rolId` text NOT NULL,
	PRIMARY KEY(`usuarioId`, `rolId`),
	FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rolId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`personaId` text NOT NULL,
	`username` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` text NOT NULL,
	`desactivadoAt` text,
	FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_username_unique` ON `usuarios` (`username`);