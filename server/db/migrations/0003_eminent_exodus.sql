DROP INDEX `u_asistencias_clase_fecha`;--> statement-breakpoint
ALTER TABLE `asistencias` ADD `cursoId` text REFERENCES cursos(id);--> statement-breakpoint
CREATE UNIQUE INDEX `u_asis_clase_fecha_aula` ON `asistencias` (`claseId`,`fecha`) WHERE "asistencias"."cursoId" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `u_asis_clase_curso_fecha` ON `asistencias` (`claseId`,`cursoId`,`fecha`) WHERE "asistencias"."cursoId" IS NOT NULL;