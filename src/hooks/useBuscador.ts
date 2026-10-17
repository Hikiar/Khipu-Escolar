import { useMemo, useState } from 'react'

export interface UseBuscador<T> {
  busqueda: string
  setBusqueda: (valor: string) => void
  pagina: number
  setPagina: (pagina: number) => void
  totalPaginas: number
  total: number
  inicio: number
  fin: number
  visibles: T[]
}

const TAMANO_PAGINA = 10

/**
 * Búsqueda en memoria + paginación local para tablas.
 * Filtra `items` por los campos indicados y pagina el resultado.
 */
export function useBuscador<T>(
  items: T[],
  campos: (item: T) => string[],
  tamanoPagina: number = TAMANO_PAGINA,
): UseBuscador<T> {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const normalizada = busqueda.trim().toLowerCase()

  const filtrados = useMemo(() => {
    if (!normalizada) return items
    return items.filter((item) =>
      campos(item).some((valor) => valor.toLowerCase().includes(normalizada)),
    )
  }, [items, normalizada, campos])

  const total = filtrados.length
  const totalPaginas = Math.max(1, Math.ceil(total / tamanoPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * tamanoPagina
  const fin = Math.min(inicio + tamanoPagina, total)

  const visibles = useMemo(() => {
    return filtrados.slice(inicio, fin)
  }, [filtrados, inicio, fin])

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  return {
    busqueda,
    setBusqueda: cambiarBusqueda,
    pagina: paginaActual,
    setPagina,
    totalPaginas,
    total,
    inicio,
    fin,
    visibles,
  }
}