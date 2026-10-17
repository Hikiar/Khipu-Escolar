import { useCallback, useEffect, useState } from 'react'
import type { EstadoCarga } from '@/hooks/useCarga'
import { listarDocentes, type Docente } from '@/services/profesoresService'

export type FiltroEstado = 'TODOS' | 'ACTIVO' | 'INACTIVO'

export function useProfesores() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS')

  const cargarDocentes = useCallback(async () => {
    const estadoFiltro = filtroEstado === 'TODOS' ? undefined : filtroEstado
    const resultado = await listarDocentes(estadoFiltro)
    if (resultado.ok === false) {
      setError(resultado.error)
      setEstado('error')
    } else {
      setDocentes(resultado.data)
      setEstado('ok')
    }
  }, [filtroEstado])

  useEffect(() => {
    void cargarDocentes()
  }, [cargarDocentes])

  function reintentar() {
    setEstado('cargando')
    setError(null)
    void cargarDocentes()
  }

  function marcarErrorCarga(mensaje: string) {
    setError(mensaje)
    setEstado('error')
  }

  return {
    estado,
    docentes,
    error,
    filtroEstado,
    setFiltroEstado,
    cargarDocentes,
    reintentar,
    marcarErrorCarga,
  }
}
