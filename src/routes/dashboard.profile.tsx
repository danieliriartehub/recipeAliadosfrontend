import { createFileRoute } from "@tanstack/react-router";
import { usePortal, fileToDataUrl } from "@/lib/portal-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MobilePreview } from "@/components/MobilePreview";
import { ImageIcon, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { company, updateCompany } = usePortal();

  const onUpload = async (key: "logo" | "cover", file?: File) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    updateCompany({ [key]: url });
    toast.success(`${key === "logo" ? "Logo" : "Portada"} actualizado`);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Perfil de marca</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personaliza cómo se ve tu empresa en la app. Los cambios se reflejan en tiempo real.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-8">
        <div className="space-y-6">
          {/* Cover & logo */}
          <Section title="Imagen visual" subtitle="Logo y portada que verán los usuarios.">
            <div className="rounded-2xl overflow-hidden border border-border">
              <div
                className="relative h-44 group"
                style={{
                  background: company.cover
                    ? `url(${company.cover}) center/cover`
                    : `linear-gradient(135deg, ${company.brandColor}, oklch(0.82 0.16 85))`,
                }}
              >
                <UploadButton onPick={(f) => onUpload("cover", f)} label="Cambiar portada" />
              </div>
              <div className="flex items-end gap-4 px-5 -mt-10 pb-5 relative">
                <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-md overflow-hidden flex items-center justify-center relative group">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-muted-foreground" />
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUpload("logo", e.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="mb-1">
                  <div className="font-semibold">{company.name}</div>
                  <div className="text-xs text-muted-foreground">{company.tagline}</div>
                </div>
              </div>
            </div>
          </Section>

          {/* Identity */}
          <Section title="Identidad" subtitle="Nombre, tagline y descripción.">
            <div className="space-y-4">
              <Row label="Nombre de la empresa">
                <Input
                  value={company.name}
                  onChange={(e) => updateCompany({ name: e.target.value })}
                />
              </Row>
              <Row label="Tagline corto">
                <Input
                  value={company.tagline}
                  onChange={(e) => updateCompany({ tagline: e.target.value })}
                  placeholder="Una frase que te describa"
                />
              </Row>
              <Row label="Descripción">
                <Textarea
                  rows={4}
                  value={company.description}
                  onChange={(e) => updateCompany({ description: e.target.value })}
                />
              </Row>
              <div className="grid sm:grid-cols-2 gap-4">
                <Row label="Categoría">
                  <Input
                    value={company.category}
                    onChange={(e) => updateCompany({ category: e.target.value })}
                  />
                </Row>
                <Row label="Color de marca">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={company.brandColor}
                      onChange={(e) => updateCompany({ brandColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-border bg-transparent cursor-pointer"
                    />
                    <Input
                      value={company.brandColor}
                      onChange={(e) => updateCompany({ brandColor: e.target.value })}
                    />
                  </div>
                </Row>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contacto" subtitle="Cómo los usuarios y nuestro equipo pueden contactarte.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Row label="Correo">
                <Input
                  type="email"
                  value={company.email}
                  onChange={(e) => updateCompany({ email: e.target.value })}
                />
              </Row>
              <Row label="Sitio web">
                <Input
                  value={company.website}
                  onChange={(e) => updateCompany({ website: e.target.value })}
                />
              </Row>
            </div>
          </Section>

          <div className="flex items-center gap-2 p-4 rounded-xl bg-accent/15 border border-accent/30">
            <Sparkles className="w-4 h-4 text-accent-foreground shrink-0" />
            <p className="text-sm">
              Los cambios se guardan automáticamente y se reflejan al instante en el preview.
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div className="hidden lg:block sticky top-6 self-start">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 text-center font-semibold">
            Preview en vivo
          </div>
          <MobilePreview />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function UploadButton({ onPick, label }: { onPick: (f?: File) => void; label: string }) {
  return (
    <label className="absolute right-3 bottom-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur border border-border text-xs font-medium cursor-pointer hover:bg-background flex items-center gap-1.5 shadow-sm">
      <Upload className="w-3.5 h-3.5" />
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </label>
  );
}
