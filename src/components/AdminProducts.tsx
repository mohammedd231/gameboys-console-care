import { useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES, formatPrice, productImage, type Category, type Product } from "@/lib/shop";
import { adminDeleteProduct, adminListProducts, adminSaveProduct, adminUploadImage } from "@/lib/shop-api";

const field = "w-full rounded-lg border bg-background px-3 py-2 outline-none focus:border-ring";

/** Resize in the browser (max 1000px, JPEG) so uploads stay small and fast on phones. */
async function shrink(file: File): Promise<{ base64: string; contentType: "image/jpeg" }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL("image/jpeg", 0.85);
  return { base64: dataUrl.split(",")[1]!, contentType: "image/jpeg" };
}

export function AdminProducts() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: products = [], isLoading, error } = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts() });
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin-products"] });
    await router.invalidate(); // updates the public shop too
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This can't be undone. (To just hide it, use Edit and untick "Show in shop".)`)) return;
    await adminDeleteProduct({ data: { id: p.id } });
    await refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products.length} products · changes show on the shop within a minute</p>
        <button onClick={() => setEditing({ category: "PS5", active: true, image: "", price: 0 })} className="btn bg-primary px-4 py-2 text-xs text-primary-foreground">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>
      <div className="mt-4 divide-y rounded-xl border bg-card">
        {isLoading && <p className="p-6 text-muted-foreground">Loading…</p>}
        {error && <p className="p-6 text-destructive">Couldn't load products. Refresh and sign in again.</p>}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3">
            <img src={productImage(p)} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.category} · <span className="text-accent">{formatPrice(p.price)}</span>{p.tag ? ` · ${p.tag}` : ""}</p>
            </div>
            {p.active === false && <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Hidden</span>}
            <button aria-label="Edit" onClick={() => setEditing(p)} className="rounded-md bg-secondary p-2"><Pencil className="h-4 w-4" /></button>
            <button aria-label="Delete" onClick={() => remove(p)} className="rounded-md bg-secondary p-2 hover:text-primary"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {editing && <ProductForm key={editing.id ?? "new"} initial={editing} onDone={async () => { setEditing(null); await refresh(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ initial, onDone }: { initial: Partial<Product>; onDone: () => Promise<void> }) {
  const [name, setName] = useState(initial.name ?? "");
  const [category, setCategory] = useState<Category>(initial.category ?? "PS5");
  const [price, setPrice] = useState(String(initial.price ?? ""));
  const [tag, setTag] = useState(initial.tag ?? "");
  const [image, setImage] = useState(initial.image ?? "");
  const [active, setActive] = useState(initial.active !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await adminUploadImage({ data: await shrink(f) });
      setImage(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  }

  async function save() {
    const n = Number(price);
    if (name.trim().length < 2) return setError("Enter the product name.");
    if (!Number.isInteger(n) || n < 0) return setError("Enter the price as a whole number in EGP.");
    setBusy(true);
    setError("");
    try {
      await adminSaveProduct({ data: { id: initial.id, name, category, price: n, image, tag, active } });
      await onDone();
    } catch {
      setError("Couldn't save. Refresh the page and sign in again.");
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader><DialogTitle className="font-display">{initial.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
      <div className="flex items-center gap-4">
        <img src={productImage({ image, category })} alt="" className="h-24 w-24 rounded-lg border object-cover" />
        <label className="btn cursor-pointer border bg-secondary px-4 py-2 text-xs text-secondary-foreground">
          <ImagePlus className="h-4 w-4" /> {busy ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      </div>
      <label className="text-sm">Name
        <input className={`${field} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Category
          <select className={`${field} mt-1`} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-sm">Price (EGP)
          <input className={`${field} mt-1`} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      <label className="text-sm">Badge on the photo (optional, e.g. Hot, New, Used – checked)
        <input className={`${field} mt-1`} value={tag} maxLength={30} onChange={(e) => setTag(e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Show in shop (untick if sold out)
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={save} disabled={busy} className="btn bg-primary text-primary-foreground disabled:opacity-60">{busy ? "Please wait…" : "Save product"}</button>
    </>
  );
}
