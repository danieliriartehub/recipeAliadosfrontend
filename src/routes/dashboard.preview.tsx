import { createFileRoute, Link } from "@tanstack/react-router";
import { MobilePreview } from "@/components/MobilePreview";
import { usePortal } from "@/lib/portal-store";
import { Button } from "@/components/ui/button";
import { Pencil, Package } from "lucide-react";

export const Route = createFileRoute("/dashboard/preview")({
  component: PreviewPage,
});

function PreviewPage() {
  const { company, products } = usePortal();

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Preview móvil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Así verán los usuarios tu perfil dentro de la app de reciclaje.
        </p>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-10 items-start">
        <div
          className="rounded-3xl p-8 flex items-center justify-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          <MobilePreview />
        </div>

        <div className="space-y-4">
          <InfoCard
            title="Identidad"
            value={company.name}
            subtitle={company.tagline}
          />
          <InfoCard
            title="Categoría"
            value={company.category}
            accent={company.brandColor}
          />
          <InfoCard
            title="Catálogo"
            value={`${products.length} productos publicados`}
            subtitle={`${products.reduce((s, p) => s + p.points, 0).toLocaleString()} puntos totales en circulación`}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/dashboard/profile">
              <Button className="gap-2">
                <Pencil className="w-4 h-4" />
                Editar perfil
              </Button>
            </Link>
            <Link to="/dashboard/products">
              <Button variant="outline" className="gap-2">
                <Package className="w-4 h-4" />
                Gestionar productos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="mt-1 font-semibold flex items-center gap-2">
        {accent && (
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ background: accent }}
          />
        )}
        {value}
      </div>
      {subtitle && <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>}
    </div>
  );
}
