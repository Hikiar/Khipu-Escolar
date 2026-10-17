import { Router } from 'express'
import * as servicio from '../../domain/modelo.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo } from '../middleware.ts'
import { crearModeloSchema, actualizarModeloSchema } from '../schemas.ts'

export const routerModelo = Router()

routerModelo.use(exigirAuth)

// GET /api/modelos
routerModelo.get(
  '/modelos',
  exigirPermiso('modelos.ver'),
  async (_req, res) => {
    enviarResultado(res, await servicio.listarModelos())
  },
)

// POST /api/modelos
routerModelo.post(
  '/modelos',
  validarCuerpo(crearModeloSchema),
  exigirPermiso('modelos.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearModelo(req.body))
  },
)

// GET /api/modelos/:id
routerModelo.get(
  '/modelos/:id',
  exigirPermiso('modelos.ver'),
  async (req, res) => {
    enviarResultado(res, await servicio.obtenerModelo(String(req.params.id)))
  },
)

// PATCH /api/modelos/:id
routerModelo.patch(
  '/modelos/:id',
  validarCuerpo(actualizarModeloSchema),
  exigirPermiso('modelos.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarModelo(String(req.params.id), req.body))
  },
)

// DELETE /api/modelos/:id
routerModelo.delete(
  '/modelos/:id',
  exigirPermiso('modelos.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.eliminarModelo(String(req.params.id)))
  },
)