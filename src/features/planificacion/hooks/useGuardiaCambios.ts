import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Guardia de cambios sin guardar para el `BrowserRouter` declarativo (sin
 * data router, por lo que `useBlocker` no está disponible).
 *
 * Intercepta tres salidas:
 * - `beforeunload` (recarga/cierre de pestaña),
 * - `popstate` en fase de captura (evita que React Router aplique el cambio),
 * - clics en enlaces internos (`<a href="/...">`).
 *
 * Cuando hay un destino pendiente se expone `destino` para mostrar el diálogo.
 */
export function useGuardiaCambios({
  sucio,
  guardar,
}: {
  sucio: boolean
  guardar: () => Promise<boolean>
}) {
  const navigate = useNavigate()
  const [destino, setDestino] = useState<string | null>(null)
  const [guardandoSalida, setGuardandoSalida] = useState(false)
  const ignorarRef = useRef(false)

  useEffect(() => {
    if (!sucio) return
    const handler = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sucio])

  useEffect(() => {
    if (!sucio) return
    const actual = window.location.pathname + window.location.search + window.location.hash
    const onPopState = (evento: PopStateEvent) => {
      if (ignorarRef.current) return
      // popstate ya actualizó la URL al destino: capturarlo antes de restaurar.
      const objetivo = window.location.pathname + window.location.search + window.location.hash
      evento.stopImmediatePropagation()
      window.history.pushState(null, '', actual)
      setDestino(objetivo)
    }
    window.addEventListener('popstate', onPopState, true)
    return () => window.removeEventListener('popstate', onPopState, true)
  }, [sucio])

  useEffect(() => {
    if (!sucio) return
    const onClick = (evento: MouseEvent) => {
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return
      }
      const objetivo = evento.target as HTMLElement | null
      const ancla = objetivo?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!ancla) return
      const href = ancla.getAttribute('href') ?? ''
      if (!href.startsWith('/') || href.startsWith('//')) return
      const actual = window.location.pathname + window.location.search + window.location.hash
      if (href === actual) return
      evento.preventDefault()
      evento.stopPropagation()
      setDestino(href)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [sucio])

  const salir = useCallback(
    (objetivo: string) => {
      ignorarRef.current = true
      setDestino(null)
      navigate(objetivo)
      window.setTimeout(() => {
        ignorarRef.current = false
      }, 0)
    },
    [navigate],
  )

  const descartar = useCallback(() => {
    if (destino) salir(destino)
  }, [destino, salir])

  const guardarYSalir = useCallback(async () => {
    if (!destino) return
    setGuardandoSalida(true)
    let ok = false
    try {
      ok = await guardar()
    } catch {
      ok = false
    }
    setGuardandoSalida(false)
    if (ok) salir(destino)
    else setDestino(null)
  }, [destino, guardar, salir])

  const seguirEditando = useCallback(() => setDestino(null), [])

  return { destino, guardandoSalida, descartar, guardarYSalir, seguirEditando }
}
