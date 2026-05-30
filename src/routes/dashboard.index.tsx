import { createFileRoute, Link } from "@tanstack/react-router";
import { usePortal } from "@/lib/portal-store";
import { Package, Coins, TrendingUp, ArrowRight, Smartphone, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { company, products } = usePortal();
  const totalPoints = products.reduce((s, p) => s + p.points * Math.max(1, 100 - p.stock), 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hola, {company.name} 👋</h1>
        <p className="text-muted-foreground mt-1">
          Este es el resumen de tu actividad en el portal de aliados.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={<Package />} label="Productos publicados" value={products.length} />
        <StatCard
          icon={<Coins />}
          label="Puntos canjeables (total)"
          value={products.reduce((s, p) => s + p.points, 0).toLocaleString()}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Canjes estimados (mes)"
          value={Math.floor(totalPoints / 5000)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ActionCard
          icon={<Package />}
          title="Gestiona tus productos"
          body="Sube nuevos artículos, ajusta precios en puntos y mantén tu catálogo fresco."
          to="/dashboard/products"
          cta="Ir a productos"
        />
        <ActionCard
          icon={<Store />}
          title="Personaliza tu marca"
          body="Edita logo, portada, descripción y los detalles visuales de tu perfil."
          to="/dashboard/profile"
          cta="Editar perfil"
        />
        <ActionCard
          icon={<Smartphone />}
          title="Preview móvil"
          body="Mira cómo se ve tu perfil en la app antes de que los usuarios lo vean."
          to="/dashboard/preview"
          cta="Ver preview"
          highlight
        />
        <div
          className="rounded-2xl p-6 border border-accent/30 bg-accent/10 flex flex-col justify-between"
        >
          <div>
            <div className="text-xs font-semibold tracking-wide text-accent-foreground/80 uppercase">
              Tip del día
            </div>
            <h3 className="font-semibold mt-2">Productos con fotos reciben 3x más canjes</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Sube imágenes claras y bien iluminadas para destacar en el feed de usuarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-soft)]">
      <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  body,
  to,
  cta,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  to: string;
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 border ${highlight ? "border-primary/40 bg-primary-soft/40" : "border-border bg-card"} flex flex-col justify-between gap-4 shadow-[var(--shadow-soft)]`}
    >
      <div>
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{body}</p>
      </div>
      <Link to={to as "/dashboard"}>
        <Button variant={highlight ? "default" : "outline"} className="gap-2">
          {cta} <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
