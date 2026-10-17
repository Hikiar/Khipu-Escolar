import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { notificarExito, notificarError } from '@/lib/feedback'
import type { Clase } from '@/services/gradosService'
import {
  listarClasesDePeriodo,
  crearClase,
  actualizarClase,
  eliminarClase,
  type CrearClaseInput,
} from '@/services/gradosService'
import { listarDocentes, listarSeccionesDeGrado as listarSeccionesDeGradoCatalogo, type Docente } from '@/services/catalogoService'
import { usePlanificacion } from './usePlanificacion'

export function useClasesTab() {
  const { clasesEstado, periodo, gradoSeleccionado: gradoGlobal, recargarClases, grados } = usePlanificacion()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estado local para grado (sync con URL)
  const gradoInicial = searchParams.get('grado') || gradoGlobal?.id || ''
  const [gradoLocal, setGradoLocal] = useState<string>(gradoInicial)

  // Sincronizar gradoLocal con URL y hook global
  useEffect(() => {
    if (gradoLocal) {
      const params = new URLSearchParams(searchParams)
      params.set('grado', gradoLocal)
      setSearchParams(params)
    } else {
      const params = new URLSearchParams(searchParams)
      params.delete('grado')
      setSearchParams(params)
    }
  }, [gradoLocal, searchParams, setSearchParams])

  // Sincronizar con hook global cuando cambia desde otra tab
  useEffect(() => {
    if (gradoGlobal?.id && gradoGlobal.id !== gradoLocal) {
      setGradoLocal(gradoGlobal.id)
    }
  }, [gradoGlobal?.id, gradoLocal])

  // Resolver objeto grado seleccionado
  const gradoSeleccionado = grados.find(g => g.id === gradoLocal) ?? null

  const [docentes, setDocentes] = useState<Docente[]>([])
  const [seccionesParaSelect, setSeccionesParaSelect] = useState<{ id: string; gradoId: string; nombre: string; turno: string }[]>([])

  const [filtroPeriodoId, setFiltroPeriodoId] = useState<string>('')
  const [clasesFiltradas, setClasesFiltradas] = useState<Clase[]>([])

  const [dialogoClase, setDialogoClase] = useState<{
    abierto: boolean
    modo: 'crear' | 'editar'
    clase?: Clase
  }>({ abierto: false, modo: 'crear' })
  const [formClase, setFormClase] = useState<CrearClaseInput & { estado?: string }>({
    periodoId: '',
    gradoId: '',
    seccionId: '',
    tutorDocenteId: undefined,
    vacantes: 30,
    estado: 'ACTIVO',
  })
  const [formClaseErrores, setFormClaseErrores] = useState<Partial<CrearClaseInput>>({})
  const [formClaseEnviando, setFormClaseEnviando] = useState(false)

  const [clasePorEliminar, setClasePorEliminar] = useState<Clase | null>(null)
  const [eliminandoClase, setEliminandoClase] = useState(false)

  const cargarDocentes = useCallback(async () => {
    const res = await listarDocentes()
    if (res.ok) {
      setDocentes(res.data)
    }
  }, [])

  const cargarSeccionesParaGrado = useCallback(async (gradoId: string) => {
    const res = await listarSeccionesDeGradoCatalogo(gradoId)
    if (res.ok) {
      setSeccionesParaSelect(res.data.map((s) => ({ id: s.id, gradoId: s.gradoId, nombre: s.nombre, turno: s.turno })))
    }
  }, [])

  useEffect(() => {
    void cargarDocentes()
  }, [cargarDocentes])

  useEffect(() => {
    if (gradoSeleccionado) {
      void cargarSeccionesParaGrado(gradoSeleccionado.id)
    } else {
      setSeccionesParaSelect([])
    }
  }, [gradoSeleccionado, cargarSeccionesParaGrado])

  useEffect(() => {
    const periodoId = filtroPeriodoId || periodo?.id
    if (periodoId) {
      void (async () => {
        const res = await listarClasesDePeriodo(periodoId)
        if (res.ok) setClasesFiltradas(res.data)
      })()
    } else {
      setClasesFiltradas([])
    }
  }, [filtroPeriodoId, periodo?.id])

  const clasesMostradas = useMemo(() => {
    if (gradoSeleccionado) {
      return clasesFiltradas.filter((c) => c.gradoId === gradoSeleccionado.id)
    }
    return clasesFiltradas
  }, [clasesFiltradas, gradoSeleccionado])

  const abrirDialogoCrearClase = useCallback(() => {
    if (!gradoSeleccionado) return
    setFormClase({
      periodoId: periodo?.id || '',
      gradoId: gradoSeleccionado.id,
      seccionId: '',
      tutorDocenteId: undefined,
      vacantes: 30,
      estado: 'ACTIVO',
    })
    setFormClaseErrores({})
    setSeccionesParaSelect([])
    setDialogoClase({ abierto: true, modo: 'crear' })
    void cargarSeccionesParaGrado(gradoSeleccionado.id)
  }, [periodo?.id, gradoSeleccionado, cargarSeccionesParaGrado])

  const abrirDialogoEditarClase = useCallback((clase: Clase) => {
    setFormClase({
      periodoId: clase.periodoId,
      gradoId: clase.gradoId,
      seccionId: clase.seccionId,
      tutorDocenteId: clase.tutorDocenteId || undefined,
      vacantes: clase.vacantes,
      estado: clase.estado,
    })
    setFormClaseErrores({})
    setSeccionesParaSelect([])
    setDialogoClase({ abierto: true, modo: 'editar', clase })
    void cargarSeccionesParaGrado(clase.gradoId)
  }, [cargarSeccionesParaGrado])

  const cerrarDialogoClase = useCallback(() => {
    setDialogoClase({ abierto: false, modo: 'crear' })
  }, [])

  const enviarClase = useCallback(async () => {
    const errores: Partial<CrearClaseInput> = {}
    if (!formClase.periodoId) errores.periodoId = 'Periodo requerido'
    if (!formClase.gradoId) errores.gradoId = 'Grado requerido'
    if (!formClase.seccionId) errores.seccionId = 'Sección requerida'
    if (Object.keys(errores).length > 0) {
      setFormClaseErrores(errores)
      return
    }
    setFormClaseEnviando(true)
    let res
    if (dialogoClase.modo === 'crear') {
      res = await crearClase(formClase)
    } else {
      res = await actualizarClase(dialogoClase.clase!.id, formClase)
    }
    setFormClaseEnviando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito(dialogoClase.modo === 'crear' ? 'Clase creada' : 'Cambios guardados')
    cerrarDialogoClase()
    void recargarClases()
  }, [formClase, dialogoClase, cerrarDialogoClase, recargarClases])

  const abrirConfirmarEliminarClase = useCallback((clase: Clase) => {
    setClasePorEliminar(clase)
  }, [])

  const manejarEliminarClase = useCallback(async () => {
    if (!clasePorEliminar) return
    setEliminandoClase(true)
    const res = await eliminarClase(clasePorEliminar.id)
    setEliminandoClase(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Clase eliminada')
    setClasePorEliminar(null)
    void recargarClases()
  }, [clasePorEliminar, recargarClases])

  return {
    clasesEstado,
    periodo,
    grados,
    gradoSeleccionado,
    gradoLocal,
    setGradoLocal,
    filtroPeriodoId,
    setFiltroPeriodoId,
    docentes,
    seccionesParaSelect,
    clasesMostradas,
    dialogoClase,
    formClase,
    setFormClase,
    formClaseErrores,
    formClaseEnviando,
    clasePorEliminar,
    setClasePorEliminar,
    eliminandoClase,
    cargarSeccionesParaGrado,
    abrirDialogoCrearClase,
    abrirDialogoEditarClase,
    cerrarDialogoClase,
    enviarClase,
    abrirConfirmarEliminarClase,
    manejarEliminarClase,
  }
}
