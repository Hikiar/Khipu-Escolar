import { GraduationCap, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCalificaciones } from '../hooks/useCalificaciones'
import { ContextoAcademicoCard } from '../components/ContextoAcademicoCard'
import { TrabajosTabContent } from '../components/TrabajosTabContent'
import { ExamenesTabContent } from '../components/ExamenesTabContent'
import { ResultadosTabContent } from '../components/ResultadosTabContent'
import { TrabajoFormDialog } from '../components/TrabajoFormDialog'
import { TrabajoEditarDialog } from '../components/TrabajoEditarDialog'
import { CalificarDialog } from '../components/CalificarDialog'
import { ExamenFormDialog } from '../components/ExamenFormDialog'
import { ExamenEditarDialog } from '../components/ExamenEditarDialog'
import { AnularTrabajoDialog } from '../components/AnularTrabajoDialog'
import { DetalleResultadoDialog } from '../components/DetalleResultadoDialog'

export function CalificacionesPage() {
  const {
    clases,
    claseId,
    setClaseId,
    cursos,
    cursoId,
    setCursoId,
    modeloError,
    estadoClases,
    errorClases,
    reintentarClases,
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
    tieneModelo,
    modeloEsCompetencias,
    modeloEsExamen,
    toggleExpanded,
  } = useCalificaciones()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calificaciones"
        description="Notas, evaluaciones y resultados"
        icon={<GraduationCap />}
      />

      <ContextoAcademicoCard
        estadoClases={estadoClases}
        errorClases={errorClases}
        onReintentar={reintentarClases}
        clases={clases}
        claseId={claseId}
        onClaseChange={setClaseId}
        cursos={cursos}
        cursoId={cursoId}
        onCursoChange={setCursoId}
      />

      {claseId && cursoId && modeloError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>Sin configuración</AlertTitle>
          <AlertDescription>{modeloError}</AlertDescription>
        </Alert>
      )}

      {claseId && cursoId && tieneModelo && (
        <Tabs defaultValue={modeloEsCompetencias ? 'trabajos' : modeloEsExamen ? 'examenes' : 'resultados'}>
          <TabsList>
            {modeloEsCompetencias && <TabsTrigger value="trabajos">Trabajos</TabsTrigger>}
            {modeloEsExamen && <TabsTrigger value="examenes">Exámenes</TabsTrigger>}
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>

          {modeloEsCompetencias && (
            <TrabajosTabContent
              estado={estadoTrabajos}
              error={errorTrabajos}
              onReintentar={() => void cargarTrabajos(claseId, competencias)}
              trabajos={trabajos}
              traducirCompetencia={traducirCompetencia}
              onNuevo={() => { resetFormTrabajo(); setDialogTrabajoAbierto(true) }}
              onEditar={abrirDialogTrabajoEditar}
              onCalificar={(t) => void abrirDialogCalifTrabajo(t)}
              onAnular={(t) => setAnularObjetivo(t)}
            />
          )}

          {modeloEsExamen && (
            <ExamenesTabContent
              estado={estadoExamenes}
              error={errorExamenes}
              onReintentar={() => void cargarExamenes(claseId)}
              examenes={examenes}
              onNuevo={() => { resetFormExamen(); setDialogExamenAbierto(true) }}
              onEditar={abrirDialogExamenEditar}
              onCalificar={(ex) => void abrirDialogCalifExamen(ex)}
            />
          )}

          <ResultadosTabContent
            estado={estadoResultados}
            error={errorResultados}
            onReintentar={() => void cargarResultados(claseId, cursoId)}
            resultados={resultados}
            expandedResultados={expandedResultados}
            onToggleExpanded={toggleExpanded}
            onVerDetalle={abrirDialogResultadoDetalle}
          />
        </Tabs>
      )}

      <TrabajoFormDialog
        abierto={dialogTrabajoAbierto}
        onOpenChange={setDialogTrabajoAbierto}
        error={errorDialogTrabajo}
        competencias={competencias}
        nuevoTrabajoCompetencia={nuevoTrabajoCompetencia}
        setNuevoTrabajoCompetencia={setNuevoTrabajoCompetencia}
        nuevoTrabajoNombre={nuevoTrabajoNombre}
        setNuevoTrabajoNombre={setNuevoTrabajoNombre}
        nuevoTrabajoFecha={nuevoTrabajoFecha}
        setNuevoTrabajoFecha={setNuevoTrabajoFecha}
        nuevoTrabajoDesc={nuevoTrabajoDesc}
        setNuevoTrabajoDesc={setNuevoTrabajoDesc}
        enviando={enviandoTrabajo}
        onGuardar={() => void handleCrearTrabajo()}
      />

      <TrabajoEditarDialog
        trabajo={dialogTrabajoEditar}
        onCancelar={cerrarDialogTrabajoEditar}
        error={errorDialogTrabajoEditar}
        editTrabajoNombre={editTrabajoNombre}
        setEditTrabajoNombre={setEditTrabajoNombre}
        editTrabajoFecha={editTrabajoFecha}
        setEditTrabajoFecha={setEditTrabajoFecha}
        editTrabajoDesc={editTrabajoDesc}
        setEditTrabajoDesc={setEditTrabajoDesc}
        editando={editandoTrabajo}
        traducirCompetencia={traducirCompetencia}
        onGuardar={() => void handleEditarTrabajo()}
      />

      <CalificarDialog
        abierto={dialogCalifTrabajo !== null}
        onCancelar={() => setDialogCalifTrabajo(null)}
        nombre={dialogCalifTrabajo?.nombre}
        alumnos={alumnos}
        valores={calificacionesTrabajo}
        setValores={setCalificacionesTrabajo}
        error={errorCalifTrabajo}
        guardando={guardandoCalifTrabajo}
        onGuardar={() => void handleCalificarTrabajo()}
      />

      <ExamenFormDialog
        abierto={dialogExamenAbierto}
        onOpenChange={setDialogExamenAbierto}
        error={errorDialogExamen}
        nuevoExamenNombre={nuevoExamenNombre}
        setNuevoExamenNombre={setNuevoExamenNombre}
        nuevoExamenFecha={nuevoExamenFecha}
        setNuevoExamenFecha={setNuevoExamenFecha}
        enviando={enviandoExamen}
        onGuardar={() => void handleCrearExamen()}
      />

      <CalificarDialog
        abierto={dialogCalifExamen !== null}
        onCancelar={() => setDialogCalifExamen(null)}
        nombre={dialogCalifExamen?.nombre}
        alumnos={alumnos}
        valores={calificacionesExamen}
        setValores={setCalificacionesExamen}
        error={errorCalifExamen}
        guardando={guardandoCalifExamen}
        onGuardar={() => void handleCalificarExamen()}
      />

      <AnularTrabajoDialog
        objetivo={anularObjetivo}
        onCancelar={() => setAnularObjetivo(null)}
        onConfirmar={handleAnularConfirmar}
      />

      <ExamenEditarDialog
        abierto={dialogExamenEditar}
        onCancelar={cerrarDialogExamenEditar}
        examen={examenEditando}
        error={errorDialogExamenEditar}
        formExamenEstado={formExamenEstado}
        setFormExamenEstado={setFormExamenEstado}
        editando={editandoExamen}
        onGuardar={handleEditarExamen}
      />

      <DetalleResultadoDialog
        resultado={dialogResultadoDetalle}
        onCancelar={cerrarDialogResultadoDetalle}
      />
    </div>
  )
}
