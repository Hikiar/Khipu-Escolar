import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

/**
 * Campo de formulario accesible: label asociado (`htmlFor` = `id`) y mensaje
 * de error anunciado (`role="alert"` + `id` predecible).
 *
 * Contrato de uso con el control hijo (`<Input>`, `<SelectTrigger>`, …):
 * - El control debe tener `id={id}` (en `Select`, el `id` va en `<SelectTrigger>`).
 * - Si hay `error`, el control debe llevar:
 *   `aria-invalid={!!error}` y `aria-describedby={error ? `${id}-error` : undefined}`.
 */
export function CampoFormulario({
  label,
  id,
  children,
  required = false,
  error,
}: {
  label: string
  id: string
  children: ReactNode
  required?: boolean
  error?: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
