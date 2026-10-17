import { Router } from 'express'
import * as servicio from '../../domain/cursos.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryCursos } from '../querySchemas.ts'
import { crearCursoSchema, actualizarCursoSchema } from '../schemas.ts'

export const routerCursos = Router()

routerCursos.use(exigirAuth)

// GET /api/cursos[?activos=true]
routerCursos.get('/', exigirPermiso('cursos.ver'), validarQuery(queryCursos), async (req, res) => {
  const { activos } = req.query as { activos?: string }
  enviarResultado(res, await servicio.listarCursos(activos !== 'false'))
})

// GET /api/cursos/:id
routerCursos.get('/:id', exigirPermiso('cursos.ver'), async (req, res) => {
  enviarResultado(res, await servicio.obtenerCurso(String(req.params.id)))
})

// POST /api/cursos
routerCursos.post(
  '/',
  validarCuerpo(crearCursoSchema),
  exigirPermiso('cursos.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearCurso(req.body))
  },
)

// PATCH /api/cursos/:id
routerCursos.patch(
  '/:id',
  validarCuerpo(actualizarCursoSchema),
  exigirPermiso('cursos.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarCurso(String(req.params.id), req.body))
  },
)

// POST /api/cursos/:id/desactivar
routerCursos.post('/:id/desactivar', exigirPermiso('cursos.eliminar'), async (req, res) => {
  enviarResultado(res, await servicio.desactivarCurso(String(req.params.id)))
})

// POST /api/cursos/:id/reactivar
routerCursos.post('/:id/reactivar', exigirPermiso('cursos.editar'), async (req, res) => {
  enviarResultado(res, await servicio.reactivarCurso(String(req.params.id)))
})