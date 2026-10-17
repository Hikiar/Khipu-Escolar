import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/common/PageHeader'
import { GradosAgrupados } from '@/components/common/GradosAgrupados'
import { nivelesValidosDeCurso, type NivelCurricular } from '@/lib/nivelesCurso'
import { Can } from '@/components/guards/Can'
import { listarCursos, crearCurso, actualizarCurso, desactivarCurso, reactivarCurso, listarGradosDeCurso, agregarCursoAGrado, actualizarCursoGrado, quitarCursoDeGrado, type Curso, type CrearCursoInput, type ActualizarCursoInput, type GradoCurso, type CrearCursoGradoInput, type ActualizarCursoGradoInput } from '@/services/cursosService'
import {
  listarConfiguracionesDeCurso, crearConfiguracion, actualizarConfiguracion, eliminarConfiguracion,
  type ConfiguracionEvaluacion, type CrearConfiguracionInput, type ActualizarConfiguracionInput
} from '@/services/configuracionService'
import {
  listarCompetenciasDeConfig, crearCompetencia, actualizarCompetencia, anularCompetencia,
  type CompetenciaCurso, type CrearCompetenciaInput, type ActualizarCompetenciaInput
} from '@/services/competenciaService'
import { listarModelosEvaluacion, type ModeloEvaluacion } from '@/services/catalogoService'
import { listarGrados, type Grado } from '@/services/gradosService'
import { listarPeriodos, type PeriodoAcademico } from '@/services/periodosService'
import { BookOpen, RefreshCcw, AlertTriangle, Plus, Edit, Trash2, RotateCcw } from 'lucide-react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'

type EstadoCarga = 'cargando' | 'ok' | 'error'
type FiltroEstado = 'todos' | 'activos' | 'inactivos'
type GradosCursoEstado = 'cargando' | 'ok' | 'error'
type ConfigEstado = 'cargando' | 'ok' | 'error'
type CompetenciaEstado = 'cargando' | 'ok' | 'error'

