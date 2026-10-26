import { Router } from 'express'
import type { Request } from 'express'
import * as catalogo from '../../domain/catalogo.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, validarQuery } from '../middleware.ts'
import { hasPermission } from '../../../shared/authorization.ts'
import { queryClaseCurso, queryClasesCatalogo } from '../querySchemas.ts'

/**
 * Catálogo académico de solo lectura (autenticado).
 * Sirve datos de referencia para poblar selectores y grillas del frontend.
 *
 * SCOPE: un docente (sin `alumnos.verTodos`) solo puede consultar sus propias
 * clases y las de sus alumnos; el resto de roles autenticados ve el total.
 */
export const routerCatalogo = Router()

routerCatalogo.use(exigirAuth)

function esAdminAcademico(req: Request): boolean {
  return hasPermission(req.auth?.permisos ?? [], 'alumnos.verTodos')
}

/** Para un docente no administrador, verificar pertenencia a la Clase. */
function claseAccesible(req: Request, claseId: string): boolean {
  if (esAdminAcademico(req)) return true
  return catalogo.puedeDocenteVerClase(req.auth!.persona.id, claseId)
}

// GET /api/clases[?docenteId=X][?periodoId=X][?abiertas=1]  → listado único de clases
routerCatalogo.get('/clases', validarQuery(queryClasesCatalogo), async (req, res) => {
  const { docenteId, periodoId, abiertas } = req.query as {
    docenteId?: string
    periodoId?: string
    abiertas?: string
  }
  // Un docente no administrador solo puede listar SUS clases (se ignora otro docenteId).
  // Un administrador puede filtrar por docenteId; si no lo indica, se listan todas.
  const docenteBuscado = esAdminAcademico(req) ? docenteId : req.auth!.persona.id
  if (docenteBuscado) {
    enviarResultado(res, await catalogo.listarClasesDeDocente(docenteBuscado))
    return
  }
  if (periodoId) {
    enviarResultado(res, await catalogo.listarClasesDePeriodo(periodoId))
    return
  }
  enviarResultado(res, catalogo.listarClases(abiertas === '1' || abiertas === 'true'))
})

// GET /api/clases/:claseId/alumnos  → alumnos con matrícula ACTIVA en la clase
routerCatalogo.get('/clases/:claseId/alumnos', async (req, res) => {
  const claseId = String(req.params.claseId)
  if (!claseAccesible(req, claseId)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }
  enviarResultado(res, await catalogo.listarAlumnosDeClase(claseId))
})

// GET /api/clases/:claseId/cursos  → cursos dictados en la clase (AsignacionCurso)
routerCatalogo.get('/clases/:claseId/cursos', async (req, res) => {
  const claseId = String(req.params.claseId)
  if (!claseAccesible(req, claseId)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }
  enviarResultado(res, await catalogo.listarCursosDeClase(claseId))
})

// GET /api/clases/:claseId/competencias?cursoId=X
routerCatalogo.get('/clases/:claseId/competencias', validarQuery(queryClaseCurso), async (req, res) => {
  const claseId = String(req.params.claseId)
  if (!claseAccesible(req, claseId)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }
  const { cursoId } = req.query as { cursoId?: string }
  enviarResultado(res, await catalogo.listarCompetenciasDeClaseYCurso(claseId, cursoId!))
})

// GET /api/clases/:claseId/configuracion?cursoId=X
routerCatalogo.get('/clases/:claseId/configuracion', validarQuery(queryClaseCurso), async (req, res) => {
  const claseId = String(req.params.claseId)
  if (!claseAccesible(req, claseId)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }
  const { cursoId } = req.query as { cursoId?: string }
  enviarResultado(res, await catalogo.listarConfiguracionDeClaseYCurso(claseId, cursoId!))
})

// GET /api/periodo-activo
routerCatalogo.get('/periodo-activo', (_req, res) => {
  enviarResultado(res, catalogo.listarPeriodoActivo())
})