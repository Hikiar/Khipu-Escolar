import { Router } from 'express'
import * as servicio from '../../domain/asistencia.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryAsistencia } from '../querySchemas.ts'
import { actualizarAsistenciaSchema, registrarAsistenciaSchema } from '../schemas.ts'

export const routerAsistencia = Router()

// GET /api/asistencia?claseId=X[&fecha=YYYY-MM-DD][&cursoId=Y]
routerAsistencia.get(
  '/',
  exigirAuth,
  exigirPermiso('asistencia.ver'),
  validarQuery(queryAsistencia),
  async (req, res) => {
    const { claseId, cursoId, fecha } = req.query as {
      claseId?: string
      cursoId?: string
      fecha?: string
    }
    if (fecha) {
      enviarResultado(res, await servicio.obtenerAsistencia(claseId!, fecha, cursoId))
      return
    }
    enviarResultado(res, await servicio.listarAsistenciasDeClase(claseId!, cursoId ?? null))
  },
)

// GET /api/asistencia/alcances/:claseId
// Alcances (AULA y/o CURSOS) que el usuario autenticado puede registrar en la clase.
routerAsistencia.get(
  '/alcances/:claseId',
  exigirAuth,
  exigirPermiso('asistencia.registrar'),
  async (req, res) => {
    const usuarioId = req.auth?.id ?? ''
    enviarResultado(
      res,
      servicio.listarAlcancesDeClase(String(req.params.claseId), usuarioId),
    )
  },
)

// GET /api/asistencia/:id
routerAsistencia.get('/:id', exigirAuth, exigirPermiso('asistencia.ver'), async (req, res) => {
  enviarResultado(res, await servicio.obtenerAsistenciaPorId(String(req.params.id)))
})

// POST /api/asistencia
routerAsistencia.post(
  '/',
  validarCuerpo(registrarAsistenciaSchema),
  exigirAuth,
  exigirPermiso('asistencia.registrar'),
  async (req, res) => {
    enviarResultado(res, await servicio.registrarAsistencia(req.body, req.auth!))
  },
)

// PUT /api/asistencia/:id
routerAsistencia.put(
  '/:id',
  validarCuerpo(actualizarAsistenciaSchema),
  exigirAuth,
  exigirPermiso('asistencia.registrar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarAsistencia(String(req.params.id), req.body, req.auth!))
  },
)