function FilasSkeleton({ columnas }: { columnas: number }) {
  return (
    <>
      {Array.from({ length: 4 }, (_, indice) => (
        <TableRow key={indice}>
          {Array.from({ length: columnas }, (_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function CursosPage() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [cursos, setCursos] = useState<Curso[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroEstado>('activos')

  const [dialogoCrear, setDialogoCrear] = useState(false)
  const [formCodigo, setFormCodigo] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formEnviando, setFormEnviando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [gradosCatalogo, setGradosCatalogo] = useState<Grado[]>([])
  const [formGrados, setFormGrados] = useState<string[]>([])
  const [formModeloId, setFormModeloId] = useState('')

  const [dialogoEditar, setDialogoEditar] = useState<Curso | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editActivo, setEditActivo] = useState(true)
  const [editEnviando, setEditEnviando] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [dialogoDesactivar, setDialogoDesactivar] = useState<Curso | null>(null)
  const [desactivando, setDesactivando] = useState(false)
  const [desactivarError, setDesactivarError] = useState<string | null>(null)

  const [dialogoReactivar, setDialogoReactivar] = useState<Curso | null>(null)
  const [reactivando, setReactivando] = useState(false)
  const [reactivarError, setReactivarError] = useState<string | null>(null)

  // Plan de Estudios
  const [activeTab, setActiveTab] = useState<'cursos' | 'plan' | 'config'>('cursos')
  const [estadoGrados, setEstadoGrados] = useState<GradosCursoEstado>('cargando')
  const [gradosCurso, setGradosCurso] = useState<GradoCurso[]>([])
  const [errorGrados, setErrorGrados] = useState<string | null>(null)
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Curso | null>(null)

  const [dialogoAgregarGrado, setDialogoAgregarGrado] = useState(false)
  const [formGradoId, setFormGradoId] = useState('')
  const [formHorasSemana, setFormHorasSemana] = useState('')
  const [formOrden, setFormOrden] = useState('')
  const [formAgregarGradoEnviando, setFormAgregarGradoEnviando] = useState(false)
  const [formAgregarGradoError, setFormAgregarGradoError] = useState<string | null>(null)

  const [dialogoEditarGrado, setDialogoEditarGrado] = useState<GradoCurso | null>(null)
  const [editHorasSemana, setEditHorasSemana] = useState('')
  const [editOrden, setEditOrden] = useState('')
  const [editGradoEnviando, setEditGradoEnviando] = useState(false)
  const [editGradoError, setEditGradoError] = useState<string | null>(null)

  const [dialogoQuitarGrado, setDialogoQuitarGrado] = useState<GradoCurso | null>(null)
  const [quitandoGrado, setQuitandoGrado] = useState(false)
  const [quitarGradoError, setQuitarGradoError] = useState<string | null>(null)

  // Configuración de Evaluación
  const [estadoConfig, setEstadoConfig] = useState<ConfigEstado>('cargando')
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionEvaluacion[]>([])
  const [errorConfig, setErrorConfig] = useState<string | null>(null)
  const [configSeleccionada, setConfigSeleccionada] = useState<ConfiguracionEvaluacion | null>(null)
  const [modelos, setModelos] = useState<ModeloEvaluacion[]>([])

  const [dialogoCrearConfig, setDialogoCrearConfig] = useState(false)
  const [periodosCatalogo, setPeriodosCatalogo] = useState<PeriodoAcademico[]>([])
  const [formGradoIdConfig, setFormGradoIdConfig] = useState('')
  const [formPeriodoIdConfig, setFormPeriodoIdConfig] = useState('')
  const [formModeloIdConfig, setFormModeloIdConfig] = useState('')
  const [formCrearConfigEnviando, setFormCrearConfigEnviando] = useState(false)
  const [formCrearConfigError, setFormCrearConfigError] = useState<string | null>(null)

  const [dialogoEditarConfig, setDialogoEditarConfig] = useState<ConfiguracionEvaluacion | null>(null)
  const [editModeloIdConfig, setEditModeloIdConfig] = useState('')
  const [editActivoConfig, setEditActivoConfig] = useState(true)
  const [editConfigEnviando, setEditConfigEnviando] = useState(false)
  const [editConfigError, setEditConfigError] = useState<string | null>(null)

  const [dialogoEliminarConfig, setDialogoEliminarConfig] = useState<ConfiguracionEvaluacion | null>(null)
  const [eliminandoConfig, setEliminandoConfig] = useState(false)
  const [eliminarConfigError, setEliminarConfigError] = useState<string | null>(null)

  // Competencias
  const [estadoCompetencias, setEstadoCompetencias] = useState<CompetenciaEstado>('cargando')
  const [competencias, setCompetencias] = useState<CompetenciaCurso[]>([])
  const [errorCompetencias, setErrorCompetencias] = useState<string | null>(null)

  const [dialogoCrearCompetencia, setDialogoCrearCompetencia] = useState(false)
  const [formCompetenciaCodigo, setFormCompetenciaCodigo] = useState('')
  const [formCompetenciaNombre, setFormCompetenciaNombre] = useState('')
  const [formCompetenciaDescripcion, setFormCompetenciaDescripcion] = useState('')
  const [formCompetenciaOrden, setFormCompetenciaOrden] = useState('')
  const [formCrearCompetenciaEnviando, setFormCrearCompetenciaEnviando] = useState(false)
  const [formCrearCompetenciaError, setFormCrearCompetenciaError] = useState<string | null>(null)

  const [dialogoEditarCompetencia, setDialogoEditarCompetencia] = useState<CompetenciaCurso | null>(null)
  const [editCompetenciaNombre, setEditCompetenciaNombre] = useState('')
  const [editCompetenciaDescripcion, setEditCompetenciaDescripcion] = useState('')
  const [editCompetenciaOrden, setEditCompetenciaOrden] = useState('')
  const [editCompetenciaActivo, setEditCompetenciaActivo] = useState(true)
  const [editCompetenciaEnviando, setEditCompetenciaEnviando] = useState(false)
  const [editCompetenciaError, setEditCompetenciaError] = useState<string | null>(null)

  const [dialogoAnularCompetencia, setDialogoAnularCompetencia] = useState<CompetenciaCurso | null>(null)
  const [anulandoCompetencia, setAnulandoCompetencia] = useState(false)
  const [anularCompetenciaError, setAnularCompetenciaError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    let activos: boolean | undefined
    if (filtro === 'activos') activos = true
    else if (filtro === 'inactivos') activos = false

    const resultado = await listarCursos(activos)
    if (resultado.ok === false) {
      setError(resultado.error)
      setEstado('error')
    } else {
      setCursos(resultado.data)
      setEstado('ok')
    }
  }, [filtro])

  useEffect(() => {
    setEstado('cargando')
    setError(null)
    void cargar()
  }, [cargar])

  function reintentar() {
    setEstado('cargando')
    setError(null)
    void cargar()
  }

  const cargarGradosCurso = useCallback(async (curso: Curso) => {
    setEstadoGrados('cargando')
    setErrorGrados(null)
    const resultado = await listarGradosDeCurso(curso.id)
    if (resultado.ok === false) {
      setErrorGrados(resultado.error)
      setEstadoGrados('error')
    } else {
      setGradosCurso(resultado.data)
      setEstadoGrados('ok')
    }
  }, [])

  function reintentarGrados() {
    if (cursoSeleccionado) {
      setEstadoGrados('cargando')
      setErrorGrados(null)
      void cargarGradosCurso(cursoSeleccionado)
    }
  }

  async function abrirDialogoCrear() {
    setFormCodigo('')
    setFormNombre('')
    setFormDescripcion('')
    setFormGrados([])
    setFormModeloId('')
    setFormError(null)
    setDialogoCrear(true)

    const resultadoGrados = await listarGrados()
    if (resultadoGrados.ok !== false) setGradosCatalogo(resultadoGrados.data)

    if (modelos.length === 0) {
      const resultadoModelos = await listarModelosEvaluacion()
      if (resultadoModelos.ok !== false) {
        setModelos(resultadoModelos.data)
        const porDefecto = resultadoModelos.data.find((m) => m.codigo === 'COMPETENCIAS')
        setFormModeloId(porDefecto ? porDefecto.id : '')
      }
    } else {
      const porDefecto = modelos.find((m) => m.codigo === 'COMPETENCIAS')
      setFormModeloId(porDefecto ? porDefecto.id : '')
    }
  }

  async function enviarCrear() {
    if (!formCodigo.trim() || !formNombre.trim()) return
    setFormEnviando(true)
    setFormError(null)

    const input: CrearCursoInput = {
      codigo: formCodigo.trim().toUpperCase(),
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || undefined,
      grados: formGrados.map((gradoId) => ({ gradoId })),
      modeloEvaluacionId: formModeloId || undefined,
    }

    const resultado = await crearCurso(input)
    setFormEnviando(false)

    if (resultado.ok === false) {
      setFormError(resultado.error)
      return
    }
    setDialogoCrear(false)
    void cargar()
  }

  function abrirDialogoEditar(curso: Curso) {
    setDialogoEditar(curso)
    setEditNombre(curso.nombre)
    setEditDescripcion(curso.descripcion ?? '')
    setEditActivo(curso.activo)
    setEditError(null)
  }

  async function enviarEditar() {
    if (!dialogoEditar || !editNombre.trim()) return
    setEditEnviando(true)
    setEditError(null)

    const input: ActualizarCursoInput = {
      nombre: editNombre.trim(),
      descripcion: editDescripcion.trim() || undefined,
      activo: editActivo,
    }

    const resultado = await actualizarCurso(dialogoEditar.id, input)
    setEditEnviando(false)

    if (resultado.ok === false) {
      setEditError(resultado.error)
      return
    }
    setDialogoEditar(null)
    void cargar()
  }

  function abrirDialogoDesactivar(curso: Curso) {
    setDialogoDesactivar(curso)
    setDesactivarError(null)
  }

  async function ejecutarDesactivar() {
    if (!dialogoDesactivar) return
    setDesactivando(true)
    setDesactivarError(null)

    const resultado = await desactivarCurso(dialogoDesactivar.id)
    setDesactivando(false)

    if (resultado.ok === false) {
      setDesactivarError(resultado.error)
      return
    }
    setDialogoDesactivar(null)
    void cargar()
}

  function abrirDialogoReactivar(curso: Curso) {
    setDialogoReactivar(curso)
    setReactivarError(null)
  }

  async function ejecutarReactivar() {
    if (!dialogoReactivar) return
    setReactivando(true)
    setReactivarError(null)

    const resultado = await reactivarCurso(dialogoReactivar.id)
    setReactivando(false)

    if (resultado.ok === false) {
      setReactivarError(resultado.error)
      return
    }
    setDialogoReactivar(null)
    void cargar()
}

// Plan de Estudios handlers
  function handleTabChange(tab: 'cursos' | 'plan' | 'config') {
    setActiveTab(tab)
    if (tab === 'plan' && !cursoSeleccionado && cursos.length > 0) {
      setCursoSeleccionado(cursos[0])
    }
    if (tab === 'config' && !cursoSeleccionado && cursos.length > 0) {
      setCursoSeleccionado(cursos[0])
    }
  }

  // Cargar modelos de evaluación
  const cargarModelos = useCallback(async () => {
    const resultado = await listarModelosEvaluacion()
    if (resultado.ok === false) {
      // Error is handled silently, modelos will remain empty
    } else {
      setModelos(resultado.data.filter(m => m.activo))
    }
  }, [])

  const cargarConfiguraciones = useCallback(async (curso: Curso) => {
    setEstadoConfig('cargando')
    setErrorConfig(null)
    await cargarModelos()
    const resultado = await listarConfiguracionesDeCurso(curso.id)
    if (resultado.ok === false) {
      setErrorConfig(resultado.error)
      setEstadoConfig('error')
    } else {
      setConfiguraciones(resultado.data)
      setEstadoConfig('ok')
    }
  }, [cargarModelos])

  useEffect(() => {
    if (!cursoSeleccionado) {
      if (activeTab === 'plan') {
        setGradosCurso([])
        setEstadoGrados('ok')
      }
      if (activeTab === 'config') {
        setConfiguraciones([])
        setEstadoConfig('ok')
      }
      return
    }
    if (activeTab === 'plan') void cargarGradosCurso(cursoSeleccionado)
    if (activeTab === 'config') void cargarConfiguraciones(cursoSeleccionado)
  }, [cursoSeleccionado, activeTab, cargarGradosCurso, cargarConfiguraciones])

  function reintentarConfig() {
    if (cursoSeleccionado) {
      setEstadoConfig('cargando')
      setErrorConfig(null)
      void cargarConfiguraciones(cursoSeleccionado)
    }
  }

  const cargarCompetencias = useCallback(async (config: ConfiguracionEvaluacion) => {
    setEstadoCompetencias('cargando')
    setErrorCompetencias(null)
    const resultado = await listarCompetenciasDeConfig(config.id)
    if (resultado.ok === false) {
      setErrorCompetencias(resultado.error)
      setEstadoCompetencias('error')
    } else {
      setCompetencias(resultado.data)
      setEstadoCompetencias('ok')
    }
  }, [])

  function reintentarCompetencias() {
    if (configSeleccionada) {
      setEstadoCompetencias('cargando')
      setErrorCompetencias(null)
      void cargarCompetencias(configSeleccionada)
    }
  }

  async function abrirDialogoCrearConfig(curso: Curso) {
    setCursoSeleccionado(curso)
    setFormGradoIdConfig('')
    setFormPeriodoIdConfig('')
    setFormModeloIdConfig('')
    setFormCrearConfigError(null)
    await cargarModelos()
    if (periodosCatalogo.length === 0) {
      const resultado = await listarPeriodos()
      if (resultado.ok !== false) setPeriodosCatalogo(resultado.data)
    }
    setDialogoCrearConfig(true)
  }

  async function enviarCrearConfig() {
    if (!cursoSeleccionado || !formGradoIdConfig || !formPeriodoIdConfig || !formModeloIdConfig) return
    setFormCrearConfigEnviando(true)
    setFormCrearConfigError(null)

    const input: CrearConfiguracionInput = {
      cursoId: cursoSeleccionado.id,
      gradoId: formGradoIdConfig,
      periodoId: formPeriodoIdConfig,
      modeloEvaluacionId: formModeloIdConfig,
    }

    const resultado = await crearConfiguracion(input)
    setFormCrearConfigEnviando(false)

    if (resultado.ok === false) {
      setFormCrearConfigError(resultado.error)
      return
    }
    setDialogoCrearConfig(false)
    if (cursoSeleccionado) void cargarConfiguraciones(cursoSeleccionado)
  }

  function abrirDialogoEditarConfig(config: ConfiguracionEvaluacion) {
    setDialogoEditarConfig(config)
    setEditModeloIdConfig(config.modeloEvaluacionId)
    setEditActivoConfig(config.activo)
    setEditConfigError(null)
  }

  async function enviarEditarConfig() {
    if (!dialogoEditarConfig) return
    setEditConfigEnviando(true)
    setEditConfigError(null)

    const input: ActualizarConfiguracionInput = {
      modeloEvaluacionId: editModeloIdConfig || undefined,
      activo: editActivoConfig,
    }

    const resultado = await actualizarConfiguracion(dialogoEditarConfig.id, input)
    setEditConfigEnviando(false)

    if (resultado.ok === false) {
      setEditConfigError(resultado.error)
      return
    }
    setDialogoEditarConfig(null)
    if (cursoSeleccionado) void cargarConfiguraciones(cursoSeleccionado)
  }

  function abrirDialogoEliminarConfig(config: ConfiguracionEvaluacion) {
    setDialogoEliminarConfig(config)
    setEliminarConfigError(null)
  }

  async function ejecutarEliminarConfig() {
    if (!dialogoEliminarConfig || !cursoSeleccionado) return
    setEliminandoConfig(true)
    setEliminarConfigError(null)

    const resultado = await eliminarConfiguracion(dialogoEliminarConfig.id)
    setEliminandoConfig(false)

    if (resultado.ok === false) {
      setEliminarConfigError(resultado.error)
      return
    }
    setDialogoEliminarConfig(null)
    void cargarConfiguraciones(cursoSeleccionado!)
  }

  // Competencias handlers
  function handleConfigClick(config: ConfiguracionEvaluacion) {
    setConfigSeleccionada(config)
    void cargarCompetencias(config)
  }

  async function abrirDialogoCrearCompetencia(config: ConfiguracionEvaluacion) {
    setConfigSeleccionada(config)
    setFormCompetenciaCodigo('')
    setFormCompetenciaNombre('')
    setFormCompetenciaDescripcion('')
    setFormCompetenciaOrden('')
    setFormCrearCompetenciaError(null)
    setDialogoCrearCompetencia(true)
  }

  async function enviarCrearCompetencia() {
    if (!configSeleccionada || !formCompetenciaCodigo.trim() || !formCompetenciaNombre.trim()) return
    setFormCrearCompetenciaEnviando(true)
    setFormCrearCompetenciaError(null)

    const input: CrearCompetenciaInput = {
      configuracionEvaluacionCursoId: configSeleccionada.id,
      codigo: formCompetenciaCodigo.trim().toUpperCase(),
      nombre: formCompetenciaNombre.trim(),
      descripcion: formCompetenciaDescripcion.trim() || undefined,
      orden: formCompetenciaOrden ? parseInt(formCompetenciaOrden, 10) : undefined,
    }

    const resultado = await crearCompetencia(input)
    setFormCrearCompetenciaEnviando(false)

    if (resultado.ok === false) {
      setFormCrearCompetenciaError(resultado.error)
      return
    }
    setDialogoCrearCompetencia(false)
    if (configSeleccionada) void cargarCompetencias(configSeleccionada)
  }

  function abrirDialogoEditarCompetencia(comp: CompetenciaCurso) {
    setDialogoEditarCompetencia(comp)
    setEditCompetenciaNombre(comp.nombre)
    setEditCompetenciaDescripcion(comp.descripcion ?? '')
    setEditCompetenciaOrden(comp.orden.toString())
    setEditCompetenciaActivo(comp.activo)
    setEditCompetenciaError(null)
  }

  async function enviarEditarCompetencia() {
    if (!dialogoEditarCompetencia) return
    setEditCompetenciaEnviando(true)
    setEditCompetenciaError(null)

    const input: ActualizarCompetenciaInput = {
      nombre: editCompetenciaNombre.trim() || undefined,
      descripcion: editCompetenciaDescripcion.trim() || undefined,
      orden: editCompetenciaOrden ? parseInt(editCompetenciaOrden, 10) : undefined,
      activo: editCompetenciaActivo,
    }

    const resultado = await actualizarCompetencia(dialogoEditarCompetencia.id, input)
    setEditCompetenciaEnviando(false)

    if (resultado.ok === false) {
      setEditCompetenciaError(resultado.error)
      return
    }
    setDialogoEditarCompetencia(null)
    if (configSeleccionada) void cargarCompetencias(configSeleccionada)
  }

  function abrirDialogoAnularCompetencia(comp: CompetenciaCurso) {
    setDialogoAnularCompetencia(comp)
    setAnularCompetenciaError(null)
  }

  async function ejecutarAnularCompetencia() {
    if (!dialogoAnularCompetencia || !configSeleccionada) return
    setAnulandoCompetencia(true)
    setAnularCompetenciaError(null)

    const resultado = await anularCompetencia(dialogoAnularCompetencia.id)
    setAnulandoCompetencia(false)

    if (resultado.ok === false) {
      setAnularCompetenciaError(resultado.error)
      return
    }
    setDialogoAnularCompetencia(null)
    void cargarCompetencias(configSeleccionada!)
  }

  // Plan de Estudios handlers
  function abrirDialogoAgregarGrado(curso: Curso) {
    setCursoSeleccionado(curso)
    setFormGradoId('')
    setFormHorasSemana('')
    setFormOrden('')
    setFormAgregarGradoError(null)
    setDialogoAgregarGrado(true)
    void (async () => {
      if (gradosCatalogo.length === 0) {
        const resultado = await listarGrados()
        if (resultado.ok !== false) setGradosCatalogo(resultado.data)
      }
    })()
  }

  async function enviarAgregarGrado() {
    if (!cursoSeleccionado || !formGradoId) return
    setFormAgregarGradoEnviando(true)
    setFormAgregarGradoError(null)

    const input: CrearCursoGradoInput = {
      cursoId: cursoSeleccionado.id,
      gradoId: formGradoId,
      horasSemana: formHorasSemana ? parseInt(formHorasSemana, 10) : undefined,
      orden: formOrden ? parseInt(formOrden, 10) : undefined,
    }

    const resultado = await agregarCursoAGrado(input)
    setFormAgregarGradoEnviando(false)

    if (resultado.ok === false) {
      setFormAgregarGradoError(resultado.error)
      return
    }
    setDialogoAgregarGrado(false)
    if (cursoSeleccionado) void cargarGradosCurso(cursoSeleccionado)
  }

  function abrirDialogoEditarGrado(grado: GradoCurso) {
    setDialogoEditarGrado(grado)
    setEditHorasSemana(grado.horasSemana?.toString() ?? '')
    setEditOrden(grado.orden?.toString() ?? '')
    setEditGradoError(null)
  }

  async function enviarEditarGrado() {
    if (!dialogoEditarGrado || !cursoSeleccionado) return
    setEditGradoEnviando(true)
    setEditGradoError(null)

    const input: ActualizarCursoGradoInput = {
      horasSemana: editHorasSemana ? parseInt(editHorasSemana, 10) : undefined,
      orden: editOrden ? parseInt(editOrden, 10) : undefined,
    }

    const resultado = await actualizarCursoGrado(cursoSeleccionado.id, dialogoEditarGrado.gradoId, input)
    setEditGradoEnviando(false)

    if (resultado.ok === false) {
      setEditGradoError(resultado.error)
      return
    }
    setDialogoEditarGrado(null)
    void cargarGradosCurso(cursoSeleccionado!)
  }

  function abrirDialogoQuitarGrado(grado: GradoCurso) {
    setDialogoQuitarGrado(grado)
    setQuitarGradoError(null)
  }

  async function ejecutarQuitarGrado() {
    if (!dialogoQuitarGrado || !cursoSeleccionado) return
    setQuitandoGrado(true)
    setQuitarGradoError(null)

    const resultado = await quitarCursoDeGrado(cursoSeleccionado.id, dialogoQuitarGrado.gradoId)
    setQuitandoGrado(false)

    if (resultado.ok === false) {
      setQuitarGradoError(resultado.error)
      return
    }
    setDialogoQuitarGrado(null)
    void cargarGradosCurso(cursoSeleccionado!)
  }

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Cursos y materias del plan de estudios"
        icon={<BookOpen className="size-5" />}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="plan">Plan de estudios</TabsTrigger>
          <TabsTrigger value="config">Esquema de calificación</TabsTrigger>
        </TabsList>

        <TabsContent value="cursos">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Can permission="cursos.crear">
                <Button onClick={abrirDialogoCrear}>
                  <Plus className="size-4" aria-hidden />
                  Crear curso
                </Button>
              </Can>

              <div className="w-full max-w-xs">
                <Label className="mb-1.5 block">Filtrar por estado</Label>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroEstado)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar filtro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activos">Activos</SelectItem>
                    <SelectItem value="inactivos">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listado de cursos</CardTitle>
                <CardDescription>
                  {estado === 'ok' && cursos.length > 0
                    ? `${cursos.length} curso${cursos.length !== 1 ? 's' : ''} encontrado${cursos.length !== 1 ? 's' : ''}`
                    : 'Listado de cursos'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estado === 'error' && (
                  <div className="grid gap-3">
                    <Alert variant="destructive">
                      <AlertTriangle className="size-4" aria-hidden />
                      <AlertTitle>Error al cargar</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div>
                      <Button variant="outline" onClick={reintentar}>
                        <RefreshCcw className="size-4" aria-hidden />
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}

                {estado === 'cargando' && (
                  <Table aria-busy="true">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <FilasSkeleton columnas={5} />
                    </TableBody>
                  </Table>
                )}

                {estado === 'ok' && cursos.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay cursos registrados.
                  </p>
                )}

                {estado === 'ok' && cursos.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cursos.map((curso) => (
                        <TableRow key={curso.id}>
                          <TableCell className="font-medium font-mono text-sm">
                            {curso.codigo}
                          </TableCell>
                          <TableCell className="font-medium">{curso.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {curso.descripcion ?? '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={curso.activo ? 'success' : 'outline'}>
                              {curso.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Can permission="cursos.editar">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => abrirDialogoEditar(curso)}
                                >
                                  <Edit className="size-3" aria-hidden />
                                  Editar
                                </Button>
                              </Can>
                              <Can permission="cursos.eliminar">
                                {curso.activo && (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => abrirDialogoDesactivar(curso)}
                                  >
                                    <Trash2 className="size-3" aria-hidden />
                                    Desactivar
                                  </Button>
                                )}
                              </Can>
                              <Can permission="cursos.editar">
                                {!curso.activo && (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => abrirDialogoReactivar(curso)}
                                  >
                                    <RotateCcw className="size-3" aria-hidden />
                                    Reactivar
                                  </Button>
                                )}
                              </Can>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plan">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Can permission="grados.crear">
                <Button onClick={() => cursoSeleccionado && abrirDialogoAgregarGrado(cursoSeleccionado)}>
                  <Plus className="size-4" aria-hidden />
                  Agregar grado al plan
                </Button>
              </Can>

              <div className="w-full max-w-xs">
                <Label className="mb-1.5 block">Seleccionar curso</Label>
                <Select
                  value={cursoSeleccionado?.id ?? ''}
                  onValueChange={(v) => setCursoSeleccionado(cursos.find(c => c.id === v) ?? null)}
                  disabled={cursos.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={cursos.length === 0 ? 'No hay cursos' : 'Seleccionar curso'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.codigo} - {curso.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan de estudios</CardTitle>
                <CardDescription>
                  {cursoSeleccionado
                    ? `Grados donde se dicta ${cursoSeleccionado.codigo} - ${cursoSeleccionado.nombre}`
                    : 'Seleccione un curso para ver su plan de estudios'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estadoGrados === 'error' && (
                  <div className="grid gap-3">
                    <Alert variant="destructive">
                      <AlertTriangle className="size-4" aria-hidden />
                      <AlertTitle>Error al cargar plan de estudios</AlertTitle>
                      <AlertDescription>{errorGrados}</AlertDescription>
                    </Alert>
                    <Button variant="outline" onClick={reintentarGrados}>
                      <RefreshCcw className="size-4" aria-hidden />
                      Reintentar
                    </Button>
                  </div>
                )}

                {estadoGrados === 'cargando' && (
                  <Table aria-busy="true">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grado</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Horas/semana</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <FilasSkeleton columnas={5} />
                    </TableBody>
                  </Table>
                )}

                {estadoGrados === 'ok' && gradosCurso.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay grados en el plan de estudios de este curso.
                  </p>
                )}

                {estadoGrados === 'ok' && gradosCurso.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grado</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Horas/semana</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradosCurso.map((grado) => (
                        <TableRow key={grado.gradoId}>
                          <TableCell className="font-medium">{grado.gradoNombre}</TableCell>
                          <TableCell className="font-mono text-sm">{grado.gradoCodigo}</TableCell>
                          <TableCell>{grado.horasSemana ?? '—'}</TableCell>
                          <TableCell>{grado.orden ?? '—'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Can permission="grados.editar">
                                <Button variant="outline" size="xs" onClick={() => abrirDialogoEditarGrado(grado)}>
                                  <Edit className="size-3" aria-hidden />
                                  Editar
                                </Button>
                              </Can>
                              <Can permission="grados.eliminar">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => abrirDialogoQuitarGrado(grado)}
                                >
                                  <Trash2 className="size-3" aria-hidden />
                                  Quitar
                                </Button>
                              </Can>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Can permission="configuraciones.crear">
                <Button onClick={() => cursoSeleccionado && abrirDialogoCrearConfig(cursoSeleccionado)}>
                  <Plus className="size-4" aria-hidden />
                  Crear configuración
                </Button>
              </Can>

              <div className="w-full max-w-xs">
                <Label className="mb-1.5 block">Seleccionar curso</Label>
                <Select
                  value={cursoSeleccionado?.id ?? ''}
                  onValueChange={(v) => setCursoSeleccionado(cursos.find(c => c.id === v) ?? null)}
                  disabled={cursos.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={cursos.length === 0 ? 'No hay cursos' : 'Seleccionar curso'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.codigo} - {curso.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuraciones de Evaluación</CardTitle>
                <CardDescription>
                  {cursoSeleccionado
                    ? `Configuraciones para ${cursoSeleccionado.codigo} - ${cursoSeleccionado.nombre}`
                    : 'Seleccione un curso para ver sus configuraciones'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estadoConfig === 'error' && (
                  <div className="grid gap-3">
                    <Alert variant="destructive">
                      <AlertTriangle className="size-4" aria-hidden />
                      <AlertTitle>Error al cargar configuraciones</AlertTitle>
                      <AlertDescription>{errorConfig}</AlertDescription>
                    </Alert>
                    <Button variant="outline" onClick={reintentarConfig}>
                      <RefreshCcw className="size-4" aria-hidden />
                      Reintentar
                    </Button>
                  </div>
                )}

                {estadoConfig === 'cargando' && (
                  <Table aria-busy="true">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grado</TableHead>
                        <TableHead>Año lectivo</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <FilasSkeleton columnas={5} />
                    </TableBody>
                  </Table>
                )}

                {estadoConfig === 'ok' && configuraciones.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay configuraciones de evaluación para este curso.
                  </p>
                )}

                {estadoConfig === 'ok' && configuraciones.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grado</TableHead>
                        <TableHead>Año lectivo</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configuraciones.map((config) => (
                        <TableRow
                          key={config.id}
                          onClick={() => handleConfigClick(config)}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{config.gradoNombre}</TableCell>
                          <TableCell className="font-mono text-sm">{config.periodoCodigo}</TableCell>
                          <TableCell>{config.modeloEvaluacionNombre}</TableCell>
                          <TableCell>
                            <Badge variant={config.activo ? 'success' : 'outline'}>
                              {config.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Can permission="configuraciones.editar">
                                <Button variant="outline" size="xs" onClick={(e) => { e.stopPropagation(); abrirDialogoEditarConfig(config); }}>
                                  <Edit className="size-3" aria-hidden />
                                  Editar
                                </Button>
                              </Can>
                              <Can permission="configuraciones.eliminar">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={(e) => { e.stopPropagation(); abrirDialogoEliminarConfig(config); }}
                                  disabled={!config.activo}
                                >
                                  <Trash2 className="size-3" aria-hidden />
                                  Eliminar
                                </Button>
                              </Can>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {configSeleccionada && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Competencias: {configSeleccionada.gradoNombre} - {configSeleccionada.periodoCodigo} ({configSeleccionada.modeloEvaluacionNombre})</h3>
                      <Can permission="competencias.crear">
                        <Button size="sm" onClick={() => configSeleccionada && abrirDialogoCrearCompetencia(configSeleccionada)}>
                          <Plus className="size-4" aria-hidden />
                          Crear competencia
                        </Button>
                      </Can>
                    </div>

                    {estadoCompetencias === 'error' && (
                      <div className="grid gap-3">
                        <Alert variant="destructive">
                          <AlertTriangle className="size-4" aria-hidden />
                          <AlertTitle>Error al cargar competencias</AlertTitle>
                          <AlertDescription>{errorCompetencias}</AlertDescription>
                        </Alert>
                        <Button variant="outline" onClick={reintentarCompetencias}>
                          <RefreshCcw className="size-4" aria-hidden />
                          Reintentar
                        </Button>
                      </div>
                    )}

                    {estadoCompetencias === 'cargando' && (
                      <Table aria-busy="true">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Orden</TableHead>
                            <TableHead>Activo</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <FilasSkeleton columnas={5} />
                        </TableBody>
                      </Table>
                    )}

                    {estadoCompetencias === 'ok' && competencias.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No hay competencias definidas para esta configuración.
                      </p>
                    )}

                    {estadoCompetencias === 'ok' && competencias.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Orden</TableHead>
                            <TableHead>Activo</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {competencias.map((comp) => (
                            <TableRow key={comp.id}>
                              <TableCell className="font-mono text-sm">{comp.codigo}</TableCell>
                              <TableCell className="font-medium">{comp.nombre}</TableCell>
                              <TableCell>{comp.orden}</TableCell>
                              <TableCell>
                                <Badge variant={comp.activo ? 'success' : 'outline'}>
                                  {comp.activo ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Can permission="competencias.editar">
                                    <Button variant="outline" size="xs" onClick={() => abrirDialogoEditarCompetencia(comp)}>
                                      <Edit className="size-3" aria-hidden />
                                      Editar
                                    </Button>
                                  </Can>
                                  <Can permission="competencias.eliminar">
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={() => abrirDialogoAnularCompetencia(comp)}
                                      disabled={!comp.activo}
                                    >
                                      <Trash2 className="size-3" aria-hidden />
                                      Anular
                                    </Button>
                                  </Can>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogoCrear} onOpenChange={setDialogoCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear curso</DialogTitle>
            <DialogDescription>
              Ingrese los datos y seleccione los grados donde se dictará. Se creará su configuración de evaluación.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={formCodigo}
                onChange={(e) => {
                  const nuevo = e.target.value.toUpperCase()
                  setFormCodigo(nuevo)
                  const validos = nivelesValidosDeCurso(nuevo)
                  setFormGrados((prev) =>
                    prev.filter((gid) =>
                      gradosCatalogo.some(
                        (g) => g.id === gid && validos.includes(g.nivel as NivelCurricular),
                      ),
                    ),
                  )
                }}
                placeholder="Ej: MAT, COM, CIE"
                maxLength={10}
                disabled={formEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Matemáticas"
                maxLength={100}
                disabled={formEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Descripción breve del curso"
                maxLength={255}
                disabled={formEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label>Grados donde se dictará</Label>
              <p className="text-xs text-muted-foreground">
                Los grados de niveles donde no se dicta el curso (según el código) se atenúan.
              </p>
              {gradosCatalogo.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay grados disponibles.</p>
              ) : (
                (['INICIAL', 'PRIMARIA', 'SECUNDARIA'] as const).map((nivel) => {
                  const gradosDeNivel = gradosCatalogo
                    .filter((g) => g.nivel === nivel)
                    .sort((a, b) => a.orden - b.orden)
                  if (gradosDeNivel.length === 0) return null
                  const permitido = nivelesValidosDeCurso(formCodigo).includes(nivel)
                  const etiqueta =
                    nivel === 'INICIAL' ? 'Inicial' : nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'
                  return (
                    <div key={nivel} className="grid gap-1.5">
                      <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-md border p-3">
                        {gradosDeNivel.map((g) => {
                          const marcado = formGrados.includes(g.id)
                          return (
                            <label
                              key={g.id}
                              className={`flex items-center gap-2 text-sm ${
                                permitido ? 'cursor-pointer' : 'cursor-not-allowed'
                              }`}
                            >
                              <Checkbox
                                checked={marcado}
                                disabled={formEnviando || !permitido}
                                onCheckedChange={() => {
                                  if (!permitido) return
                                  setFormGrados((prev) =>
                                    marcado ? prev.filter((x) => x !== g.id) : [...prev, g.id],
                                  )
                                }}
                              />
                              <span className={permitido ? '' : 'text-muted-foreground'}>
                                {g.nombre}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modelo-curso">Modelo de evaluación</Label>
              <Select
                value={formModeloId}
                onValueChange={setFormModeloId}
                disabled={formEnviando}
              >
                <SelectTrigger id="modelo-curso">
                  <SelectValue placeholder="Seleccione el modelo de evaluación" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoCrear(false)}
              disabled={formEnviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={enviarCrear}
              disabled={!formCodigo.trim() || !formNombre.trim() || formEnviando}
            >
              {formEnviando ? 'Creando...' : 'Crear curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoEditar !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoEditar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar curso</DialogTitle>
            <DialogDescription>
              Modifique los datos del curso seleccionado.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Código</Label>
              <Input
                value={dialogoEditar?.codigo ?? ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                id="edit-nombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                maxLength={100}
                disabled={editEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-descripcion">Descripción (opcional)</Label>
              <Input
                id="edit-descripcion"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                maxLength={255}
                disabled={editEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-activo">Estado</Label>
              <Select
                value={String(editActivo)}
                onValueChange={(v) => setEditActivo(v === 'true')}
                disabled={editEnviando}
              >
                <SelectTrigger id="edit-activo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoEditar(null)}
              disabled={editEnviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={enviarEditar}
              disabled={!editNombre.trim() || editEnviando}
            >
              {editEnviando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoDesactivar !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoDesactivar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar curso</DialogTitle>
            <DialogDescription>
              ¿Está seguro de desactivar el curso <strong>{dialogoDesactivar?.nombre}</strong> ({dialogoDesactivar?.codigo})?
              Esta acción cambiará su estado a inactivo. Si el curso tiene plan de estudios,
              configuraciones o asignaciones asociadas, no se podrá desactivar.
            </DialogDescription>
          </DialogHeader>

          {desactivarError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{desactivarError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoDesactivar(null)}
              disabled={desactivando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={ejecutarDesactivar}
              disabled={desactivando}
            >
              {desactivando ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoReactivar !== null}
        onOpenChange={(open) => {
          if (!open) setDialogoReactivar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivar curso</DialogTitle>
            <DialogDescription>
              ¿Está seguro de reactivar el curso <strong>{dialogoReactivar?.nombre}</strong> ({dialogoReactivar?.codigo})? Su estado volverá a activo.
            </DialogDescription>
          </DialogHeader>

          {reactivarError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{reactivarError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoReactivar(null)}
              disabled={reactivando}
            >
              Cancelar
            </Button>
            <Button onClick={ejecutarReactivar} disabled={reactivando}>
              {reactivando ? 'Reactivando...' : 'Reactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <Dialog open={dialogoAgregarGrado} onOpenChange={setDialogoAgregarGrado}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar grado al plan de estudios</DialogTitle>
            <DialogDescription>
              Seleccione un grado y configure las horas semanales y el orden para el curso <strong>{cursoSeleccionado?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          {formAgregarGradoError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formAgregarGradoError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="gradoId">Grado</Label>
              <Select value={formGradoId} onValueChange={setFormGradoId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar grado" />
                </SelectTrigger>
                <SelectContent>
                  <GradosAgrupados
                    grados={gradosCatalogo.filter(
                      (g) =>
                        !gradosCurso.some((c) => c.gradoId === g.id) &&
                        nivelesValidosDeCurso(cursoSeleccionado?.codigo ?? '').includes(
                          g.nivel as NivelCurricular,
                        ),
                    )}
                  />
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="horasSemana">Horas semanales</Label>
              <Input
                id="horasSemana"
                type="number"
                min="1"
                value={formHorasSemana}
                onChange={(e) => setFormHorasSemana(e.target.value)}
                placeholder="Ej: 5"
                disabled={formAgregarGradoEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                min="0"
                value={formOrden}
                onChange={(e) => setFormOrden(e.target.value)}
                placeholder="Ej: 1"
                disabled={formAgregarGradoEnviando}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAgregarGrado(false)} disabled={formAgregarGradoEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarAgregarGrado} disabled={!formGradoId || formAgregarGradoEnviando}>
              {formAgregarGradoEnviando ? 'Agregando...' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoEditarGrado !== null} onOpenChange={(open) => { if (!open) setDialogoEditarGrado(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar grado en plan de estudios</DialogTitle>
            <DialogDescription>
              Modifique las horas semanales y el orden para <strong>{dialogoEditarGrado?.gradoNombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          {editGradoError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{editGradoError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Grado</Label>
              <Input value={dialogoEditarGrado?.gradoNombre ?? ''} disabled className="bg-muted" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editHorasSemana">Horas semanales</Label>
              <Input
                id="editHorasSemana"
                type="number"
                min="1"
                value={editHorasSemana}
                onChange={(e) => setEditHorasSemana(e.target.value)}
                disabled={editGradoEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editOrden">Orden</Label>
              <Input
                id="editOrden"
                type="number"
                min="0"
                value={editOrden}
                onChange={(e) => setEditOrden(e.target.value)}
                disabled={editGradoEnviando}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEditarGrado(null)} disabled={editGradoEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarEditarGrado} disabled={editGradoEnviando}>
              {editGradoEnviando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoQuitarGrado !== null} onOpenChange={(open) => { if (!open) setDialogoQuitarGrado(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quitar grado del plan</DialogTitle>
            <DialogDescription>
              Se eliminará <strong>{dialogoQuitarGrado?.gradoNombre}</strong> del plan de estudios de <strong>{cursoSeleccionado?.nombre}</strong>.
              Esta acción no se puede deshacer si hay asignaciones docentes activas.
            </DialogDescription>
          </DialogHeader>

          {quitarGradoError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{quitarGradoError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoQuitarGrado(null)} disabled={quitandoGrado}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={ejecutarQuitarGrado} disabled={quitandoGrado}>
              {quitandoGrado ? 'Quitando...' : 'Quitar grado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoCrearConfig} onOpenChange={setDialogoCrearConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear configuración de evaluación</DialogTitle>
            <DialogDescription>
              Configure la evaluación para el curso <strong>{cursoSeleccionado?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          {formCrearConfigError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formCrearConfigError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="gradoIdConfig">Grado</Label>
              <Select value={formGradoIdConfig} onValueChange={setFormGradoIdConfig}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar grado" />
                </SelectTrigger>
                <SelectContent>
                  {gradosCurso.map((grado) => (
                    <SelectItem key={grado.gradoId} value={grado.gradoId}>
                      {grado.gradoNombre} ({grado.gradoCodigo})
                    </SelectItem>
                  ))}
                  {gradosCurso.length === 0 && (
                    <SelectItem value="" disabled>No hay grados en el plan de estudios</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="periodoIdConfig">Año lectivo</Label>
              <Select value={formPeriodoIdConfig} onValueChange={setFormPeriodoIdConfig}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodosCatalogo.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id}>
                      {periodo.nombre} ({periodo.codigo}){periodo.estado === 'ACTIVO' ? ' — Activo' : ''}
                    </SelectItem>
                  ))}
                  {periodosCatalogo.length === 0 && (
                    <SelectItem value="" disabled>No hay años lectivos</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modeloIdConfig">Modelo de Evaluación</Label>
              <Select value={formModeloIdConfig} onValueChange={setFormModeloIdConfig}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.id}>
                      {modelo.codigo} - {modelo.nombre}
                    </SelectItem>
                  ))}
                  {modelos.length === 0 && (
                    <SelectItem value="" disabled>No hay modelos disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoCrearConfig(false)} disabled={formCrearConfigEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarCrearConfig} disabled={!formGradoIdConfig || !formPeriodoIdConfig || !formModeloIdConfig || formCrearConfigEnviando}>
              {formCrearConfigEnviando ? 'Creando...' : 'Crear configuración'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoEditarConfig !== null}
        onOpenChange={(open) => { if (!open) setDialogoEditarConfig(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar configuración de evaluación</DialogTitle>
            <DialogDescription>
              Modifique la configuración para <strong>{dialogoEditarConfig?.gradoNombre}</strong> - <strong>{dialogoEditarConfig?.periodoCodigo}</strong>.
            </DialogDescription>
          </DialogHeader>

          {editConfigError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{editConfigError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Grado</Label>
              <Input value={dialogoEditarConfig?.gradoNombre ?? ''} disabled className="bg-muted" />
            </div>

            <div className="grid gap-2">
              <Label>Año lectivo</Label>
              <Input value={dialogoEditarConfig?.periodoCodigo ?? ''} disabled className="bg-muted" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editModeloIdConfig">Modelo de Evaluación</Label>
              <Select value={editModeloIdConfig} onValueChange={setEditModeloIdConfig} disabled={editConfigEnviando}>
                <SelectTrigger id="editModeloIdConfig">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.id}>
                      {modelo.codigo} - {modelo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editActivoConfig">Estado</Label>
              <Select value={String(editActivoConfig)} onValueChange={(v) => setEditActivoConfig(v === 'true')} disabled={editConfigEnviando}>
                <SelectTrigger id="editActivoConfig">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEditarConfig(null)} disabled={editConfigEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarEditarConfig} disabled={editConfigEnviando}>
              {editConfigEnviando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoEliminarConfig !== null} onOpenChange={(open) => { if (!open) setDialogoEliminarConfig(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar configuración</DialogTitle>
            <DialogDescription>
              ¿Está seguro de eliminar la configuración de <strong>{dialogoEliminarConfig?.gradoNombre}</strong> - <strong>{dialogoEliminarConfig?.periodoCodigo}</strong>?
              No se puede eliminar si tiene competencias o exámenes asociados.
            </DialogDescription>
          </DialogHeader>

          {eliminarConfigError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{eliminarConfigError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEliminarConfig(null)} disabled={eliminandoConfig}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={ejecutarEliminarConfig} disabled={eliminandoConfig}>
              {eliminandoConfig ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoCrearCompetencia} onOpenChange={setDialogoCrearCompetencia}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear competencia</DialogTitle>
            <DialogDescription>
              Defina una nueva competencia para <strong>{configSeleccionada?.gradoNombre}</strong> - <strong>{configSeleccionada?.periodoCodigo}</strong>.
            </DialogDescription>
          </DialogHeader>

          {formCrearCompetenciaError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formCrearCompetenciaError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="competenciaCodigo">Código</Label>
              <Input
                id="competenciaCodigo"
                value={formCompetenciaCodigo}
                onChange={(e) => setFormCompetenciaCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: C1, COM.1"
                maxLength={20}
                disabled={formCrearCompetenciaEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="competenciaNombre">Nombre</Label>
              <Input
                id="competenciaNombre"
                value={formCompetenciaNombre}
                onChange={(e) => setFormCompetenciaNombre(e.target.value)}
                placeholder="Ej: Resuelve problemas de cantidad"
                maxLength={100}
                disabled={formCrearCompetenciaEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="competenciaDescripcion">Descripción (opcional)</Label>
              <Input
                id="competenciaDescripcion"
                value={formCompetenciaDescripcion}
                onChange={(e) => setFormCompetenciaDescripcion(e.target.value)}
                placeholder="Descripción de la competencia"
                maxLength={255}
                disabled={formCrearCompetenciaEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="competenciaOrden">Orden</Label>
              <Input
                id="competenciaOrden"
                type="number"
                min="0"
                value={formCompetenciaOrden}
                onChange={(e) => setFormCompetenciaOrden(e.target.value)}
                placeholder="Ej: 1"
                disabled={formCrearCompetenciaEnviando}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoCrearCompetencia(false)} disabled={formCrearCompetenciaEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarCrearCompetencia} disabled={!formCompetenciaCodigo.trim() || !formCompetenciaNombre.trim() || formCrearCompetenciaEnviando}>
              {formCrearCompetenciaEnviando ? 'Creando...' : 'Crear competencia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoEditarCompetencia !== null}
        onOpenChange={(open) => { if (!open) setDialogoEditarCompetencia(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar competencia</DialogTitle>
            <DialogDescription>
              Modifique la competencia <strong>{dialogoEditarCompetencia?.codigo} - {dialogoEditarCompetencia?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          {editCompetenciaError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{editCompetenciaError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Código</Label>
              <Input value={dialogoEditarCompetencia?.codigo ?? ''} disabled className="bg-muted" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editCompetenciaNombre">Nombre</Label>
              <Input
                id="editCompetenciaNombre"
                value={editCompetenciaNombre}
                onChange={(e) => setEditCompetenciaNombre(e.target.value)}
                maxLength={100}
                disabled={editCompetenciaEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editCompetenciaDescripcion">Descripción (opcional)</Label>
              <Input
                id="editCompetenciaDescripcion"
                value={editCompetenciaDescripcion}
                onChange={(e) => setEditCompetenciaDescripcion(e.target.value)}
                maxLength={255}
                disabled={editCompetenciaEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editCompetenciaOrden">Orden</Label>
              <Input
                id="editCompetenciaOrden"
                type="number"
                min="0"
                value={editCompetenciaOrden}
                onChange={(e) => setEditCompetenciaOrden(e.target.value)}
                disabled={editCompetenciaEnviando}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editCompetenciaActivo">Estado</Label>
              <Select value={String(editCompetenciaActivo)} onValueChange={(v) => setEditCompetenciaActivo(v === 'true')} disabled={editCompetenciaEnviando}>
                <SelectTrigger id="editCompetenciaActivo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEditarCompetencia(null)} disabled={editCompetenciaEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarEditarCompetencia} disabled={editCompetenciaEnviando}>
              {editCompetenciaEnviando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoAnularCompetencia !== null} onOpenChange={(open) => { if (!open) setDialogoAnularCompetencia(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular competencia</DialogTitle>
            <DialogDescription>
              Se anulará la competencia <strong>{dialogoAnularCompetencia?.codigo} - {dialogoAnularCompetencia?.nombre}</strong>.
              No se puede anular si tiene trabajos asociados.
            </DialogDescription>
          </DialogHeader>

          {anularCompetenciaError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{anularCompetenciaError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAnularCompetencia(null)} disabled={anulandoCompetencia}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={ejecutarAnularCompetencia} disabled={anulandoCompetencia}>
              {anulandoCompetencia ? 'Anulando...' : 'Anular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}