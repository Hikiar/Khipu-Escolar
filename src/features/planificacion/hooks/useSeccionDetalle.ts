import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCarga, type EstadoCarga } from '@/hooks/useCarga'
import { notificarExito } from '@/lib/feedback'
import { listarClases, listarDocentes, type Clase, type Docente } from '@/services/catalogoService'
import {
  crearAsignacion,
  eliminarAsignacion,
  listarAsignacionesDeClase,
  type AsignacionCurso,
} from '@/services/asignacionService'
import { listarCursosDeGrado, type CursoGrado } from '@/services/cursosService'
import { actualizarClase, eliminarClase } from '@/services/gradosService'
import {
  ASIGNACIONES_VACIO,
  borradorDesde,
  iguales,
  type BorradorSeccion,
} from '../lib/secciones'

/**
 * Estado del detalle de una sección (clase): carga de la clase, plan de
 * estudios, docentes y asignaciones; modo consulta/edición con borrador local y
 * guardado secuencial que conserva el borrador si alguna operación falla.
 */
export function useSeccionDetalle(claseId: string) {
  const { can } = useAuth()
  const puedeAsignaciones = can('asignaciones.ver')
  const puedeProfesores = can('profesores.ver')
  const puedeEditarClase = can('grados.editar')
  const puedeEliminarClase = can('grados.eliminar')
  const puedeCrearAsignacion = can('asignaciones.crear')
  const puedeEliminarAsignacion = can('asignaciones.eliminar')

  const clases = useCarga(() => listarClases(), true)
  const clase = useMemo<Clase | null>(
    () => clases.data?.find((item) => item.id === claseId) ?? null,
    [clases.data, claseId],
  )
  const gradoId = clase?.gradoId
  const plan = useCarga<CursoGrado[]>(
    () => listarCursosDeGrado(gradoId as string),
    !!gradoId,
    gradoId,
  )
  const docentes = useCarga<Docente[]>(() => listarDocentes(), puedeProfesores)
  const asignaciones = useCarga<AsignacionCurso[]>(
    () => listarAsignacionesDeClase(claseId),
    puedeAsignaciones && !!claseId,
    claseId,
  )

  const planCursos = useMemo<CursoGrado[]>(() => plan.data ?? [], [plan.data])

  const [base, setBase] = useState<BorradorSeccion | null>(null)
  const [borrador, setBorrador] = useState<BorradorSeccion | null>(null)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const ultimoAplicadoRef = useRef<AsignacionCurso[] | null>(null)

  // Al cambiar de sección se descarta cualquier borrador de la anterior.
  useEffect(() => {
    setBase(null)
    setBorrador(null)
    setEditando(false)
    setErrorGuardado(null)
    ultimoAplicadoRef.current = null
  }, [claseId])

  useEffect(() => {
    if (!clase) return
    if (puedeAsignaciones && asignaciones.estado !== 'ok') return
    const lista = puedeAsignaciones ? asignaciones.data : ASIGNACIONES_VACIO
    if (puedeAsignaciones && lista === null) return
    if (base !== null && lista === ultimoAplicadoRef.current) return
    ultimoAplicadoRef.current = lista
    const nuevo = borradorDesde(clase, lista ?? ASIGNACIONES_VACIO)
    setBase(nuevo)
    if (!editando) setBorrador(nuevo)
    // `base` se lee solo como guarda; no debe disparar el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clase, asignaciones.data, asignaciones.estado, puedeAsignaciones, editando])

  const docentesHabilitados = useMemo(() => {
    if (!clase) return []
    return (docentes.data ?? [])
      .filter(
        (docente) =>
          docente.estado === 'ACTIVO' && (docente.niveles as string[]).includes(clase.nivel),
      )
      .sort((a, b) => a.apellidos.localeCompare(b.apellidos) || a.nombres.localeCompare(b.nombres))
  }, [docentes.data, clase])

  const docentesPorId = useMemo(() => {
    const mapa = new Map<string, Docente>()
    for (const docente of docentes.data ?? []) mapa.set(docente.id, docente)
    return mapa
  }, [docentes.data])

  const cargando =
    clases.estado === 'cargando' ||
    (!!gradoId && (plan.estado === 'cargando' || (plan.estado === 'ok' && plan.data === null))) ||
    (puedeAsignaciones &&
      (asignaciones.estado === 'cargando' ||
        (asignaciones.estado === 'ok' && asignaciones.data === null)))

  const errorCarga =
    clases.estado === 'error'
      ? clases.error
      : plan.estado === 'error'
        ? plan.error
        : puedeAsignaciones && asignaciones.estado === 'error'
          ? asignaciones.error
          : null

  const puedeQuitarAsignacion = puedeAsignaciones && puedeEliminarAsignacion && !!asignaciones.data
  const puedeAgregarAsignacion =
    puedeAsignaciones && puedeCrearAsignacion && docentes.estado === 'ok'
  const puedeEditarTutor = puedeEditarClase && puedeProfesores
  const puedeEditar = puedeEditarClase || puedeQuitarAsignacion || puedeAgregarAsignacion

  const recargarTodo = useCallback(() => {
    void clases.recargar()
    void plan.recargar()
    void docentes.recargar()
    void asignaciones.recargar()
  }, [clases, plan, docentes, asignaciones])

  const abrirEdicion = useCallback(() => {
    setBorrador((prev) => base ?? prev)
    setErrorGuardado(null)
    setEditando(true)
  }, [base])

  const cancelarEdicion = useCallback(() => {
    setBorrador(base)
    setErrorGuardado(null)
    setEditando(false)
  }, [base])

  const cambiarTutor = useCallback((docenteId: string | null) => {
    setBorrador((prev) => (prev ? { ...prev, tutorDocenteId: docenteId } : prev))
  }, [])

  const cambiarEstado = useCallback((estado: string) => {
    setBorrador((prev) => (prev ? { ...prev, estado } : prev))
  }, [])

  const cambiarVacantes = useCallback((vacantes: number) => {
    setBorrador((prev) => (prev ? { ...prev, vacantes } : prev))
  }, [])

  const agregarDocente = useCallback((cursoId: string, docenteId: string) => {
    setBorrador((prev) => {
      if (!prev) return prev
      const actuales = prev.docentesPorCurso[cursoId] ?? []
      if (actuales.includes(docenteId)) return prev
      return {
        ...prev,
        docentesPorCurso: {
          ...prev.docentesPorCurso,
          [cursoId]: [...actuales, docenteId],
        },
      }
    })
  }, [])

  const quitarDocente = useCallback((cursoId: string, docenteId: string) => {
    setBorrador((prev) => {
      if (!prev) return prev
      const restantes = (prev.docentesPorCurso[cursoId] ?? []).filter(
        (item) => item !== docenteId,
      )
      const docentesPorCurso = { ...prev.docentesPorCurso }
      if (restantes.length === 0) delete docentesPorCurso[cursoId]
      else docentesPorCurso[cursoId] = restantes
      return { ...prev, docentesPorCurso }
    })
  }, [])

  /** Asigna un docente a todas las asignaturas que aún no tienen docente. */
  const asignarDocenteATodas = useCallback(
    (docenteId: string) => {
      setBorrador((prev) => {
        if (!prev) return prev
        const docentesPorCurso = { ...prev.docentesPorCurso }
        for (const curso of planCursos) {
          const actuales = docentesPorCurso[curso.cursoId] ?? []
          if (actuales.length === 0) docentesPorCurso[curso.cursoId] = [docenteId]
        }
        return { ...prev, docentesPorCurso }
      })
    },
    [planCursos],
  )

  const guardar = useCallback(async (): Promise<boolean> => {
    if (!clase || !base || !borrador) return false
    setGuardando(true)
    setErrorGuardado(null)
    let actual = base
    try {
      const cambioTutor = borrador.tutorDocenteId !== actual.tutorDocenteId
      const cambioEstado = borrador.estado !== actual.estado
      const cambioVacantes = borrador.vacantes !== actual.vacantes

      if (cambioTutor || cambioEstado || cambioVacantes) {
        if (!puedeEditarClase) {
          setErrorGuardado('No tienes permiso para modificar los datos de la sección.')
          return false
        }
        if (cambioTutor && !puedeEditarTutor) {
          setErrorGuardado('No tienes permiso para cambiar el tutor de la sección.')
          return false
        }
        const res = await actualizarClase(clase.id, {
          ...(cambioTutor ? { tutorDocenteId: borrador.tutorDocenteId } : {}),
          ...(cambioEstado ? { estado: borrador.estado } : {}),
          ...(cambioVacantes ? { vacantes: borrador.vacantes } : {}),
        })
        if (res.ok === false) {
          setErrorGuardado(res.error)
          return false
        }
        actual = {
          ...actual,
          tutorDocenteId: borrador.tutorDocenteId,
          estado: borrador.estado,
          vacantes: borrador.vacantes,
        }
        setBase(actual)
      }

      const cursoIds = new Set([
        ...Object.keys(actual.docentesPorCurso),
        ...Object.keys(borrador.docentesPorCurso),
      ])
      for (const cursoId of cursoIds) {
        const deseados = borrador.docentesPorCurso[cursoId] ?? []
        const previos = actual.docentesPorCurso[cursoId] ?? []

        for (const docenteId of previos) {
          if (deseados.includes(docenteId)) continue
          if (!puedeEliminarAsignacion) {
            setErrorGuardado('No tienes permiso para quitar docentes de una asignatura.')
            return false
          }
          const res = await eliminarAsignacion(clase.id, cursoId, docenteId)
          if (res.ok === false) {
            setErrorGuardado(res.error)
            return false
          }
          actual = {
            ...actual,
            docentesPorCurso: {
              ...actual.docentesPorCurso,
              [cursoId]: (actual.docentesPorCurso[cursoId] ?? []).filter(
                (item) => item !== docenteId,
              ),
            },
          }
          setBase(actual)
        }

        const restantes = actual.docentesPorCurso[cursoId] ?? []
        for (const docenteId of deseados) {
          if (restantes.includes(docenteId)) continue
          if (!puedeCrearAsignacion) {
            setErrorGuardado('No tienes permiso para asignar docentes a una asignatura.')
            return false
          }
          const res = await crearAsignacion({ claseId: clase.id, cursoId, docenteId })
          if (res.ok === false) {
            setErrorGuardado(res.error)
            return false
          }
          actual = {
            ...actual,
            docentesPorCurso: {
              ...actual.docentesPorCurso,
              [cursoId]: [...(actual.docentesPorCurso[cursoId] ?? []), docenteId],
            },
          }
          setBase(actual)
        }
      }

      setBorrador(actual)
      setEditando(false)
      notificarExito('Cambios guardados')
      void asignaciones.recargar()
      void clases.recargar()
      return true
    } finally {
      setGuardando(false)
    }
  }, [
    clase,
    base,
    borrador,
    puedeEditarClase,
    puedeEditarTutor,
    puedeEliminarAsignacion,
    puedeCrearAsignacion,
    asignaciones,
    clases,
  ])

  const eliminar = useCallback(async (): Promise<boolean> => {
    if (!clase || !puedeEliminarClase) return false
    setEliminando(true)
    setErrorGuardado(null)
    try {
      const res = await eliminarClase(clase.id)
      if (res.ok === false) {
        setErrorGuardado(res.error)
        return false
      }
      notificarExito('Sección eliminada')
      return true
    } finally {
      setEliminando(false)
    }
  }, [clase, puedeEliminarClase])

  const sucio = !!base && !!borrador && !iguales(base, borrador)

  const estado: EstadoCarga = cargando ? 'cargando' : errorCarga ? 'error' : 'ok'

  return {
    estado,
    error: errorCarga,
    notEncontrada: clases.estado === 'ok' && !clase,
    recargar: recargarTodo,
    clase,
    plan: planCursos,
    planEstado: plan.estado,
    docentesPorId,
    docentesHabilitados,
    puedeProfesores,
    puedeAsignaciones,
    puedeEditarClase,
    puedeEditarTutor,
    puedeAgregarAsignacion,
    puedeQuitarAsignacion,
    puedeEliminarClase,
    puedeEditar,
    base,
    borrador,
    editando,
    sucio,
    guardando,
    eliminando,
    errorGuardado,
    abrirEdicion,
    cancelarEdicion,
    cambiarTutor,
    cambiarEstado,
    cambiarVacantes,
    agregarDocente,
    quitarDocente,
    asignarDocenteATodas,
    guardar,
    eliminar,
  }
}
