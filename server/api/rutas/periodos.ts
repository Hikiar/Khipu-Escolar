import { Router } from 'express'
import * as servicio from '../../domain/periodos.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo } from '../middleware.ts'
import { crearPeriodoSchema } from '../schemas.ts'

export const routerPeriodos = Router()

routerPeriodos.use(exigirAuth)

// GET /api/periodos/activo (periodo en curso; sin permiso específico: solo meta)
routerPeriodos.get('/activo', (_req, res) => {
  enviarResultado(res, servicio.obtenerPeriodoActivoDto())
})

// GET /api/periodos
routerPeriodos.get('/', exigirPermiso('periodos.ver'), (_req, res) => {
  enviarResultado(res, servicio.listarPeriodos())
})

// POST /api/periodos
routerPeriodos.post('/', exigirPermiso('periodos.crear'), validarCuerpo(crearPeriodoSchema), (req, res) => {
  enviarResultado(res, servicio.crearPeriodo(req.body))
})

// POST /api/periodos/:id/activar  (N2: un solo ACTIVO)
routerPeriodos.post('/:id/activar', exigirPermiso('periodos.activar'), (req, res) => {
  enviarResultado(res, servicio.activarPeriodo(String(req.params.id)))
})

// POST /api/periodos/:id/cerrar  (N10: congela escrituras)
routerPeriodos.post('/:id/cerrar', exigirPermiso('periodos.cerrar'), (req, res) => {
  enviarResultado(res, servicio.cerrarPeriodo(String(req.params.id)))
})