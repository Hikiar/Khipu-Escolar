import { Router } from 'express'
import * as servicio from '../../domain/docentes.service.ts'
import * as expediente from '../../domain/expediente.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { queryDocentes } from '../querySchemas.ts'
import { crearDocenteSchema, actualizarDocenteSchema } from '../schemas.ts'

export const routerDocentes = Router()

routerDocentes.use(exigirAuth)

// GET /api/docentes[?estado=ACTIVO|INACTIVO&pagina=1&limite=50]
routerDocentes.get('/', exigirPermiso('profesores.ver'), validarQuery(queryDocentes), async (req, res) => {
  const { estado, pagina, limite } = req.query as {
    estado?: 'ACTIVO' | 'INACTIVO'
    pagina?: string
    limite?: string
  }
  const paginacion =
    pagina || limite
      ? { pagina: Number(pagina ?? 1), limite: Number(limite ?? 50) }
      : undefined
  enviarResultado(res, await servicio.listarDocentes(estado, paginacion))
})

// GET /api/docentes/:id
routerDocentes.get('/:id', exigirPermiso('profesores.ver'), async (req, res) => {
  enviarResultado(res, await servicio.obtenerDocente(String(req.params.id)))
})

// GET /api/docentes/:id/expediente — ficha: datos + tutoría + carga horaria
routerDocentes.get('/:id/expediente', exigirPermiso('profesores.ver'), async (req, res) => {
  enviarResultado(res, await expediente.obtenerExpedienteDocente(String(req.params.id)))
})

// POST /api/docentes
routerDocentes.post(
  '/',
  validarCuerpo(crearDocenteSchema),
  exigirPermiso('profesores.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearDocente(req.body))
  },
)

// PATCH /api/docentes/:id
routerDocentes.patch(
  '/:id',
  validarCuerpo(actualizarDocenteSchema),
  exigirPermiso('profesores.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarDocente(String(req.params.id), req.body))
  },
)

// POST /api/docentes/:id/desactivar
routerDocentes.post('/:id/desactivar', exigirPermiso('profesores.eliminar'), async (req, res) => {
  enviarResultado(res, await servicio.desactivarDocente(String(req.params.id)))
})

// POST /api/docentes/:id/reactivar
routerDocentes.post('/:id/reactivar', exigirPermiso('profesores.editar'), async (req, res) => {
  enviarResultado(res, await servicio.reactivarDocente(String(req.params.id)))
})

// POST /api/docentes/:id/cuenta — crea la cuenta de acceso del docente
routerDocentes.post('/:id/cuenta', exigirPermiso('usuarios.gestionar'), async (req, res) => {
  enviarResultado(res, await servicio.crearCuentaDocente(String(req.params.id)))
})