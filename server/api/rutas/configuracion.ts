import { Router } from 'express'
import * as servicio from '../../domain/configuracion.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryConfiguraciones } from '../querySchemas.ts'
import { crearConfiguracionSchema, actualizarConfiguracionSchema } from '../schemas.ts'

export const routerConfiguracion = Router()

routerConfiguracion.use(exigirAuth)

// GET /api/configuraciones?cursoId=&gradoId=&periodoId=
routerConfiguracion.get(
  '/configuraciones',
  exigirPermiso('configuraciones.ver'),
  validarQuery(queryConfiguraciones),
  async (req, res) => {
    const { cursoId, gradoId, periodoId } = req.query as {
      cursoId?: string
      gradoId?: string
      periodoId?: string
    }
    enviarResultado(
      res,
      await servicio.listarConfiguraciones({ cursoId, gradoId, periodoId }),
    )
  },
)

// POST /api/configuraciones
routerConfiguracion.post(
  '/configuraciones',
  validarCuerpo(crearConfiguracionSchema),
  exigirPermiso('configuraciones.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearConfiguracion(req.body))
  },
)

// GET /api/cursos/:cursoId/configuraciones
routerConfiguracion.get(
  '/cursos/:cursoId/configuraciones',
  exigirPermiso('configuraciones.ver'),
  async (req, res) => {
    enviarResultado(res, await servicio.listarConfiguracionesDeCurso(String(req.params.cursoId)))
  },
)

// GET /api/configuraciones/:id
routerConfiguracion.get(
  '/configuraciones/:id',
  exigirPermiso('configuraciones.ver'),
  async (req, res) => {
    enviarResultado(res, await servicio.obtenerConfiguracion(String(req.params.id)))
  },
)

// PATCH /api/configuraciones/:id
routerConfiguracion.patch(
  '/configuraciones/:id',
  validarCuerpo(actualizarConfiguracionSchema),
  exigirPermiso('configuraciones.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarConfiguracion(String(req.params.id), req.body))
  },
)

// DELETE /api/configuraciones/:id
routerConfiguracion.delete(
  '/configuraciones/:id',
  exigirPermiso('configuraciones.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.eliminarConfiguracion(String(req.params.id)))
  },
)