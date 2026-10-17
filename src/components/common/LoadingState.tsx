import { Skeleton } from "@/components/ui/skeleton"

interface LoadingStateProps {
  variant?: "table" | "card" | "list" | "inline"
  rows?: number
  columns?: number
  className?: string
}

export function LoadingState({
  variant = "table",
  rows = 4,
  columns = 5,
  className,
}: LoadingStateProps) {
  const SkeletonRow = () => (
    <div className="flex gap-4">
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} className="h-4 w-24" />
      ))}
    </div>
  )

  const SkeletonCard = () => (
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )

  const SkeletonListItem = () => (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )

  if (variant === "table") {
    return (
      <div className={className}>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="border-b px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: columns }, (_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          <div>
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="border-t px-4 py-3">
                <SkeletonRow />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className={`grid gap-4 ${className ?? ""}`}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <SkeletonCard />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div className={`space-y-2 ${className ?? ""}`}>
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    )
  }

  // inline
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-4 w-48" />
      ))}
    </div>
  )
}