import { useCallback, useState } from 'react'
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
  type Grado,
  type CrearGradoInput,
  type Seccion,
  type CrearSeccionInput,
} from '@/services/gradosService'

export function useGradosTab() {
  const { grados, gradosEstado, recargarSecciones, recargarTodo, gradoSeleccionado, setGradoSeleccionado } = usePlanificacion()

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

  return {
    grados,
    gradosEstado,
    recargarSecciones,
    gradoSeleccionado,
    setGradoSeleccionado,
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
  }
}
