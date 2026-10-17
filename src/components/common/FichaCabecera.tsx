import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export interface EtiquetaEstado {
  label: string
  variante?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info'
}

interface FichaCabeceraProps {
  iniciales: string
  nombre: string
  subtitulo?: string
  estado?: EtiquetaEstado
  badges?: ReactNode
  actions?: ReactNode
}

/** Cabecera tipo "perfil" usada en las fichas de alumno, profesor y mi perfil. */
export function FichaCabecera({
  iniciales,
  nombre,
  subtitulo,
  estado,
  badges,
  actions,
}: FichaCabeceraProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-xl font-semibold text-primary-foreground">
              {iniciales}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{nombre}</h2>
            {subtitulo && <p className="truncate text-sm text-muted-foreground">{subtitulo}</p>}
            {(estado || badges) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {estado && <Badge variant={estado.variante}>{estado.label}</Badge>}
                {badges}
              </div>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardContent>
    </Card>
  )
}