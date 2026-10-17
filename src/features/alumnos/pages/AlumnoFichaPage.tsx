import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState, EmptyState, ErrorState } from '@/components/common'
import { FichaCabecera } from '@/components/common/FichaCabecera'
import { useCarga } from '@/hooks/useCarga'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { obtenerAlumno } from '@/services/alumnosService'
import {
  obtenerExpedienteAlumno,
  obtenerHistorialAsistenciaAlumno,
  obtenerResultadosDeAlumno,
  type ApoderadoExpediente,
} from '@/services/expedienteService'
import { listarPagosDeAlumno, type PagoConEntidad } from '@/services/pagosService'
import type { EstadoAsistencia } from '@/services/asistenciaService'
import {
  ArrowLeft,
  CalendarDays,
  HeartHandshake,
  BadgeCheck,
  Activity,
  GraduationCap,
  Wallet,
} from 'lucide-react'

function fe(iso?: string): string {
  return iso
    ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
}

function moneda(monto: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

const METODO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
}

function badgeAsistencia(estado: EstadoAsistencia) {
  const mapa: Record<EstadoAsistencia, { label: string; variante: 'success' | 'warning' | 'destructive' | 'info' }> = {
    PRESENTE: { label: 'Presente', variante: 'success' },
    TARDE: { label: 'Tarde', variante: 'warning' },
    FALTA: { label: 'Falta', variante: 'destructive' },
    JUSTIFICADO: { label: 'Justificado', variante: 'info' },
  }
  const dato = mapa[estado]
  return <Badge variant={dato.variante}>{dato.label}</Badge>
}

function badgeNivelLogro(nivel: string | null) {
  if (!nivel) return null
  const color =
    nivel === 'AD' ? 'success' : nivel === 'A' ? 'info' : nivel === 'B' ? 'warning' : 'destructive'
  return (
    <Badge variant={color as 'success' | 'info' | 'warning' | 'destructive'}>
      {nivel}
    </Badge>
  )
}

