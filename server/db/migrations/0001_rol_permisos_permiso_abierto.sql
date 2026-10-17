PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rol_permisos` (
	`rolId` text NOT NULL,
	`permisoId` text NOT NULL,
	PRIMARY KEY(`rolId`, `permisoId`),
	FOREIGN KEY (`rolId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_rol_permisos`("rolId", "permisoId") SELECT "rolId", "permisoId" FROM `rol_permisos`;--> statement-breakpoint
DROP TABLE `rol_permisos`;--> statement-breakpoint
ALTER TABLE `__new_rol_permisos` RENAME TO `rol_permisos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;