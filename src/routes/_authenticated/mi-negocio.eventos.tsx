import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { borrarEvento, guardarEvento, misEventos, type EventoRow } from "@/lib/divertirme.functions";
import { fechaLargaD, hora12 } from "@/lib/divertirme";
import { subirMedio, urlImagen } from "@/lib/cloudinary";
import { pesos } from "@/lib/publico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/eventos")({
  head: () => ({
    meta: [
      { title: "Mis eventos — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Publica música en vivo, shows y eventos especiales de tu lugar.",
      },
      { property: "og:title", content: "Mis eventos — Tomar el Fresco en Yucatán" },
      { property: "og:description", content: "Música en vivo, shows y eventos especiales." },
    ],
  }),
  component: Eventos,
});

type Borrador = {
  id?: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  hora: string;
  cover_monto: string;
  activo: boolean;
  foto_url: string | null;
};

const VACIO: Borrador = {
  nombre: "",
  descripcion: "",
  fecha: "",
  hora: "",
  cover_monto: "",
  activo: true,
  foto_url: null,
};

function Eventos() {
  const qc = useQueryClient();
  const cargar = useServerFn(misEventos);
  const guardar = useServerFn(guardarEvento);
  const borrar = useServerFn(borrarEvento);

  const { data, isLoading } = useQuery({ queryKey: ["mis-eventos"], queryFn: () => cargar() });
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

  async function enviar() {
    if (!borrador) return;
    setOcupado(true);
    setError(null);
    try {
      await guardar({
        data: {
          ...(borrador.id ? { id: borrador.id } : {}),
          nombre: borrador.nombre,
          descripcion: borrador.descripcion,
          fecha: borrador.fecha || null,
          hora: borrador.hora || null,
          foto_url: borrador.foto_url,
          cover_monto: borrador.cover_monto ? Number(borrador.cover_monto) : null,
          activo: borrador.activo,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mis-eventos"] });
      setBorrador(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el evento");
    } finally {
      setOcupado(false);
    }
  }

  function editar(e: EventoRow) {
    setBorrador({
      id: e.id,
      nombre: e.nombre,
      descripcion: e.descripcion ?? "",
      fecha: e.fecha ?? "",
      hora: e.hora ?? "",
      cover_monto: e.cover_monto != null ? String(e.cover_monto) : "",
      activo: e.activo,
      foto_url: e.foto_url,
    });
  }

  return (
    <div className="space-y-5 pb-24">
      <Link to="/mi-negocio" className="inline-flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="size-4" /> Mi negocio
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CalendarClock className="size-6 text-primary" /> Mis eventos
        </h1>
        <p className="text-sm text-muted-foreground">
          Música en vivo, shows y noches especiales. Tomar el Fresco no vende boletos.
        </p>
      </div>

      {borrador ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="ev-nombre">Nombre del evento</Label>
            <Input
              id="ev-nombre"
              value={borrador.nombre}
              onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
              placeholder="Grupo Tropical en Vivo"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev-fecha">Fecha</Label>
              <Input
                id="ev-fecha"
                type="date"
                value={borrador.fecha}
                onChange={(e) => setBorrador({ ...borrador, fecha: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ev-hora">Hora</Label>
              <Input
                id="ev-hora"
                type="time"
                value={borrador.hora}
                onChange={(e) => setBorrador({ ...borrador, hora: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ev-desc">Descripción (opcional)</Label>
            <Textarea
              id="ev-desc"
              value={borrador.descripcion}
              onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ev-cover">Cover del evento (opcional)</Label>
            <Input
              id="ev-cover"
              inputMode="numeric"
              value={borrador.cover_monto}
              onChange={(e) => setBorrador({ ...borrador, cover_monto: e.target.value })}
              placeholder="150"
            />
          </div>
          <div>
            <Label htmlFor="ev-foto">Imagen (opcional)</Label>
            <Input
              id="ev-foto"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) void subirFoto(archivo);
              }}
            />
            {borrador.foto_url ? (
              <img
                src={urlImagen(borrador.foto_url, "tarjeta")}
                alt="Imagen del evento"
                loading="lazy"
                className="mt-2 h-32 w-full rounded-xl object-cover"
              />
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={borrador.activo}
              onChange={(e) => setBorrador({ ...borrador, activo: e.target.checked })}
            />
            Activo (visible para el público)
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button onClick={() => void enviar()} disabled={ocupado} className="h-12 flex-1">
              {ocupado ? <Loader2 className="size-5 animate-spin" /> : "GUARDAR"}
            </Button>
            <Button variant="secondary" className="h-12" onClick={() => setBorrador(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setBorrador({ ...VACIO })} className="h-13 w-full text-base">
          <Plus className="size-5" /> NUEVO EVENTO
        </Button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((e) => (
            <div
              key={e.id}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
            >
              {e.foto_url ? (
                <img
                  src={urlImagen(e.foto_url, "tarjeta")}
                  alt={e.nombre}
                  loading="lazy"
                  className="size-20 shrink-0 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{e.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {e.fecha ? fechaLargaD(e.fecha) : "Sin fecha"}
                  {e.hora ? ` · ${hora12(e.hora)}` : ""}
                </p>
                {e.cover_monto ? (
                  <p className="text-sm font-semibold">Cover {pesos(e.cover_monto)}</p>
                ) : null}
                {!e.activo ? <p className="text-xs text-muted-foreground">Inactivo</p> : null}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="icon" variant="secondary" onClick={() => editar(e)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Borrar"
                  onClick={async () => {
                    await borrar({ data: { id: e.id } });
                    await qc.invalidateQueries({ queryKey: ["mis-eventos"] });
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no tienes eventos publicados.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
