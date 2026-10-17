CREATE TABLE `docente_niveles` (
	`docenteId` text NOT NULL,
	`nivel` text NOT NULL,
	PRIMARY KEY(`docenteId`, `nivel`),
	FOREIGN KEY (`docenteId`) REFERENCES `docentes`(`personaId`) ON UPDATE no action ON DELETE cascade
);
