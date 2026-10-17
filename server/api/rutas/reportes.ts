import { Router } from 'express'
import * as servicio from '../../domain/reportes.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarQuery } from '../middleware.ts'
import {
  queryReportesAsistencia,
  queryReportesEvaluacion,
  queryReportesMatriculas,
  queryReportesPagos,
} from '../querySchemas.ts'

export const routerReportes = Router()

routerReportes.use(exigirAuth, exigirPermiso('reportes.ver'))

// GET /api/reportes/matriculas[?periodoId=X]
routerReportes.get('/matriculas', validarQuery(queryReportesMatriculas), async (req, res) => {
  const { periodoId } = req.query as { periodoId?: string }
  enviarResultado(res, await servicio.reporteMatriculas(periodoId))
})

// GET /api/reportes/asistencia[?claseId=X&cursoId=Y&fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD]
routerReportes.get('/asistencia', validarQuery(queryReportesAsistencia), async (req, res) => {
  const { claseId, cursoId, fechaDesde, fechaHasta } = req.query as {
    claseId?: string
    cursoId?: string
    fechaDesde?: string
    fechaHasta?: string
  }
  enviarResultado(res, await servicio.reporteAsistencia(claseId, cursoId, fechaDesde, fechaHasta))
})

// GET /api/reportes/evaluacion[?claseId=X&cursoId=Y]
routerReportes.get('/evaluacion', validarQuery(queryReportesEvaluacion), async (req, res) => {
  const { claseId, cursoId } = req.query as { claseId?: string; cursoId?: string }
  enviarResultado(res, await servicio.reporteEvaluacion(claseId, cursoId))
})

// GET /api/reportes/pagos[?periodoId=X]
routerReportes.get('/pagos', validarQuery(queryReportesPagos), async (req, res) => {
  const { periodoId } = req.query as { periodoId?: string }
  enviarResultado(res, await servicio.reportePagos(periodoId))
})

// GET /api/reportes/alumnos
routerReportes.get('/alumnos', async (_req, res) => {
  enviarResultado(res, await servicio.reporteAlumnos())
})