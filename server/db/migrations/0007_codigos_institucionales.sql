CREATE TABLE `secuencia_codigos` (
	`letra` text NOT NULL,
	`anio` integer NOT NULL,
	`ultimo` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`letra`, `anio`)
);
--> statement-breakpoint
-- Código institucional [LETRA][AÑO 2D][CORRELATIVO 6D]. NOT NULL con valor por defecto para
-- permitir el ALTER sobre datos existentes; el backfill siguiente lo reemplaza en todas las filas.
ALTER TABLE `personas` ADD `codigoInstitucional` text NOT NULL DEFAULT '';
--> statement-breakpoint
-- Docentes → P (los códigos de una misma letra se numeran consecutivos por personaId).
UPDATE `personas`
SET `codigoInstitucional` = 'P' || substr(strftime('%Y','now'),3,2) || printf('%06d', (
	SELECT COUNT(*) FROM `docentes` d WHERE d.`personaId` <= `personas`.`id`
))
WHERE `id` IN (SELECT `personaId` FROM `docentes`)
  AND `codigoInstitucional` = '';
--> statement-breakpoint
-- Director → D.
UPDATE `personas`
SET `codigoInstitucional` = 'D' || substr(strftime('%Y','now'),3,2) || printf('%06d', (
	SELECT COUNT(*) FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'director' AND u.`personaId` <= `personas`.`id`
))
WHERE `id` IN (
	SELECT u.`personaId` FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'director'
)
  AND `codigoInstitucional` = '';
--> statement-breakpoint
-- Secretaría → S.
UPDATE `personas`
SET `codigoInstitucional` = 'S' || substr(strftime('%Y','now'),3,2) || printf('%06d', (
	SELECT COUNT(*) FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'secretaria' AND u.`personaId` <= `personas`.`id`
))
WHERE `id` IN (
	SELECT u.`personaId` FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'secretaria'
)
  AND `codigoInstitucional` = '';
--> statement-breakpoint
-- Personal → A.
UPDATE `personas`
SET `codigoInstitucional` = 'A' || substr(strftime('%Y','now'),3,2) || printf('%06d', (
	SELECT COUNT(*) FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'personal' AND u.`personaId` <= `personas`.`id`
))
WHERE `id` IN (
	SELECT u.`personaId` FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'personal'
)
  AND `codigoInstitucional` = '';
--> statement-breakpoint
-- Profesores con cuenta de usuario que no estén ya registrados como docentes → P.
UPDATE `personas`
SET `codigoInstitucional` = 'P' || substr(strftime('%Y','now'),3,2) || printf('%06d', (
	SELECT COUNT(*) FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'profesor' AND u.`personaId` <= `personas`.`id`
))
WHERE `id` IN (
	SELECT u.`personaId` FROM `usuarios` u
	JOIN `usuario_roles` ur ON ur.`usuarioId` = u.`id`
	JOIN `roles` r ON r.`id` = ur.`rolId`
	WHERE r.`codigo` = 'profesor'
)
  AND `codigoInstitucional` = '';
--> statement-breakpoint
-- Estudiantes → E.
UPDATE `personas`
SET `codigoInstitucional` = 'E' || substr(strftime('%Y','now'),3,2) || printf('%06d', (
	SELECT COUNT(*) FROM `alumnos` al WHERE al.`personaId` <= `personas`.`id`
))
WHERE `id` IN (SELECT `personaId` FROM `alumnos`)
  AND `codigoInstitucional` = '';
--> statement-breakpoint
-- El login pasa a ser por código: username = código institucional de la persona.
UPDATE `usuarios`
SET `username` = (
	SELECT `codigoInstitucional` FROM `personas` WHERE `personas`.`id` = `usuarios`.`personaId`
)
WHERE `personaId` IN (SELECT `id` FROM `personas` WHERE `codigoInstitucional` <> '');
--> statement-breakpoint
-- Secuencias inicializadas al valor actual (los nuevos códigos continúan sin repetirse).
INSERT INTO `secuencia_codigos` (`letra`, `anio`, `ultimo`)
SELECT 'D', CAST(strftime('%Y','now') AS INTEGER), COUNT(*) FROM `personas` WHERE `codigoInstitucional` LIKE 'D%';
--> statement-breakpoint
INSERT INTO `secuencia_codigos` (`letra`, `anio`, `ultimo`)
SELECT 'P', CAST(strftime('%Y','now') AS INTEGER), COUNT(*) FROM `personas` WHERE `codigoInstitucional` LIKE 'P%';
--> statement-breakpoint
INSERT INTO `secuencia_codigos` (`letra`, `anio`, `ultimo`)
SELECT 'S', CAST(strftime('%Y','now') AS INTEGER), COUNT(*) FROM `personas` WHERE `codigoInstitucional` LIKE 'S%';
--> statement-breakpoint
INSERT INTO `secuencia_codigos` (`letra`, `anio`, `ultimo`)
SELECT 'A', CAST(strftime('%Y','now') AS INTEGER), COUNT(*) FROM `personas` WHERE `codigoInstitucional` LIKE 'A%';
--> statement-breakpoint
INSERT INTO `secuencia_codigos` (`letra`, `anio`, `ultimo`)
SELECT 'E', CAST(strftime('%Y','now') AS INTEGER), COUNT(*) FROM `personas` WHERE `codigoInstitucional` LIKE 'E%';
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_codigoInstitucional_unique` ON `personas` (`codigoInstitucional`);