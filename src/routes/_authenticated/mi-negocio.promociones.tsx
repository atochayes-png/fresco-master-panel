import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";

import {
  borrarPromocion,
  guardarPromocion,
  misPromociones,
  type PromocionRow,
} from "@/lib/comer.functions";
import { subirMedio, urlImagen } from "@/lib/cloudinary";
import { pesos } from "@/lib/publico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/promociones")({
  head: () => ({
    meta: [
      { title: "Mis promociones — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Crea combos y promociones que tus clientes verán en tu ficha pública.",
      },
      { property: "og:title", content: "Mis promociones — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Combos, martes de pizza y ofertas visibles en tu ficha.",
      },
    ],
  }),
  component: Promociones,
});

type Borrador = {
  id?: string;
  titulo: string;
  descripcion: string;
  precio: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  foto_url: string | null;
};

const VACIO: Borrador = {
  titulo: "",
  descripcion: "",
  precio: "",
  fecha_inicio: "",
  fecha_fin: "",
  activa: true,
  foto_url: null,
};

function Promociones() {
  const qc = useQueryClient();
  const cargar = useServerFn(misPromociones);
  const guardar = useServerFn(guardarPromocion);
  const borrar = useServerFn(borrarPromocion);

  const { data, isLoading } = useQuery({
    queryKey: ["mis-promociones"],
    queryFn: () => cargar(),
  });

  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirFoto(archivo: File) {
    setOcupado(true);
    try {
      const r = await subirMedio(archivo, "image");
      setBorrador((b) => (b ? { ...b, foto_url: r.secure_url } : b));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos subir la foto");
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
          titulo: borrador.titulo,
          descripcion: borrador.descripcion,
          foto_url: borrador.foto_url,
          precio: Number(borrador.precio.replace(/[^\d.]/g, "")) || null,
          fecha_inicio: borrador.fecha_inicio || null,
          fecha_fin: borrador.fecha_fin || null,
          activa: borrador.activa,
        },
      });
      setBorrador(null);
      await qc.invalidateQueries({ queryKey: ["mis-promociones"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar la promoción");
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar(p: PromocionRow) {
    await borrar({ data: { id: p.id } });
    await qc.invalidateQueries({ queryKey: ["mis-promociones"] });
  }

  return (
    <div className="space-y-5 pb-8">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mis promociones</h1>
        <p className="text-sm text-muted-foreground">
          Ejemplos: “Combo familiar”, “Martes de pizza”, “2 hamburguesas + papas”.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Todavía no tienes promociones.
        </p>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              {p.foto_url ? (
                <img
                  src={urlImagen(p.foto_url, "miniatura")}
                  alt={p.titulo}
                  loading="lazy"
                  className="size-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
                  <Tag className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.titulo}</p>
                {p.precio ? <p className="text-sm text-primary">{pesos(p.precio)}</p> : null}
                {!p.activa ? <p className="text-xs text-muted-foreground">Inactiva</p> : null}
              </div>
              <button
                aria-label="Editar"
                onClick={() =>
                  setBorrador({
                    id: p.id,
                    titulo: p.titulo,
                    descripcion: p.descripcion ?? "",
                    precio: p.precio != null ? String(p.precio) : "",
                    fecha_inicio: p.fecha_inicio ?? "",
                    fecha_fin: p.fecha_fin ?? "",
                    activa: p.activa,
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
        <Plus className="size-5" /> AGREGAR PROMOCIÓN
      </Button>

      {borrador ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-sm space-y-4 overflow-y-auto rounded-t-3xl border border-border bg-card p-6 sm:rounded-3xl">
            <h2 className="text-xl font-bold">
              {borrador.id ? "Editar promoción" : "Nueva promoción"}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="pt" className="text-base">
                Título
              </Label>
              <Input
                id="pt"
                value={borrador.titulo}
                onChange={(e) => setBorrador({ ...borrador, titulo: e.target.value })}
                className="h-13 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pd" className="text-base">
                Descripción corta (opcional)
              </Label>
              <Textarea
                id="pd"
                value={borrador.descripcion}
                onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pp" className="text-base">
                Precio promocional (opcional)
              </Label>
              <Input
                id="pp"
                inputMode="decimal"
                value={borrador.precio}
                onChange={(e) => setBorrador({ ...borrador, precio: e.target.value })}
                className="h-13 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pi" className="text-sm">
                  Inicia (opcional)
                </Label>
                <Input
                  id="pi"
                  type="date"
                  value={borrador.fecha_inicio}
                  onChange={(e) => setBorrador({ ...borrador, fecha_inicio: e.target.value })}
                  className="h-13 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf" className="text-sm">
                  Termina (opcional)
                </Label>
                <Input
                  id="pf"
                  type="date"
                  value={borrador.fecha_fin}
                  onChange={(e) => setBorrador({ ...borrador, fecha_fin: e.target.value })}
                  className="h-13 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pfo" className="text-base">
                Fotografía (opcional)
              </Label>
              {borrador.foto_url ? (
                <img
                  src={urlImagen(borrador.foto_url, "tarjeta")}
                  alt="Promoción"
                  className="h-32 w-full rounded-2xl object-cover"
                />
              ) : null}
              <Input
                id="pfo"
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
                checked={borrador.activa}
                onChange={(e) => setBorrador({ ...borrador, activa: e.target.checked })}
                className="size-6 accent-[var(--color-primary)]"
              />
              Activa
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
