import { Badge } from '@/components/ui/badge'
import { Award, CheckCircle, MinusCircle, XCircle } from 'lucide-react'

export function NivelLogroBadge({ nivel }: { nivel: string | null }) {
  if (!nivel) return <span className="text-muted-foreground">—</span>
  const map: Record<string, { variant: "success" | "info" | "warning" | "destructive" | "default"; icon: React.ReactNode; label: string }> = {
    AD: { variant: "success", icon: <Award className="size-2.5 mr-1" />, label: 'Destacado' },
    A: { variant: "info", icon: <CheckCircle className="size-2.5 mr-1" />, label: 'Logrado' },
    B: { variant: "warning", icon: <MinusCircle className="size-2.5 mr-1" />, label: 'En proceso' },
    C: { variant: "destructive", icon: <XCircle className="size-2.5 mr-1" />, label: 'En inicio' },
  }
  const config = map[nivel] ?? { variant: "default", icon: null, label: nivel }
  return (
    <Badge variant={config.variant} size="sm" className="gap-1">
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  )
}
