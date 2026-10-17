import { leerSesion } from '@/lib/session-store'

/**
 * Cliente HTTP mínimo hacia la API local.
 *
 * En dev, Vite redirige `/api` al servidor Express (:8787). Cada llamada añade
 * el token de la sesión persistida (Authorization: Bearer) salvo que el llamador
 * indique `tokenSesion` explícito (p. ej. validar/logout con un token concreto).
 *
 * Contrato de errores:
 * - Los bodies de la API son los ADT de `shared` (ResultadoServicio /
 *   ResultadoAutenticacion). Los fallos de negocio (ok:false) se devuelven
 *   tal cual para que el consumidor decida (no se lanzan excepciones).
 * - Los fallos de TRANSPORTE (sin red, timeout, body no-JSON, status HTTP
 *   sin cuerpo ADT reconocible) lanzan {@link ApiError} con un mensaje
 *   apto para mostrar al usuario. Las páginas deben envolver en try/catch
 *   o capturar el error en su estado de carga.
 */

/** Error de transporte: red caída, timeout o respuesta HTTP inesperada. */
export class ApiError extends Error {
  /** Status HTTP real; 0 cuando la petición no llegó al servidor. */
  readonly status: number

  constructor(mensaje: string, status = 0) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface OpcionesApi extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit
  tokenSesion?: string
}

/** Timeout de red por petición (ms). Evita pantallas "colgadas". */
const TIMEOUT_MS = 15000

const MENSAJE_TIMEOUT = 'El servidor tardó demasiado en responder. Intenta nuevamente.'
const MENSAJE_RED = 'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.'
const MENSAJE_STATUS = (status: number) => `El servidor respondió con un error (${status}).`

/** Un cuerpo es ADT consumible si tiene `ok` booleano (ResultadoServicio / ResultadoAutenticacion). */
function esCuerpoAdt(cuerpo: unknown): boolean {
  return (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    'ok' in cuerpo &&
    typeof (cuerpo as { ok: unknown }).ok === 'boolean'
  )
}

export async function apiFetch<T = unknown>(
  ruta: string,
  opciones: OpcionesApi = {},
): Promise<T> {
  const { tokenSesion, signal, ...init } = opciones
  const sesion = leerSesion()
  const token = tokenSesion ?? sesion?.token

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  // Timeout propio + cancelación externa combinadas en un solo AbortSignal.
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)
  if (signal) {
    if (signal.aborted) controlador.abort()
    else signal.addEventListener('abort', () => controlador.abort(), { once: true })
  }

  let respuesta: Response
  try {
    respuesta = await fetch(`/api${ruta}`, { ...init, headers, signal: controlador.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(MENSAJE_TIMEOUT)
    }
    throw new ApiError(MENSAJE_RED)
  }

  // El timeout sigue activo durante la lectura del body: un servidor que
  // envíe los headers y luego se cuelgue también aborta con mensaje claro.
  try {
    if (respuesta.status === 204) return undefined as T

    // Body tolerante: vacío o no-JSON no deben reventar con SyntaxError.
    const texto = await respuesta.text()
    let cuerpo: unknown
    if (texto) {
      try {
        cuerpo = JSON.parse(texto) as unknown
      } catch {
        cuerpo = undefined
      }
    }

    if (respuesta.ok) {
      if (cuerpo === undefined) {
        throw new ApiError(MENSAJE_STATUS(respuesta.status), respuesta.status)
      }
      return cuerpo as T
    }

    // HTTP con error: si el cuerpo es el ADT de error (ok booleano), se
    // devuelve tal cual (contrato existente, conservando `motivo` original).
    // Si no hay cuerpo ADT legible, se lanza ApiError.
    if (esCuerpoAdt(cuerpo)) return cuerpo as T
    throw new ApiError(MENSAJE_STATUS(respuesta.status), respuesta.status)
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(MENSAJE_TIMEOUT, respuesta.status)
    }
    throw new ApiError(MENSAJE_RED, respuesta.status)
  } finally {
    clearTimeout(temporizador)
  }
}
