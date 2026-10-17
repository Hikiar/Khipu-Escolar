import type { EstadoCarga } from '@/hooks/useCarga'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  listarClases, listarClasesDeDocente, listarCursosDeClase,
  listarConfiguracionDeClaseYCurso,
  type Clase, type Curso,
} from '@/services/catalogoService'
import { extraerError } from '../utils'

export function useCalificacionesContexto() {
  const { usuario, can } = useAuth()
  const [parametros] = useSearchParams()

  const [clases, setClases] = useState<Clase[]>([])
  const [claseId, setClaseId] = useState<string>(parametros.get('clase') ?? '')
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursoId, setCursoId] = useState<string>('')
  const [configModelo, setConfigModelo] = useState<{ modeloCodigo: string; configId: string } | null>(null)
  const [modeloError, setModeloError] = useState<string | null>(null)

  const [estadoClases, setEstadoClases] = useState<EstadoCarga>('cargando')
  const [errorClases, setErrorClases] = useState<string | null>(null)

  const cargarClases = useCallback(async () => {
    // Un profesor (puede registrar notas pero sin acceso global a alumnos) solo
    // ve sus salones; el resto de roles ve el catálogo completo.
    const esDocente = usuario && can('notas.registrar') && !can('alumnos.verTodos')
    const res = esDocente
      ? await listarClasesDeDocente(usuario.persona.id)
      : await listarClases()
    if (res.ok) {
      setClases(res.data)
      setEstadoClases('ok')
    } else {
      setErrorClases(extraerError(res))
      setEstadoClases('error')
    }
  }, [usuario, can])

  useEffect(() => { void cargarClases() }, [cargarClases])

  function reintentarClases() {
    setEstadoClases('cargando')
    void cargarClases()
  }

  const cargarCursos = useCallback(async (cId: string) => {
    const res = await listarCursosDeClase(cId)
    if (res.ok) setCursos(res.data)
  }, [])

  useEffect(() => {
    if (claseId) {
      void cargarCursos(claseId)
      setCursoId('')
      setCursos([])
      setConfigModelo(null)
      setModeloError(null)
    }
  }, [claseId, cargarCursos])

  const cargarConfiguracion = useCallback(async (cId: string, crId: string) => {
    const configRes = await listarConfiguracionDeClaseYCurso(cId, crId)
    if (configRes.ok) {
      setConfigModelo({ modeloCodigo: configRes.data.modeloCodigo, configId: configRes.data.id })
      setModeloError(null)
    } else {
      setConfigModelo(null)
      setModeloError(extraerError(configRes))
    }
  }, [])

  useEffect(() => {
    if (!claseId || !cursoId) return
    void cargarConfiguracion(claseId, cursoId)
  }, [claseId, cursoId, cargarConfiguracion])

  const tieneModelo = configModelo !== null || modeloError !== null
  const modeloEsCompetencias = configModelo?.modeloCodigo === 'COMPETENCIAS'
  const modeloEsExamen = configModelo?.modeloCodigo === 'EXAMEN'

  return {
    clases,
    claseId,
    setClaseId,
    cursos,
    cursoId,
    setCursoId,
    configModelo,
    modeloError,
    estadoClases,
    errorClases,
    cargarClases,
    reintentarClases,
    tieneModelo,
    modeloEsCompetencias,
    modeloEsExamen,
  }
}
