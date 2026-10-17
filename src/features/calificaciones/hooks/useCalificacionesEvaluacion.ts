import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useState } from 'react'
import {
  listarCompetenciasDeClaseYCurso, listarAlumnosDeClase,
  type CompetenciaCurso, type AlumnoDeClase,
} from '@/services/catalogoService'
import {
  listarTrabajos, crearTrabajo, anularTrabajo, editarTrabajo,
  listarCalificacionesTrabajo, registrarCalificacionTrabajo,
  listarExamenes, crearExamen, editarExamen,
  listarCalificacionesExamen, registrarCalificacionExamen,
  calcularResultados,
  type Trabajo,
  type Examen,
  type ResultadoCurso,
} from '@/services/evaluacionService'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { extraerError } from '../utils'

export function useCalificacionesEvaluacion({
  claseId,
  cursoId,
  configModelo,
}: {
  claseId: string
  cursoId: string
  configModelo: { modeloCodigo: string; configId: string } | null
}) {
  const { usuario } = useAuth()

  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [competencias, setCompetencias] = useState<CompetenciaCurso[]>([])
  const [alumnos, setAlumnos] = useState<AlumnoDeClase[]>([])
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [resultados, setResultados] = useState<ResultadoCurso[]>([])

  const [estadoTrabajos, setEstadoTrabajos] = useState<EstadoCarga>('cargando')
  const [estadoExamenes, setEstadoExamenes] = useState<EstadoCarga>('cargando')
  const [estadoResultados, setEstadoResultados] = useState<EstadoCarga>('cargando')
  const [errorTrabajos, setErrorTrabajos] = useState<string | null>(null)
  const [errorExamenes, setErrorExamenes] = useState<string | null>(null)
  const [errorResultados, setErrorResultados] = useState<string | null>(null)

  const [dialogTrabajoAbierto, setDialogTrabajoAbierto] = useState(false)
  const [dialogTrabajoEditar, setDialogTrabajoEditar] = useState<Trabajo | null>(null)
  const [dialogExamenAbierto, setDialogExamenAbierto] = useState(false)
  const [dialogExamenEditar, setDialogExamenEditar] = useState(false)
  const [dialogCalifTrabajo, setDialogCalifTrabajo] = useState<Trabajo | null>(null)
  const [dialogCalifExamen, setDialogCalifExamen] = useState<Examen | null>(null)
  const [anularObjetivo, setAnularObjetivo] = useState<Trabajo | null>(null)
  const [examenEditando, setExamenEditando] = useState<Examen | null>(null)
  const [dialogResultadoDetalle, setDialogResultadoDetalle] = useState<ResultadoCurso | null>(null)

  const [nuevoTrabajoNombre, setNuevoTrabajoNombre] = useState('')
  const [nuevoTrabajoFecha, setNuevoTrabajoFecha] = useState('')
  const [nuevoTrabajoDesc, setNuevoTrabajoDesc] = useState('')
  const [nuevoTrabajoCompetencia, setNuevoTrabajoCompetencia] = useState('')
  const [nuevoExamenNombre, setNuevoExamenNombre] = useState('')
  const [nuevoExamenFecha, setNuevoExamenFecha] = useState('')
  const [errorDialogTrabajo, setErrorDialogTrabajo] = useState<string | null>(null)
  const [errorDialogExamen, setErrorDialogExamen] = useState<string | null>(null)
  const [enviandoTrabajo, setEnviandoTrabajo] = useState(false)
  const [enviandoExamen, setEnviandoExamen] = useState(false)
  const [editandoExamen, setEditandoExamen] = useState(false)
  const [editandoTrabajo, setEditandoTrabajo] = useState(false)
  const [editTrabajoNombre, setEditTrabajoNombre] = useState('')
  const [editTrabajoFecha, setEditTrabajoFecha] = useState('')
  const [editTrabajoDesc, setEditTrabajoDesc] = useState('')
  const [errorDialogTrabajoEditar, setErrorDialogTrabajoEditar] = useState<string | null>(null)
  const [formExamenEstado, setFormExamenEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO')
  const [errorDialogExamenEditar, setErrorDialogExamenEditar] = useState<string | null>(null)

  const [calificacionesTrabajo, setCalificacionesTrabajo] = useState<Record<string, string>>({})
  const [calificacionesExamen, setCalificacionesExamen] = useState<Record<string, string>>({})
  const [guardandoCalifTrabajo, setGuardandoCalifTrabajo] = useState(false)
  const [guardandoCalifExamen, setGuardandoCalifExamen] = useState(false)
  const [errorCalifTrabajo, setErrorCalifTrabajo] = useState<string | null>(null)
  const [errorCalifExamen, setErrorCalifExamen] = useState<string | null>(null)

  const [expandedResultados, setExpandedResultados] = useState<Set<string>>(new Set())

  const cargarTrabajos = useCallback(async (cId: string, crs: CompetenciaCurso[]) => {
    setEstadoTrabajos('cargando')
    setErrorTrabajos(null)
    const allTrabajos: Trabajo[] = []
    for (const comp of crs) {
      const res = await listarTrabajos(cId, comp.id)
      if (res.ok) allTrabajos.push(...res.data)
    }
    setTrabajos(allTrabajos)
    setEstadoTrabajos('ok')
  }, [])

  const cargarExamenes = useCallback(async (cId: string) => {
    setEstadoExamenes('cargando')
    setErrorExamenes(null)
    const res = await listarExamenes(cId)
    if (res.ok) {
      setExamenes(res.data)
      setEstadoExamenes('ok')
    } else {
      setErrorExamenes(extraerError(res))
      setEstadoExamenes('error')
    }
  }, [])

  const cargarResultados = useCallback(async (cId: string, crId: string) => {
    setEstadoResultados('cargando')
    setErrorResultados(null)
    const res = await calcularResultados(cId, crId)
    if (res.ok) {
      setResultados(res.data)
      setEstadoResultados('ok')
    } else {
      setErrorResultados(extraerError(res))
      setEstadoResultados('error')
    }
  }, [])

  useEffect(() => {
    if (!claseId || !cursoId) return
    const cargarTodo = async () => {
      const compsRes = await listarCompetenciasDeClaseYCurso(claseId, cursoId)
      const comps = compsRes.ok ? compsRes.data : []
      setCompetencias(comps)
      const alsRes = await listarAlumnosDeClase(claseId)
      if (alsRes.ok) setAlumnos(alsRes.data)
      if (configModelo?.modeloCodigo === 'COMPETENCIAS') {
        void cargarTrabajos(claseId, comps)
      }
      if (configModelo?.modeloCodigo === 'EXAMEN') {
        void cargarExamenes(claseId)
      }
      void cargarResultados(claseId, cursoId)
    }
    void cargarTodo()
  }, [claseId, cursoId, configModelo, cargarTrabajos, cargarExamenes, cargarResultados])

  const traducirCompetencia = useCallback(
    (compId: string) => {
      const c = competencias.find(x => x.id === compId)
      return c ? `${c.codigo} - ${c.nombre}` : '—'
    },
    [competencias],
  )

  async function handleCrearTrabajo() {
    if (!claseId || !cursoId || !nuevoTrabajoCompetencia || !nuevoTrabajoNombre.trim()) return
    if (!usuario?.persona?.id) {
      setErrorDialogTrabajo('El usuario no tiene asignación docente.')
      return
    }
    setEnviandoTrabajo(true)
    setErrorDialogTrabajo(null)
    const res = await crearTrabajo({
      claseId,
      competenciaCursoId: nuevoTrabajoCompetencia,
      nombre: nuevoTrabajoNombre.trim(),
      descripcion: nuevoTrabajoDesc.trim() || undefined,
      fecha: nuevoTrabajoFecha || undefined,
    })
    setEnviandoTrabajo(false)
    if (res.ok) {
      setDialogTrabajoAbierto(false)
      resetFormTrabajo()
      void cargarTrabajos(claseId, competencias)
    } else {
      setErrorDialogTrabajo(extraerError(res))
    }
  }

  async function handleAnularConfirmar() {
    if (!anularObjetivo || !claseId) return
    const res = await anularTrabajo(anularObjetivo.id)
    setAnularObjetivo(null)
    if (res.ok) {
      void cargarTrabajos(claseId, competencias)
    }
  }

  async function handleCalificarTrabajo() {
    if (!dialogCalifTrabajo || !usuario) return
    setGuardandoCalifTrabajo(true)
    setErrorCalifTrabajo(null)
    const errores: string[] = []
    for (const [alumnoId, notaStr] of Object.entries(calificacionesTrabajo)) {
      const nota = parseFloat(notaStr)
      if (isNaN(nota)) continue
      const res = await registrarCalificacionTrabajo({
        trabajoEvaluacionId: dialogCalifTrabajo.id,
        alumnoId,
        nota,
      })
      if (!res.ok) errores.push(extraerError(res))
    }
    setGuardandoCalifTrabajo(false)
    if (errores.length > 0) {
      setErrorCalifTrabajo(errores.join('; '))
    } else {
      setDialogCalifTrabajo(null)
    }
  }

  async function handleCrearExamen() {
    if (!claseId || !cursoId || !configModelo || !nuevoExamenNombre.trim()) return
    if (!usuario?.persona?.id) {
      setErrorDialogExamen('El usuario no tiene asignación docente.')
      return
    }
    setEnviandoExamen(true)
    setErrorDialogExamen(null)
    const res = await crearExamen({
      claseId,
      configuracionEvaluacionCursoId: configModelo.configId,
      nombre: nuevoExamenNombre.trim(),
      fecha: nuevoExamenFecha || undefined,
    })
    setEnviandoExamen(false)
    if (res.ok) {
      setDialogExamenAbierto(false)
      resetFormExamen()
      void cargarExamenes(claseId)
    } else {
      setErrorDialogExamen(extraerError(res))
    }
  }

  async function handleCalificarExamen() {
    if (!dialogCalifExamen || !usuario) return
    setGuardandoCalifExamen(true)
    setErrorCalifExamen(null)
    const errores: string[] = []
    for (const [alumnoId, notaStr] of Object.entries(calificacionesExamen)) {
      const nota = parseFloat(notaStr)
      if (isNaN(nota)) continue
      const res = await registrarCalificacionExamen({
        examenCursoId: dialogCalifExamen.id,
        alumnoId,
        nota,
      })
      if (!res.ok) errores.push(extraerError(res))
    }
    setGuardandoCalifExamen(false)
    if (errores.length > 0) {
      setErrorCalifExamen(errores.join('; '))
    } else {
      setDialogCalifExamen(null)
    }
  }

  function resetFormTrabajo() {
    setNuevoTrabajoNombre('')
    setNuevoTrabajoFecha('')
    setNuevoTrabajoDesc('')
    setNuevoTrabajoCompetencia('')
    setErrorDialogTrabajo(null)
  }

  function resetFormExamen() {
    setNuevoExamenNombre('')
    setNuevoExamenFecha('')
    setErrorDialogExamen(null)
  }

  function abrirDialogExamenEditar(examen: Examen) {
    setExamenEditando(examen)
    setFormExamenEstado((examen.estado === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO') as 'ACTIVO' | 'INACTIVO')
    setErrorDialogExamenEditar(null)
    setDialogExamenEditar(true)
  }

  function cerrarDialogExamenEditar() {
    setDialogExamenEditar(false)
    setExamenEditando(null)
    setErrorDialogExamenEditar(null)
  }

  async function handleEditarExamen() {
    if (!examenEditando || !claseId) return
    setEditandoExamen(true)
    setErrorDialogExamenEditar(null)
    const res = await editarExamen(examenEditando.id, { estado: formExamenEstado })
    setEditandoExamen(false)
    if (res.ok) {
      cerrarDialogExamenEditar()
      void cargarExamenes(claseId)
    } else {
      setErrorDialogExamenEditar(extraerError(res))
    }
  }

  function abrirDialogTrabajoEditar(trabajo: Trabajo) {
    setDialogTrabajoEditar(trabajo)
    setEditTrabajoNombre(trabajo.nombre)
    setEditTrabajoFecha(trabajo.fecha ? String(trabajo.fecha).slice(0, 10) : '')
    setEditTrabajoDesc(trabajo.descripcion ?? '')
    setErrorDialogTrabajoEditar(null)
  }

  function cerrarDialogTrabajoEditar() {
    setDialogTrabajoEditar(null)
    setErrorDialogTrabajoEditar(null)
  }

  async function handleEditarTrabajo() {
    if (!dialogTrabajoEditar || !claseId) return
    setEditandoTrabajo(true)
    setErrorDialogTrabajoEditar(null)
    const res = await editarTrabajo(dialogTrabajoEditar.id, {
      nombre: editTrabajoNombre.trim(),
      fecha: editTrabajoFecha || undefined,
      descripcion: editTrabajoDesc.trim() || undefined,
    })
    setEditandoTrabajo(false)
    if (res.ok) {
      cerrarDialogTrabajoEditar()
      void cargarTrabajos(claseId, competencias)
    } else {
      setErrorDialogTrabajoEditar(extraerError(res))
    }
  }

  function abrirDialogResultadoDetalle(resultado: ResultadoCurso) {
    setDialogResultadoDetalle(resultado)
  }

  function cerrarDialogResultadoDetalle() {
    setDialogResultadoDetalle(null)
  }

  async function abrirDialogCalifTrabajo(trabajo: Trabajo) {
    setDialogCalifTrabajo(trabajo)
    setErrorCalifTrabajo(null)
    const res = await listarCalificacionesTrabajo(trabajo.id)
    if (res.ok) {
      const mapa: Record<string, string> = {}
      for (const c of res.data) {
        mapa[c.alumnoId] = String(c.nota)
      }
      setCalificacionesTrabajo(mapa)
    } else {
      setCalificacionesTrabajo({})
    }
  }

  async function abrirDialogCalifExamen(examen: Examen) {
    setDialogCalifExamen(examen)
    setErrorCalifExamen(null)
    const res = await listarCalificacionesExamen(examen.id)
    if (res.ok) {
      const mapa: Record<string, string> = {}
      for (const c of res.data) {
        mapa[c.alumnoId] = String(c.nota)
      }
      setCalificacionesExamen(mapa)
    } else {
      setCalificacionesExamen({})
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedResultados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return {
    trabajos,
    competencias,
    alumnos,
    examenes,
    resultados,
    estadoTrabajos,
    estadoExamenes,
    estadoResultados,
    errorTrabajos,
    errorExamenes,
    errorResultados,
    dialogTrabajoAbierto,
    setDialogTrabajoAbierto,
    dialogTrabajoEditar,
    dialogExamenAbierto,
    setDialogExamenAbierto,
    dialogExamenEditar,
    dialogCalifTrabajo,
    setDialogCalifTrabajo,
    dialogCalifExamen,
    setDialogCalifExamen,
    anularObjetivo,
    setAnularObjetivo,
    examenEditando,
    dialogResultadoDetalle,
    nuevoTrabajoNombre,
    setNuevoTrabajoNombre,
    nuevoTrabajoFecha,
    setNuevoTrabajoFecha,
    nuevoTrabajoDesc,
    setNuevoTrabajoDesc,
    nuevoTrabajoCompetencia,
    setNuevoTrabajoCompetencia,
    nuevoExamenNombre,
    setNuevoExamenNombre,
    nuevoExamenFecha,
    setNuevoExamenFecha,
    errorDialogTrabajo,
    errorDialogExamen,
    enviandoTrabajo,
    enviandoExamen,
    editandoExamen,
    editandoTrabajo,
    editTrabajoNombre,
    setEditTrabajoNombre,
    editTrabajoFecha,
    setEditTrabajoFecha,
    editTrabajoDesc,
    setEditTrabajoDesc,
    errorDialogTrabajoEditar,
    formExamenEstado,
    setFormExamenEstado,
    errorDialogExamenEditar,
    calificacionesTrabajo,
    setCalificacionesTrabajo,
    calificacionesExamen,
    setCalificacionesExamen,
    guardandoCalifTrabajo,
    guardandoCalifExamen,
    errorCalifTrabajo,
    errorCalifExamen,
    expandedResultados,
    cargarTrabajos,
    cargarExamenes,
    cargarResultados,
    traducirCompetencia,
    handleCrearTrabajo,
    handleAnularConfirmar,
    handleCalificarTrabajo,
    handleCrearExamen,
    handleCalificarExamen,
    resetFormTrabajo,
    resetFormExamen,
    abrirDialogExamenEditar,
    cerrarDialogExamenEditar,
    handleEditarExamen,
    abrirDialogTrabajoEditar,
    cerrarDialogTrabajoEditar,
    handleEditarTrabajo,
    abrirDialogResultadoDetalle,
    cerrarDialogResultadoDetalle,
    abrirDialogCalifTrabajo,
    abrirDialogCalifExamen,
    toggleExpanded,
  }
}
