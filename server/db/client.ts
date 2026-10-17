import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { leerConfig } from '../config.ts'

/**
 * Cliente SQLite (Drizzle + better-sqlite3).
 * La base vive en `server/data/colegio.db` (generada en el arranque, ignorada por git).
 * La ruta se puede sobreescribir con `DATABASE_PATH` (ver `.env.example`).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DATA_DIR = path.resolve(__dirname, '../data')
export const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations')

const { dbPath } = leerConfig()
export const DB_FILE = path.resolve(dbPath)

export function abrirBaseDatos() {
  mkdirSync(DATA_DIR, { recursive: true })
  const connection = new Database(DB_FILE)
  connection.pragma('foreign_keys = ON')
  return connection
}

export const sqlite = abrirBaseDatos()
export const db = drizzle(sqlite)

/** Aplica las migraciones versionadas (solo ejecuta las pendientes). */
export function ejecutarMigraciones() {
  migrate(db, { migrationsFolder: MIGRATIONS_DIR })
}