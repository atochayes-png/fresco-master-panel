import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Camera, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import {
  borrarProducto,
  guardarProducto,
  misProductos,
  type ProductoRow,
} from "@/lib/productos.functions";
import { miNegocio, guardarPerfil } from "@/lib/dueno.functions";
import { comprimirImagen, subirArchivo, urlFirmada } from "@/lib/dueno";
import { pesos } from "@/lib/publico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/productos")({
  head: () => ({
    meta: [
      { title: "Mis productos — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Activa los pedidos y administra los productos que ofreces a tus clientes.",
      },
      { property: "og:title", content: "Mis productos — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Activa los pedidos y administra tu lista de productos.",
      },
    ],
  }),
  component: Productos,
});

type Borrador = {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: string;
  disponible: boolean;
  foto_ruta?: string | null;
  foto_url?: string | null;
};

const VACIO: Borrador = { nombre: "", descripcion: "", precio: "", disponible: true };

function Productos() {
  const qc = useQueryClient();
  const cargar = useServerFn(misProductos);
  const cargarNegocio = useServerFn(miNegocio);
  const guardar = useServerFn(guardarProducto);
  const borrar = useServerFn(borrarProducto);
  const guardarP = useServerFn(guardarPerfil);

  const { data: productos, isLoading } = useQuery({
    queryKey: ["mis-productos"],
    queryFn: () => cargar(),
  });
  const { data: negocio } = useQuery({ queryKey: ["mi-negocio"], queryFn: () => cargarNegocio() });

  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recibePedidos = negocio?.perfil.recibe_pedidos === true;

  async function alternarPedidos(valor: boolean) {
    await guardarP({ data: { campos: { recibe_pedidos: valor } } });
    await qc.invalidateQueries({ queryKey: ["mi-negocio"] });
  }

  async function subirFoto(archivo: File) {
    if (!negocio) return;
    setOcupado(true);
    try {
      const comprimida = await comprimirImagen(archivo, 900, 0.75);
      const ruta = await subirArchivo(negocio.negocio.id, "productos", comprimida);
      const url = await urlFirmada(ruta);
      setBorrador((b) => (b ? { ...b, foto_ruta: ruta, foto_url: url } : b));
    } finally {
      setOcupado(false);
    }
  }

  async function guardarBorrador() {
    if (!borrador) return;
    setError(null);
    setOcupado(true);
    try {
      await guardar({
        data: {
          ...(borrador.id ? { id: borrador.id } : {}),
          nombre: borrador.nombre,
          descripcion: borrador.descripcion,
          precio: Number(borrador.precio.replace(/[^\d.]/g, "")) || 0,
          disponible: borrador.disponible,
          foto_ruta: borrador.foto_ruta ?? null,
          foto_url: borrador.foto_url ?? null,
        },
      });
      setBorrador(null);
      await qc.invalidateQueries({ queryKey: ["mis-productos"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el producto");
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar(p: ProductoRow) {
    await borrar({ data: { id: p.id } });
    await qc.invalidateQueries({ queryKey: ["mis-productos"] });
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mis productos</h1>
        <p className="text-sm text-muted-foreground">
          Agrega lo que vendes para que tus clientes armen su pedido y te escriban por WhatsApp.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <input
          type="checkbox"
          checked={recibePedidos}
          onChange={(e) => void alternarPedidos(e.target.checked)}
          className="mt-1 size-6 accent-[var(--color-primary)]"
        />
        <span>
          <span className="block text-base font-semibold">Quiero recibir pedidos</span>
          <span className="block text-sm text-muted-foreground">
            Tus clientes podrán armar su pedido y enviártelo por WhatsApp.
          </span>
        </span>
      </label>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="space-y-3">
          {(productos ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              {p.foto_url ? (
                <img src={p.foto_url} alt={p.nombre} className="size-16 rounded-xl object-cover" />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
                  <Camera className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.nombre}</p>
                <p className="text-sm text-primary">{pesos(p.precio)}</p>
                {!p.disponible ? (
                  <p className="text-xs text-muted-foreground">No disponible</p>
                ) : null}
              </div>
              <button
                aria-label="Editar"
                onClick={() =>
                  setBorrador({
                    id: p.id,
                    nombre: p.nombre,
                    descripcion: p.descripcion ?? "",
                    precio: String(p.precio),
                    disponible: p.disponible,
                    foto_ruta: p.foto_ruta,
                    foto_url: p.foto_url,
                  })
                }
                className="flex size-10 items-center justify-center rounded-full bg-secondary"
              >
                <Pencil className="size-4" />
              </button>
              <button
                aria-label="Eliminar"
                onClick={() => void eliminar(p)}
                className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={() => setBorrador(VACIO)} className="h-14 w-full text-base font-semibold">
        <Plus className="size-5" /> AGREGAR PRODUCTO
      </Button>

      {borrador ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-sm space-y-4 overflow-y-auto rounded-t-3xl border border-border bg-card p-6 sm:rounded-3xl">
            <h2 className="text-xl font-bold">
              {borrador.id ? "Editar producto" : "Nuevo producto"}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="np" className="text-base">
                Nombre
              </Label>
              <Input
                id="np"
                value={borrador.nombre}
                onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
                className="h-13 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dp" className="text-base">
                Descripción (opcional)
              </Label>
              <Textarea
                id="dp"
                value={borrador.descripcion}
                onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pp" className="text-base">
                Precio
              </Label>
              <Input
                id="pp"
                inputMode="decimal"
                value={borrador.precio}
                onChange={(e) => setBorrador({ ...borrador, precio: e.target.value })}
                className="h-13 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fp" className="text-base">
                Foto (opcional)
              </Label>
              {borrador.foto_url ? (
                <img
                  src={borrador.foto_url}
                  alt="Foto del producto"
                  className="h-32 w-full rounded-2xl object-cover"
                />
              ) : null}
              <Input
                id="fp"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void subirFoto(f);
                }}
                className="text-sm"
              />
            </div>

            <label className="flex items-center gap-3 text-base">
              <input
                type="checkbox"
                checked={borrador.disponible}
                onChange={(e) => setBorrador({ ...borrador, disponible: e.target.checked })}
                className="size-6 accent-[var(--color-primary)]"
              />
              Disponible
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              onClick={guardarBorrador}
              disabled={ocupado}
              className="h-14 w-full text-base font-semibold"
            >
              {ocupado ? <Loader2 className="size-5 animate-spin" /> : "GUARDAR"}
            </Button>
            <Button variant="ghost" onClick={() => setBorrador(null)} className="h-12 w-full">
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
