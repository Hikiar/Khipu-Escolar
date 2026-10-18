import { FilasSkeleton } from '@/components/common'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/guards/Can'
import { Layers, Plus } from 'lucide-react'
import { etiquetaNiveles } from '@/lib/nivelesCurso'
import { useGradosTab } from '../hooks/useGradosTab'
import { GradoCard } from './grados/GradoCard'
import { GradoFormDialog } from './grados/GradoFormDialog'
import { SeccionFormDialog } from './grados/SeccionFormDialog'
import { EliminarGradoDialog } from './grados/EliminarGradoDialog'
import { EliminarSeccionDialog } from './grados/EliminarSeccionDialog'


export function GradosTab() {
  const g = useGradosTab()

  const NIVELES = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Grados y Secciones</h3>
          <p className="text-sm text-muted-foreground">
            Organiza los niveles educativos y sus divisiones
          </p>
        </div>
        <Can permission="grados.crear">
          <Button onClick={g.abrirDialogoCrearGrado}>
            <Plus className="size-4 mr-2" aria-hidden />
            Crear grado
          </Button>
        </Can>
      </div>

      {g.gradosEstado === 'cargando' && (
        <Card>
          <CardContent className="p-4">
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FilasSkeleton columnas={5} />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {g.gradosEstado === 'ok' && g.grados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="size-12 mx-auto text-muted-foreground/50" aria-hidden />
            <h4 className="mt-4 text-lg font-medium">No hay grados registrados</h4>
            <p className="text-sm text-muted-foreground">Crea el primer grado para comenzar</p>
            <Can permission="grados.crear">
              <Button onClick={g.abrirDialogoCrearGrado} className="mt-4">
                <Plus className="size-4 mr-2" aria-hidden />
                Crear grado
              </Button>
            </Can>
          </CardContent>
        </Card>
      )}

      {g.gradosEstado === 'ok' && g.grados.length > 0 && (
        <div className="space-y-6">
          {NIVELES.map((nivel) => {
            const gradosNivel = g.grados.filter((grado) => grado.nivel === nivel)
            if (gradosNivel.length === 0) return null
            return (
              <section key={nivel} className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Badge variant="outline">{etiquetaNiveles([nivel])}</Badge>
                  <span className="text-muted-foreground">({gradosNivel.length})</span>
                </h3>
                <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {gradosNivel.map((grado) => (
                    <GradoCard
                      key={grado.id}
                      grado={grado}
                      gradoSeleccionado={g.gradoSeleccionado}
                      setGradoSeleccionado={g.setGradoSeleccionado}
                      recargarSecciones={g.recargarSecciones}
                      abrirDialogoEditarGrado={g.abrirDialogoEditarGrado}
                      setGradoPorEliminar={g.setGradoPorEliminar}
                      abrirDialogoCrearSeccion={g.abrirDialogoCrearSeccion}
                      abrirDialogoEditarSeccion={g.abrirDialogoEditarSeccion}
                      abrirConfirmarEliminarSeccion={g.abrirConfirmarEliminarSeccion}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <GradoFormDialog
        dialogoGrado={g.dialogoGrado}
        cerrarDialogoGrado={g.cerrarDialogoGrado}
        formGrado={g.formGrado}
        setFormGrado={g.setFormGrado}
        formGradoErrores={g.formGradoErrores}
        formGradoEnviando={g.formGradoEnviando}
        gradoSugeridoId={g.gradoSugeridoId}
        setGradoSugeridoId={g.setGradoSugeridoId}
        aplicarGradoSugerido={g.aplicarGradoSugerido}
        enviarGrado={g.enviarGrado}
      />

      <SeccionFormDialog
        dialogoSeccion={g.dialogoSeccion}
        cerrarDialogoSeccion={g.cerrarDialogoSeccion}
        formSeccion={g.formSeccion}
        setFormSeccion={g.setFormSeccion}
        formSeccionErrores={g.formSeccionErrores}
        formSeccionEnviando={g.formSeccionEnviando}
        enviarSeccion={g.enviarSeccion}
      />

      <EliminarGradoDialog
        gradoPorEliminar={g.gradoPorEliminar}
        setGradoPorEliminar={g.setGradoPorEliminar}
        eliminandoGrado={g.eliminandoGrado}
        manejarEliminarGrado={g.manejarEliminarGrado}
      />

      <EliminarSeccionDialog
        seccionPorEliminar={g.seccionPorEliminar}
        setSeccionPorEliminar={g.setSeccionPorEliminar}
        eliminandoSeccion={g.eliminandoSeccion}
        manejarEliminarSeccion={g.manejarEliminarSeccion}
      />
    </div>
  )
}
