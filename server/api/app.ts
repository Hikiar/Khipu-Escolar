import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type Express } from 'express'
import { routerAuth } from './rutas/auth.ts'
import { routerRoles } from './rutas/roles.ts'
import { routerUsuarios } from './rutas/usuarios.ts'
import { routerTrabajos } from './rutas/trabajos.ts'
import { routerExamenes } from './rutas/examenes.ts'
import { routerResultados } from './rutas/resultados.ts'
import { routerAsistencia } from './rutas/asistencia.ts'
import { routerPagos } from './rutas/pagos.ts'
import { routerMatriculas } from './rutas/matriculas.ts'
import { routerCatalogo } from './rutas/catalogo.ts'
import { routerAlumnos } from './rutas/alumnos.ts'
import { routerDocentes } from './rutas/docentes.ts'
import { routerCursos } from './rutas/cursos.ts'
import { routerGrados } from './rutas/grados.ts'
import { routerReportes } from './rutas/reportes.ts'
import { routerCursoGrado } from './rutas/cursogrado.ts'
import { routerConfiguracion } from './rutas/configuracion.ts'
import { routerCompetencia } from './rutas/competencia.ts'
import { routerModelo } from './rutas/modelo.ts'
import { routerAsignacion } from './rutas/asignacion.ts'
import { routerPeriodos } from './rutas/periodos.ts'
import { routerAuditoria } from './rutas/auditoria.ts'
import { auditarMutaciones } from './middleware.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../../dist')

/**
 * En producción sirve el frontend compilado (`dist`) y el SPA fallback,
 * para que `npm run start` levante API + UI en un solo proceso.
 */
function servirFrontendEstatico(app: Express) {
  if (!existsSync(DIST_DIR)) return
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'))
      return
    }
    next()
  })
}

/**
 * Aplicación Express 5 con la API del dashboard colegio.
 * Contrato: los bodies replican los ADT de `shared` (ok/data o ok/error/motivo);
 * el status HTTP traduce el motivo de fallo.
 * Cadena por ruta: validación Zod → auth → permiso → servicio de dominio → repo.
 */
export function crearApp(): Express {
  const app = express()
  app.use(express.json())
  app.use(auditarMutaciones)

  app.use('/api/auth', routerAuth)
  app.use('/api/roles', routerRoles)
  app.use('/api/usuarios', routerUsuarios)
  app.use('/api/trabajos', routerTrabajos)
  app.use('/api/examenes', routerExamenes)
  app.use('/api/resultados', routerResultados)
  app.use('/api/asistencia', routerAsistencia)
  app.use('/api/pagos', routerPagos)
  app.use('/api/matriculas', routerMatriculas)
  app.use('/api/alumnos', routerAlumnos)
  app.use('/api/docentes', routerDocentes)
  app.use('/api/cursos', routerCursos)
  app.use('/api', routerCursoGrado)
  app.use('/api', routerGrados)
  app.use('/api/reportes', routerReportes)
  app.use('/api', routerCatalogo)
  app.use('/api', routerConfiguracion)
  app.use('/api/competencias', routerCompetencia)
  app.use('/api', routerModelo)
  app.use('/api/asignaciones', routerAsignacion)
  app.use('/api/periodos', routerPeriodos)
  app.use('/api/auditoria', routerAuditoria)

  servirFrontendEstatico(app)

  app.use((_req, res) => {
    res.status(404).json({ ok: false, motivo: 'no-encontrado', error: 'Ruta no encontrada.' })
  })

  // Error handler de 4 argos (lo reconoce Express). Express 5 reenvía aquí
  // los rechazos de handlers async declarados con await.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[api] error no controlado:', err)
    res.status(500).json({ ok: false, motivo: 'no-disponible', error: 'Error interno del servidor.' })
  })

  return app
}