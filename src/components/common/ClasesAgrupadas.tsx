import {
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/components/ui/select'
import { NIVEL_LABELS } from '@/lib/nivelesCurso'

interface ClaseAgrupable {
  id: string
  nivel: string
  gradoCodigo: string
  gradoNombre: string
  seccionNombre: string
  periodoCodigo: string
  gradoOrden: number
}

const ORDEN_NIVEL = ['INICIAL', 'PRIMARIA', 'SECUNDARIA']

/**
 * Opciones de un Select agrupadas por nivel (Inicial / Primaria / Secundaria)
 * y ordenadas dentro de cada grupo, para que las clases no se mezclen.
 */
export function ClasesAgrupadas({ clases }: { clases: ClaseAgrupable[] }) {
  const grupos = new Map<string, ClaseAgrupable[]>()
  for (const c of clases) {
    const lista = grupos.get(c.nivel) ?? []
    lista.push(c)
    grupos.set(c.nivel, lista)
  }

  const niveles = [...grupos.keys()].sort(
    (a, b) =>
      (ORDEN_NIVEL.indexOf(a) === -1 ? 99 : ORDEN_NIVEL.indexOf(a)) -
      (ORDEN_NIVEL.indexOf(b) === -1 ? 99 : ORDEN_NIVEL.indexOf(b)),
  )

  return (
    <>
      {niveles.map((nivel) => (
        <SelectGroup key={nivel}>
          <SelectLabel>{NIVEL_LABELS[nivel as keyof typeof NIVEL_LABELS] ?? nivel}</SelectLabel>
          {grupos
            .get(nivel)!
            .sort((a, b) => a.gradoOrden - b.gradoOrden)
            .map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.gradoCodigo} — {c.gradoNombre} · {c.seccionNombre} · {c.periodoCodigo}
              </SelectItem>
            ))}
        </SelectGroup>
      ))}
      {clases.length === 0 && (
        <SelectItem value="" disabled>
          No hay clases disponibles
        </SelectItem>
      )}
    </>
  )
}