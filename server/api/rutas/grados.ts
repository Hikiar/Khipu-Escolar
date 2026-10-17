import { Router } from 'express'
import * as servicio from '../../domain/grados.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo } from '../middleware.ts'
import {
  crearGradoSchema,
  actualizarGradoSchema,
  crearSeccionSchema,
  actualizarSeccionSchema,
  crearClaseSchema,
  actualizarClaseSchema,
} from '../schemas.ts'

export const routerGrados = Router()

routerGrados.use(exigirAuth)

// ─────────────────────────── Grados ───────────────────────────

// GET /api/grados
routerGrados.get('/grados', exigirPermiso('grados.ver'), async (_req, res) => {
  enviarResultado(res, await servicio.listarGrados())
})

// GET /api/grados/:id
routerGrados.get('/grados/:id', exigirPermiso('grados.ver'), async (req, res) => {
  enviarResultado(res, await servicio.obtenerGrado(String(req.params.id)))
})

// POST /api/grados
routerGrados.post(
  '/grados',
  validarCuerpo(crearGradoSchema),
  exigirPermiso('grados.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearGrado(req.body))
  },
)

// PATCH /api/grados/:id
routerGrados.patch(
  '/grados/:id',
  validarCuerpo(actualizarGradoSchema),
  exigirPermiso('grados.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarGrado(String(req.params.id), req.body))
  },
)

// POST /api/grados/:id/desactivar (elimina si no tiene clases)
routerGrados.post('/grados/:id/desactivar', exigirPermiso('grados.eliminar'), async (req, res) => {
  enviarResultado(res, await servicio.desactivarGrado(String(req.params.id)))
})

// ─────────────────────────── Secciones ───────────────────────────

// GET /api/grados/:gradoId/secciones
routerGrados.get('/grados/:gradoId/secciones', exigirPermiso('grados.ver'), async (req, res) => {
  enviarResultado(res, await servicio.listarSeccionesDeGrado(String(req.params.gradoId)))
})

// POST /api/grados/:gradoId/secciones
routerGrados.post(
  '/grados/:gradoId/secciones',
  validarCuerpo(crearSeccionSchema),
  exigirPermiso('grados.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearSeccion({ ...req.body, gradoId: String(req.params.gradoId) }))
  },
)

// PATCH /api/secciones/:id
routerGrados.patch(
  '/secciones/:id',
  validarCuerpo(actualizarSeccionSchema),
  exigirPermiso('grados.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarSeccion(String(req.params.id), req.body))
  },
)

// DELETE /api/secciones/:id
routerGrados.delete(
  '/secciones/:id',
  exigirPermiso('grados.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.eliminarSeccion(String(req.params.id)))
  },
)

// ─────────────────────────── Clases ───────────────────────────

// GET /api/clases (listado de clases: ?docenteId/periodoId/abiertas) lo sirve el catálogo

// POST /api/clases
routerGrados.post(
  '/clases',
  validarCuerpo(crearClaseSchema),
  exigirPermiso('grados.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearClase(req.body))
  },
)

// PATCH /api/clases/:id
routerGrados.patch(
  '/clases/:id',
  validarCuerpo(actualizarClaseSchema),
  exigirPermiso('grados.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarClase(String(req.params.id), req.body))
  },
)

// DELETE /api/clases/:id
routerGrados.delete(
  '/clases/:id',
  exigirPermiso('grados.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.eliminarClase(String(req.params.id)))
  },
)