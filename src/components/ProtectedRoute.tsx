import { useEffect, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMerchantAuth } from '@/lib/auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useMerchantAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: '/login', replace: true })
    }
  }, [loading, session, navigate])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}
