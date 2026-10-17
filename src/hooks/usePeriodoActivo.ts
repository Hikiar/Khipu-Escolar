import { useEffect, useState } from 'react'
import {
  obtenerPeriodoActivo,
  type PeriodoAcademico,
} from '@/services/periodosService'

let cachePeriodo: PeriodoAcademico | null | undefined
let peticionEnVuelo: Promise<PeriodoAcademico | null> | null = null
let huboError = false
let suscriptores: Array<() => void> = []

/**
 * Carga compartida del período activo. Los suscriptores concurrentes comparten
 * una única petición (dedupe) para no disparar N GET al invalidar (M3).
 * Un fallo transitorio NO se cachea como "sin año activo" (M4): se marca
 * `huboError` y se reintenta en el próximo ciclo.
 */
async function cargarPeriodo(): Promise<PeriodoAcademico | null> {
  if (cachePeriodo !== undefined) return cachePeriodo
  if (peticionEnVuelo) return peticionEnVuelo

  peticionEnVuelo = (async () => {
    try {
      const res = await obtenerPeriodoActivo()
      if (res.ok === false) {
        huboError = true
        // No cachear el error: conservar el último valor conocido si lo hay.
        return cachePeriodo ?? null
      }
      huboError = false
      cachePeriodo = res.data
      return res.data
    } catch {
      huboError = true
      return cachePeriodo ?? null
    } finally {
      peticionEnVuelo = null
    }
  })()

  return peticionEnVuelo
}

/**
 * Invalida el caché del período activo y notifica a los hooks suscritos.
 * Llamar tras mutar periodos (activar/cerrar) para que el banner y el
 * sidebar se refresquen sin recargar la página.
 */
export function invalidarPeriodoActivo() {
  cachePeriodo = undefined
  huboError = false
  for (const avisar of suscriptores) avisar()
}

/**
 * Periodo académico ACTIVO en curso (usado en el banner/sidebar/dashboard).
 * Se consulta una sola vez por sesión del navegador y se expone en caliente.
 * `error` distingue "fallo de red/permiso" de "sin año lectivo activo".
 */
export function usePeriodoActivo(): {
  periodo: PeriodoAcademico | null
  cargando: boolean
  error: boolean
} {
  const [periodo, setPeriodo] = useState<PeriodoAcademico | null>(cachePeriodo ?? null)
  const [cargando, setCargando] = useState(cachePeriodo === undefined)
  const [error, setError] = useState(huboError)

  useEffect(() => {
    let activo = true

    async function refrescar() {
      if (cachePeriodo === undefined) setCargando(true)
      const resultado = await cargarPeriodo()
      if (!activo) return
      setPeriodo(resultado)
      setError(huboError)
      setCargando(false)
    }

    const suscribir = () => {
      void refrescar()
    }
    suscriptores.push(suscribir)
    void refrescar()

    return () => {
      activo = false
      suscriptores = suscriptores.filter((s) => s !== suscribir)
    }
  }, [])

  return { periodo, cargando, error }
}
