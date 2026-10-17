import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline"
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`py-12 text-center ${className}`}>
      <CardContent className="flex flex-col items-center gap-4">
        {icon && <div className="text-muted-foreground/50">{icon}</div>}
        <div className="space-y-1">
          <h4 className="text-lg font-medium">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground max-w-md">{description}</p>
          )}
        </div>
        {action && (
          <Button variant={action.variant ?? "default"} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}