import type { ResultadoServicio } from '@/types/operations'

export function extraerError<T>(res: ResultadoServicio<T>): string {
  if ('error' in res) return res.error
  return ''
}
