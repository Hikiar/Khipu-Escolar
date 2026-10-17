import type { EstadoCarga } from '@/hooks/useCarga'
import { FilasSkeleton } from '@/components/common'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { getNavItemByHref } from '@/lib/navigation'
import { AlertTriangle, Download, RefreshCcw } from 'lucide-react'
import type { ResultadoServicio } from '@/types/operations'
import { listarPeriodos, type PeriodoAcademico } from '@/services/periodosService'
import { listarClases, listarCursos, type Clase, type Curso } from '@/services/catalogoService'
import {
  consultarAlumnos,
  consultarAsistencia,
  consultarEvaluacion,
  consultarMatriculas,
  consultarPagos,
  type ResumenAlumnos,
  type ResumenAsistencia,
  type ResumenEvaluacion,
  type ResumenMatriculas,
  type ResumenPagos,
} from '@/services/reportesService'

const item = getNavItemByHref('/reportes')!


function extraerError<T>(res: ResultadoServicio<T>): string {
  return 'error' in res ? res.error : ''
}

function descargarArchivo(nombre: string, filas: Record<string, string | number | null>[]) {
  if (filas.length === 0) return
  const encabezados = Object.keys(filas[0])
  const escapar = (v: string | number | null) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const contenido = [
    encabezados.join(','),
    ...filas.map((f) => encabezados.map((h) => escapar(f[h])).join(',')),
  ].join('\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${nombre}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatoPEN(monto: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}


function EstadoVacio({ colSpan, mensaje }: { colSpan: number; mensaje: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
        {mensaje}
      </TableCell>
    </TableRow>
  )
}

function SeccionReporte({
  titulo,
  descripcion,
  cargando,
  error,
  recargar,
  exportar,
  filasCsv,
  children,
}: {
  titulo: string
  descripcion: string
  cargando: boolean
  error: string | null
  recargar: () => void
  exportar: () => void
  filasCsv: Record<string, string | number | null>[]
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{titulo}</CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon" onClick={recargar} aria-label={`Recargar ${titulo}`}>
            <RefreshCcw className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportar} disabled={filasCsv.length === 0}>
            <Download className="size-4" aria-hidden="true" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertTitle>No se pudo consultar el reporte</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {cargando ? (
          <Table>
            <TableBody>
              <FilasSkeleton columnas={4} />
            </TableBody>
          </Table>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

type Cuentas = Array<{ etiqueta: string; valor: string; secundario?: string }>

function CuentasResumen({ cuentas }: { cuentas: Cuentas }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cuentas.map((c) => (
        <div key={c.etiqueta} className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{c.etiqueta}</p>
          <p className="text-2xl font-semibold tabular-nums">{c.valor}</p>
          {c.secundario && <p className="text-xs text-muted-foreground">{c.secundario}</p>}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────── Reporte: Alumnos ───────────────────────────

function ReporteAlumnos() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState<ResumenAlumnos | null>(null)

  const cargar = useCallback(async () => {
    setEstado('cargando')
    setError(null)
    const res = await consultarAlumnos()
    if (res.ok) {
      setDatos(res.data)
      setEstado('ok')
    } else {
      setError(extraerError(res))
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filasCsv = datos
    ? datos.porGrado.map((g) => ({ Grado: g.gradoNombre, Alumnos: g.total }))
    : []

  return (
    <SeccionReporte
      titulo="Alumnos"
      descripcion="Distribución general del alumnado por estado y grado."
      cargando={estado === 'cargando'}
      error={error}
      recargar={() => void cargar()}
      exportar={() => descargarArchivo('alumnos', filasCsv)}
      filasCsv={filasCsv}
    >
      {datos === null ? null : (
        <div className="flex flex-col gap-4">
          <CuentasResumen
            cuentas={[
              { etiqueta: 'Total', valor: String(datos.total) },
              { etiqueta: 'Activos', valor: String(datos.porEstado.ACTIVO) },
              { etiqueta: 'Inactivos', valor: String(datos.porEstado.INACTIVO) },
            ]}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grado</TableHead>
                <TableHead className="text-right">Alumnos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.porGrado.length === 0 && <EstadoVacio colSpan={2} mensaje="Sin alumnos registrados." />}
              {datos.porGrado.map((g) => (
                <TableRow key={g.gradoId}>
                  <TableCell className="font-medium">{g.gradoNombre}</TableCell>
                  <TableCell className="text-right tabular-nums">{g.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SeccionReporte>
  )
}

// ─────────────────────────── Reporte: Matrículas ───────────────────────────

function ReporteMatriculas() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState<ResumenMatriculas | null>(null)
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([])
  const [periodoId, setPeriodoId] = useState('')

  const cargar = useCallback(async () => {
    setEstado('cargando')
    setError(null)
    const res = await consultarMatriculas(periodoId || undefined)
    if (res.ok) {
      setDatos(res.data)
      setEstado('ok')
    } else {
      setError(extraerError(res))
      setEstado('error')
    }
  }, [periodoId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    void listarPeriodos().then((res) => {
      if (res.ok) setPeriodos(res.data)
    })
  }, [])

  const filasCsv = datos
    ? datos.porClase.map((c) => ({
        Grado: c.gradoNombre,
        Seccion: c.seccionNombre,
        Matriculados: c.total,
        'Cupos disponibles': c.vacantes,
        CuposLibres: c.vacantes - c.total,
      }))
    : []

  return (
    <SeccionReporte
      titulo="Matrículas por clase"
      descripcion="Alumnos matriculados y cupos disponibles por clase en un periodo."
      cargando={estado === 'cargando'}
      error={error}
      recargar={() => void cargar()}
      exportar={() => descargarArchivo('matriculas', filasCsv)}
      filasCsv={filasCsv}
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:w-64">
          <Label htmlFor="matriculas-periodo">Año lectivo</Label>
          <Select value={periodoId} onValueChange={setPeriodoId}>
            <SelectTrigger id="matriculas-periodo" aria-label="Año lectivo">
              <SelectValue placeholder="Año lectivo activo" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.codigo} · {p.estado === 'ACTIVO' ? 'Activo' : p.estado.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {datos === null ? null : (
          <>
            <CuentasResumen
              cuentas={[
                { etiqueta: 'Matriculados', valor: String(datos.totalAlumnos) },
                { etiqueta: 'Activos', valor: String(datos.activos) },
                { etiqueta: 'Inactivos', valor: String(datos.inactivos) },
              ]}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grado</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead className="text-right">Matriculados</TableHead>
                  <TableHead className="text-right">Cupos disponibles</TableHead>
                  <TableHead className="text-right">Cupos libres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.porClase.length === 0 && <EstadoVacio colSpan={5} mensaje="Sin matrículas para este periodo." />}
                {datos.porClase.map((c) => (
                  <TableRow key={c.claseId}>
                    <TableCell className="font-medium">{c.gradoNombre}</TableCell>
                    <TableCell>{c.seccionNombre}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.total}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.vacantes}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.vacantes - c.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </SeccionReporte>
  )
}

// ─────────────────────────── Reporte: Asistencia ───────────────────────────

function ReporteAsistencia() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState<ResumenAsistencia | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [claseId, setClaseId] = useState('')
  const [cursoId, setCursoId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const cargar = useCallback(async () => {
    setEstado('cargando')
    setError(null)
    const res = await consultarAsistencia({
      claseId: claseId || undefined,
      cursoId: cursoId || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
    })
    if (res.ok) {
      setDatos(res.data)
      setEstado('ok')
    } else {
      setError(extraerError(res))
      setEstado('error')
    }
  }, [claseId, cursoId, fechaDesde, fechaHasta])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    void Promise.all([listarClases(), listarCursos()]).then(([c, cu]) => {
      if (c.ok) setClases(c.data)
      if (cu.ok) setCursos(cu.data)
    })
  }, [])

  const totalDetalles =
    datos !== null
      ? datos.porEstado.presentes + datos.porEstado.tardes + datos.porEstado.faltas + datos.porEstado.justificados
      : 0
  const tasaAsistencia =
    totalDetalles > 0 ? Math.round((datos!.porEstado.presentes / totalDetalles) * 1000) / 10 : null

  const filasCsv = datos
    ? datos.porClase.map((c) => ({
        Clase: c.claseId,
        Fecha: c.fecha,
        Presentes: c.presentes,
        Tardes: c.tardes,
        Faltas: c.faltas,
        Justificados: c.justificados,
      }))
    : []

  return (
    <SeccionReporte
      titulo="Asistencia"
      descripcion="Registros diarios de asistencia, filtrables por clase, asignatura (alcance CURSO) y rango de fechas."
      cargando={estado === 'cargando'}
      error={error}
      recargar={() => void cargar()}
      exportar={() => descargarArchivo('asistencia', filasCsv)}
      filasCsv={filasCsv}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="asis-clase">Clase</Label>
            <Select value={claseId} onValueChange={setClaseId}>
              <SelectTrigger id="asis-clase" aria-label="Clase">
                <SelectValue placeholder="Todas las clases" />
              </SelectTrigger>
              <SelectContent>
                {clases.map((cl) => (
                  <SelectItem key={cl.id} value={cl.id}>
                    {cl.gradoNombre} - {cl.seccionNombre} ({cl.turno})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="asis-curso">Asignatura</Label>
            <Select value={cursoId} onValueChange={setCursoId}>
              <SelectTrigger id="asis-curso" aria-label="Asignatura">
                <SelectValue placeholder="Todas las asignaturas" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((cu) => (
                  <SelectItem key={cu.id} value={cu.id}>
                    {cu.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="asis-desde">Desde</Label>
            <Input id="asis-desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="asis-hasta">Hasta</Label>
            <Input id="asis-hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
        </div>
        {datos === null ? null : (
          <>
            <CuentasResumen
              cuentas={[
                { etiqueta: 'Presentes', valor: String(datos.porEstado.presentes) },
                { etiqueta: 'Tardes', valor: String(datos.porEstado.tardes) },
                { etiqueta: 'Faltas', valor: String(datos.porEstado.faltas) },
                {
                  etiqueta: 'Tasa de asistencia',
                  valor: tasaAsistencia === null ? '—' : `${tasaAsistencia}%`,
                  secundario: `${datos.totalRegistros} registros`,
                },
              ]}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Presentes</TableHead>
                  <TableHead className="text-right">Tardes</TableHead>
                  <TableHead className="text-right">Faltas</TableHead>
                  <TableHead className="text-right">Justificados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.porClase.length === 0 && <EstadoVacio colSpan={6} mensaje="Sin registros de asistencia para los filtros indicados." />}
                {datos.porClase.map((r) => (
                  <TableRow key={`${r.claseId}-${r.fecha}`}>
                    <TableCell className="font-medium">{r.claseId}</TableCell>
                    <TableCell>{r.fecha}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.presentes}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.tardes}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.faltas}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.justificados}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </SeccionReporte>
  )
}

// ─────────────────────────── Reporte: Evaluación ───────────────────────────

const MODELO_VARIANTE: Record<string, 'default' | 'secondary'> = {
  COMPETENCIAS: 'default',
  PERSONALIZADO: 'secondary',
  EXAMEN: 'secondary',
}

function ReporteEvaluacion() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState<ResumenEvaluacion | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [claseId, setClaseId] = useState('')
  const [cursoId, setCursoId] = useState('')

  const cargar = useCallback(async () => {
    setEstado('cargando')
    setError(null)
    const res = await consultarEvaluacion({ claseId: claseId || undefined, cursoId: cursoId || undefined })
    if (res.ok) {
      setDatos(res.data)
      setEstado('ok')
    } else {
      setError(extraerError(res))
      setEstado('error')
    }
  }, [claseId, cursoId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    void Promise.all([listarClases(), listarCursos()]).then(([c, cu]) => {
      if (c.ok) setClases(c.data)
      if (cu.ok) setCursos(cu.data)
    })
  }, [])

  const nombreClase = (id: string) => clases.find((c) => c.id === id)
  const nombreCurso = (id: string) => cursos.find((c) => c.id === id)

  const filasCsv = datos
    ? datos.porClaseCurso.map((r) => {
        const cl = nombreClase(r.claseId)
        return {
          Clase: cl ? `${cl.gradoNombre} - ${cl.seccionNombre}` : r.claseId,
          Asignatura: nombreCurso(r.cursoId)?.nombre ?? r.cursoId,
          Modelo: r.modelo,
          Promedio: r.promedio,
          Nivel: r.nivelLogro,
          Alumnos: r.alumnos,
        }
      })
    : []

  return (
    <SeccionReporte
      titulo="Evaluación (resultados)"
      descripcion="Promedios y niveles de logro por clase y asignatura, según el modelo de evaluación configurado."
      cargando={estado === 'cargando'}
      error={error}
      recargar={() => void cargar()}
      exportar={() => descargarArchivo('evaluacion', filasCsv)}
      filasCsv={filasCsv}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="eval-clase">Clase</Label>
            <Select value={claseId} onValueChange={setClaseId}>
              <SelectTrigger id="eval-clase" aria-label="Clase">
                <SelectValue placeholder="Todas las clases" />
              </SelectTrigger>
              <SelectContent>
                {clases.map((cl) => (
                  <SelectItem key={cl.id} value={cl.id}>
                    {cl.gradoNombre} - {cl.seccionNombre} ({cl.turno})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eval-curso">Asignatura</Label>
            <Select value={cursoId} onValueChange={setCursoId}>
              <SelectTrigger id="eval-curso" aria-label="Asignatura">
                <SelectValue placeholder="Todas las asignaturas" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((cu) => (
                  <SelectItem key={cu.id} value={cu.id}>
                    {cu.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {datos === null ? null : (
          <>
            <CuentasResumen
              cuentas={[
                { etiqueta: 'Trabajos', valor: String(datos.totalTrabajos) },
                { etiqueta: 'Exámenes', valor: String(datos.totalExamenes) },
                { etiqueta: 'Calificaciones', valor: String(datos.totalCalificaciones) },
                { etiqueta: 'Promedio general', valor: datos.promedioGeneral === null ? '—' : String(datos.promedioGeneral) },
              ]}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Promedio</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead className="text-right">Alumnos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.porClaseCurso.length === 0 && <EstadoVacio colSpan={6} mensaje="Sin resultados de evaluación para los filtros indicados." />}
                {datos.porClaseCurso.map((r) => {
                  const cl = nombreClase(r.claseId)
                  return (
                    <TableRow key={`${r.claseId}-${r.cursoId}`}>
                      <TableCell className="font-medium">
                        {cl ? `${cl.gradoNombre} - ${cl.seccionNombre}` : r.claseId}
                      </TableCell>
                      <TableCell>{nombreCurso(r.cursoId)?.nombre ?? r.cursoId}</TableCell>
                      <TableCell>
                        <Badge variant={MODELO_VARIANTE[r.modelo] ?? 'secondary'}>{r.modelo}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.promedio === null ? '—' : r.promedio}
                      </TableCell>
                      <TableCell>{r.nivelLogro ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.alumnos}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </SeccionReporte>
  )
}

// ─────────────────────────── Reporte: Pagos ───────────────────────────

function ReportePagos() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState<ResumenPagos | null>(null)
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([])
  const [periodoId, setPeriodoId] = useState('')

  const cargar = useCallback(async () => {
    setEstado('cargando')
    setError(null)
    const res = await consultarPagos(periodoId || undefined)
    if (res.ok) {
      setDatos(res.data)
      setEstado('ok')
    } else {
      setError(extraerError(res))
      setEstado('error')
    }
  }, [periodoId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    void listarPeriodos().then((res) => {
      if (res.ok) setPeriodos(res.data)
    })
  }, [])

  const filasCsv = datos
    ? datos.porConcepto.map((c) => ({
        Codigo: c.codigo,
        Concepto: c.descripcion,
        MontoBase: c.montoBase,
        Pagos: c.pagados,
        Recaudado: c.montoRecaudado,
      }))
    : []

  return (
    <SeccionReporte
      titulo="Pagos por concepto"
      descripcion="Recaudación y número de pagos por concepto en un periodo."
      cargando={estado === 'cargando'}
      error={error}
      recargar={() => void cargar()}
      exportar={() => descargarArchivo('pagos', filasCsv)}
      filasCsv={filasCsv}
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:w-64">
          <Label htmlFor="pagos-periodo">Año lectivo</Label>
          <Select value={periodoId} onValueChange={setPeriodoId}>
            <SelectTrigger id="pagos-periodo" aria-label="Año lectivo">
              <SelectValue placeholder="Año lectivo activo" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.codigo} · {p.estado === 'ACTIVO' ? 'Activo' : p.estado.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {datos === null ? null : (
          <>
            <CuentasResumen
              cuentas={[
                { etiqueta: 'Conceptos', valor: String(datos.totalConceptos) },
                { etiqueta: 'Pagos registrados', valor: String(datos.porEstado.REGISTRADO) },
                { etiqueta: 'Anulados', valor: String(datos.porEstado.ANULADO) },
                { etiqueta: 'Recaudado total', valor: formatoPEN(datos.montoTotal), secundario: `${datos.totalPagos} pagos` },
              ]}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto base</TableHead>
                  <TableHead className="text-right">Pagos</TableHead>
                  <TableHead className="text-right">Recaudado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.porConcepto.length === 0 && <EstadoVacio colSpan={5} mensaje="Sin conceptos de pago para este periodo." />}
                {datos.porConcepto.map((c) => (
                  <TableRow key={c.conceptoId}>
                    <TableCell className="font-medium">{c.codigo}</TableCell>
                    <TableCell>{c.descripcion}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatoPEN(c.montoBase)}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.pagados}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatoPEN(c.montoRecaudado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </SeccionReporte>
  )
}

// ─────────────────────────── Página ───────────────────────────

export function ReportesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader title={item.title} description={item.description} icon={<item.icon />} />
      <div className="flex flex-col gap-6">
        <ReporteAlumnos />
        <ReporteMatriculas />
        <ReporteAsistencia />
        <ReporteEvaluacion />
        <ReportePagos />
      </div>
    </div>
  )
}