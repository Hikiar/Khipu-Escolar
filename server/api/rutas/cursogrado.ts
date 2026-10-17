import { Router } from 'express'
import * as servicio from '../../domain/cursogrado.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo } from '../middleware.ts'
import { agregarCursoAGradoSchema, actualizarCursoGradoSchema } from '../schemas.ts'

export const routerCursoGrado = Router()

routerCursoGrado.use(exigirAuth)

// GET /api/cursos/:cursoId/grados  → grados donde está el curso
routerCursoGrado.get('/cursos/:cursoId/grados', exigirPermiso('cursos.ver'), async (req, res) => {
  enviarResultado(res, await servicio.listarGradosDeCurso(String(req.params.cursoId)))
})

// POST /api/cursos/:cursoId/grados  → agregar curso a grado
routerCursoGrado.post(
  '/cursos/:cursoId/grados',
  validarCuerpo(agregarCursoAGradoSchema),
  exigirPermiso('cursos.crear'),
  async (req, res) => {
    enviarResultado(res, await servicio.agregarCursoAGrado({ ...req.body, cursoId: String(req.params.cursoId) }))
  },
)

// PATCH /api/cursos/:cursoId/grados/:gradoId  → editar horas/orden
routerCursoGrado.patch(
  '/cursos/:cursoId/grados/:gradoId',
  validarCuerpo(actualizarCursoGradoSchema),
  exigirPermiso('cursos.editar'),
  async (req, res) => {
    enviarResultado(res, await servicio.actualizarCursoGrado(String(req.params.cursoId), String(req.params.gradoId), req.body))
  },
)

// DELETE /api/cursos/:cursoId/grados/:gradoId  → quitar curso de grado
routerCursoGrado.delete(
  '/cursos/:cursoId/grados/:gradoId',
  exigirPermiso('cursos.eliminar'),
  async (req, res) => {
    enviarResultado(res, await servicio.quitarCursoDeGrado(String(req.params.cursoId), String(req.params.gradoId)))
  },
)

// GET /api/grados/:gradoId/cursos  → cursos del grado (ya existe en catalogo, pero exponemos aquí también para consistencia)
routerCursoGrado.get('/grados/:gradoId/cursos', exigirPermiso('grados.ver'), async (req, res) => {
  enviarResultado(res, await servicio.listarCursosDeGrado(String(req.params.gradoId)))
})