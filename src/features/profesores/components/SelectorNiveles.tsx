import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NIVELES, NIVEL_LABELS, type NivelCurricular } from '@/lib/nivelesCurso'

export function SelectorNiveles({
  seleccion,
  onChange,
}: {
  seleccion: NivelCurricular[]
  onChange: (niveles: NivelCurricular[]) => void
}) {
  return (
    <div className="grid gap-2">
      <Label>Niveles donde dicta *</Label>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Niveles donde dicta">
        {NIVELES.map((n) => {
          const activo = seleccion.includes(n)
          return (
            <Button
              key={n}
              type="button"
              variant={activo ? 'default' : 'outline'}
              aria-pressed={activo}
              onClick={() =>
                onChange(activo ? seleccion.filter((v) => v !== n) : [...seleccion, n])
              }
            >
              {NIVEL_LABELS[n]}
            </Button>
          )
        })}
      </div>
      {seleccion.length === 0 && (
        <p className="text-sm text-muted-foreground" role="alert">
          Seleccione al menos un nivel. Un profesor de EF/Arte/Inglés puede marcar varios niveles.
        </p>
      )}
    </div>
  )
}
