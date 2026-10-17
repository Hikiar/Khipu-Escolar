import { Router } from 'express'
import * as servicio from '../../domain/examenes.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryExamenes } from '../querySchemas.ts'
import {
  actualizarExamenSchema,
  crearExamenSchema,
  registrarCalificacionExamenSchema,
} from '../schemas.ts'

export const routerExamenes = Router()

routerExamenes.use(exigirAuth)

// GET /api/examenes?claseId=X
routerExamenes.get('/', exigirPermiso('notas.ver'), validarQuery(queryExamenes), async (req, res) => {
  const { claseId } = req.query as { claseId?: string }
  enviarResultado(res, await servicio.listarExamenesDeClase(claseId!))
})

routerExamenes.post('/', exigirPermiso('notas.registrar'), validarCuerpo(crearExamenSchema), async (req, res) => {
  enviarResultado(res, await servicio.crearExamen(req.body, req.auth!))
})

routerExamenes.patch('/:id', exigirPermiso('notas.registrar'), validarCuerpo(actualizarExamenSchema), async (req, res) => {
  enviarResultado(res, await servicio.actualizarExamen(String(req.params.id), req.body))
})

// GET /api/examenes/:examenId/calificaciones
routerExamenes.get('/:examenId/calificaciones', exigirPermiso('notas.ver'), async (req, res) => {
  enviarResultado(res, await servicio.listarCalificacionesDeExamen(String(req.params.examenId)))
})

// POST /api/examenes/:examenId/calificaciones
routerExamenes.post('/:examenId/calificaciones', exigirPermiso('notas.registrar'), validarCuerpo(registrarCalificacionExamenSchema), async (req, res) => {
  enviarResultado(res, await servicio.registrarCalificacionExamen(req.body, req.auth!))
})