CREATE TABLE `docente_titulos` (
	`docenteId` text NOT NULL,
	`nivel` text NOT NULL,
	`titulo` text NOT NULL,
	PRIMARY KEY(`docenteId`, `nivel`),
	FOREIGN KEY (`docenteId`) REFERENCES `docentes`(`personaId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Backfill: mueve el título legacy (columna docentes.titulo) a la tabla por nivel.
INSERT INTO `docente_titulos` (`docenteId`, `nivel`, `titulo`)
SELECT d.`personaId`, dn.`nivel`, d.`titulo`
FROM `docentes` d
JOIN `docente_niveles` dn ON dn.`docenteId` = d.`personaId`
WHERE d.`titulo` IS NOT NULL AND TRIM(d.`titulo`) <> '';
