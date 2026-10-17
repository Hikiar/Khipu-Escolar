import { useContext } from 'react'
import type { AuthContextValue } from '@/types/auth'
import { AuthContext } from '@/features/auth/AuthProvider'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}