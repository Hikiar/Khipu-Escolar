import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { UseBuscador } from '@/hooks/useBuscador'
import type { Docente } from '@/services/profesoresService'
import type { FiltroEstado } from '../hooks/useProfesores'

export function ProfesoresFiltros({
  filtroEstado,
  onFiltroEstadoChange,
  buscador,
}: {
  filtroEstado: FiltroEstado
  onFiltroEstadoChange: (filtro: FiltroEstado) => void
  buscador: UseBuscador<Docente>
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-xs">
        <Label htmlFor="filtro-estado" className="mb-1.5 block">Filtrar por estado</Label>
        <Select
          value={filtroEstado}
          onValueChange={(v) => {
            onFiltroEstadoChange(v as FiltroEstado)
            buscador.setPagina(1)
          }}
        >
          <SelectTrigger id="filtro-estado" className="w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="INACTIVO">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full max-w-xs">
        <Label htmlFor="buscarDocente" className="mb-1.5 block">Buscar</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="buscarDocente"
            value={buscador.busqueda}
            onChange={(e) => buscador.setBusqueda(e.target.value)}
            placeholder="Por DNI, nombres o especialidad"
            className="pl-8"
          />
        </div>
      </div>
    </div>
  )
}
