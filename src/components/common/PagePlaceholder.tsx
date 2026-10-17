import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PagePlaceholderProps {
  title?: string
  description?: string
  moduleName: string
  className?: string
}

export function PagePlaceholder({
  title = 'Módulo en preparación',
  description,
  moduleName,
  className,
}: PagePlaceholderProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal">
            Scaffold
          </Badge>
        </div>
        <CardDescription>
          {description ??
            'La estructura de este módulo está lista. La implementación de ' +
              `«${moduleName}» se agregará en la siguiente fase del proyecto.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium">Componentes</p>
            <p className="text-xs text-muted-foreground">Pendientes por definir</p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium">Hooks</p>
            <p className="text-xs text-muted-foreground">Pendientes por definir</p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium">Validación</p>
            <p className="text-xs text-muted-foreground">Pendiente por definir</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}