import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { PageHeader } from '@/components/common/PageHeader'
import { GradosAgrupados } from '@/components/common/GradosAgrupados'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { etiquetaNiveles } from '@/lib/nivelesCurso'
import { gradosCneBDeNivel } from '@/lib/gradosCneb'
import { Can } from '@/components/guards/Can'
import { Layers, RefreshCcw, AlertTriangle, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  listarGrados,
  crearGrado,
  actualizarGrado,
  desactivarGrado,
  type Grado,
  type CrearGradoInput,
} from '@/services/gradosService'
import {
  listarSeccionesDeGrado,
  crearSeccion,
  actualizarSeccion,
  eliminarSeccion,
  type Seccion,
  type CrearSeccionInput,
} from '@/services/gradosService'
import {
  listarClases,
  listarClasesDePeriodo,
  crearClase,
  actualizarClase,
  eliminarClase,
  type Clase,
  type CrearClaseInput,
} from '@/services/gradosService'
import {
  listarSeccionesDeGrado as listarSeccionesDeGradoCatalogo,
  listarPeriodoActivo,
  listarDocentes,
  listarModelosEvaluacion,
  type PeriodoAcademico,
  type Docente,
  type ModeloEvaluacion,
} from '@/services/catalogoService'
import { listarCursosDeGrado, type CursoGrado } from '@/services/cursosService'
import {
  listarConfiguraciones,
  actualizarConfiguracion,
  type ConfiguracionEvaluacion,
} from '@/services/configuracionService'

type EstadoCarga = 'cargando' | 'ok' | 'error'

type VistaActiva = 'grados' | 'clases' | 'evaluacion'

const NIVELES = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'] as const

const NIVEL_LABELS: Record<(typeof NIVELES)[number], string> = {
  INICIAL: 'Inicial',
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria',
}

interface GradoConSecciones extends Grado {
  secciones: Seccion[]
  seccionesCargadas: boolean
  seccionesEstado: EstadoCarga
  seccionesError: string | null
  expandido: boolean
}

