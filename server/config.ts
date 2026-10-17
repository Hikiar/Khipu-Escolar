import path from 'node:path'

/**
 * Configuración de entorno centralizada.
 * Valores por defecto de desarrollo; en producción se inyectan vía `.env`
 * (Node la carga con `--env-file-if-exists=.env`; ver scripts de package.json).
 */
export function leerConfig() {
  return {
    /** Puerto HTTP de la API. */
    port: Number(process.env.PORT ?? 8787),

    /** Ruta de la base de datos (por defecto `server/data/colegio.db`). */
    dbPath: process.env.DATABASE_PATH
      ? path.resolve(process.env.DATABASE_PATH)
      : path.resolve(process.cwd(), 'server/data/colegio.db'),

    /** Duración de sesión en horas (token opaco en BD). */
    sesionExpiracionHoras: Number(process.env.SESION_EXPIRACION_HORAS ?? 8),

    /** Directorio donde se escriben los respaldos (Prod: `server/data/backups`). */
    backupsDir: process.env.BACKUPS_DIR
      ? path.resolve(process.env.BACKUPS_DIR)
      : path.resolve(process.cwd(), 'server/data/backups'),

    /**
     * Secreto usado para cifrar contraseñas temporales en reposo (AES-256-GCM).
     * En producción DEBE inyectarse un valor propio (p. ej. 32 bytes base64);
     * el valor por defecto solo es para desarrollo.
     */
    passwordTemporalSecreto: process.env.PASSWORD_TEMPORAL_SECRETO
      ?? 'clave-de-cifrado-temporal-dev-no-usar-en-produccion',
  }
}

export type Config = ReturnType<typeof leerConfig>