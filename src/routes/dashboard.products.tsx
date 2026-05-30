import { createFileRoute } from "@tanstack/react-router";
import { usePortal, fileToDataUrl, type Product } from "@/lib/portal-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Coins, Package, ImageIcon, Leaf } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/products")({
  component: ProductsPage,
});

const emptyForm: Omit<Product, "id"> = {
  name: "",
  description: "",
  points: 100,
  stock: 10,
  image: "",
  category: "Hogar",
};

function ProductsPage() {
  const { products, addProduct, updateProduct, removeProduct } = usePortal();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    setForm(rest);
    setOpen(true);
  };

  const onImage = async (file?: File) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setForm((f) => ({ ...f, image: url }));
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Pon un nombre al producto");
    if (form.points <= 0) return toast.error("Los puntos deben ser mayores a 0");
    if (editing) {
      updateProduct(editing.id, form);
      toast.success("Producto actualizado");
    } else {
      addProduct(form);
      toast.success("Producto publicado");
    }
    setOpen(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Catálogo de productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} producto{products.length === 1 ? "" : "s"} disponible
            {products.length === 1 ? "" : "s"} para canje.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo producto
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState onAdd={openNew} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} onEdit={() => openEdit(p)} onDelete={() => {
              removeProduct(p.id);
              toast.success("Producto eliminado");
            }} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ImagePicker
              image={form.image}
              onPick={(f) => onImage(f)}
              onClear={() => setForm((f) => ({ ...f, image: "" }))}
            />
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Botella reutilizable"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalles, materiales, vigencia..."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Puntos</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>{editing ? "Guardar cambios" : "Publicar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImagePicker({
  image,
  onPick,
  onClear,
}: {
  image: string;
  onPick: (f?: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">Imagen</Label>
      <label className="cursor-pointer block">
        <div className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center overflow-hidden">
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground text-sm">
              <ImageIcon className="w-6 h-6 mx-auto mb-1.5" />
              Click para subir imagen
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
      {image && (
        <button
          onClick={onClear}
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive mt-1.5"
        >
          Quitar imagen
        </button>
      )}
    </div>
  );
}

function ProductCard({
  p,
  onEdit,
  onDelete,
}: {
  p: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-soft">
            <Leaf className="w-10 h-10 text-primary/60" />
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-[10px] font-medium">
          {p.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold leading-tight">{p.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/15">
            <Coins className="w-3.5 h-3.5 text-accent-foreground" />
            <span className="text-sm font-semibold">{p.points.toLocaleString()}</span>
          </div>
          <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center bg-card">
      <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4">
        <Package className="w-6 h-6" />
      </div>
      <h3 className="font-semibold">Aún no tienes productos</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Publica tu primer producto para empezar a recibir canjes de usuarios que reciclan.
      </p>
      <Button onClick={onAdd} className="mt-5 gap-2">
        <Plus className="w-4 h-4" /> Crear producto
      </Button>
    </div>
  );
}
