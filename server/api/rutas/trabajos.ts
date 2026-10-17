import { Router } from 'express'
import * as servicio from '../../domain/evaluacion.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryTrabajos } from '../querySchemas.ts'
import {
  actualizarTrabajoSchema,
  crearTrabajoSchema,
  registrarCalificacionTrabajoSchema,
} from '../schemas.ts'

export const routerTrabajos = Router()

routerTrabajos.use(exigirAuth)

// GET /api/trabajos?claseId=X[&competenciaCursoId=Y]
routerTrabajos.get('/', exigirPermiso('notas.ver'), validarQuery(queryTrabajos), async (req, res) => {
  const { claseId, competenciaCursoId } = req.query as {
    claseId?: string
    competenciaCursoId?: string
  }
  if (competenciaCursoId) {
    enviarResultado(res, await servicio.listarTrabajosDeCompetencia(claseId!, competenciaCursoId))
    return
  }
  enviarResultado(res, await servicio.listarTrabajosDeClase(claseId!))
})

routerTrabajos.post('/', exigirPermiso('notas.registrar'), validarCuerpo(crearTrabajoSchema), async (req, res) => {
  enviarResultado(res, await servicio.crearTrabajo(req.body, req.auth!))
})

routerTrabajos.patch('/:id', exigirPermiso('notas.registrar'), validarCuerpo(actualizarTrabajoSchema), async (req, res) => {
  enviarResultado(res, await servicio.actualizarTrabajo(String(req.params.id), req.body))
})

routerTrabajos.post('/:id/anular', exigirPermiso('notas.registrar'), async (req, res) => {
  enviarResultado(res, await servicio.anularTrabajo(String(req.params.id)))
})

// GET /api/trabajos/:trabajoId/calificaciones
routerTrabajos.get('/:trabajoId/calificaciones', exigirPermiso('notas.ver'), async (req, res) => {
  enviarResultado(res, await servicio.listarCalificacionesDeTrabajo(String(req.params.trabajoId)))
})

// POST /api/trabajos/:trabajoId/calificaciones
routerTrabajos.post('/:trabajoId/calificaciones', exigirPermiso('notas.registrar'), validarCuerpo(registrarCalificacionTrabajoSchema), async (req, res) => {
  enviarResultado(res, await servicio.registrarCalificacionTrabajo(req.body, req.auth!))
})