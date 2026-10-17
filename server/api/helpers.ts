import type { Response } from 'express'
import type { ResultadoAutenticacion } from '../../shared/types/auth.ts'
import type { ResultadoServicio } from '../../shared/types/operations.ts'

/**
 * Helpers de serialización HTTP de los ADT compartidos.
 * El body se devuelve tal cual (mismo contrato que el frontend consume),
 * solo se traduce el motivo de fallo a código de estado.
 */

const statusDeMotivo = {
  'no-encontrado': 404,
  invalido: 400,
  'no-disponible': 503,
} as const

export function enviarResultado<T>(res: Response, resultado: ResultadoServicio<T>): void {
  if ('error' in resultado) {
    res.status(statusDeMotivo[resultado.motivo]).json(resultado)
    return
  }
  res.status(200).json(resultado)
}

export function enviarAuth(res: Response, resultado: ResultadoAutenticacion): void {
  if ('error' in resultado) {
    const estatus = resultado.error === 'SERVER_ERROR' ? 500 : 401
    res.status(estatus).json(resultado)
    return
  }
  res.status(200).json(resultado)
}

export function leerTokenDeAutorizacion(valor: string | undefined): string | null {
  if (!valor) return null
  const partes = valor.trim().split(' ')
  if (partes[0] !== 'Bearer' || !partes[1]) return null
  return partes[1]
}

/** Lee un parámetro de query (string) y lo devuelve limpio, o null si falta/es inválido. */
export function leerParametroCadena(valor: unknown): string | null {
  if (Array.isArray(valor) || typeof valor !== 'string') return null
  const limpio = valor.trim()
  return limpio ? limpio : null
}