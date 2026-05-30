import { usePortal } from "@/lib/portal-store";
import { Leaf, Coins, Search } from "lucide-react";

export function MobilePreview({ className = "" }: { className?: string }) {
  const { company, products } = usePortal();

  return (
    <div className={`mx-auto ${className}`}>
      <div className="relative w-[300px] h-[620px] rounded-[2.5rem] border-[10px] border-foreground/90 bg-foreground/90 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/90 rounded-b-2xl z-20" />
        <div className="relative h-full w-full overflow-y-auto bg-background no-scrollbar">
          {/* Cover */}
          <div
            className="h-32 w-full relative"
            style={{
              background: company.cover
                ? `url(${company.cover}) center/cover`
                : `linear-gradient(135deg, ${company.brandColor}, oklch(0.82 0.16 85))`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Logo + name */}
          <div className="px-4 -mt-8 relative">
            <div className="w-16 h-16 rounded-2xl bg-card border-4 border-background shadow-md overflow-hidden flex items-center justify-center">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Leaf className="w-7 h-7" style={{ color: company.brandColor }} />
              )}
            </div>
            <div className="mt-2">
              <h3 className="font-semibold text-base leading-tight">{company.name}</h3>
              <p className="text-xs text-muted-foreground">{company.tagline}</p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${company.brandColor}1a`,
                    color: company.brandColor,
                  }}
                >
                  {company.category}
                </span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="px-4 mt-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
              {company.description}
            </p>
          </div>

          {/* Search */}
          <div className="px-4 mt-3">
            <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Buscar productos</span>
            </div>
          </div>

          {/* Products */}
          <div className="px-4 mt-4 pb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold">Catálogo</h4>
              <span className="text-[10px] text-muted-foreground">
                {products.length} productos
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `${company.brandColor}14` }}
                      >
                        <Leaf className="w-6 h-6" style={{ color: company.brandColor }} />
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium leading-tight line-clamp-2">{p.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Coins className="w-2.5 h-2.5 text-accent" />
                      <span className="text-[10px] font-semibold text-foreground">
                        {p.points.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
