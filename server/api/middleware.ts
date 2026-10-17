import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { hasPermission } from '../../shared/authorization.ts'
import type { PermissionCode } from '../../shared/types/rbac.ts'
import { validarSesion } from '../domain/auth.service.ts'
import { registrarAuditoria } from '../infra/repos/auditoria.ts'
import { leerTokenDeAutorizacion } from './helpers.ts'

/** Exige sesión válida (Authorization: Bearer <token>); adjunta el AuthUser. */
export async function exigirAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = leerTokenDeAutorizacion(req.headers.authorization)
  if (!token) {
    res.status(401).json({ ok: false, error: 'SESSION_EXPIRED' })
    return
  }

  const resultado = await validarSesion(token)
  if ('error' in resultado) {
    res.status(401).json({ ok: false, error: resultado.error })
    return
  }

  req.auth = resultado.sesion.usuario
  req.token = token
  next()
}

/** Exige que el usuario tenga AL MENOS uno de los permisos listados. */
export function exigirPermiso(...requeridos: PermissionCode[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permisos = req.auth?.permisos ?? []
    if (!req.auth) {
      res.status(401).json({ ok: false, error: 'SESSION_REQUIRED' })
      return
    }
    if (!requeridos.some((permiso) => hasPermission(permisos, permiso))) {
      res.status(403).json({ ok: false, error: 'FORBIDDEN' })
      return
    }
    next()
  }
}

/** Valida `req.query` contra un esquema zod; rechaza con 400 si no cumple. */
export function validarQuery<TSchema extends z.ZodType>(schema: TSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parseado = schema.safeParse(req.query)
    if (!parseado.success) {
      res.status(400).json({
        ok: false,
        motivo: 'invalido',
        error: 'Los parámetros de consulta no son válidos.',
        detalles: parseado.error.issues.map((issue) => ({
          ruta: issue.path.join('.'),
          mensaje: issue.message,
        })),
      })
      return
    }
    next()
  }
}

/** Valida `req.body` contra un esquema zod; reemplaza el body con el dato parseado. */
export function validarCuerpo<TSchema extends z.ZodType>(schema: TSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parseado = schema.safeParse(req.body)
    if (!parseado.success) {
      res.status(400).json({
        ok: false,
        motivo: 'invalido',
        error: 'El cuerpo de la petición no es válido.',
        detalles: parseado.error.issues.map((issue) => ({
          ruta: issue.path.join('.'),
          mensaje: issue.message,
        })),
      })
      return
    }
    req.body = parseado.data
    next()
  }
}

/**
 * Bitácora: registra toda mutación de la API (POST/PUT/PATCH/DELETE).
 * Debe montarse ANTES de los routers; el usuario se lee en `finish`
 * (momento en que `req.auth` ya fue resuelto por la cadena de auth).
 */
export function auditarMutaciones(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const esMutacion =
    req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS'
  const esApi = req.path.startsWith('/api/')

  if (esMutacion && esApi) {
    res.on('finish', () => {
      registrarAuditoria({
        usuarioId: req.auth?.id ?? null,
        metodo: req.method,
        ruta: req.originalUrl,
        status: res.statusCode,
        ip: req.ip ?? null,
      })
    })
  }
  next()
}