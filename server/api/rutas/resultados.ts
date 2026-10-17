import { Router } from 'express'
import * as servicio from '../../domain/promedios.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarQuery } from '../middleware.ts'
import { queryResultados } from '../querySchemas.ts'

export const routerResultados = Router()

routerResultados.use(exigirAuth)

// GET /api/resultados?claseId=X&cursoId=Y  → todos los alumnos con matrícula ACTIVA
routerResultados.get(
  '/',
  exigirPermiso('notas.ver'),
  validarQuery(queryResultados),
  async (req, res) => {
    const { claseId, cursoId } = req.query as { claseId?: string; cursoId?: string }
    enviarResultado(res, await servicio.calcularResultadosDeClase(claseId!, cursoId!))
  },
)

// GET /api/resultados/:alumnoId?claseId=X&cursoId=Y  → resultado de un alumno
routerResultados.get(
  '/:alumnoId',
  exigirPermiso('notas.ver'),
  validarQuery(queryResultados),
  async (req, res) => {
    const { claseId, cursoId } = req.query as { claseId?: string; cursoId?: string }
    enviarResultado(
      res,
      await servicio.calcularResultadoCurso(claseId!, cursoId!, String(req.params.alumnoId)),
    )
  },
)