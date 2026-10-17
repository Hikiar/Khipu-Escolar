CREATE TABLE `auditoria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuarioId` text,
	`metodo` text NOT NULL,
	`ruta` text NOT NULL,
	`status` integer NOT NULL,
	`ip` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null
);
