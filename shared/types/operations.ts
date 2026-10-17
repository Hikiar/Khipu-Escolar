/** Resultado tipado común para los servicios (patrón ADT lista para una API real). */
export type MotivoFallo = 'no-disponible' | 'no-encontrado' | 'invalido'

export type ResultadoServicio<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; motivo: MotivoFallo }

export function exito<T>(data: T): ResultadoServicio<T> {
  return { ok: true, data }
}

export function fallo<T>(
  motivo: MotivoFallo,
  error: string,
): ResultadoServicio<T> {
  return { ok: false, motivo, error }
}

/**
 * Paginación de listados grandes (opt-in desde la API).
 * El frontend sigue usando listas completas; los clientes pueden pedir
 * `?pagina=N&limite=M` y reciben `{ items, total, pagina, totalPaginas }`.
 */
export interface Paginacion {
  pagina: number
  limite: number
}

export interface ListadoConTotal<T> {
  items: T[]
  total: number
  pagina: number
  totalPaginas: number
}

export function paginar<T>(items: T[], total: number, pag: Paginacion): ListadoConTotal<T> {
  return {
    items: items.slice((pag.pagina - 1) * pag.limite, pag.pagina * pag.limite),
    total,
    pagina: pag.pagina,
    totalPaginas: total === 0 ? 0 : Math.max(1, Math.ceil(total / pag.limite)),
  }
}