export function AlumnoFichaPage() {
  const { id } = useParams<'id'>()
  const alumnoId = id ?? ''
  const { can } = useAuth()
  const [tabActivo, setTabActivo] = useState('datos')

  const puedeAsistencia = can('asistencia.ver')
  const puedeNotas = can('notas.ver')
  const puedePagos = can('pagos.ver')

  const alumno = useCarga(() => obtenerAlumno(alumnoId), true)
  const expediente = useCarga(() => obtenerExpedienteAlumno(alumnoId), true)
  const historial = useCarga(
    () => obtenerHistorialAsistenciaAlumno(alumnoId),
    puedeAsistencia,
  )
  const resultados = useCarga(
    () => obtenerResultadosDeAlumno(alumnoId),
    puedeNotas,
  )
  const pagos = useCarga(() => listarPagosDeAlumno(alumnoId), puedePagos)

  const cargandoNucleo = alumno.estado === 'cargando' || expediente.estado === 'cargando'
  const errorNucleo = alumno.error ?? expediente.error

  if (cargandoNucleo) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingState variant="card" rows={3} />
      </div>
    )
  }

  if (errorNucleo || !alumno.data || !expediente.data) {
    return (
      <ErrorState
        message={errorNucleo ?? 'No se pudo cargar la ficha del alumno.'}
        onRetry={() => {
          void alumno.recargar()
          void expediente.recargar()
        }}
      />
    )
  }

  const a = alumno.data
  const exped = expediente.data
  const iniciales = `${a.nombres.trim().charAt(0)}${a.apellidos.trim().charAt(0)}`.toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/alumnos"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a alumnos
      </Link>

      <FichaCabecera
        iniciales={iniciales}
        nombre={`${a.nombres} ${a.apellidos}`}
        subtitulo={`DNI ${a.dni} · Código ${a.codigoInstitucional}`}
        estado={{
          label: a.estado === 'ACTIVO' ? 'Activo' : 'Inactivo',
          variante: a.estado === 'ACTIVO' ? 'success' : 'outline',
        }}
        badges={
          exped.matriculas.find((m) => m.estado === 'ACTIVA') ? (
            <Badge variant="info" size="sm">
              Matriculado
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              Sin matrícula activa
            </Badge>
          )
        }
      />

      <Tabs value={tabActivo} onValueChange={setTabActivo} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="datos">Datos generales</TabsTrigger>
          <TabsTrigger value="matricula">Matrícula</TabsTrigger>
          {puedeAsistencia && <TabsTrigger value="asistencia">Asistencia</TabsTrigger>}
          {puedeNotas && <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>}
          {puedePagos && <TabsTrigger value="pagos">Pagos</TabsTrigger>}
        </TabsList>

        {/* ── Datos generales ── */}
        <TabsContent value="datos" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BadgeCheck className="size-4 text-muted-foreground" aria-hidden />
                Datos del alumno
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Campo label="DNI" valor={a.dni} />
              <Campo label="Código institucional" valor={a.codigoInstitucional} />
              <Campo label="Correo electrónico" valor={a.correo ?? '—'} />
              <Campo label="Teléfono" valor={a.telefono ?? '—'} />
              <Campo label="Fecha de ingreso" valor={fe(a.ingresoAt)} />
              <Campo
                label="Estado"
                valor={a.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HeartHandshake className="size-4 text-muted-foreground" aria-hidden />
                Apoderados
              </CardTitle>
              {exped.apoderados.length > 0 && (
                <CardDescription>
                  Personas responsables y de contacto de emergencia del alumno.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {exped.apoderados.length === 0 ? (
                <EmptyState
                  icon={<HeartHandshake className="size-8" />}
                  title="Sin apoderados registrados"
                  description="Este alumno aún no tiene apoderados asociados."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {exped.apoderados.map((ap) => (
                    <ApoderadoCard key={ap.id} apoderado={ap} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Matrícula ── */}
        <TabsContent value="matricula" className="flex flex-col gap-4">
          {exped.matriculas.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-8" />}
              title="Sin matrículas"
              description="El alumno aún no ha sido matriculado en ningún año lectivo."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial de matrículas</CardTitle>
                <CardDescription>
                  Año lectivo, clase, estado y fechas de cada matrícula del alumno.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Año lectivo</TableHead>
                      <TableHead>Clase</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registrada</TableHead>
                      <TableHead>Retirada</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exped.matriculas.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.periodoNombre}</TableCell>
                        <TableCell>
                          {m.gradoNombre} · {m.seccionNombre}
                        </TableCell>
                        <TableCell>{m.turno}</TableCell>
                        <TableCell>
                          <Badge variant={m.estado === 'ACTIVA' ? 'success' : 'outline'}>
                            {m.estado === 'ACTIVA' ? 'Activa' : 'Retirada'}
                          </Badge>
                        </TableCell>
                        <TableCell>{fe(m.fechaRegistro)}</TableCell>
                        <TableCell>{m.retiradoAt ? fe(m.retiradoAt) : '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{m.observaciones ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Asistencia ── */}
        {puedeAsistencia && (
          <TabsContent value="asistencia" className="flex flex-col gap-4">
            {historial.estado === 'cargando' && <LoadingState variant="card" rows={2} />}
            {historial.estado === 'error' && (
              <ErrorState
                message={historial.error ?? 'No se pudo cargar la asistencia.'}
                onRetry={() => void historial.recargar()}
              />
            )}
            {historial.estado === 'ok' && historial.data && (
              <>
                {historial.data.registros.length === 0 ? (
                  <EmptyState
                    icon={<Activity className="size-8" />}
                    title="Sin registros de asistencia"
                    description="Aún no hay asistencias registradas para este alumno."
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <CardaMini label="Presentes" valor={historial.data.resumen.presentes} />
                      <CardaMini label="Tardes" valor={historial.data.resumen.tardes} />
                      <CardaMini label="Faltas" valor={historial.data.resumen.faltas} />
                      <CardaMini label="Justificados" valor={historial.data.resumen.justificados} />
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Registros ({historial.data.resumen.total})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Clase</TableHead>
                              <TableHead>Alcance</TableHead>
                              <TableHead>Asignatura</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Observaciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historial.data.registros.map((r) => (
                              <TableRow key={`${r.claseId}-${r.fecha}-${r.cursoId ?? 'aula'}`}>
                                <TableCell className="font-medium">{fe(r.fecha)}</TableCell>
                                <TableCell>{r.clase}</TableCell>
                                <TableCell>
                                  <Badge variant={r.alcance === 'AULA' ? 'secondary' : 'info'} size="sm">
                                    {r.alcance === 'AULA' ? 'Clase' : 'Por asignatura'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{r.cursoNombre ?? '—'}</TableCell>
                                <TableCell>{badgeAsistencia(r.estado)}</TableCell>
                                <TableCell className="text-muted-foreground">{r.observaciones ?? '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </TabsContent>
        )}

        {/* ── Calificaciones ── */}
        {puedeNotas && (
          <TabsContent value="calificaciones" className="flex flex-col gap-4">
            {resultados.estado === 'cargando' && <LoadingState variant="card" rows={3} />}
            {resultados.estado === 'error' && (
              <ErrorState
                message={resultados.error ?? 'No se pudieron cargar las calificaciones.'}
                onRetry={() => void resultados.recargar()}
              />
            )}
            {resultados.estado === 'ok' && resultados.data && (
              <>
                {!resultados.data.matricula ? (
                  <EmptyState
                    icon={<GraduationCap className="size-8" />}
                    title="Sin matrícula activa"
                    description="Las calificaciones se calculan sobre la matrícula activa del alumno."
                  />
                ) : resultados.data.resultados.length === 0 ? (
                  <EmptyState
                    icon={<GraduationCap className="size-8" />}
                    title="Sin calificaciones aún"
                    description="Cuando el curso tenga configurada su evaluación y notas, aparecerán aquí."
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {resultados.data.matricula.gradoNombre} ·{' '}
                        {resultados.data.matricula.seccionNombre}
                      </Badge>
                      <Badge variant="secondary">{resultados.data.matricula.periodoNombre}</Badge>
                    </div>
                    {resultados.data.resultados.map(({ curso, resultado }) => (
                      <Card key={curso.id}>
                        <CardHeader>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <span className="truncate">{curso.nombre}</span>
                              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                {curso.codigo}
                              </span>
                              <Badge variant="secondary" size="sm">
                                {resultado.modelo}
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-semibold tabular-nums">
                                {resultado.promedio !== null ? resultado.promedio.toFixed(2) : '—'}
                              </span>
                              {badgeNivelLogro(resultado.nivelLogro)}
                            </div>
                          </div>
                        </CardHeader>
                        {resultado.competencias.length > 0 && (
                          <CardContent>
                            <ul className="divide-y">
                              {resultado.competencias.map((c) => (
                                <li
                                  key={c.competenciaId}
                                  className="flex items-center justify-between gap-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {c.codigo}
                                    </span>
                                    <span className="ml-2 text-sm">{c.nombre}</span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-sm font-medium tabular-nums">
                                      {c.promedio !== null ? c.promedio.toFixed(2) : '—'}
                                    </span>
                                    {badgeNivelLogro(c.nivelLogro)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </>
                )}
              </>
            )}
          </TabsContent>
        )}

        {/* ── Pagos ── */}
        {puedePagos && (
          <TabsContent value="pagos" className="flex flex-col gap-4">
            {pagos.estado === 'cargando' && <LoadingState variant="card" rows={2} />}
            {pagos.estado === 'error' && (
              <ErrorState
                message={pagos.error ?? 'No se pudieron cargar los pagos.'}
                onRetry={() => void pagos.recargar()}
              />
            )}
            {pagos.estado === 'ok' && pagos.data && (
              <>
                {pagos.data.length === 0 ? (
                  <EmptyState
                    icon={<Wallet className="size-8" />}
                    title="Sin pagos registrados"
                    description="Aún no se registran pagos de matrícula, pensiones ni otros conceptos."
                  />
                ) : (
                  <PagosAlumno pagos={pagos.data} />
                )}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{valor}</dd>
    </div>
  )
}

function ApoderadoCard({ apoderado }: { apoderado: ApoderadoExpediente }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {apoderado.nombres} {apoderado.apellidos}
          </p>
          <p className="text-xs text-muted-foreground">DNI {apoderado.dni}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          <Badge variant="secondary" size="sm">
            {apoderado.parentesco}
          </Badge>
          {apoderado.esContactoEmergencia && (
            <Badge variant="info" size="sm">
              Emergencia
            </Badge>
          )}
        </div>
      </div>
      <dl className="mt-3 space-y-1">
        <Campo label="Correo" valor={apoderado.correo ?? '—'} />
        <Campo label="Teléfono" valor={apoderado.telefono ?? '—'} />
      </dl>
    </div>
  )
}

function CardaMini({ label, valor }: { label: string; valor: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-xl font-semibold tabular-nums">{valor}</span>
      </CardContent>
    </Card>
  )
}

function PagosAlumno({ pagos }: { pagos: PagoConEntidad[] }) {
  const registrados = pagos.filter((p) => p.estado === 'REGISTRADO')
  const totalRegistrado = registrados.reduce((acc, p) => acc + p.monto, 0)

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
          <span className="text-sm text-muted-foreground">Total registrado</span>
          <span className="text-xl font-semibold tabular-nums">{moneda(totalRegistrado)}</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.concepto?.nombre ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">{moneda(p.monto)}</TableCell>
                  <TableCell>{METODO_LABEL[p.metodoPago] ?? p.metodoPago}</TableCell>
                  <TableCell>{fe(p.fecha)}</TableCell>
                  <TableCell>
                    <Badge variant={p.estado === 'REGISTRADO' ? 'success' : 'outline'}>
                      {p.estado === 'REGISTRADO' ? 'Registrado' : 'Anulado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}