function FilasSkeleton({ columnas = 5 }: { columnas?: number }) {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <TableRow key={i}>
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

function InputConLabel({
  label,
  id,
  children,
  required = false,
  error,
}: {
  label: string
  id: string
  children: React.ReactNode
  required?: boolean
  error?: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}

export function GradosPage() {
  const [vista, setVista] = useState<VistaActiva>('grados')

  const [estadoGrados, setEstadoGrados] = useState<EstadoCarga>('cargando')
  const [grados, setGrados] = useState<GradoConSecciones[]>([])
  const [errorGrados, setErrorGrados] = useState<string | null>(null)

  const [periodoActivo, setPeriodoActivo] = useState<PeriodoAcademico | null>(null)

  const [clases, setClases] = useState<Clase[]>([])
  const [estadoClases, setEstadoClases] = useState<EstadoCarga>('cargando')
  const [errorClases, setErrorClases] = useState<string | null>(null)
  const [filtroPeriodoId, setFiltroPeriodoId] = useState<string>('')

  const [docentes, setDocentes] = useState<Docente[]>([])
  const [gradosParaSelect, setGradosParaSelect] = useState<Grado[]>([])
  const [seccionesParaSelect, setSeccionesParaSelect] = useState<Seccion[]>([])

  const [gradoEvaluacionId, setGradoEvaluacionId] = useState('')
  const [cursosGrado, setCursosGrado] = useState<CursoGrado[]>([])
  const [configsGrado, setConfigsGrado] = useState<ConfiguracionEvaluacion[]>([])
  const [estadoConfigsGrado, setEstadoConfigsGrado] = useState<EstadoCarga>('cargando')
  const [errorConfigsGrado, setErrorConfigsGrado] = useState<string | null>(null)
  const [modelosGrado, setModelosGrado] = useState<ModeloEvaluacion[]>([])
  const [guardandoConfigId, setGuardandoConfigId] = useState<string | null>(null)

  const [dialogoGrado, setDialogoGrado] = useState<{
    abierto: boolean
    modo: 'crear' | 'editar'
    grado?: Grado
  }>({ abierto: false, modo: 'crear' })
  const [formGrado, setFormGrado] = useState<CrearGradoInput>({
    codigo: '',
    nombre: '',
    nivel: '',
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

  const [gradoPorDesactivar, setGradoPorDesactivar] = useState<Grado | null>(null)
  const [desactivarGradoError, setDesactivarGradoError] = useState<string | null>(null)
  const [desactivandoGrado, setDesactivandoGrado] = useState(false)

  const [seccionPorEliminar, setSeccionPorEliminar] = useState<{
    seccion: Seccion
    gradoId: string
  } | null>(null)
  const [eliminarSeccionError, setEliminarSeccionError] = useState<string | null>(null)
  const [eliminandoSeccion, setEliminandoSeccion] = useState(false)

  const [clasePorEliminar, setClasePorEliminar] = useState<Clase | null>(null)
  const [eliminarClaseError, setEliminarClaseError] = useState<string | null>(null)
  const [eliminandoClase, setEliminandoClase] = useState(false)

  const cargarGrados = useCallback(async () => {
    setEstadoGrados('cargando')
    setErrorGrados(null)
    const res = await listarGrados()
    if (res.ok === false) {
      setErrorGrados(res.error)
      setEstadoGrados('error')
    } else {
      const gradosConSecciones: GradoConSecciones[] = res.data.map((g) => ({
        ...g,
        secciones: [],
        seccionesCargadas: false,
        seccionesEstado: 'cargando' as EstadoCarga,
        seccionesError: null,
        expandido: false,
      }))
      setGrados(gradosConSecciones)
      setEstadoGrados('ok')
      setGradosParaSelect(res.data)
    }
  }, [])

  const cargarPeriodoActivo = useCallback(async () => {
    const res = await listarPeriodoActivo()
    if (res.ok) {
      setPeriodoActivo(res.data)
      if (res.data?.id) setFiltroPeriodoId(res.data.id)
    }
  }, [])

  const cargarDocentes = useCallback(async () => {
    const res = await listarDocentes()
    if (res.ok) setDocentes(res.data)
  }, [])

  const cargarModelos = useCallback(async () => {
    const res = await listarModelosEvaluacion()
    if (res.ok) setModelosGrado(res.data)
  }, [])

  const cargarEvaluacionGrado = useCallback(async (gradoId: string) => {
    setEstadoConfigsGrado('cargando')
    setErrorConfigsGrado(null)
    const [resCursos, resConfigs] = await Promise.all([
      listarCursosDeGrado(gradoId),
      listarConfiguraciones({ gradoId }),
    ])
    if (resCursos.ok === false || resConfigs.ok === false) {
      const error = resCursos.ok === false ? resCursos.error : resConfigs.ok === false ? resConfigs.error : 'Error al cargar.'
      setErrorConfigsGrado(error)
      setEstadoConfigsGrado('error')
      return
    }
    setCursosGrado(resCursos.data)
    setConfigsGrado(resConfigs.data)
    setEstadoConfigsGrado('ok')
  }, [])

  async function guardarModeloConfig(cfg: ConfiguracionEvaluacion, modeloId: string) {
    if (modeloId === cfg.modeloEvaluacionId) return
    setGuardandoConfigId(cfg.id)
    setErrorConfigsGrado(null)
    const res = await actualizarConfiguracion(cfg.id, { modeloEvaluacionId: modeloId })
    setGuardandoConfigId(null)
    if (res.ok === false) {
      setErrorConfigsGrado(res.error)
      return
    }
    setConfigsGrado((prev) => prev.map((c) => (c.id === cfg.id ? res.data : c)))
  }

  const cargarClases = useCallback(async (periodoId?: string) => {
    setEstadoClases('cargando')
    setErrorClases(null)
    const res = periodoId
      ? await listarClasesDePeriodo(periodoId)
      : await listarClases()
    if (res.ok === false) {
      setErrorClases(res.error)
      setEstadoClases('error')
    } else {
      setClases(res.data)
      setEstadoClases('ok')
    }
  }, [])

  const cargarSeccionesDeGrado = useCallback(async (gradoId: string) => {
    setGrados((prev) =>
      prev.map((g) =>
        g.id === gradoId ? { ...g, seccionesEstado: 'cargando' as EstadoCarga, seccionesError: null } : g
      )
    )
    const res = await listarSeccionesDeGrado(gradoId)
    if (res.ok === false) {
      setGrados((prev) =>
        prev.map((g) =>
          g.id === gradoId
            ? {
                ...g,
                secciones: [],
                seccionesCargadas: true,
                seccionesEstado: 'error' as EstadoCarga,
                seccionesError: res.error,
              }
            : g
        )
      )
    } else {
      setGrados((prev) =>
        prev.map((g) =>
          g.id === gradoId
            ? {
                ...g,
                secciones: res.data,
                seccionesCargadas: true,
                seccionesEstado: 'ok' as EstadoCarga,
                seccionesError: null,
              }
            : g
        )
      )
    }
  }, [])

  const toggleExpandirGrado = useCallback((grado: GradoConSecciones) => {
    if (!grado.seccionesCargadas && !grado.expandido) {
      void cargarSeccionesDeGrado(grado.id)
    }
    setGrados((prev) =>
      prev.map((g) => (g.id === grado.id ? { ...g, expandido: !g.expandido } : g))
    )
  }, [cargarSeccionesDeGrado])

  useEffect(() => {
    void cargarGrados()
    void cargarPeriodoActivo()
    void cargarDocentes()
    void cargarModelos()
  }, [cargarGrados, cargarPeriodoActivo, cargarDocentes, cargarModelos])

  useEffect(() => {
    if (vista === 'clases') {
      void cargarClases(filtroPeriodoId || undefined)
    }
  }, [vista, filtroPeriodoId, cargarClases])

  useEffect(() => {
    if (vista === 'evaluacion' && gradoEvaluacionId) {
      void cargarEvaluacionGrado(gradoEvaluacionId)
    }
  }, [vista, gradoEvaluacionId, cargarEvaluacionGrado])

  function reintentarGrados() {
    setEstadoGrados('cargando')
    setErrorGrados(null)
    void cargarGrados()
  }

  function reintentarClases() {
    setEstadoClases('cargando')
    setErrorClases(null)
    void cargarClases(filtroPeriodoId || undefined)
  }

  function abrirDialogoCrearGrado() {
    setFormGrado({ codigo: '', nombre: '', nivel: '', orden: 0 })
    setFormGradoErrores({})
    setGradoSugeridoId('')
    setDialogoGrado({ abierto: true, modo: 'crear' })
  }

  function aplicarGradoSugerido(codigo: string) {
    const sugerido = gradosCneBDeNivel(formGrado.nivel).find((g) => g.codigo === codigo)
    if (!sugerido) return
    setGradoSugeridoId(codigo)
    setFormGrado((prev) => ({
      ...prev,
      codigo: sugerido.codigo,
      nombre: sugerido.nombre,
      orden: sugerido.orden,
    }))
  }

  function abrirDialogoEditarGrado(grado: Grado) {
    setFormGrado({ codigo: grado.codigo, nombre: grado.nombre, nivel: grado.nivel, orden: grado.orden })
    setFormGradoErrores({})
    setDialogoGrado({ abierto: true, modo: 'editar', grado })
  }

  function cerrarDialogoGrado() {
    setDialogoGrado({ abierto: false, modo: 'crear' })
  }

  async function enviarGrado() {
    const errores: Partial<CrearGradoInput> = {}
    if (!formGrado.codigo.trim()) errores.codigo = 'Código requerido'
    if (!formGrado.nombre.trim()) errores.nombre = 'Nombre requerido'
    if (!formGrado.nivel.trim()) errores.nivel = 'Nivel requerido'
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
      setFormGradoErrores({ codigo: res.error })
      return
    }
    cerrarDialogoGrado()
    void cargarGrados()
  }

  function abrirConfirmarDesactivarGrado(grado: Grado) {
    setGradoPorDesactivar(grado)
    setDesactivarGradoError(null)
  }

  async function manejarDesactivarGrado() {
    if (!gradoPorDesactivar) return
    setDesactivandoGrado(true)
    setDesactivarGradoError(null)
    const res = await desactivarGrado(gradoPorDesactivar.id)
    setDesactivandoGrado(false)
    if (res.ok === false) {
      setDesactivarGradoError(res.error)
      return
    }
    setGradoPorDesactivar(null)
    void cargarGrados()
  }

  function abrirConfirmarEliminarSeccion(gradoId: string, seccion: Seccion) {
    setSeccionPorEliminar({ seccion, gradoId })
    setEliminarSeccionError(null)
  }

  async function manejarEliminarSeccion() {
    if (!seccionPorEliminar) return
    setEliminandoSeccion(true)
    setEliminarSeccionError(null)
    const res = await eliminarSeccion(seccionPorEliminar.seccion.id)
    setEliminandoSeccion(false)
    if (res.ok === false) {
      setEliminarSeccionError(res.error)
      return
    }
    setSeccionPorEliminar(null)
    void cargarSeccionesDeGrado(seccionPorEliminar.gradoId)
    void cargarGrados()
  }

  function abrirConfirmarEliminarClase(clase: Clase) {
    setClasePorEliminar(clase)
    setEliminarClaseError(null)
  }

  async function manejarEliminarClase() {
    if (!clasePorEliminar) return
    setEliminandoClase(true)
    setEliminarClaseError(null)
    const res = await eliminarClase(clasePorEliminar.id)
    setEliminandoClase(false)
    if (res.ok === false) {
      setEliminarClaseError(res.error)
      return
    }
    setClasePorEliminar(null)
    void cargarClases(filtroPeriodoId || undefined)
    void cargarGrados()
  }

  function abrirDialogoCrearSeccion(gradoId: string) {
    setFormSeccion({ gradoId, nombre: '', turno: '' })
    setFormSeccionErrores({})
    setDialogoSeccion({ abierto: true, modo: 'crear', gradoId })
  }

  function abrirDialogoEditarSeccion(gradoId: string, seccion: Seccion) {
    setFormSeccion({ gradoId, nombre: seccion.nombre, turno: seccion.turno })
    setFormSeccionErrores({})
    setDialogoSeccion({ abierto: true, modo: 'editar', gradoId, seccion })
  }

  function cerrarDialogoSeccion() {
    setDialogoSeccion({ abierto: false, modo: 'crear', gradoId: '' })
  }

  async function enviarSeccion() {
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
      setFormSeccionErrores({ nombre: res.error })
      return
    }
    cerrarDialogoSeccion()
    const gradoIndex = grados.findIndex((g) => g.id === formSeccion.gradoId)
    if (gradoIndex >= 0) {
      const resSecciones = await listarSeccionesDeGrado(formSeccion.gradoId)
      if (resSecciones.ok) {
        setGrados((prev) =>
          prev.map((g, i) =>
            i === gradoIndex ? { ...g, secciones: resSecciones.data, seccionesEstado: 'ok' as EstadoCarga } : g
          )
        )
      }
    }
  }

  function abrirDialogoCrearClase() {
    setFormClase({
      periodoId: filtroPeriodoId || periodoActivo?.id || '',
      gradoId: '',
      seccionId: '',
      tutorDocenteId: undefined,
      vacantes: 30,
    })
    setFormClaseErrores({})
    setSeccionesParaSelect([])
    setDialogoClase({ abierto: true, modo: 'crear' })
  }

  function abrirDialogoEditarClase(clase: Clase) {
    setFormClase({
      periodoId: clase.periodoId,
      gradoId: clase.gradoId,
      seccionId: clase.seccionId,
      tutorDocenteId: clase.tutorDocenteId || undefined,
      vacantes: clase.vacantes,
    })
    setFormClaseErrores({})
    setSeccionesParaSelect([])
    setDialogoClase({ abierto: true, modo: 'editar', clase })
  }

  function cerrarDialogoClase() {
    setDialogoClase({ abierto: false, modo: 'crear' })
  }

  async function cargarSeccionesParaGrado(gradoId: string) {
    const res = await listarSeccionesDeGradoCatalogo(gradoId)
    if (res.ok) setSeccionesParaSelect(res.data)
  }

  async function enviarClase() {
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
      setFormClaseErrores({ periodoId: res.error })
      return
    }
    cerrarDialogoClase()
    void cargarClases(filtroPeriodoId || undefined)
  }

  const clasesFiltradas = useMemo(() => clases, [clases])

  const tutorDocentes = useMemo(() => {
    const nivelGrado = gradosParaSelect.find((g) => g.id === formClase.gradoId)?.nivel
    if (!nivelGrado) return docentes
    return docentes.filter(
      (d) =>
        d.niveles.includes(nivelGrado) ||
        (formClase.tutorDocenteId != null && d.id === formClase.tutorDocenteId),
    )
  }, [gradosParaSelect, docentes, formClase.gradoId, formClase.tutorDocenteId])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Grados y Secciones"
        description="Grados, secciones y aulas"
        icon={<Layers className="size-5" />}
        actions={
          <div className="flex items-center gap-2">
            {vista !== 'evaluacion' && (
              <Can permission="grados.crear">
                <Button variant="outline" onClick={vista === 'grados' ? abrirDialogoCrearGrado : abrirDialogoCrearClase}>
                  <Plus className="size-4" aria-hidden />
                  {vista === 'grados' ? 'Crear grado' : 'Crear clase'}
                </Button>
              </Can>
            )}
          </div>
        }
      />

      <Tabs value={vista} onValueChange={(v) => setVista(v as VistaActiva)} aria-label="Vistas">
        <TabsList>
          <TabsTrigger value="grados">Grados y Secciones</TabsTrigger>
          <TabsTrigger value="clases">Clases (Aulas)</TabsTrigger>
          <TabsTrigger value="evaluacion">Esquema de calificación</TabsTrigger>
        </TabsList>
        <TabsContent value="grados">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lista de grados</CardTitle>
            <CardDescription>
              {estadoGrados === 'ok' && grados.length > 0
                ? `${grados.length} grado${grados.length !== 1 ? 's' : ''} registrado${grados.length !== 1 ? 's' : ''}`
                : 'Listado de grados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estadoGrados === 'error' && (
              <div className="grid gap-3 mb-4">
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" aria-hidden />
                  <AlertTitle>Error al cargar</AlertTitle>
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
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <FilasSkeleton columnas={5} />
                </TableBody>
              </Table>
            )}

            {estadoGrados === 'ok' && grados.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay grados registrados todavía.
              </p>
            )}

            {estadoGrados === 'ok' && grados.length > 0 && (
              <div className="space-y-5">
                {NIVELES.map((nivel) => {
                  const gradosDeNivel = grados
                    .filter((g) => g.nivel === nivel)
                    .sort((a, b) => a.orden - b.orden)
                  if (gradosDeNivel.length === 0) return null
                  return (
                    <div key={nivel} className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">{NIVEL_LABELS[nivel]}</h3>
                        <Badge variant="outline">{gradosDeNivel.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {gradosDeNivel.map((grado) => (
                  <div key={grado.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpandirGrado(grado)}
                          aria-expanded={grado.expandido}
                          aria-controls={`secciones-${grado.id}`}
                          aria-label={grado.expandido ? 'Ocultar secciones' : 'Mostrar secciones'}
                        >
                          {grado.expandido ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{grado.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {grado.codigo} · {etiquetaNiveles([grado.nivel])} · Orden: {grado.orden}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Can permission="grados.editar">
                          <Button variant="ghost" size="sm" onClick={() => abrirDialogoEditarGrado(grado)}>
                            <Edit className="size-4" aria-hidden />
                            Editar
                          </Button>
                        </Can>
                        <Can permission="grados.eliminar">
                          <Button variant="ghost" size="sm" onClick={() => abrirConfirmarDesactivarGrado(grado)}>
                            <Trash2 className="size-4" aria-hidden />
                            Eliminar
                          </Button>
                        </Can>
                      </div>
                    </div>

                    <div
                      id={`secciones-${grado.id}`}
                      role="region"
                      aria-label={`Secciones del grado ${grado.nombre}`}
                      className={`overflow-hidden transition-all duration-200 ${
                        grado.expandido ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Secciones</h4>
                          <Can permission="grados.crear">
                            <Button size="sm" onClick={() => abrirDialogoCrearSeccion(grado.id)}>
                              <Plus className="size-3.5" aria-hidden />
                              Crear sección
                            </Button>
                          </Can>
                        </div>

                        {grado.seccionesEstado === 'cargando' && (
                          <Table aria-busy="true" className="w-full">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Turno</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <FilasSkeleton columnas={3} />
                            </TableBody>
                          </Table>
                        )}

                        {grado.seccionesEstado === 'error' && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="size-4" aria-hidden />
                            <AlertTitle>Error al cargar secciones</AlertTitle>
                            <AlertDescription>{grado.seccionesError}</AlertDescription>
                          </Alert>
                        )}

                        {grado.seccionesEstado === 'ok' && grado.secciones.length === 0 && (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            No hay secciones en este grado.
                          </p>
                        )}

                        {grado.seccionesEstado === 'ok' && grado.secciones.length > 0 && (
                          <Table className="w-full">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Turno</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grado.secciones.map((seccion) => (
                                <TableRow key={seccion.id}>
                                  <TableCell className="font-medium">{seccion.nombre}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{seccion.turno || '—'}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Can permission="grados.editar">
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          onClick={() => abrirDialogoEditarSeccion(grado.id, seccion)}
                                        >
                                          Editar
                                        </Button>
                                      </Can>
                                      <Can permission="grados.eliminar">
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          onClick={() => abrirConfirmarEliminarSeccion(grado.id, seccion)}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="clases">
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full max-w-sm">
              <Label className="mb-1.5 block">Filtrar por año lectivo</Label>
              <Select value={filtroPeriodoId} onValueChange={(v) => setFiltroPeriodoId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los periodos" />
                </SelectTrigger>
                <SelectContent>
                  {periodoActivo && (
                    <SelectItem key={periodoActivo.id} value={periodoActivo.id}>
                      {periodoActivo.nombre} ({periodoActivo.codigo}) — Activo
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reintentarClases} disabled={estadoClases === 'cargando'}>
                <RefreshCcw className="size-4" aria-hidden />
                Actualizar
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clases (Aulas)</CardTitle>
              <CardDescription>
                {estadoClases === 'ok' && clases.length > 0
                  ? `${clases.length} clase${clases.length !== 1 ? 's' : ''} registrada${clases.length !== 1 ? 's' : ''}`
                  : 'Listado de clases'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {estadoClases === 'error' && (
                <div className="grid gap-3 mb-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" aria-hidden />
                    <AlertTitle>Error al cargar</AlertTitle>
                    <AlertDescription>{errorClases}</AlertDescription>
                  </Alert>
                  <Button variant="outline" onClick={reintentarClases}>
                    <RefreshCcw className="size-4" aria-hidden />
                    Reintentar
                  </Button>
                </div>
              )}

              {estadoClases === 'cargando' && (
                <Table aria-busy="true">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grado</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead>Año lectivo</TableHead>
                      <TableHead>Tutor de aula</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cupos disponibles</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <FilasSkeleton columnas={7} />
                  </TableBody>
                </Table>
              )}

              {estadoClases === 'ok' && clases.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay clases registradas para este periodo.
                </p>
              )}

              {estadoClases === 'ok' && clases.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grado</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead>Año lectivo</TableHead>
                      <TableHead>Tutor de aula</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cupos disponibles</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clasesFiltradas.map((clase) => (
                      <TableRow key={clase.id}>
                        <TableCell className="font-medium">{clase.gradoNombre}</TableCell>
                        <TableCell>{clase.seccionNombre}</TableCell>
                        <TableCell>{clase.periodoCodigo}</TableCell>
                        <TableCell>
                          {docentes.find((d) => d.id === clase.tutorDocenteId)
                            ? `${docentes.find((d) => d.id === clase.tutorDocenteId)!.nombres} ${docentes.find((d) => d.id === clase.tutorDocenteId)!.apellidos}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={clase.estado === 'ACTIVO' ? 'success' : 'outline'}>
                            {clase.estado === 'ACTIVO' ? 'Activo' : clase.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{clase.vacantes}</TableCell>
                        <TableCell>
                          <Can permission="grados.editar">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => abrirDialogoEditarClase(clase)}
                            >
                              Editar
                            </Button>
                          </Can>
                          <Can permission="grados.eliminar">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => abrirConfirmarEliminarClase(clase)}
                            >
                              <Trash2 className="size-3" aria-hidden />
                              Eliminar
                            </Button>
                          </Can>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
        </TabsContent>

        <TabsContent value="evaluacion">
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="w-full max-w-sm">
              <Label className="mb-1.5 block">Grado</Label>
              <Select
                value={gradoEvaluacionId}
                onValueChange={(v) => setGradoEvaluacionId(v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un grado" />
                </SelectTrigger>
                <SelectContent>
                  <GradosAgrupados grados={gradosParaSelect} />
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (gradoEvaluacionId) void cargarEvaluacionGrado(gradoEvaluacionId)
              }}
              disabled={estadoConfigsGrado === 'cargando' || !gradoEvaluacionId}
            >
              <RefreshCcw className="size-4" aria-hidden />
              Actualizar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Esquema de calificación por grado</CardTitle>
              <CardDescription>
                {estadoConfigsGrado === 'ok' && gradoEvaluacionId && cursosGrado.length > 0
                  ? `${cursosGrado.length} curso(s) en el plan de estudios del grado`
                  : 'Seleccione un grado para ver su configuración de evaluación.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorConfigsGrado && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="size-4" aria-hidden />
                  <AlertTitle>Error al cargar</AlertTitle>
                  <AlertDescription>{errorConfigsGrado}</AlertDescription>
                </Alert>
              )}

              {estadoConfigsGrado === 'cargando' && (
                <Table aria-busy="true">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Modelo de evaluación</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <FilasSkeleton columnas={4} />
                  </TableBody>
                </Table>
              )}

              {estadoConfigsGrado === 'ok' && (!gradoEvaluacionId || cursosGrado.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {gradoEvaluacionId
                    ? 'Este grado no tiene cursos en su plan de estudios.'
                    : 'Seleccione un grado para ver su configuración de evaluación.'}
                </p>
              )}

              {estadoConfigsGrado === 'ok' && gradoEvaluacionId && cursosGrado.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Modelo de evaluación</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cursosGrado.map((cg) => {
                      const cfg = configsGrado.find((c) => c.cursoId === cg.cursoId)
                      const guardando = guardandoConfigId === cfg?.id
                      return (
                        <TableRow key={cg.cursoId}>
                          <TableCell className="font-medium">
                            {cg.cursoCodigo} — {cg.cursoNombre}
                          </TableCell>
                          <TableCell>{cg.horasSemana ?? '—'}</TableCell>
                          <TableCell>
                            {cfg ? (
                              <Can
                                permission="configuraciones.editar"
                                fallback={
                                  <span className="text-sm text-muted-foreground">
                                    {cfg.modeloEvaluacionNombre}
                                  </span>
                                }
                              >
                                <Select
                                  value={cfg.modeloEvaluacionId}
                                  disabled={guardando}
                                  onValueChange={(v) => {
                                    if (v) void guardarModeloConfig(cfg, v as string)
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {modelosGrado.map((m) => (
                                      <SelectItem key={m.id} value={m.id}>
                                        {m.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Can>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Sin configuración
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!cfg ? (
                              <Badge variant="outline">—</Badge>
                            ) : guardando ? (
                              <Badge variant="outline">Guardando…</Badge>
                            ) : cfg.activo ? (
                              <Badge variant="default">Activo</Badge>
                            ) : (
                              <Badge variant="outline">Inactivo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
        </TabsContent>
      </Tabs>

      <Dialog
        open={dialogoGrado.abierto}
        onOpenChange={(open) => {
          if (!open) setDialogoGrado({ abierto: false, modo: 'crear' })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogoGrado.modo === 'crear' ? 'Crear grado' : 'Editar grado'}</DialogTitle>
            <DialogDescription>
              {dialogoGrado.modo === 'crear'
                ? 'Complete los datos del nuevo grado.'
                : 'Modifique los datos del grado.'}
            </DialogDescription>
          </DialogHeader>

          {formGradoErrores.codigo && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formGradoErrores.codigo}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {dialogoGrado.modo === 'crear' && (
              <InputConLabel label="Grado del catálogo (CNEB)" id="grado-sugerido">
                <Select
                  value={gradoSugeridoId}
                  onValueChange={aplicarGradoSugerido}
                  disabled={!formGrado.nivel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        formGrado.nivel
                          ? 'Elige un grado oficial del nivel'
                          : 'Primero selecciona el nivel'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {gradosCneBDeNivel(formGrado.nivel).map((g) => (
                      <SelectItem key={g.codigo} value={g.codigo}>
                        {g.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InputConLabel>
            )}

            <InputConLabel label="Código" id="grado-codigo" required error={formGradoErrores.codigo}>
              <Input
                id="grado-codigo"
                value={formGrado.codigo}
                onChange={(e) => setFormGrado({ ...formGrado, codigo: e.target.value.toUpperCase() })}
                disabled={dialogoGrado.modo === 'editar'}
                placeholder="Ej: 1PRI"
              />
            </InputConLabel>

            <InputConLabel label="Nombre" id="grado-nombre" required error={formGradoErrores.nombre}>
              <Input
                id="grado-nombre"
                value={formGrado.nombre}
                onChange={(e) => setFormGrado({ ...formGrado, nombre: e.target.value })}
                placeholder="Ej: 1° Primaria"
              />
            </InputConLabel>

            <InputConLabel label="Nivel" id="grado-nivel" required error={formGradoErrores.nivel}>
              <Select
                value={formGrado.nivel}
                onValueChange={(v) => {
                  setFormGrado({ ...formGrado, nivel: v as string })
                  setGradoSugeridoId('')
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INICIAL">Inicial</SelectItem>
                  <SelectItem value="PRIMARIA">Primaria</SelectItem>
                  <SelectItem value="SECUNDARIA">Secundaria</SelectItem>
                </SelectContent>
              </Select>
            </InputConLabel>

            <InputConLabel label="Orden" id="grado-orden">
              <Input
                id="grado-orden"
                type="number"
                min="0"
                value={formGrado.orden}
                onChange={(e) => setFormGrado({ ...formGrado, orden: Number(e.target.value) || 0 })}
              />
            </InputConLabel>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialogoGrado} disabled={formGradoEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarGrado} disabled={formGradoEnviando}>
              {formGradoEnviando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoSeccion.abierto}
        onOpenChange={(open) => {
          if (!open) setDialogoSeccion({ abierto: false, modo: 'crear', gradoId: '' })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogoSeccion.modo === 'crear' ? 'Crear sección' : 'Editar sección'}</DialogTitle>
            <DialogDescription>
              {dialogoSeccion.modo === 'crear'
                ? 'Complete los datos de la nueva sección.'
                : 'Modifique los datos de la sección.'}
            </DialogDescription>
          </DialogHeader>

          {formSeccionErrores.nombre && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formSeccionErrores.nombre}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <InputConLabel label="Nombre" id="seccion-nombre" required error={formSeccionErrores.nombre}>
              <Input
                id="seccion-nombre"
                value={formSeccion.nombre}
                onChange={(e) => setFormSeccion({ ...formSeccion, nombre: e.target.value.toUpperCase() })}
                placeholder="Ej: A, B, C"
              />
            </InputConLabel>

            <InputConLabel label="Turno" id="seccion-turno">
              <Select
                value={formSeccion.turno}
                onValueChange={(v) => setFormSeccion({ ...formSeccion, turno: v as string })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAÑANA">Mañana</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOCHE">Noche</SelectItem>
                </SelectContent>
              </Select>
            </InputConLabel>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialogoSeccion} disabled={formSeccionEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarSeccion} disabled={formSeccionEnviando}>
              {formSeccionEnviando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoClase.abierto}
        onOpenChange={(open) => {
          if (!open) setDialogoClase({ abierto: false, modo: 'crear' })
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogoClase.modo === 'crear' ? 'Crear clase' : 'Editar clase'}</DialogTitle>
            <DialogDescription>
              {dialogoClase.modo === 'crear'
                ? 'Complete los datos del aula (grado + sección + año lectivo).'
                : 'Modifique los datos del aula.'}
            </DialogDescription>
          </DialogHeader>

          {formClaseErrores.periodoId && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formClaseErrores.periodoId}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <InputConLabel label="Periodo" id="clase-periodo" required error={formClaseErrores.periodoId}>
              <Select
                value={formClase.periodoId}
                onValueChange={(v) => setFormClase({ ...formClase, periodoId: v as string })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodoActivo && (
                    <SelectItem key={periodoActivo.id} value={periodoActivo.id}>
                      {periodoActivo.nombre} ({periodoActivo.codigo})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </InputConLabel>

            <InputConLabel label="Grado" id="clase-grado" required error={formClaseErrores.gradoId}>
              <Select
                value={formClase.gradoId}
                onValueChange={async (v) => {
                  setFormClase({ ...formClase, gradoId: v as string, seccionId: '' })
                  await cargarSeccionesParaGrado(v as string)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar grado" />
                </SelectTrigger>
                <SelectContent>
                  <GradosAgrupados grados={gradosParaSelect} />
                </SelectContent>
              </Select>
            </InputConLabel>

            <InputConLabel label="Sección" id="clase-seccion" required error={formClaseErrores.seccionId}>
              <Select
                value={formClase.seccionId}
                onValueChange={(v) => setFormClase({ ...formClase, seccionId: v as string })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesParaSelect.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} ({s.turno || 'sin turno'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputConLabel>

            <InputConLabel label="Tutor (Docente)" id="clase-tutor">
              <Select
                value={formClase.tutorDocenteId || ''}
                onValueChange={(v) => setFormClase({ ...formClase, tutorDocenteId: v as string || undefined })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tutor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin tutor de aula</SelectItem>
                  {tutorDocentes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombres} {d.apellidos} — {etiquetaNiveles(d.niveles)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputConLabel>

            <InputConLabel label="Cupos disponibles" id="clase-vacantes">
              <Input
                id="clase-vacantes"
                type="number"
                min="1"
                max="50"
                value={formClase.vacantes}
                onChange={(e) => setFormClase({ ...formClase, vacantes: Number(e.target.value) || 30 })}
              />
            </InputConLabel>

            {dialogoClase.modo === 'editar' && (
              <InputConLabel label="Estado" id="clase-estado">
                <Select
                  value={dialogoClase.clase?.estado || 'ACTIVO'}
                  onValueChange={(v) => setFormClase({ ...formClase, estado: v as string })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </InputConLabel>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialogoClase} disabled={formClaseEnviando}>
              Cancelar
            </Button>
            <Button onClick={enviarClase} disabled={formClaseEnviando}>
              {formClaseEnviando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={gradoPorDesactivar !== null}
        onOpenChange={(open) => {
          if (!open) setGradoPorDesactivar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar grado</DialogTitle>
            <DialogDescription>
              ¿Eliminar el grado <strong>{gradoPorDesactivar?.nombre}</strong> ({gradoPorDesactivar?.codigo})?
              Esta acción lo borra definitivamente y solo es posible si no tiene clases asociadas.
            </DialogDescription>
          </DialogHeader>

          {desactivarGradoError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{desactivarGradoError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGradoPorDesactivar(null)}
              disabled={desactivandoGrado}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={manejarDesactivarGrado} disabled={desactivandoGrado}>
              {desactivandoGrado ? 'Eliminando...' : 'Eliminar grado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={seccionPorEliminar !== null}
        onOpenChange={(open) => {
          if (!open) setSeccionPorEliminar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar sección</DialogTitle>
            <DialogDescription>
              ¿Eliminar la sección <strong>{seccionPorEliminar?.seccion.nombre}</strong> del grado?
              Esta acción la borra definitivamente y solo es posible si no tiene clases asociadas.
            </DialogDescription>
          </DialogHeader>

          {eliminarSeccionError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{eliminarSeccionError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSeccionPorEliminar(null)}
              disabled={eliminandoSeccion}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={manejarEliminarSeccion} disabled={eliminandoSeccion}>
              {eliminandoSeccion ? 'Eliminando...' : 'Eliminar sección'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={clasePorEliminar !== null}
        onOpenChange={(open) => {
          if (!open) setClasePorEliminar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar clase</DialogTitle>
            <DialogDescription>
              ¿Eliminar la clase <strong>{clasePorEliminar?.gradoNombre}</strong> — {clasePorEliminar?.seccionNombre} ({clasePorEliminar?.periodoCodigo})?
              Esta acción la borra definitivamente y no es posible si tiene matrículas, asistencias,
              asignaciones o calificaciones asociadas.
            </DialogDescription>
          </DialogHeader>

          {eliminarClaseError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{eliminarClaseError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClasePorEliminar(null)}
              disabled={eliminandoClase}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={manejarEliminarClase} disabled={eliminandoClase}>
              {eliminandoClase ? 'Eliminando...' : 'Eliminar clase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}