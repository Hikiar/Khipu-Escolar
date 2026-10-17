import { Router } from 'express'
import * as servicio from '../../domain/pagos.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryPagos, queryPagosConceptos } from '../querySchemas.ts'
import {
  registrarPagoSchema,
  crearConceptoPagoSchema,
  actualizarConceptoPagoSchema,
} from '../schemas.ts'

export const routerPagos = Router()

// ─────────────────── Conceptos de pago (cronograma) ───────────────────

// GET /api/pagos/conceptos?periodoId=X
// OR de permisos: `pagos.ver` (PagosPage) o `conceptosPago.ver` (página dedicada).
routerPagos.get(
  '/conceptos',
  exigirAuth,
  exigirPermiso('pagos.ver', 'conceptosPago.ver'),
  validarQuery(queryPagosConceptos),
  async (req, res) => {
    const { periodoId } = req.query as { periodoId?: string }
    enviarResultado(res, await servicio.listarConceptos(periodoId!))
  },
)

// POST /api/pagos/conceptos
routerPagos.post(
  '/conceptos',
  validarCuerpo(crearConceptoPagoSchema),
  exigirAuth,
  exigirPermiso('conceptosPago.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearConcepto(req.body))
  },
)

// PATCH /api/pagos/conceptos/:id  (periodoId NO editable)
routerPagos.patch(
  '/conceptos/:id',
  validarCuerpo(actualizarConceptoPagoSchema),
  exigirAuth,
  exigirPermiso('conceptosPago.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarConcepto(String(req.params.id), req.body))
  },
)

// DELETE /api/pagos/conceptos/:id  (bloqueado si tiene pagos — FK restrict)
routerPagos.delete(
  '/conceptos/:id',
  exigirAuth,
  exigirPermiso('conceptosPago.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.eliminarConcepto(String(req.params.id)))
  },
)

// ───────────────────────────── Pagos ─────────────────────────────

// GET /api/pagos?alumnoId=X[&periodoId=Y]
routerPagos.get('/', exigirAuth, exigirPermiso('pagos.ver'), validarQuery(queryPagos), async (req, res) => {
  const { alumnoId, periodoId } = req.query as { alumnoId?: string; periodoId?: string }
  enviarResultado(res, await servicio.listarPagosDeAlumno(alumnoId!, periodoId))
})

// POST /api/pagos
routerPagos.post(
  '/',
  validarCuerpo(registrarPagoSchema),
  exigirAuth,
  exigirPermiso('pagos.registrar'),
  async (req, res) => {
    enviarResultado(res, await servicio.registrarPago(req.body, req.auth!))
  },
)

// POST /api/pagos/:id/anular
routerPagos.post('/:id/anular', exigirAuth, exigirPermiso('pagos.anular'), async (req, res) => {
  enviarResultado(res, await servicio.anularPago(String(req.params.id)))
})
