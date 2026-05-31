import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/login/operador')({
  component: OperadorLogin,
})

function OperadorLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Verificar si ya hay sesión activa de operador
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('validators')
        .select('id')
        .eq('id', session.user.id)
        .single()
      if (data) navigate({ to: '/dashboard/operador', replace: true })
    })
  }, [])

  // Countdown de bloqueo
  useEffect(() => {
    if (!blockedUntil) return
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.round((blockedUntil.getTime() - Date.now()) / 1000)
      )
      setCountdown(diff)
      if (diff === 0) {
        setBlockedUntil(null)
        setAttempts(0)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [blockedUntil])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (blockedUntil) return
    setLoading(true)
    setError(null)

    // 1. Autenticar con Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 5) {
        setBlockedUntil(new Date(Date.now() + 5 * 60 * 1000))
      }
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // 2. Verificar que es un validador usando la función de Supabase
    const { data: validatorData, error: roleError } = await supabase.rpc(
      'validator_login',
      { p_user_id: data.user.id }
    )

    if (roleError) {
      await supabase.auth.signOut()
      if (roleError.message.includes('desactivada')) {
        setError('Tu cuenta está desactivada. Contacta al administrador.')
      } else {
        setError('No tienes acceso a este portal.')
      }
      setLoading(false)
      return
    }

    // 3. Login exitoso → ir al dashboard de operador
    navigate({ to: '/dashboard/operador', replace: true })
    setLoading(false)
  }

  const isBlocked = !!blockedUntil && countdown > 0
  const canSubmit = email && password.length >= 6 && !loading && !isBlocked

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Acceso Operadores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Personal autorizado · Centros de acopio USIL
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {/* Bloqueo por intentos */}
          {isBlocked && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
              <p className="text-sm font-semibold text-red-700">
                Demasiados intentos fallidos
              </p>
              <p className="text-xs text-red-500 mt-1">
                Intenta nuevamente en{' '}
                <span className="font-bold tabular-nums">
                  {Math.floor(countdown / 60)}:
                  {String(countdown % 60).padStart(2, '0')}
                </span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Correo institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={e =>
                  setEmail(e.target.value.replace(/[<>'"`;\\]/g, ''))
                }
                placeholder="operador@usil.edu.pe"
                autoComplete="email"
                disabled={isBlocked}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e =>
                    setPassword(e.target.value.replace(/[<>'"`;\\]/g, ''))
                  }
                  maxLength={72}
                  autoComplete="current-password"
                  disabled={isBlocked}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && !isBlocked && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Ingresar como Operador'}
            </button>
          </form>

          {/* Info */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Acceso exclusivo para operadores autorizados.
            <br />Cuentas gestionadas por administración USIL.
          </p>
        </div>

        {/* Volver al login de aliados */}
        <button
          onClick={() => navigate({ to: '/login' })}
          className="mt-4 flex items-center gap-1 mx-auto text-xs text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-3 w-3" /> Volver al login de aliados
        </button>
      </div>
    </div>
  )
}
