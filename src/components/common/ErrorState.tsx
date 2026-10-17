import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = "Error",
  message,
  onRetry,
  retryLabel = "Reintentar",
  className,
}: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="size-4" aria-hidden />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        {onRetry && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="size-4 mr-2" aria-hidden />
              {retryLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function InlineError({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="size-4" aria-hidden />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {onDismiss && (
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Descartar
        </Button>
      )}
    </Alert>
  )
}