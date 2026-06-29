import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, ChangeEvent, useEffect } from 'react'
import { useMerchantAuth } from '@/lib/auth'
import { backendApi } from '@/lib/backendApi'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Megaphone, Image as ImageIcon, Upload, X, Trash2, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/ads')({
  head: () => ({ meta: [{ title: 'Publicidad — Portal de Aliados' }] }),
  component: DashboardAds,
})

interface Banner {
  id: string
  banner_url: string
  link_url?: string
  title?: string
  is_active: boolean
}

function DashboardAds() {
  const { session, merchantPartner } = useMerchantAuth()
  
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoadingBanners, setIsLoadingBanners] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (session?.access_token && merchantPartner?.id) {
      fetchBanners()
    }
  }, [session?.access_token, merchantPartner?.id])

  const fetchBanners = async () => {
    try {
      const api = backendApi.withToken(session!.access_token)
      const data = await api.get<Banner[]>(`/api/v1/aliados/partner/${merchantPartner!.id}/banners`)
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('No se pudieron cargar los banners')
    } finally {
      setIsLoadingBanners(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedImage || !session?.access_token || !merchantPartner?.id) return

    setIsUploading(true)
    try {
      const img = new Image()
      img.src = selectedImage

      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = canvasRef.current
      if (!canvas) throw new Error('No canvas element')

      let width = img.width
      let height = img.height
      const MAX_WIDTH = 1200
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No 2d context')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Error al procesar la imagen')
          setIsUploading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', blob, 'banner.webp')
        
        // Append link if provided
        const finalLinkUrl = linkUrl.trim()
        const uploadUrl = finalLinkUrl 
          ? `/api/v1/aliados/partner/${merchantPartner!.id}/banners?link_url=${encodeURIComponent(finalLinkUrl)}`
          : `/api/v1/aliados/partner/${merchantPartner!.id}/banners`

        try {
          const api = backendApi.withToken(session.access_token)
          const newBanner = await api.postForm<Banner>(uploadUrl, formData)
          
          toast.success('¡Banner agregado exitosamente!')
          setBanners(prev => [newBanner, ...prev])
          clearSelection()
        } catch (error: any) {
          toast.error(error.message || 'Error al subir el banner')
        } finally {
          setIsUploading(false)
        }
      }, 'image/webp', 0.85)

    } catch (error: any) {
      toast.error('Ocurrió un error al procesar la imagen')
      setIsUploading(false)
    }
  }

  const handleDelete = async (bannerId: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return
    
    try {
      const api = backendApi.withToken(session!.access_token)
      await api.delete(`/api/v1/aliados/partner/${merchantPartner!.id}/banners/${bannerId}`)
      setBanners(prev => prev.filter(b => b.id !== bannerId))
      toast.success('Banner eliminado')
    } catch (error) {
      toast.error('Error al eliminar el banner')
    }
  }

  const clearSelection = () => {
    setSelectedImage(null)
    setLinkUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" />
          Gestión de Publicidad
        </h1>
        <p className="text-muted-foreground mt-1">
          Atrae a más alumnos agregando banners publicitarios. Se mostrarán en el Carrusel, Pop-up de inicio y en la tienda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subida de Imagen */}
        <Card>
          <CardHeader>
            <CardTitle>Añadir Nuevo Banner</CardTitle>
            <CardDescription>
              Sube una imagen atractiva (promociones, nuevos productos). Será optimizada automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="banner-upload">Seleccionar imagen</Label>
              <Input 
                id="banner-upload" 
                type="file" 
                accept="image/*" 
                className="cursor-pointer"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5 mt-2">
              <Label htmlFor="banner-link">URL de destino (Opcional)</Label>
              <div className="flex relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="banner-link" 
                  placeholder="https://tu-sitio.com/promo" 
                  className="pl-9"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            {selectedImage ? (
              <div className="relative mt-4 border rounded-xl overflow-hidden aspect-[21/9] bg-muted group">
                <img src={selectedImage} alt="Banner preview" className="w-full h-full object-cover" />
                <button 
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-4 border-2 border-dashed rounded-xl aspect-[21/9] bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-sm">Ninguna imagen seleccionada</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedImage || isUploading}
              className="w-full"
            >
              {isUploading ? 'Subiendo...' : 'Publicar Banner'}
              {!isUploading && <Upload className="w-4 h-4 ml-2" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Lista de Banners */}
        <Card className="bg-slate-50 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Banners Activos ({banners.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {isLoadingBanners ? (
              <div className="text-center text-muted-foreground py-8">Cargando banners...</div>
            ) : banners.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No tienes banners configurados aún.
              </div>
            ) : (
              banners.map((banner) => (
                <div key={banner.id} className="bg-white rounded-lg border shadow-sm p-3 flex gap-4 relative group">
                  <div className="w-32 rounded bg-slate-100 overflow-hidden flex-shrink-0 aspect-[21/9]">
                    <img src={banner.banner_url} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    {banner.link_url ? (
                      <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        Ver enlace
                      </a>
                    ) : (
                      <span className="text-sm text-slate-500 italic">Sin enlace</span>
                    )}
                    <span className="text-xs text-green-600 font-medium mt-1">Activo</span>
                  </div>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
