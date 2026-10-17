import { Router } from 'express'
import type { Request } from 'express'
import * as servicio from '../../domain/alumnos.service.ts'
import * as expediente from '../../domain/expediente.service.ts'
import * as catalogo from '../../domain/catalogo.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo, validarQuery } from '../middleware.ts'
import { hasPermission } from '../../../shared/authorization.ts'
import { queryAlumnos } from '../querySchemas.ts'
import { crearAlumnoSchema, actualizarAlumnoSchema } from '../schemas.ts'

export const routerAlumnos = Router()

routerAlumnos.use(exigirAuth)

/**
 * Scope de datos: un docente (sin `alumnos.verTodos`) solo puede acceder a
 * alumnos con matrícula ACTIVA en alguna de sus clases; el resto ve el total.
 */
function alumnadoAccesible(req: Request, alumnoId: string): boolean {
  if (hasPermission(req.auth?.permisos ?? [], 'alumnos.verTodos')) return true
  return catalogo.puedeDocenteVerAlumno(req.auth!.persona.id, alumnoId)
}

// GET /api/alumnos[?estado=ACTIVO|INACTIVO&pagina=1&limite=50]
routerAlumnos.get('/', exigirPermiso('alumnos.verTodos'), validarQuery(queryAlumnos), async (req, res) => {
  const { estado, pagina, limite } = req.query as {
    estado?: 'ACTIVO' | 'INACTIVO'
    pagina?: string
    limite?: string
  }
  const paginacion =
    pagina || limite
      ? { pagina: Number(pagina ?? 1), limite: Number(limite ?? 50) }
      : undefined
  enviarResultado(res, await servicio.listarAlumnos(estado, paginacion))
})

// GET /api/alumnos/:id
routerAlumnos.get('/:id', exigirPermiso('alumnos.ver'), async (req, res) => {
  const alumnoId = String(req.params.id)
  if (!alumnadoAccesible(req, alumnoId)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }
  enviarResultado(res, await servicio.obtenerAlumno(alumnoId))
})

// GET /api/alumnos/:id/expediente — ficha: datos + apoderados + matrículas
routerAlumnos.get('/:id/expediente', exigirPermiso('alumnos.ver'), async (req, res) => {
  const alumnoId = String(req.params.id)
  if (!alumnadoAccesible(req, alumnoId)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }
  enviarResultado(res, await expediente.obtenerExpedienteAlumno(alumnoId))
})

// GET /api/alumnos/:id/historial-asistencia — asistencias por alumno
routerAlumnos.get(
  '/:id/historial-asistencia',
  exigirPermiso('asistencia.ver'),
  async (req, res) => {
    const alumnoId = String(req.params.id)
    if (!alumnadoAccesible(req, alumnoId)) {
      res.status(403).json({ ok: false, error: 'FORBIDDEN' })
      return
    }
    enviarResultado(res, await expediente.historicoAsistenciaAlumno(alumnoId))
  },
)

// GET /api/alumnos/:id/resultados — calificaciones derivadas de la matrícula activa
routerAlumnos.get('/:id/resultados', exigirPermiso('notas.ver'), async (req, res) => {
  const alumnoId = String(req.params.id)
  if (!alumnadoAccesible(req, alumnoId)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }
  enviarResultado(res, await expediente.resultadosDeAlumno(alumnoId))
})

// POST /api/alumnos
routerAlumnos.post(
  '/',
  validarCuerpo(crearAlumnoSchema),
  exigirPermiso('alumnos.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.crearAlumno(req.body))
  },
)

// PATCH /api/alumnos/:id
routerAlumnos.patch(
  '/:id',
  validarCuerpo(actualizarAlumnoSchema),
  exigirPermiso('alumnos.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarAlumno(String(req.params.id), req.body))
  },
)

// POST /api/alumnos/:id/desactivar
routerAlumnos.post('/:id/desactivar', exigirPermiso('alumnos.eliminar'), async (req, res) => {
  enviarResultado(res, await servicio.desactivarAlumno(String(req.params.id)))
})

// POST /api/alumnos/:id/reactivar
routerAlumnos.post('/:id/reactivar', exigirPermiso('alumnos.editar'), async (req, res) => {
  enviarResultado(res, await servicio.reactivarAlumno(String(req.params.id)))
})