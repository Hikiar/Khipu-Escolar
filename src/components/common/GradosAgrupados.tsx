import {
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/components/ui/select'
import { NIVELES, NIVEL_LABELS } from '@/lib/nivelesCurso'

interface GradoAgrupable {
  id: string
  codigo: string
  nombre: string
  nivel: string
  orden: number
}

/**
 * Opciones de un Select agrupadas por nivel (Inicial / Primaria / Secundaria)
 * y ordenadas dentro de cada grupo, para que no se mezclen los grados.
 */
export function GradosAgrupados({ grados }: { grados: GradoAgrupable[] }) {
  return (
    <>
      {NIVELES.map((nivel) => {
        const deNivel = grados
          .filter((g) => g.nivel === nivel)
          .sort((a, b) => a.orden - b.orden)
        if (deNivel.length === 0) return null
        return (
          <SelectGroup key={nivel}>
            <SelectLabel>{NIVEL_LABELS[nivel]}</SelectLabel>
            {deNivel.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.codigo} — {g.nombre}
              </SelectItem>
            ))}
          </SelectGroup>
        )
      })}
      {grados.length === 0 && (
        <SelectItem value="" disabled>
          No hay grados disponibles
        </SelectItem>
      )}
    </>
  )
}