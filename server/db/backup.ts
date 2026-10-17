import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { leerConfig } from '../config.ts'
import { sqlite } from './client.ts'

/**
 * Respaldos de la base SQLite.
 *   node server/db/backup.ts backup            → server/data/backups/colegio_YYYYMMDD-HHMMSS.db
 *   node server/db/backup.ts restore <archivo> → restaura un respaldo (servidor detenido)
 *
 * `sqlite.backup()` usa el mecanismo online de SQLite: seguro con el servidor en marcha.
 */

const rutaEjecutada = process.argv[1]
const esModuloPrincipal = rutaEjecutada
  ? import.meta.url === pathToFileURL(rutaEjecutada).href
  : false

function timestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function crearRespaldo() {
  const { backupsDir } = leerConfig()
  mkdirSync(backupsDir, { recursive: true })
  const destino = path.join(backupsDir, `colegio_${timestamp()}.db`)
  sqlite.backup(destino)
  console.log(`[backup] respaldo creado: ${destino}`)
}

function restaurar(origen: string) {
  const { dbPath } = leerConfig()
  const absoluto = path.resolve(origen)
  if (!existsSync(absoluto)) {
    console.error(`[backup] no existe el respaldo: ${absoluto}`)
    process.exit(1)
  }
  const actual = path.resolve(dbPath)
  // Copia de seguridad del estado actual antes de la restauración.
  const resguardo = `${actual}.pre-restauracion`
  if (existsSync(actual)) copyFileSync(actual, resguardo)
  copyFileSync(absoluto, actual)
  console.log(`[backup] base restaurada desde ${absoluto}`)
  console.log(`[backup] respaldo previo conservado en ${resguardo}`)
  console.log('[backup] si el servidor estaba en marcha, reinícielo para tomar la base restaurada.')
}

if (esModuloPrincipal) {
  const comando = process.argv[2] ?? 'backup'
  if (comando === 'backup') {
    crearRespaldo()
  } else if (comando === 'restore') {
    const origen = process.argv[3]
    if (!origen) {
      console.error('[backup] uso: node server/db/backup.ts restore <archivo>.db')
      process.exit(1)
    }
    restaurar(origen)
  } else {
    console.error(`[backup] comando desconocido: ${comando}`)
    process.exit(1)
  }
}