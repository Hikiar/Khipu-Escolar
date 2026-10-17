import { useCallback, useRef, useState } from 'react'
import { notificarExito, notificarError } from '@/lib/feedback'
import { usePlanificacion } from './usePlanificacion'
import {
  agregarCursoAGrado,
  actualizarCursoGrado,
  quitarCursoDeGrado,
  listarCursos,
  obtenerCurso,
  type Curso,
  type CursoGrado,
  type CrearCursoGradoInput,
  type ActualizarCursoGradoInput,
} from '@/services/cursosService'
import { ApiError } from '@/services/apiClient'
import {
  listarAsignaciones,
  type AsignacionCurso,
} from '@/services/asignacionService'

export function usePlanEstudios() {
  const { gradoSeleccionado, setGradoSeleccionado, grados, cursosDeGrado, cursosDeGradoEstado, recargarCursosDeGrado } = usePlanificacion()

  const handleGradoChange = useCallback((gradoId: string) => {
    const g = grados.find((x) => x.id === gradoId) ?? null
    setGradoSeleccionado(g)
  }, [grados, setGradoSeleccionado])

  const [dialogoAgregar, setDialogoAgregar] = useState(false)
  const [formCursoId, setFormCursoId] = useState('')
  const [formHorasSemana, setFormHorasSemana] = useState('')
  const [formOrden, setFormOrden] = useState('')
  const [formAgregarEnviando, setFormAgregarEnviando] = useState(false)
  const [formAgregarError, setFormAgregarError] = useState<string | null>(null)
  // Catálogo de cursos activos para el diálogo "Añadir asignatura al plan"
  const [catalogoCursos, setCatalogoCursos] = useState<Curso[]>([])
  const [catalogoCursosCargando, setCatalogoCursosCargando] = useState(false)

  const [dialogoEditar, setDialogoEditar] = useState<CursoGrado | null>(null)
  const [editHorasSemana, setEditHorasSemana] = useState('')
  const [editOrden, setEditOrden] = useState('')
  const [editEnviando, setEditEnviando] = useState(false)

  const [dialogoQuitar, setDialogoQuitar] = useState<CursoGrado | null>(null)
  const [quitando, setQuitando] = useState(false)

  // Docentes drawer
  const [docentesCurso, setDocentesCurso] = useState<AsignacionCurso[]>([])
  const [docentesCargando, setDocentesCargando] = useState(false)
  const [cursoParaDocentes, setCursoParaDocentes] = useState<CursoGrado | null>(null)

  // Detalle de asignatura (P5): drawer lateral con datos de GET /cursos/:id
  const [cursoDetalle, setCursoDetalle] = useState<CursoGrado | null>(null)
  const [detalleCurso, setDetalleCurso] = useState<Curso | null>(null)
  const [detalleCursoCargando, setDetalleCursoCargando] = useState(false)
  const [detalleCursoError, setDetalleCursoError] = useState<string | null>(null)
  // Id del curso cuyo detalle está en vuelo (M2: evitar respuestas cruzadas)
  const detalleCursoEnVueloRef = useRef<string | null>(null)

  // Cargar asignaciones para un curso en el grado seleccionado
  const cargarDocentesCurso = useCallback(async (cursoId: string) => {
    if (!gradoSeleccionado) return
    setDocentesCargando(true)
    const res = await listarAsignaciones()
    setDocentesCargando(false)
    if (res.ok) {
      // Filtrar por cursoId y grado (usando gradoNombre)
      const filtradas = res.data.filter(
        (a) => a.cursoId === cursoId && a.clase.gradoNombre === gradoSeleccionado.nombre
      )
      setDocentesCurso(filtradas)
    }
  }, [gradoSeleccionado])

  const abrirDialogoAgregar = useCallback(async () => {
    setFormCursoId('')
    setFormHorasSemana('')
    setFormOrden('')
    setFormAgregarError(null)
    setDialogoAgregar(true)
    // Cargar el catálogo de cursos activos, excluyendo los ya presentes en el plan.
    setCatalogoCursosCargando(true)
    const res = await listarCursos(true)
    setCatalogoCursosCargando(false)
    if (res.ok === false) {
      setFormAgregarError(res.error)
      return
    }
    const yaEnPlan = new Set(cursosDeGrado.map((cg) => cg.cursoId))
    setCatalogoCursos(res.data.filter((c) => !yaEnPlan.has(c.id)))
  }, [cursosDeGrado])

  const abrirDialogoEditar = useCallback((cg: CursoGrado) => {
    setEditHorasSemana(String(cg.horasSemana ?? ''))
    setEditOrden(String(cg.orden ?? ''))
    setDialogoEditar(cg)
  }, [])

  const abrirDialogoQuitar = useCallback((cg: CursoGrado) => {
    setDialogoQuitar(cg)
  }, [])

  const cerrarDialogoAgregar = useCallback(() => {
    setDialogoAgregar(false)
  }, [])

  const cerrarDialogoEditar = useCallback(() => {
    setDialogoEditar(null)
  }, [])

  const cerrarDialogoQuitar = useCallback(() => {
    setDialogoQuitar(null)
  }, [])

  const enviarAgregar = useCallback(async () => {
    if (!formCursoId) {
      setFormAgregarError('Selecciona una asignatura')
      return
    }
    setFormAgregarEnviando(true)
    const input: CrearCursoGradoInput = {
      cursoId: formCursoId,
      gradoId: gradoSeleccionado!.id,
      horasSemana: formHorasSemana ? Number(formHorasSemana) : undefined,
      orden: formOrden ? Number(formOrden) : undefined,
    }
    const res = await agregarCursoAGrado(input)
    setFormAgregarEnviando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Asignatura añadida al plan')
    cerrarDialogoAgregar()
    void recargarCursosDeGrado()
  }, [formCursoId, formHorasSemana, formOrden, gradoSeleccionado, cerrarDialogoAgregar, recargarCursosDeGrado])

  const enviarEditar = useCallback(async () => {
    if (!dialogoEditar) return
    setEditEnviando(true)
    const input: ActualizarCursoGradoInput = {
      horasSemana: editHorasSemana ? Number(editHorasSemana) : undefined,
      orden: editOrden ? Number(editOrden) : undefined,
    }
    const res = await actualizarCursoGrado(dialogoEditar.cursoId, gradoSeleccionado!.id, input)
    setEditEnviando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Cambios guardados')
    cerrarDialogoEditar()
  }, [dialogoEditar, editHorasSemana, editOrden, gradoSeleccionado, cerrarDialogoEditar])

  const enviarQuitar = useCallback(async () => {
    if (!dialogoQuitar) return
    setQuitando(true)
    const res = await quitarCursoDeGrado(dialogoQuitar.cursoId, gradoSeleccionado!.id)
    setQuitando(false)
    if (res.ok === false) {
      notificarError(res.error)
      return
    }
    notificarExito('Asignatura quitada del plan')
    cerrarDialogoQuitar()
    void recargarCursosDeGrado()
  }, [dialogoQuitar, gradoSeleccionado, cerrarDialogoQuitar, recargarCursosDeGrado])

  const abrirDocentes = useCallback((cg: CursoGrado) => {
    setCursoParaDocentes(cg)
    setDocentesCurso([])
    void cargarDocentesCurso(cg.cursoId)
  }, [cargarDocentesCurso])

  const cerrarDocentes = useCallback(() => {
    setCursoParaDocentes(null)
    setDocentesCurso([])
  }, [])

  const abrirDetalleCurso = useCallback(async (cg: CursoGrado) => {
    setCursoDetalle(cg)
    setDetalleCurso(null)
    setDetalleCursoError(null)
    setDetalleCursoCargando(true)
    detalleCursoEnVueloRef.current = cg.cursoId
    try {
      const res = await obtenerCurso(cg.cursoId)
      // Ignorar respuesta si el usuario abrió otra asignatura (M2)
      if (detalleCursoEnVueloRef.current !== cg.cursoId) return
      if (res.ok === false) {
        setDetalleCursoError(res.error)
      } else {
        setDetalleCurso(res.data)
      }
    } catch (e) {
      if (detalleCursoEnVueloRef.current !== cg.cursoId) return
      setDetalleCursoError(e instanceof ApiError ? e.message : 'No se pudo cargar el detalle.')
    } finally {
      if (detalleCursoEnVueloRef.current === cg.cursoId) setDetalleCursoCargando(false)
    }
  }, [])

  const cerrarDetalleCurso = useCallback(() => {
    setCursoDetalle(null)
    detalleCursoEnVueloRef.current = null
    setDetalleCurso(null)
    setDetalleCursoError(null)
  }, [])

  return {
    gradoSeleccionado,
    grados,
    handleGradoChange,
    cursosDeGrado,
    cursosDeGradoEstado,
    dialogoAgregar,
    setDialogoAgregar,
    formCursoId,
    setFormCursoId,
    formHorasSemana,
    setFormHorasSemana,
    formOrden,
    setFormOrden,
    formAgregarEnviando,
    formAgregarError,
    catalogoCursos,
    catalogoCursosCargando,
    dialogoEditar,
    editHorasSemana,
    setEditHorasSemana,
    editOrden,
    setEditOrden,
    editEnviando,
    dialogoQuitar,
    quitando,
    docentesCurso,
    docentesCargando,
    cursoParaDocentes,
    setCursoParaDocentes,
    setDocentesCurso,
    cursoDetalle,
    detalleCurso,
    detalleCursoCargando,
    detalleCursoError,
    detalleCursoEnVueloRef,
    abrirDialogoAgregar,
    cerrarDialogoAgregar,
    abrirDialogoEditar,
    cerrarDialogoEditar,
    abrirDialogoQuitar,
    cerrarDialogoQuitar,
    enviarAgregar,
    enviarEditar,
    enviarQuitar,
    abrirDocentes,
    cerrarDocentes,
    abrirDetalleCurso,
    cerrarDetalleCurso,
  }
}
