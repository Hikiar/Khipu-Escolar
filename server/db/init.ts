import { pathToFileURL } from 'node:url'
import { ejecutarMigraciones } from './client.ts'
import { semillar, cerrarBase } from './seed.ts'

/**
 * Arranque de base de datos: aplica migraciones pendientes y siembra si está vacía.
 * Usado por el server al iniciar y ejecutable directamente: `node server/db/init.ts`.
 */
export function inicializarBaseDatos() {
  ejecutarMigraciones()
  semillar()
}

// Ejecución directa para desarrollo y smoke tests.
const rutaEjecutada = process.argv[1]
const esModuloPrincipal = rutaEjecutada
  ? import.meta.url === pathToFileURL(rutaEjecutada).href
  : false

if (esModuloPrincipal) {
  inicializarBaseDatos()
  cerrarBase()
  console.log('[init] Base de datos migrada y sembrada correctamente.')
}