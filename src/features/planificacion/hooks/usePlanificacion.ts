import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useState } from 'react'
import type { Grado, Seccion, Clase } from '@/services/gradosService'
import type { CursoGrado } from '@/services/cursosService'
import type { PeriodoAcademico } from '@/services/catalogoService'
import type { ResultadoServicio, MotivoFallo } from '@/types/operations'
import {
  listarGrados,
  listarSeccionesDeGrado,
  listarClasesDePeriodo,
} from '@/services/gradosService'
import { listarCursosDeGrado } from '@/services/cursosService'
import { listarPeriodoActivo } from '@/services/catalogoService'

function hasError<T>(res: ResultadoServicio<T>): res is { ok: false; error: string; motivo: MotivoFallo } {
  return !res.ok
}


interface UsePlanificacionReturn {
  periodo: PeriodoAcademico | null
  periodoEstado: EstadoCarga
  grados: (Grado & { secciones?: Seccion[]; seccionesCargadas?: boolean; seccionesEstado?: EstadoCarga; seccionesError?: string | null })[]
  gradosEstado: EstadoCarga
  error: string | null
  gradoSeleccionado: Grado | null
  setGradoSeleccionado: (g: Grado | null) => void
  cursosDeGrado: CursoGrado[]
  cursosDeGradoEstado: EstadoCarga
  clases: Clase[]
  clasesEstado: EstadoCarga
  recargarTodo: () => void
  recargarSecciones: (gradoId: string) => Promise<void>
  recargarCursosDeGrado: () => Promise<void>
  recargarClases: () => Promise<void>
}

export function usePlanificacion(): UsePlanificacionReturn {
  const [periodo, setPeriodo] = useState<PeriodoAcademico | null>(null)
  const [periodoEstado, setPeriodoEstado] = useState<EstadoCarga>('cargando')

  const [grados, setGrados] = useState<(Grado & { secciones?: Seccion[]; seccionesCargadas?: boolean; seccionesEstado?: EstadoCarga; seccionesError?: string | null })[]>([])
  const [gradosEstado, setGradosEstado] = useState<EstadoCarga>('cargando')

  const [cursosDeGrado, setCursosDeGrado] = useState<CursoGrado[]>([])
  const [cursosDeGradoEstado, setCursosDeGradoEstado] = useState<EstadoCarga>('cargando')

  const [clases, setClases] = useState<Clase[]>([])
  const [clasesEstado, setClasesEstado] = useState<EstadoCarga>('cargando')

  const [gradoSeleccionado, setGradoSeleccionado] = useState<Grado | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargarPeriodo = useCallback(async () => {
    setPeriodoEstado('cargando')
    const res = await listarPeriodoActivo()
    if (hasError(res)) {
      setPeriodoEstado('error')
      setError(res.error)
      return
    }
    setPeriodo(res.data)
    setPeriodoEstado('ok')
  }, [])

  const cargarGrados = useCallback(async () => {
    setGradosEstado('cargando')
    const res = await listarGrados()
    if (hasError(res)) {
      setGradosEstado('error')
      setError(res.error)
      return
    }
    const gradosConEstado = res.data.map((g) => ({
      ...g,
      secciones: [] as Seccion[],
      seccionesCargadas: false,
      seccionesEstado: 'cargando' as EstadoCarga,
      seccionesError: null as string | null,
    }))
    setGrados(gradosConEstado)
    setGradosEstado('ok')
  }, [])

  const cargarSeccionesDeGrado = useCallback(async (gradoId: string) => {
    setGrados((prev) =>
      prev.map((g) =>
        g.id === gradoId ? { ...g, seccionesEstado: 'cargando' as EstadoCarga } : g
      )
    )
    const res = await listarSeccionesDeGrado(gradoId)
    if (hasError(res)) {
      setGrados((prev) =>
        prev.map((g) =>
          g.id === gradoId
            ? { ...g, seccionesEstado: 'error' as EstadoCarga, seccionesError: res.error }
            : g
        )
      )
      return
    }
    setGrados((prev) =>
      prev.map((g) =>
        g.id === gradoId
          ? { ...g, secciones: res.data, seccionesCargadas: true, seccionesEstado: 'ok' as EstadoCarga }
          : g
      )
    )
  }, [])

  const cargarCursosDeGrado = useCallback(async (gradoId: string) => {
    setCursosDeGradoEstado('cargando')
    const res = await listarCursosDeGrado(gradoId)
    if (hasError(res)) {
      setCursosDeGradoEstado('error')
      setError(res.error)
      return
    }
    setCursosDeGrado(res.data)
    setCursosDeGradoEstado('ok')
  }, [])

  const cargarClases = useCallback(async (periodoId?: string) => {
    setClasesEstado('cargando')
    const res = periodoId
      ? await listarClasesDePeriodo(periodoId)
      : await listarClasesDePeriodo('')
    if (hasError(res)) {
      setClasesEstado('error')
      setError(res.error)
      return
    }
    setClases(res.data)
    setClasesEstado('ok')
  }, [])

  const recargarTodo = useCallback(async () => {
    setError(null)
    await cargarPeriodo()
    await cargarGrados()
  }, [cargarPeriodo, cargarGrados])

  const recargarSecciones = useCallback(async (gradoId: string) => {
    await cargarSeccionesDeGrado(gradoId)
  }, [cargarSeccionesDeGrado])

  const recargarCursosDeGrado = useCallback(async () => {
    if (gradoSeleccionado) await cargarCursosDeGrado(gradoSeleccionado.id)
  }, [cargarCursosDeGrado, gradoSeleccionado])

  const recargarClases = useCallback(async () => {
    await cargarClases(periodo?.id)
  }, [cargarClases, periodo?.id])

  useEffect(() => {
    void recargarTodo()
  }, [recargarTodo])

  useEffect(() => {
    if (gradoSeleccionado) {
      void cargarSeccionesDeGrado(gradoSeleccionado.id)
      void cargarCursosDeGrado(gradoSeleccionado.id)
    } else {
      setCursosDeGrado([])
      setCursosDeGradoEstado('ok')
    }
  }, [gradoSeleccionado, cargarSeccionesDeGrado, cargarCursosDeGrado])

  useEffect(() => {
    if (periodo) {
      void cargarClases(periodo.id)
    }
  }, [periodo, cargarClases])

  return {
    periodo,
    periodoEstado,
    grados,
    gradosEstado,
    error,
    gradoSeleccionado,
    setGradoSeleccionado,
    cursosDeGrado,
    cursosDeGradoEstado,
    clases,
    clasesEstado,
    recargarTodo,
    recargarSecciones,
    recargarCursosDeGrado,
    recargarClases,
  }
}