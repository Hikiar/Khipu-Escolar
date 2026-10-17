import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { notificarExito, notificarError } from '@/lib/feedback'
import { listarClases, listarCursosDeClase, listarDocentes, type Curso, type Docente } from '@/services/catalogoService'
import {
  listarAsignaciones, crearAsignacion, eliminarAsignacion, asignarTodosLosCursosDeClase, type AsignacionCurso,
} from '@/services/asignacionService'
import { usePlanificacion } from './usePlanificacion'

export function useAsignacionesTab() {
  const { clases } = usePlanificacion()

  const [asignaciones, setAsignaciones] = useState<AsignacionCurso[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)

  const [docentes, setDocentes] = useState<Docente[]>([])

  const [dialogoCrear, setDialogoCrear] = useState(false)
  const [creando, setCreando] = useState(false)
  const [asignandoMasivo, setAsignandoMasivo] = useState(false)
  const [claseSeleccionada, setClaseSeleccionada] = useState('')
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('')
  const [cursosDeClase, setCursosDeClase] = useState<Curso[]>([])
  const [cursosCargando, setCursosCargando] = useState(false)

  const [asignacionAEliminar, setAsignacionAEliminar] = useState<AsignacionCurso | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargarAsignaciones = useCallback(async () => {
    const res = await listarAsignaciones()
    if (res.ok === false) {
      setError(res.error)
      setEstado('error')
    } else {
      setAsignaciones(res.data)
      setEstado('ok')
    }
  }, [])

  const cargarCatalogos = useCallback(async () => {
    const [clasesRes, docentesRes] = await Promise.all([listarClases(), listarDocentes()])
    if (clasesRes.ok === false) {
      setError(clasesRes.error)
      setEstado('error')
      return
    }
    if (docentesRes.ok === false) {
      setError(docentesRes.error)
      setEstado('error')
      return
    }
    setDocentes(docentesRes.data)
  }, [])

  const cargarCursosDeClase = useCallback(async (claseId: string) => {
    setCursosCargando(true)
    const res = await listarCursosDeClase(claseId)
    setCursosCargando(false)
    if (res.ok) setCursosDeClase(res.data)
  }, [])

  const docentesFiltrados = useMemo(() => {
    const nivel = clases.find((cl) => cl.id === claseSeleccionada)?.nivel
    if (!nivel) return docentes
    return docentes.filter((d) => d.niveles.includes(nivel))
  }, [clases, claseSeleccionada, docentes])

  useEffect(() => {
    void cargarCatalogos()
    void cargarAsignaciones()
  }, [cargarCatalogos, cargarAsignaciones])

  function reintentar() {
    setEstado('cargando')
    setError(null)
    void cargarCatalogos()
    void cargarAsignaciones()
  }

  function abrirDialogoNuevaAsignacion() {
    setClaseSeleccionada('')
    setCursoSeleccionado('')
    setDocenteSeleccionado('')
    setCursosDeClase([])
    setDialogoCrear(true)
  }

  async function cambiarClase(claseId: string) {
    setClaseSeleccionada(claseId)
    setCursoSeleccionado('')
    setDocenteSeleccionado('')
    setCursosDeClase([])
    if (claseId) await cargarCursosDeClase(claseId)
  }

  async function enviarCrear() {
    if (!claseSeleccionada || !cursoSeleccionado || !docenteSeleccionado) return
    setCreando(true)
    const res = await crearAsignacion({
      claseId: claseSeleccionada,
      cursoId: cursoSeleccionado,
      docenteId: docenteSeleccionado,
    })
    setCreando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Asignación creada')
    setDialogoCrear(false)
    void cargarAsignaciones()
  }

  async function enviarMasivo() {
    if (!claseSeleccionada || !docenteSeleccionado) return
    setAsignandoMasivo(true)
    const res = await asignarTodosLosCursosDeClase(claseSeleccionada, docenteSeleccionado)
    setAsignandoMasivo(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    const partes = [`Se asignaron ${res.data.registrados} asignatura(s)`]
    if (res.data.omitidos > 0) {
      partes.push(`${res.data.omitidos} ya tenían docente y se omitieron (especialistas)`)
    }
    notificarExito('Asignación masiva completada', partes.join('; '))
    void cargarAsignaciones()
  }

  async function enviarEliminar() {
    if (!asignacionAEliminar) return
    setEliminando(true)
    const res = await eliminarAsignacion(
      asignacionAEliminar.claseId,
      asignacionAEliminar.cursoId,
      asignacionAEliminar.docenteId,
    )
    setEliminando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Asignación eliminada')
    setAsignacionAEliminar(null)
    void cargarAsignaciones()
  }

  return {
    clases,
    asignaciones,
    estado,
    error,
    docentes,
    dialogoCrear,
    setDialogoCrear,
    creando,
    asignandoMasivo,
    claseSeleccionada,
    cursoSeleccionado,
    setCursoSeleccionado,
    docenteSeleccionado,
    setDocenteSeleccionado,
    cursosDeClase,
    cursosCargando,
    asignacionAEliminar,
    setAsignacionAEliminar,
    eliminando,
    docentesFiltrados,
    reintentar,
    abrirDialogoNuevaAsignacion,
    cambiarClase,
    enviarCrear,
    enviarMasivo,
    enviarEliminar,
  }
}
