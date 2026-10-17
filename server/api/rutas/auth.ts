import { Router } from 'express'
import {
  cambiarContrasena,
  cerrarSesion,
  iniciarSesion,
  iniciarSesionDemo,
  validarSesion,
} from '../../domain/auth.service.ts'
import { enviarAuth, enviarResultado } from '../helpers.ts'
import { exigirAuth, validarCuerpo } from '../middleware.ts'
import {
  cambiarContrasenaSchema,
  credencialesSchema,
  loginDemoSchema,
  tokenSesionSchema,
} from '../schemas.ts'

export const routerAuth = Router()

routerAuth.post('/login', validarCuerpo(credencialesSchema), async (req, res) => {
  enviarAuth(res, await iniciarSesion(req.body))
})

routerAuth.post('/demo', validarCuerpo(loginDemoSchema), async (req, res) => {
  enviarAuth(res, await iniciarSesionDemo(req.body.rolId))
})

routerAuth.post('/validar', validarCuerpo(tokenSesionSchema), async (req, res) => {
  enviarAuth(res, await validarSesion(req.body.token))
})

routerAuth.post('/logout', validarCuerpo(tokenSesionSchema), async (req, res) => {
  await cerrarSesion(req.body.token)
  res.status(204).end()
})

/** Quién soy (sesión actual desde el header Bearer). */
routerAuth.get('/me', exigirAuth, (req, res) => {
  res.json({ ok: true, usuario: req.auth })
})

/** POST /api/auth/cambiar-contrasena — cambia la contraseña de la sesión actual. */
routerAuth.post(
  '/cambiar-contrasena',
  exigirAuth,
  validarCuerpo(cambiarContrasenaSchema),
  async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ ok: false, error: 'SESSION_EXPIRED' })
      return
    }
    enviarResultado(
      res,
      await cambiarContrasena(req.auth.id, req.body.passwordActual, req.body.passwordNueva),
    )
  },
)