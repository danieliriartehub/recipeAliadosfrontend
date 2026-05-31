import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { Eye, EyeOff, Flashlight, FlipHorizontal, X } from 'lucide-react'

interface QrScannerProps {
  onScan: (token: string) => void
  onError?: (error: string) => void
  onClose?: () => void
}

export function QrScanner({ onScan, onError, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanned, setScanned] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  useEffect(() => {
    const reader = new BrowserQRCodeReader()
    let active = true

    const start = async () => {
      try {
        const devices = await BrowserQRCodeReader.listVideoInputDevices()
        if (!devices.length) {
          setHasPermission(false)
          onError?.('No se encontró cámara en este dispositivo')
          return
        }

        setHasPermission(true)
        const deviceId =
          facingMode === 'environment'
            ? devices[devices.length - 1].deviceId
            : devices[0].deviceId

        controlsRef.current = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result) => {
            if (!active || scanned) return
            if (result) {
              setScanned(true)
              if (navigator.vibrate) navigator.vibrate(200)
              onScan(result.getText())
            }
          }
        )
      } catch {
        setHasPermission(false)
        onError?.('No se pudo acceder a la cámara')
      }
    }

    start()
    return () => {
      active = false
      controlsRef.current?.stop()
    }
  }, [facingMode])

  if (hasPermission === false) {
    return <ManualInput onScan={onScan} />
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl">
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay oscuro con recorte central */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(black, black) top/100% 20% no-repeat,
            linear-gradient(black, black) bottom/100% 20% no-repeat,
            linear-gradient(black, black) left/15% 100% no-repeat,
            linear-gradient(black, black) right/15% 100% no-repeat
          `,
          opacity: 0.6,
        }}
      />

      {/* Marco guía */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                    h-56 w-56 rounded-2xl border-4 transition-colors duration-300 ${
                      scanned ? 'border-green-400 animate-pulse' : 'border-white'
                    }`}
      >
        {/* Esquinas decorativas */}
        {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map(
          (pos) => (
            <div
              key={pos}
              className={`absolute ${pos} h-6 w-6 border-4 border-primary rounded-sm`}
            />
          )
        )}
      </div>

      {/* Texto guía */}
      <p className="absolute bottom-28 left-0 right-0 text-center text-sm font-medium text-white/80">
        {scanned ? '✓ QR detectado' : 'Apunta al código QR del estudiante'}
      </p>

      {/* Controles superiores */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setFacingMode((f) => (f === 'environment' ? 'user' : 'environment'))
            }
            className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur"
          >
            <FlipHorizontal className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTorchOn((v) => !v)}
            className={`h-10 w-10 rounded-full flex items-center justify-center backdrop-blur ${
              torchOn ? 'bg-accent text-black' : 'bg-black/40 text-white'
            }`}
          >
            <Flashlight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Fallback: input manual si no hay cámara
function ManualInput({ onScan }: { onScan: (t: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="p-6 space-y-4 text-center">
      <p className="text-sm text-gray-500">
        Cámara no disponible. Ingresa el código manualmente.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.trim())}
        placeholder="Código QR del estudiante..."
        autoFocus
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        onClick={() => value && onScan(value)}
        disabled={!value}
        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-40"
      >
        Verificar código
      </button>
    </div>
  )
}
