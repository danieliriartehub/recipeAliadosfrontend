import { createFileRoute } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/dashboard/operador')({
  component: OperadorDashboard,
})

function OperadorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div>
        <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Portal Operador</h1>
        <p className="text-sm text-gray-500 mt-2">
          Vista de escaneo QR · Próximamente
        </p>
      </div>
    </div>
  )
}
