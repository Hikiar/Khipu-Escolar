import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { portalInfo } from '@/config/navigation'
import { getNavItemByHref } from '@/lib/navigation'
import { useFilteredNav } from '@/hooks/useFilteredNav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Can } from '@/components/guards/Can'
import { LayoutDashboard, AlertTriangle, TrendingUp, Users, DoorOpen, Gauge, Banknote } from 'lucide-react'
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
import { listarClases, listarCursos, type Clase, type Curso } from '@/services/catalogoService'
import { usePeriodoActivo } from '@/hooks/usePeriodoActivo'

function ModuleCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string
  title: string
  description?: string
  icon: NonNullable<ReturnType<typeof getNavItemByHref>>['icon']
}) {
  return (
    <Link to={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <span className="text-xs font-medium text-primary">Abrir módulo →</span>
        </CardContent>
      </Card>
    </Link>
  )
}

function formatoPEN(monto: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

function KpiCard({
  icono: Icono,
  etiqueta,
  valor,
  secundario,
}: {
  icono: React.ComponentType<{ className?: string }>
  etiqueta: string
  valor: string
  secundario?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Icono className="size-3.5" aria-hidden="true" />
          {etiqueta}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{valor}</CardTitle>
      </CardHeader>
      {secundario && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{secundario}</p>
        </CardContent>
      )}
    </Card>
  )
}

function SkeletonKpis() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

type SegmentoDonut = {
  etiqueta: string
  valor: number
  color: string
}

function Barra({
  etiqueta,
  detalle,
  valor,
  max,
}: {
  etiqueta: string
  detalle: string
  valor: number
  max: number
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{etiqueta}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{detalle}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[color:var(--chart-1)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Donut({ segmentos }: { segmentos: SegmentoDonut[] }) {
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0)
  let acumulado = 0
  const segmentosCss = segmentos
    .filter((s) => s.valor > 0)
    .map((s) => {
      const inicio = (acumulado / total) * 360
      acumulado += s.valor
      const fin = (acumulado / total) * 360
      return `${s.color} ${inicio}deg ${fin}deg`
    })
  const fondo = total === 0 ? 'var(--muted)' : `conic-gradient(${segmentosCss.join(', ')})`
  return (
    <div className="flex items-center gap-4">
      <div
        role="img"
        aria-label={segmentos.map((s) => `${s.etiqueta}: ${s.valor}`).join(', ')}
        className="size-24 shrink-0 rounded-full ring-1 ring-foreground/10"
        style={{ background: fondo }}
      />
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segmentos.map((s) => (
          <li key={s.etiqueta} className="flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate">{s.etiqueta}</span>
            <span className="ml-auto tabular-nums text-foreground">{s.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResumenEjecutivo() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alumnos, setAlumnos] = useState<ResumenAlumnos | null>(null)
  const [matriculas, setMatriculas] = useState<ResumenMatriculas | null>(null)
  const [asistencia, setAsistencia] = useState<ResumenAsistencia | null>(null)
  const [pagos, setPagos] = useState<ResumenPagos | null>(null)
  const [evaluacion, setEvaluacion] = useState<ResumenEvaluacion | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      setError(null)
      const [ra, rm, rast, rp, rev, rc, rcu] = await Promise.all([
        consultarAlumnos(),
        consultarMatriculas(),
        consultarAsistencia(),
        consultarPagos(),
        consultarEvaluacion(),
        listarClases(),
        listarCursos(),
      ])
      if (!activo) return
      for (const r of [ra, rm, rast, rp, rev]) {
        if (!r.ok) {
          setError('error' in r ? r.error : 'No se pudo cargar el resumen.')
          setCargando(false)
          return
        }
      }
      setAlumnos((ra as { data: ResumenAlumnos }).data)
      setMatriculas((rm as { data: ResumenMatriculas }).data)
      setAsistencia((rast as { data: ResumenAsistencia }).data)
      setPagos((rp as { data: ResumenPagos }).data)
      setEvaluacion((rev as { data: ResumenEvaluacion }).data)
      if (rc.ok) setClases(rc.data)
      if (rcu.ok) setCursos(rcu.data)
      setCargando(false)
    }
    void cargar()
    return () => {
      activo = false
    }
  }, [])

  if (cargando) return <SkeletonKpis />

  if (error || !alumnos || !matriculas || !asistencia || !pagos || !evaluacion) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>No se pudo cargar el resumen</AlertTitle>
        <AlertDescription>{error ?? 'Datos incompletos.'}</AlertDescription>
      </Alert>
    )
  }

  const vacantesLibres = matriculas.porClase.reduce((acc, c) => acc + Math.max(c.vacantes - c.total, 0), 0)
  const totalDetalles =
    asistencia.porEstado.presentes +
    asistencia.porEstado.tardes +
    asistencia.porEstado.faltas +
    asistencia.porEstado.justificados
  const tasaAsistencia =
    totalDetalles > 0 ? Math.round((asistencia.porEstado.presentes / totalDetalles) * 1000) / 10 : null

  const nombreClase = new Map(clases.map((c) => [c.id, `${c.gradoNombre} - ${c.seccionNombre}`]))
  const nombreCurso = new Map(cursos.map((c) => [c.id, c.nombre]))

  const resultados = evaluacion.porClaseCurso
    .filter((r) => r.promedio !== null)
    .slice()
    .sort((a, b) => (b.promedio ?? 0) - (a.promedio ?? 0))
    .slice(0, 8)

  const conceptosTop = pagos.porConcepto
    .slice()
    .sort((a, b) => b.montoRecaudado - a.montoRecaudado)
    .slice(0, 5)

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icono={Users}
          etiqueta="Alumnos activos"
          valor={String(alumnos.porEstado.ACTIVO)}
          secundario={`${alumnos.total} alumnos en total · ${alumnos.porEstado.INACTIVO} inactivos`}
        />
        <KpiCard
          icono={DoorOpen}
          etiqueta="Cupos disponibles"
          valor={String(vacantesLibres)}
          secundario={`${matriculas.porClase.length} clases · ${matriculas.totalAlumnos} matriculados`}
        />
        <KpiCard
          icono={Gauge}
          etiqueta="Tasa de asistencia"
          valor={tasaAsistencia === null ? '—' : `${tasaAsistencia}%`}
          secundario={`${totalDetalles} asistencias registradas`}
        />
        <KpiCard
          icono={Banknote}
          etiqueta="Recaudado"
          valor={formatoPEN(pagos.montoTotal)}
          secundario={`${pagos.porEstado.REGISTRADO} pagos en ${pagos.totalConceptos} conceptos`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" aria-hidden="true" />
              Resultados por clase y asignatura
            </CardTitle>
            <CardDescription>
              Promedios y niveles de logro según el modelo configurado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resultados.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin resultados de evaluación todavía.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clase</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead className="text-right">Promedio</TableHead>
                    <TableHead>Nivel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.map((r) => (
                    <TableRow key={`${r.claseId}-${r.cursoId}`}>
                      <TableCell className="font-medium">
                        {nombreClase.get(r.claseId) ?? r.claseId}
                      </TableCell>
                      <TableCell>{nombreCurso.get(r.cursoId) ?? r.cursoId}</TableCell>
                      <TableCell className="text-center tabular-nums">{r.promedio}</TableCell>
                      <TableCell>
                        <Badge variant={r.nivelLogro === 'AD' ? 'success' : r.nivelLogro === 'A' ? 'info' : r.nivelLogro === 'B' ? 'warning' : 'destructive'}>
                          {r.nivelLogro}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="size-4" aria-hidden="true" />
              Pagos por concepto
            </CardTitle>
            <CardDescription>Los 5 conceptos con mayor recaudación del año lectivo activo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conceptosTop.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin pagos registrados todavía.
              </p>
            ) : (
              <div className="space-y-3">
              {conceptosTop.map((c) => (
                <Barra
                  key={c.conceptoId}
                  etiqueta={c.descripcion}
                  detalle={`${formatoPEN(c.montoRecaudado)} · ${c.pagados} pagos`}
                  valor={c.montoRecaudado}
                  max={conceptosTop[0].montoRecaudado}
                />
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matrículas por clase</CardTitle>
            <CardDescription>Matriculados frente a cupos disponibles por clase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {matriculas.porClase.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin matrículas todavía.
              </p>
            ) : (
              matriculas.porClase.slice(0, 5).map((m) => (
                <Barra
                  key={m.claseId}
                  etiqueta={nombreClase.get(m.claseId) ?? m.claseId}
                  detalle={`${m.total} / ${m.vacantes} cupos`}
                  valor={m.total}
                  max={m.vacantes}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asistencia</CardTitle>
            <CardDescription>Distribución de estados de asistencia.</CardDescription>
          </CardHeader>
          <CardContent>
            {totalDetalles === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin asistencias registradas.
              </p>
            ) : (
              <Donut
                segmentos={[
                  { etiqueta: 'Presentes', valor: asistencia.porEstado.presentes, color: 'var(--chart-1)' },
                  { etiqueta: 'Tardes', valor: asistencia.porEstado.tardes, color: 'var(--chart-4)' },
                  { etiqueta: 'Faltas', valor: asistencia.porEstado.faltas, color: 'var(--chart-5)' },
                  { etiqueta: 'Justificados', valor: asistencia.porEstado.justificados, color: 'var(--chart-2)' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alumnos por estado</CardTitle>
            <CardDescription>Activos e inactivos en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Donut
              segmentos={[
                { etiqueta: 'Activos', valor: alumnos.porEstado.ACTIVO, color: 'var(--chart-1)' },
                { etiqueta: 'Inactivos', valor: alumnos.porEstado.INACTIVO, color: 'var(--chart-5)' },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigationGroups = useFilteredNav()
  const { usuario } = useAuth()
  const { periodo } = usePeriodoActivo()
  const nombre = usuario?.persona.nombres
    ? `${usuario.persona.nombres} ${usuario.persona.apellidos}`
    : ''
  const nombreRol = usuario?.roles[0]?.nombre
  const bienvenida = nombre
    ? `Bienvenido, ${nombreRol ? `${nombreRol} ` : ''}${nombre}`.trim()
    : 'Bienvenido al sistema de gestión escolar'

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        description={bienvenida}
        icon={<LayoutDashboard />}
      />
      <Can permission="reportes.ver">
        <ResumenEjecutivo />
      </Can>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">{portalInfo.name}</CardTitle>
          <CardDescription>
            {periodo
              ? `Año lectivo ${periodo.codigo} · Selecciona un módulo para comenzar.`
              : 'Sin año lectivo activo · Selecciona un módulo para comenzar.'}
          </CardDescription>
        </CardHeader>
      </Card>
      <section aria-label="Módulos del sistema">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Módulos del sistema
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navigationGroups.flatMap((group) =>
            group.items
              .filter((item) => item.href !== '/dashboard')
              .map((item) => (
                <ModuleCard
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                />
              )),
          )}
        </div>
      </section>
    </div>
  )
}