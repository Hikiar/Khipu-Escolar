import { Router } from 'express'
import * as servicio from '../../domain/matriculas.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryMatriculas } from '../querySchemas.ts'
import { registrarMatriculaSchema } from '../schemas.ts'

export const routerMatriculas = Router()

// GET /api/matriculas?claseId=X[&todas=1]  → solo activas por defecto
routerMatriculas.get(
  '/',
  exigirAuth,
  exigirPermiso('matriculas.ver'),
  validarQuery(queryMatriculas),
  async (req, res) => {
    const { claseId, todas } = req.query as { claseId?: string; todas?: string }
    enviarResultado(
      res,
      await servicio.listarMatriculasDeClase(claseId!, todas !== '1' && todas !== 'true'),
    )
  },
)

// GET /api/matriculas/:id
routerMatriculas.get('/:id', exigirAuth, exigirPermiso('matriculas.ver'), async (req, res) => {
  enviarResultado(res, await servicio.obtenerMatricula(String(req.params.id)))
})

// POST /api/matriculas
routerMatriculas.post(
  '/',
  validarCuerpo(registrarMatriculaSchema),
  exigirAuth,
  exigirPermiso('matriculas.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.registrarMatricula(req.body, req.auth!))
  },
)

// POST /api/matriculas/:id/retirar  → estado RETIRADA (conserva historial, N8)
routerMatriculas.post('/:id/retirar', exigirAuth, exigirPermiso('matriculas.anular'), async (req, res) => {
  enviarResultado(res, await servicio.retirarMatricula(String(req.params.id)))
})

// POST /api/matriculas/:id/anular  → elimina si no hay calificaciones/pagos (N9)
routerMatriculas.post('/:id/anular', exigirAuth, exigirPermiso('matriculas.anular'), async (req, res) => {
  enviarResultado(res, await servicio.anularMatricula(String(req.params.id)))
})