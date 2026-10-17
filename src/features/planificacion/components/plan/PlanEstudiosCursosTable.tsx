import { FilasSkeleton } from '@/components/common'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/guards/Can'
import type { EstadoCarga } from '@/hooks/useCarga'
import { Edit, Trash2, Users } from 'lucide-react'
import type { CursoGrado } from '@/services/cursosService'
import type { AsignacionCurso } from '@/services/asignacionService'

export function PlanEstudiosCursosTable({
  cursosDeGradoEstado,
  cursosDeGrado,
  docentesCurso,
  docentesCargando,
  cursoParaDocentes,
  abrirDetalleCurso,
  abrirDocentes,
  abrirDialogoEditar,
  abrirDialogoQuitar,
}: {
  cursosDeGradoEstado: EstadoCarga
  cursosDeGrado: CursoGrado[]
  docentesCurso: AsignacionCurso[]
  docentesCargando: boolean
  cursoParaDocentes: CursoGrado | null
  abrirDetalleCurso: (cg: CursoGrado) => void
  abrirDocentes: (cg: CursoGrado) => void
  abrirDialogoEditar: (cg: CursoGrado) => void
  abrirDialogoQuitar: (cg: CursoGrado) => void
}) {
  return (
    <>
      {cursosDeGradoEstado === 'cargando' && (
        <Card>
          <CardContent className="p-4">
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead className="text-center">Horas/sem</TableHead>
                  <TableHead className="text-center">Orden</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={4} />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {cursosDeGradoEstado === 'ok' && cursosDeGrado.length > 0 && (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead className="text-center">Horas/sem</TableHead>
                  <TableHead className="text-center">Orden</TableHead>
                  <TableHead className="text-center">Docentes</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cursosDeGrado.map((cg) => {
                  const docentesDelCurso = docentesCurso.filter((a) => a.cursoId === cg.cursoId)
                  return (
                    <TableRow key={cg.cursoId}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          onClick={() => void abrirDetalleCurso(cg)}
                          aria-label={`Ver detalle de ${cg.cursoNombre}`}
                          className="text-left underline-offset-4 hover:underline"
                        >
                          {cg.cursoCodigo} — {cg.cursoNombre}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">{cg.horasSemana ?? '—'}</TableCell>
                      <TableCell className="text-center">{cg.orden ?? '—'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={docentesDelCurso.length > 0 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => abrirDocentes(cg)}
                          disabled={docentesCargando}
                        >
                          {docentesCargando && cursoParaDocentes?.cursoId === cg.cursoId ? (
                            'Cargando...'
                          ) : (
                            <>
                              <Users className="size-3 mr-1" aria-hidden />
                              {docentesDelCurso.length || '—'}
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                      <div className="flex gap-1">
                        <Can permission="cursos.editar">
                          <Button variant="ghost" size="xs" onClick={() => abrirDialogoEditar(cg)}>
                            <Edit className="size-3" aria-hidden />
                            Editar
                          </Button>
                        </Can>
                        <Can permission="cursos.editar">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => abrirDialogoQuitar(cg)}
                          >
                            <Trash2 className="size-3" aria-hidden />
                            Quitar
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
