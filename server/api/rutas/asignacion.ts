import { Router } from 'express'
import * as servicio from '../../domain/asignacion.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryAsignaciones } from '../querySchemas.ts'
import { crearAsignacionSchema, asignacionMasivaSchema } from '../schemas.ts'

export const routerAsignacion = Router()

routerAsignacion.use(exigirAuth)

// GET /api/asignaciones?claseId=X&docenteId=X
routerAsignacion.get(
  '/',
  exigirPermiso('asignaciones.ver'),
  validarQuery(queryAsignaciones),
  async (req, res) => {
    const { claseId, docenteId } = req.query as { claseId?: string; docenteId?: string }

    if (claseId) {
      enviarResultado(res, await servicio.listarAsignacionesDeClase(claseId))
      return
    }
    if (docenteId) {
      enviarResultado(res, await servicio.listarAsignacionesDeDocente(docenteId))
      return
    }
    // Si no hay filtros, listar todas (solo admin)
    enviarResultado(res, await servicio.listarAsignaciones())
  },
)

// GET /api/asignaciones/:claseId/:cursoId/:docenteId
routerAsignacion.get(
  '/:claseId/:cursoId/:docenteId',
  exigirPermiso('asignaciones.ver'),
  async (req, res) => {
    enviarResultado(
      res,
      await servicio.obtenerAsignacion(
        String(req.params.claseId),
        String(req.params.cursoId),
        String(req.params.docenteId),
      ),
    )
  },
)

// POST /api/asignaciones/masivas — asigna todos los cursos del aula sin docente (tutor generalista)
routerAsignacion.post(
  '/masivas',
  validarCuerpo(asignacionMasivaSchema),
  exigirPermiso('asignaciones.crear'),
  async (req, res) => {
    const { claseId, docenteId } = req.body
    enviarResultado(res, await servicio.asignarTodosLosCursosDeClase(claseId, docenteId))
  },
)

// POST /api/asignaciones
routerAsignacion.post(
  '/',
  validarCuerpo(crearAsignacionSchema),
  exigirPermiso('asignaciones.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearAsignacion(req.body))
  },
)

// DELETE /api/asignaciones/:claseId/:cursoId/:docenteId
routerAsignacion.delete(
  '/:claseId/:cursoId/:docenteId',
  exigirPermiso('asignaciones.eliminar'),
  async (req, res) => {
    enviarResultado(
      res,
      await servicio.eliminarAsignacion(
        String(req.params.claseId),
        String(req.params.cursoId),
        String(req.params.docenteId),
      ),
    )
  },
)