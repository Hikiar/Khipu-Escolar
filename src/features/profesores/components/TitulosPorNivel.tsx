import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NIVELES, NIVEL_LABELS, type NivelCurricular } from '@/lib/nivelesCurso'

export function TitulosPorNivel({
  seleccion,
  valores,
  onCambiar,
  idBase,
}: {
  seleccion: NivelCurricular[]
  valores: Record<NivelCurricular, string>
  onCambiar: (nivel: NivelCurricular, valor: string) => void
  idBase: string
}) {
  if (seleccion.length === 0) return null
  return (
    <div className="grid gap-3">
      <Label>Títulos por nivel (opcional)</Label>
      {NIVELES.filter((n) => seleccion.includes(n)).map((n) => (
        <div key={n} className="grid gap-2">
          <Label htmlFor={`${idBase}-${n}`} className="text-muted-foreground">
            Título en {NIVEL_LABELS[n]}
          </Label>
          <Input
            id={`${idBase}-${n}`}
            value={valores[n] ?? ''}
            onChange={(e) => onCambiar(n, e.target.value)}
            placeholder={`Ej. Lic. en Educación ${NIVEL_LABELS[n]}`}
          />
        </div>
      ))}
    </div>
  )
}
