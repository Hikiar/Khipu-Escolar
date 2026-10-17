import { Router } from 'express'
import * as servicio from '../../domain/competencia.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo } from '../middleware.ts'
import { crearCompetenciaSchema, actualizarCompetenciaSchema } from '../schemas.ts'

export const routerCompetencia = Router()

routerCompetencia.use(exigirAuth)

// GET /api/competencias/configuraciones/:configId/competencias
routerCompetencia.get(
  '/configuraciones/:configId/competencias',
  exigirPermiso('competencias.ver'),
  async (req, res) => {
    enviarResultado(res, await servicio.listarCompetenciasDeConfiguracion(String(req.params.configId)))
  },
)

// POST /api/competencias/configuraciones/:configId/competencias
routerCompetencia.post(
  '/configuraciones/:configId/competencias',
  validarCuerpo(crearCompetenciaSchema),
  exigirPermiso('competencias.crear'),
  async (req, res) => {
    enviarResultado(
      res,
      await servicio.crearCompetencia({ ...req.body, configuracionEvaluacionCursoId: String(req.params.configId) }),
    )
  },
)

// GET /api/competencias/:id
routerCompetencia.get(
  '/:id',
  exigirPermiso('competencias.ver'),
  async (req, res) => {
    enviarResultado(res, await servicio.obtenerCompetencia(String(req.params.id)))
  },
)

// PATCH /api/competencias/:id
routerCompetencia.patch(
  '/:id',
  validarCuerpo(actualizarCompetenciaSchema),
  exigirPermiso('competencias.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarCompetencia(String(req.params.id), req.body))
  },
)

// DELETE /api/competencias/:id (soft delete - anular)
routerCompetencia.delete(
  '/:id',
  exigirPermiso('competencias.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.anularCompetencia(String(req.params.id)))
  },
)