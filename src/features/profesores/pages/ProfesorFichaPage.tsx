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
import { LoadingState, ErrorState, EmptyState } from '@/components/common'
import { FichaCabecera } from '@/components/common/FichaCabecera'
import { useCarga } from '@/hooks/useCarga'
import { obtenerExpedienteDocente } from '@/services/expedienteService'
import { obtenerDocente } from '@/services/profesoresService'
import { etiquetaNiveles } from '@/lib/nivelesCurso'
import { ArrowLeft, BookOpenCheck, UsersRound, GraduationCap } from 'lucide-react'

function fe(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ProfesorFichaPage() {
  const { id } = useParams<'id'>()
  const profesorId = id ?? ''
  const [tabActivo, setTabActivo] = useState('datos')

  const docente = useCarga(() => obtenerDocente(profesorId), true)
  const expediente = useCarga(() => obtenerExpedienteDocente(profesorId), true)

  if (docente.estado === 'cargando' || expediente.estado === 'cargando') {
    return (
      <div className="flex flex-col gap-6">
        <LoadingState variant="card" rows={3} />
      </div>
    )
  }

  const error = docente.error ?? expediente.error
  if (error || !docente.data || !expediente.data) {
    return (
      <ErrorState
        message={error ?? 'No se pudo cargar la ficha del docente.'}
        onRetry={() => {
          void docente.recargar()
          void expediente.recargar()
        }}
      />
    )
  }

  const d = docente.data
  const exped = expediente.data
  const iniciales = `${d.nombres.trim().charAt(0)}${d.apellidos.trim().charAt(0)}`.toUpperCase()
  const totalHoras = exped.asignaciones.reduce((acc, a) => acc + (a.horasSemana ?? 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/profesores"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a profesores
      </Link>

      <FichaCabecera
        iniciales={iniciales}
        nombre={`${d.nombres} ${d.apellidos}`}
        subtitulo={`DNI ${d.dni} · Código ${d.codigoInstitucional}${d.especialidad ? ` · ${d.especialidad}` : ''}`}
        estado={{
          label: d.estado === 'ACTIVO' ? 'Activo' : 'Inactivo',
          variante: d.estado === 'ACTIVO' ? 'success' : 'outline',
        }}
        badges={
          <Badge variant="secondary" size="sm">
            {etiquetaNiveles(d.niveles)}
          </Badge>
        }
      />

      <Tabs value={tabActivo} onValueChange={setTabActivo} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="datos">Datos generales</TabsTrigger>
          <TabsTrigger value="carga">Carga horaria</TabsTrigger>
          <TabsTrigger value="tutoria">Tutoría</TabsTrigger>
        </TabsList>

        {/* ── Datos ── */}
        <TabsContent value="datos" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
                Datos del docente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Campo label="DNI" valor={d.dni} />
              <Campo label="Código institucional" valor={d.codigoInstitucional} />
              <Campo label="Especialidad" valor={d.especialidad ?? '—'} />
              <Campo
                label="Títulos por nivel"
                valor={
                  d.titulos && d.titulos.length > 0
                    ? d.titulos
                        .map((t) => `${etiquetaNiveles([t.nivel])}: ${t.titulo}`)
                        .join(' · ')
                    : '—'
                }
              />
              <Campo label="Correo electrónico" valor={d.correo ?? '—'} />
              <Campo label="Teléfono" valor={d.telefono ?? '—'} />
              <Campo label="Fecha de ingreso" valor={fe(d.ingresoAt)} />
              <Campo label="Niveles" valor={etiquetaNiveles(d.niveles)} />
              <Campo label="Estado" valor={d.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Carga horaria ── */}
        <TabsContent value="carga" className="flex flex-col gap-4">
          {exped.asignaciones.length === 0 ? (
            <EmptyState
              icon={<BookOpenCheck className="size-8" />}
              title="Sin asignaturas asignadas"
              description="Este docente todavía no tiene asignaturas asignadas en ninguna clase."
            />
          ) : (
            <>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <span className="text-sm text-muted-foreground">
                    Total de horas semanales · {exped.asignaciones.length} asignaciones
                  </span>
                  <span className="text-xl font-semibold tabular-nums">
                    {totalHoras} h
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Asignaturas asignadas</CardTitle>
                  <CardDescription>
                    Clase, asignatura y horas semanales de cada asignación en este periodo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clase</TableHead>
                        <TableHead>Asignatura</TableHead>
                        <TableHead>Año lectivo</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Horas/semana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exped.asignaciones.map((a) => (
                        <TableRow key={a.claseId + a.cursoId}>
                          <TableCell className="font-medium">{a.claseNombre}</TableCell>
                          <TableCell>
                            {a.cursoNombre}{' '}
                            <span className="font-mono text-xs text-muted-foreground">
                              {a.cursoCodigo}
                            </span>
                          </TableCell>
                          <TableCell>{a.periodoNombre}</TableCell>
                          <TableCell>{a.turno}</TableCell>
                          <TableCell className="tabular-nums">
                            {a.horasSemana !== null ? `${a.horasSemana} h` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Tutoría ── */}
        <TabsContent value="tutoria" className="flex flex-col gap-4">
          {exped.tutoria.length === 0 ? (
            <EmptyState
              icon={<UsersRound className="size-8" />}
              title="Sin tutoría"
              description="Este docente no está a cargo de una tutoría en ningún año lectivo."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grupos a cargo</CardTitle>
                <CardDescription>
                  Clases donde el docente ejerce como tutor.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clase</TableHead>
                      <TableHead>Año lectivo</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Vacantes</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exped.tutoria.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.gradoNombre} · {t.seccionNombre}
                        </TableCell>
                        <TableCell>{t.periodoNombre}</TableCell>
                        <TableCell>{t.turno}</TableCell>
                        <TableCell>{t.vacantes}</TableCell>
                        <TableCell>
                          <Badge variant={t.estado === 'ACTIVO' ? 'success' : 'outline'}>
                            {t.estado === 'ACTIVO' ? 'Activo' : 'Cerrado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
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