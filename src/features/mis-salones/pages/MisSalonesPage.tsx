import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  CalendarCheck,
  ExternalLink,
  Loader2,
  School,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  listarClasesDeDocente,
  listarAlumnosDeClase,
  type Clase,
  type AlumnoDeClase,
} from '@/services/catalogoService'
import { NIVEL_LABELS } from '@/lib/nivelesCurso'


/**
 * Mis salones: salones donde el profesor dicta cursos o es tutor de aula,
 * con sus alumnos y accesos directos a Asistencia y Calificaciones.
 * El alcance lo garantiza el backend (GET /api/clases?docenteId=).
 */
export function MisSalonesPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const personaId = usuario?.persona.id

  const [salones, setSalones] = useState<Clase[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)

  const [expandida, setExpandida] = useState<string | null>(null)
  const [alumnosPorSalon, setAlumnosPorSalon] = useState<
    Record<string, AlumnoDeClase[]>
  >({})
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false)
  const [errorAlumnos, setErrorAlumnos] = useState<string | null>(null)

  const cargarSalones = useCallback(async () => {
    if (!personaId) return
    setEstado('cargando')
    setError(null)
    const res = await listarClasesDeDocente(personaId)
    if (res.ok === false) {
      setEstado('error')
      setError(res.error)
      return
    }
    setSalones(res.data)
    setEstado('ok')
  }, [personaId])

  useEffect(() => {
    void cargarSalones()
  }, [cargarSalones])

  const alAlternarSalon = useCallback(
    async (claseId: string) => {
      if (expandida === claseId) {
        setExpandida(null)
        return
      }
      setExpandida(claseId)
      if (alumnosPorSalon[claseId]) return
      setCargandoAlumnos(true)
      setErrorAlumnos(null)
      const res = await listarAlumnosDeClase(claseId)
      setCargandoAlumnos(false)
      if (res.ok === false) {
        setErrorAlumnos(res.error)
        return
      }
      setAlumnosPorSalon((prev) => ({ ...prev, [claseId]: res.data }))
    },
    [expandida, alumnosPorSalon],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis salones"
        description={
          personaId
            ? 'Las clases donde dictas asignaturas o eres tutor de aula'
            : undefined
        }
        icon={<School className="size-5" aria-hidden />}
      />

      {estado === 'cargando' && <LoadingState variant="card" rows={3} />}

      {estado === 'error' && (
        <ErrorState
          message={error ?? 'No se pudieron cargar tus salones.'}
          onRetry={() => void cargarSalones()}
        />
      )}

      {estado === 'ok' && salones.length === 0 && (
        <EmptyState
          icon={<School className="size-10" aria-hidden />}
          title="Aún no tienes clases asignadas"
          description="Cuando el director te asigne asignaturas o te designe tutor de un aula, aparecerán aquí junto con sus alumnos."
        />
      )}

      {estado === 'ok' && salones.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {salones.map((salon) => {
            const esTutor = salon.tutorDocenteId === personaId
            const abierta = expandida === salon.id
            const alumnos = alumnosPorSalon[salon.id]
            return (
              <Card key={salon.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {salon.gradoNombre} · Sección {salon.seccionNombre}
                    </CardTitle>
                    {esTutor && <Badge variant="secondary">Tutor de aula</Badge>}
                  </div>
                  <CardDescription>
                    {NIVEL_LABELS[salon.nivel as keyof typeof NIVEL_LABELS] ?? salon.nivel} · Turno{' '}
                    {salon.turno} · {salon.periodoCodigo}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void alAlternarSalon(salon.id)}
                    >
                      {abierta ? (
                        <ChevronDown className="size-4" aria-hidden />
                      ) : (
                        <ChevronRight className="size-4" aria-hidden />
                      )}
                      {alumnos ? `Alumnos (${alumnos.length})` : 'Ver alumnos'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/asistencia?clase=${salon.id}`)}
                    >
                      <CalendarCheck className="size-4" aria-hidden />
                      Asistencia
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/calificaciones?clase=${salon.id}`)}
                    >
                      <GraduationCap className="size-4" aria-hidden />
                      Calificaciones
                    </Button>
                  </div>

                  {abierta && cargandoAlumnos && !alumnos && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Cargando alumnos…
                    </div>
                  )}

                  {abierta && errorAlumnos && (
                    <p className="text-sm text-destructive">{errorAlumnos}</p>
                  )}

                  {abierta && alumnos && alumnos.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombres</TableHead>
                          <TableHead className="text-right">Ficha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alumnos.map((alumno) => (
                          <TableRow key={alumno.id}>
                            <TableCell className="font-mono text-xs">
                              {alumno.codigoInstitucional}
                            </TableCell>
                            <TableCell>
                              {alumno.apellidos}, {alumno.nombres}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/alumnos/${alumno.id}`)}
                              >
                                Ver más
                                <ExternalLink className="size-3.5" aria-hidden />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {abierta && alumnos && alumnos.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Sin alumnos matriculados en esta clase.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}