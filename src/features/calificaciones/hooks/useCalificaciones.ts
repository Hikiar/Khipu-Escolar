import { useCalificacionesContexto } from './useCalificacionesContexto'
import { useCalificacionesEvaluacion } from './useCalificacionesEvaluacion'

export function useCalificaciones() {
  const contexto = useCalificacionesContexto()
  const evaluacion = useCalificacionesEvaluacion({
    claseId: contexto.claseId,
    cursoId: contexto.cursoId,
    configModelo: contexto.configModelo,
  })

  return {
    ...contexto,
    ...evaluacion,
  }
}
