import { Router } from 'express'
import * as servicio from '../../domain/usuarios.service.ts'
import { enviarResultado } from '../helpers.ts'
import { exigirAuth, exigirPermiso, validarCuerpo } from '../middleware.ts'
import { asignarRolesSchema, crearUsuarioSchema } from '../schemas.ts'

export const routerUsuarios = Router()

routerUsuarios.use(exigirAuth, exigirPermiso('usuarios.gestionar'))

routerUsuarios.get('/', async (_req, res) => {
  enviarResultado(res, await servicio.listarUsuarios())
})

routerUsuarios.post('/', validarCuerpo(crearUsuarioSchema), async (req, res) => {
  enviarResultado(res, await servicio.crearUsuario(req.body))
})

routerUsuarios.post('/:id/desactivar', async (req, res) => {
  enviarResultado(res, await servicio.desactivarUsuario(String(req.params.id)))
})

routerUsuarios.post('/:id/reactivar', async (req, res) => {
  enviarResultado(res, await servicio.reactivarUsuario(String(req.params.id)))
})

routerUsuarios.put('/:id/roles', validarCuerpo(asignarRolesSchema), async (req, res) => {
  enviarResultado(res, await servicio.asignarRoles(String(req.params.id), req.body.rolIds))
})

routerUsuarios.post('/:id/restablecer-password', async (req, res) => {
  enviarResultado(res, await servicio.restablecerContrasena(String(req.params.id)))
})

// Re-mostrar la contraseña temporal vigente (solo mientras deba cambiarse).
routerUsuarios.get('/:id/password-temporal', async (req, res) => {
  enviarResultado(res, await servicio.verPasswordTemporal(String(req.params.id)))
})

// Lookup previo al alta: ¿ya existe la persona? ¿ya tiene cuenta? (reusa su código).
routerUsuarios.get('/buscar-persona', async (req, res) => {
  const dni = String(req.query.dni ?? '')
  enviarResultado(res, await servicio.buscarPersonaParaCuenta(dni))
})