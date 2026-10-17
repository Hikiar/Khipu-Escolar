import { Router } from 'express'
import * as servicio from '../../domain/roles.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo } from '../middleware.ts'
import {
  actualizarRolSchema,
  crearRolSchema,
  permisosSchema,
} from '../schemas.ts'

export const routerRoles = Router()

// El listado se expone a quien administra roles o usuarios (la página de
// usuarios muestra los nombres de rol).
routerRoles.use(exigirAuth, exigirPermiso('roles.gestionar', 'usuarios.gestionar'))

routerRoles.get('/', async (_req, res) => {
  enviarResultado(res, await servicio.listarRoles())
})

routerRoles.get('/activos', async (_req, res) => {
  enviarResultado(res, await servicio.listarRolesActivos())
})

routerRoles.post('/', exigirPermiso('roles.gestionar'), validarCuerpo(crearRolSchema), async (req, res) => {
  enviarResultado(res, await servicio.crearRol(req.body))
})

routerRoles.patch('/:id', exigirPermiso('roles.gestionar'), validarCuerpo(actualizarRolSchema), async (req, res) => {
  enviarResultado(res, await servicio.actualizarRol(String(req.params.id), req.body))
})

routerRoles.put('/:id/permisos', exigirPermiso('roles.gestionar'), validarCuerpo(permisosSchema), async (req, res) => {
  enviarResultado(res, await servicio.actualizarPermisosDeRol(String(req.params.id), req.body.permisos))
})