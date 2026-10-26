import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResultadoServicio } from '@/types/operations'

export type EstadoCarga = 'cargando' | 'ok' | 'error'

/**
 * Carga un recurso una sola vez (con reintento). `habilitado` permite
 * desactivar la carga (p. ej. un tab sin permiso); al desactivarse deja
 * el recurso vacío con estado 'ok'. `clave` fuerza una recarga cuando el
 * recurso depende de un identificador que puede cambiar (p. ej. el id de
 * la sección seleccionada) sin que lo haga el booleano `habilitado`.
 */
export function useCarga<T>(
  fetcher: () => Promise<ResultadoServicio<T>>,
  habilitado = true,
  clave?: string | number | null,
) {
  const [data, setData] = useState<T | null>(null)
  const [estado, setEstado] = useState<EstadoCarga>(habilitado ? 'cargando' : 'ok')
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const cargar = useCallback(async () => {
    if (!habilitado) {
      setData(null)
      setError(null)
      setEstado('ok')
      return
    }
    setEstado('cargando')
    setError(null)
    const resultado = await fetcherRef.current()
    if ('ok' in resultado && resultado.ok) {
      setData(resultado.data)
      setEstado('ok')
    } else {
      setError('error' in resultado ? resultado.error : 'Ocurrió un error.')
      setEstado('error')
    }
  }, [habilitado, clave])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { data, estado, error, recargar: cargar }
}