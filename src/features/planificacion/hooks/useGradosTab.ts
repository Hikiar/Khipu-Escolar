import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCarga } from '@/hooks/useCarga'
import { notificarExito, notificarError } from '@/lib/feedback'
import { gradosCneBDeNivel } from '@/lib/gradosCneb'
import { usePlanificacion } from './usePlanificacion'
import {
  crearGrado,
  actualizarGrado,
  desactivarGrado,
  crearSeccion,
  actualizarSeccion,
  eliminarSeccion,
  crearClase,
  type Grado,
  type CrearGradoInput,
  type Seccion,
  type CrearSeccionInput,
  type CrearClaseInput,
  type Clase,
} from '@/services/gradosService'
import {
  listarDocentes,
  listarSeccionesDeGrado as listarSeccionesDeGradoCatalogo,
  type Docente,
} from '@/services/catalogoService'
import { listarAsignaciones, type AsignacionCurso } from '@/services/asignacionService'

interface SeccionParaSelect {
  id: string
  gradoId: string
  nombre: string
  turno: string
}

export function useGradosTab() {
  const {
    grados,
    gradosEstado,
    recargarSecciones,
    recargarTodo,
    gradoSeleccionado,
    setGradoSeleccionado,
    periodo,
    clases,
    cursosDeGrado,
    recargarClases,
  } = usePlanificacion()

  const { can } = useAuth()
  const puedeProfesores = can('profesores.ver')
  const puedeAsignaciones = can('asignaciones.ver')
  const puedeCrearClase = can('grados.crear')

  const docentes = useCarga<Docente[]>(() => listarDocentes(), puedeProfesores)
  const asignaciones = useCarga<AsignacionCurso[]>(() => listarAsignaciones(), puedeAsignaciones)

  const docentesPorId = useMemo(() => {
    const mapa = new Map<string, Docente>()
    for (const docente of docentes.data ?? []) mapa.set(docente.id, docente)
    return mapa
  }, [docentes.data])

  const clasesPorSeccion = useMemo(() => {
    const mapa = new Map<string, Clase>()
    for (const clase of clases) mapa.set(`${clase.gradoId}:${clase.seccionId}`, clase)
    return mapa
  }, [clases])

  const asignacionesPorClase = useMemo(() => {
    const mapa = new Map<string, AsignacionCurso[]>()
    for (const asignacion of asignaciones.data ?? []) {
      const lista = mapa.get(asignacion.claseId) ?? []
      lista.push(asignacion)
      mapa.set(asignacion.claseId, lista)
    }
    return mapa
  }, [asignaciones.data])

  const [dialogoGrado, setDialogoGrado] = useState<{
    abierto: boolean
    modo: 'crear' | 'editar'
    grado?: Grado
  }>({ abierto: false, modo: 'crear' })
  const [formGrado, setFormGrado] = useState<CrearGradoInput>({
    codigo: '',
    nombre: '',
    nivel: 'PRIMARIA',
    orden: 0,
  })
  const [formGradoErrores, setFormGradoErrores] = useState<Partial<CrearGradoInput>>({})
  const [formGradoEnviando, setFormGradoEnviando] = useState(false)
  const [gradoSugeridoId, setGradoSugeridoId] = useState('')

  const [dialogoSeccion, setDialogoSeccion] = useState<{
    abierto: boolean
    modo: 'crear' | 'editar'
    gradoId: string
    seccion?: Seccion
  }>({ abierto: false, modo: 'crear', gradoId: '' })
  const [formSeccion, setFormSeccion] = useState<CrearSeccionInput>({
    gradoId: '',
    nombre: '',
    turno: '',
  })
  const [formSeccionErrores, setFormSeccionErrores] = useState<Partial<CrearSeccionInput>>({})
  const [formSeccionEnviando, setFormSeccionEnviando] = useState(false)

  const [dialogoClase, setDialogoClase] = useState<{
    abierto: boolean
    gradoId: string
    seccionId: string
  }>({ abierto: false, gradoId: '', seccionId: '' })
  const [formClase, setFormClase] = useState<CrearClaseInput & { estado?: string }>({
    periodoId: '',
    gradoId: '',
    seccionId: '',
    tutorDocenteId: undefined,
    vacantes: 30,
    estado: 'ABIERTA',
  })
  const [formClaseErrores, setFormClaseErrores] = useState<Partial<CrearClaseInput>>({})
  const [formClaseEnviando, setFormClaseEnviando] = useState(false)
  const [seccionesParaClase, setSeccionesParaClase] = useState<SeccionParaSelect[]>([])

  const [seccionPorEliminar, setSeccionPorEliminar] = useState<{ seccion: Seccion; gradoId: string } | null>(null)
  const [eliminandoSeccion, setEliminandoSeccion] = useState(false)

  const [gradoPorEliminar, setGradoPorEliminar] = useState<Grado | null>(null)
  const [eliminandoGrado, setEliminandoGrado] = useState(false)

  const abrirDialogoCrearGrado = useCallback(() => {
    setFormGrado({ codigo: '', nombre: '', nivel: 'PRIMARIA', orden: 0 })
    setFormGradoErrores({})
    setGradoSugeridoId('')
    setDialogoGrado({ abierto: true, modo: 'crear' })
  }, [])

  const aplicarGradoSugerido = useCallback((codigo: string) => {
    const sugerido = gradosCneBDeNivel(formGrado.nivel).find((g) => g.codigo === codigo)
    if (!sugerido) return
    setGradoSugeridoId(codigo)
    setFormGrado((prev) => ({
      ...prev,
      codigo: sugerido.codigo,
      nombre: sugerido.nombre,
      orden: sugerido.orden,
    }))
  }, [formGrado.nivel])

  const abrirDialogoEditarGrado = useCallback((grado: Grado) => {
    setFormGrado({ codigo: grado.codigo, nombre: grado.nombre, nivel: grado.nivel, orden: grado.orden ?? 0 })
    setFormGradoErrores({})
    setDialogoGrado({ abierto: true, modo: 'editar', grado })
  }, [])

  const cerrarDialogoGrado = useCallback(() => {
    setDialogoGrado({ abierto: false, modo: 'crear' })
  }, [])

  const enviarGrado = useCallback(async () => {
    const errores: Partial<CrearGradoInput> = {}
    if (!formGrado.codigo.trim()) errores.codigo = 'Código requerido'
    if (!formGrado.nombre.trim()) errores.nombre = 'Nombre requerido'
    if (!formGrado.nivel) errores.nivel = 'Nivel requerido'
    if (Object.keys(errores).length > 0) {
      setFormGradoErrores(errores)
      return
    }
    setFormGradoEnviando(true)
    let res
    if (dialogoGrado.modo === 'crear') {
      res = await crearGrado(formGrado)
    } else {
      res = await actualizarGrado(dialogoGrado.grado!.id, formGrado)
    }
    setFormGradoEnviando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito(dialogoGrado.modo === 'crear' ? 'Grado creado' : 'Cambios guardados')
    cerrarDialogoGrado()
  }, [formGrado, dialogoGrado, cerrarDialogoGrado])

  const manejarEliminarGrado = useCallback(async () => {
    if (!gradoPorEliminar) return
    setEliminandoGrado(true)
    const res = await desactivarGrado(gradoPorEliminar.id)
    setEliminandoGrado(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Grado eliminado')
    setGradoPorEliminar(null)
    void recargarTodo()
  }, [gradoPorEliminar, recargarTodo])

  const abrirDialogoCrearSeccion = useCallback((gradoId: string) => {
    setFormSeccion({ gradoId, nombre: '', turno: '' })
    setFormSeccionErrores({})
    setDialogoSeccion({ abierto: true, modo: 'crear', gradoId })
  }, [])

  const abrirDialogoEditarSeccion = useCallback((gradoId: string, seccion: Seccion) => {
    setFormSeccion({ gradoId, nombre: seccion.nombre, turno: seccion.turno })
    setFormSeccionErrores({})
    setDialogoSeccion({ abierto: true, modo: 'editar', gradoId, seccion })
  }, [])

  const cerrarDialogoSeccion = useCallback(() => {
    setDialogoSeccion({ abierto: false, modo: 'crear', gradoId: '' })
  }, [])

  const enviarSeccion = useCallback(async () => {
    const errores: Partial<CrearSeccionInput> = {}
    if (!formSeccion.nombre.trim()) errores.nombre = 'Nombre requerido'
    if (Object.keys(errores).length > 0) {
      setFormSeccionErrores(errores)
      return
    }
    setFormSeccionEnviando(true)
    let res
    if (dialogoSeccion.modo === 'crear') {
      res = await crearSeccion(formSeccion)
    } else {
      res = await actualizarSeccion(dialogoSeccion.seccion!.id, formSeccion)
    }
    setFormSeccionEnviando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito(dialogoSeccion.modo === 'crear' ? 'Sección creada' : 'Cambios guardados')
    cerrarDialogoSeccion()
    await recargarSecciones(formSeccion.gradoId)
  }, [formSeccion, dialogoSeccion, cerrarDialogoSeccion, recargarSecciones])

  const abrirConfirmarEliminarSeccion = useCallback((gradoId: string, seccion: Seccion) => {
    setSeccionPorEliminar({ seccion, gradoId })
  }, [])

  const manejarEliminarSeccion = useCallback(async () => {
    if (!seccionPorEliminar) return
    setEliminandoSeccion(true)
    const res = await eliminarSeccion(seccionPorEliminar.seccion.id)
    setEliminandoSeccion(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Sección eliminada')
    setSeccionPorEliminar(null)
    await recargarSecciones(seccionPorEliminar.gradoId)
  }, [seccionPorEliminar, recargarSecciones])

  const cargarSeccionesParaClase = useCallback(async (gradoId: string) => {
    const res = await listarSeccionesDeGradoCatalogo(gradoId)
    if (res.ok) {
      setSeccionesParaClase(
        res.data.map((s) => ({ id: s.id, gradoId: s.gradoId, nombre: s.nombre, turno: s.turno })),
      )
    }
  }, [])

  const abrirDialogoCrearClase = useCallback(
    (gradoId: string, seccionId: string) => {
      setFormClase({
        periodoId: periodo?.id ?? '',
        gradoId,
        seccionId,
        tutorDocenteId: undefined,
        vacantes: 30,
        estado: 'ABIERTA',
      })
      setFormClaseErrores({})
      setSeccionesParaClase([])
      setDialogoClase({ abierto: true, gradoId, seccionId })
      void cargarSeccionesParaClase(gradoId)
    },
    [periodo?.id, cargarSeccionesParaClase],
  )

  const cerrarDialogoClase = useCallback(() => {
    setDialogoClase({ abierto: false, gradoId: '', seccionId: '' })
  }, [])

  const enviarClase = useCallback(async () => {
    const errores: Partial<CrearClaseInput> = {}
    if (!formClase.periodoId) errores.periodoId = 'Año lectivo requerido'
    if (!formClase.gradoId) errores.gradoId = 'Grado requerido'
    if (!formClase.seccionId) errores.seccionId = 'Sección requerida'
    if (Object.keys(errores).length > 0) {
      setFormClaseErrores(errores)
      return
    }
    setFormClaseEnviando(true)
    const res = await crearClase({
      periodoId: formClase.periodoId,
      gradoId: formClase.gradoId,
      seccionId: formClase.seccionId,
      tutorDocenteId: formClase.tutorDocenteId || undefined,
      vacantes: formClase.vacantes,
    })
    setFormClaseEnviando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Clase creada')
    cerrarDialogoClase()
    await recargarClases()
  }, [formClase, cerrarDialogoClase, recargarClases])

  return {
    grados,
    gradosEstado,
    recargarSecciones,
    recargarClases,
    gradoSeleccionado,
    setGradoSeleccionado,
    periodo,
    clasesPorSeccion,
    cursosDeGrado,
    docentesPorId,
    asignacionesPorClase,
    puedeProfesores,
    puedeAsignaciones,
    puedeCrearClase,
    dialogoGrado,
    formGrado,
    setFormGrado,
    formGradoErrores,
    formGradoEnviando,
    gradoSugeridoId,
    setGradoSugeridoId,
    dialogoSeccion,
    formSeccion,
    setFormSeccion,
    formSeccionErrores,
    formSeccionEnviando,
    seccionPorEliminar,
    setSeccionPorEliminar,
    eliminandoSeccion,
    gradoPorEliminar,
    setGradoPorEliminar,
    eliminandoGrado,
    dialogoClase,
    formClase,
    setFormClase,
    formClaseErrores,
    formClaseEnviando,
    seccionesParaClase,
    cargarSeccionesParaClase,
    abrirDialogoCrearGrado,
    aplicarGradoSugerido,
    abrirDialogoEditarGrado,
    cerrarDialogoGrado,
    enviarGrado,
    manejarEliminarGrado,
    abrirDialogoCrearSeccion,
    abrirDialogoEditarSeccion,
    cerrarDialogoSeccion,
    enviarSeccion,
    abrirConfirmarEliminarSeccion,
    manejarEliminarSeccion,
    abrirDialogoCrearClase,
    cerrarDialogoClase,
    enviarClase,
  }
}
