import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, BedDouble, Loader2, Pencil, Play, Plus, Star, Trash2, X } from "lucide-react";

import {
  agregarMedioAlojamiento,
  borrarAlojamiento,
  borrarMedioAlojamiento,
  guardarAlojamiento,
  misAlojamientos,
  portadaAlojamiento,
  type AlojamientoRow,
} from "@/lib/hospedaje.functions";
import {
  SERVICIOS_HOSPEDAJE,
  TIPOS_ALOJAMIENTO,
  TIPOS_PRECIO_HOSPEDAJE,
  textoPrecioNoche,
} from "@/lib/hospedaje";
import { ACEPTA_FOTO, ACEPTA_VIDEO, posterVideo, subirMedio, urlImagen } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/alojamientos")({
  head: () => ({
    meta: [
      { title: "Mis alojamientos — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Publica tus habitaciones, departamentos o cabañas con capacidad, precio por noche y fotos.",
      },
      { property: "og:title", content: "Mis alojamientos — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Configura tus alojamientos y recibe solicitudes de hospedaje por WhatsApp.",
      },
    ],
  }),
  component: Alojamientos,
});

type Borrador = {
  id?: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  capacidad: string;
  camas: string;
  tipo_camas: string;
  precio: string;
  precio_tipo: string;
  servicios: string[];
  unidades: string;
  activo: boolean;
};

const VACIO: Borrador = {
  nombre: "",
  tipo: "habitacion",
  descripcion: "",
  capacidad: "2",
  camas: "",
  tipo_camas: "",
  precio: "",
  precio_tipo: "noche",
  servicios: [],
  unidades: "1",
  activo: true,
};

function deFila(a: AlojamientoRow): Borrador {
  return {
    id: a.id,
    nombre: a.nombre,
    tipo: a.tipo,
    descripcion: a.descripcion ?? "",
    capacidad: String(a.capacidad),
    camas: a.camas != null ? String(a.camas) : "",
    tipo_camas: a.tipo_camas ?? "",
    precio: a.precio != null ? String(a.precio) : "",
    precio_tipo: a.precio_tipo,
    servicios: a.servicios,
    unidades: String(a.unidades),
    activo: a.activo,
  };
}

function Alojamientos() {
  const qc = useQueryClient();
  const cargar = useServerFn(misAlojamientos);
  const guardar = useServerFn(guardarAlojamiento);
  const borrar = useServerFn(borrarAlojamiento);

  const { data, isLoading } = useQuery({ queryKey: ["mis-alojamientos"], queryFn: () => cargar() });

  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardarBorrador() {
    if (!borrador) return;
    setError(null);
    setOcupado(true);
    try {
      const r = await guardar({
        data: {
          ...(borrador.id ? { id: borrador.id } : {}),
          nombre: borrador.nombre,
          tipo: borrador.tipo,
          descripcion: borrador.descripcion || null,
          capacidad: Number(borrador.capacidad) || 1,
          camas: Number(borrador.camas) || null,
          tipo_camas: borrador.tipo_camas || null,
          precio: Number(borrador.precio.replace(/[^\d.]/g, "")) || null,
          precio_tipo: borrador.precio_tipo,
          servicios: borrador.servicios,
          unidades: Number(borrador.unidades) || 1,
          activo: borrador.activo,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mis-alojamientos"] });
      setBorrador((b) => (b ? { ...b, id: r.id } : b));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el alojamiento");
    } finally {
      setOcupado(false);
    }
  }

  const actual = borrador?.id ? (data ?? []).find((a) => a.id === borrador.id) : undefined;

  return (
    <div className="space-y-5 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mis alojamientos</h1>
        <p className="text-sm text-muted-foreground">
          Agrega cada habitación, departamento o cabaña que rentas.
        </p>
      </div>

      {borrador ? (
        <Formulario
          borrador={borrador}
          setBorrador={setBorrador}
          guardar={guardarBorrador}
          cerrar={() => setBorrador(null)}
          ocupado={ocupado}
          error={error}
          alojamiento={actual}
        />
      ) : (
        <>
          <Button className="h-14 w-full text-base font-semibold" onClick={() => setBorrador(VACIO)}>
            <Plus className="size-5" /> AGREGAR ALOJAMIENTO
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Todavía no tienes alojamientos publicados.
            </p>
          ) : (
            <ul className="space-y-3">
              {(data ?? []).map((a) => {
                const portada = a.medios.find((m) => m.es_portada) ?? a.medios[0];
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    {portada ? (
                      <img
                        src={
                          portada.tipo === "video"
                            ? posterVideo(portada.secure_url, "miniatura")
                            : urlImagen(portada.secure_url, "miniatura")
                        }
                        alt={a.nombre}
                        loading="lazy"
                        className="size-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
                        <BedDouble className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {textoPrecioNoche(a.precio, a.precio_tipo)} · hasta {a.capacidad} personas
                      </p>
                      <p
                        className={`text-xs font-semibold ${a.activo ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {a.activo ? "Activo" : "No disponible temporalmente"}
                      </p>
                    </div>
                    <button
                      aria-label={`Editar ${a.nombre}`}
                      onClick={() => setBorrador(deFila(a))}
                      className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      aria-label={`Eliminar ${a.nombre}`}
                      onClick={async () => {
                        await borrar({ data: { id: a.id } });
                        await qc.invalidateQueries({ queryKey: ["mis-alojamientos"] });
                      }}
                      className="rounded-full p-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid gap-2">
            <Button asChild variant="secondary" className="h-13">
              <Link to="/mi-negocio/disponibilidad">Disponibilidad y calendario</Link>
            </Button>
            <Button asChild variant="secondary" className="h-13">
              <Link to="/mi-negocio/hospedaje">Políticas del hospedaje</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Formulario({
  borrador,
  setBorrador,
  guardar,
  cerrar,
  ocupado,
  error,
  alojamiento,
}: {
  borrador: Borrador;
  setBorrador: (b: Borrador | null | ((b: Borrador | null) => Borrador | null)) => void;
  guardar: () => Promise<void>;
  cerrar: () => void;
  ocupado: boolean;
  error: string | null;
  alojamiento?: AlojamientoRow | undefined;
}) {
  const cambiar = (cambios: Partial<Borrador>) =>
    setBorrador((b) => (b ? { ...b, ...cambios } : b));

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {borrador.id ? "Editar alojamiento" : "Nuevo alojamiento"}
        </h2>
        <button aria-label="Cerrar" onClick={cerrar} className="rounded-full p-2 hover:bg-secondary">
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={borrador.nombre}
          onChange={(e) => cambiar({ nombre: e.target.value })}
          placeholder="Departamento frente al mar"
          className="h-13 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label>¿Qué tipo de alojamiento es?</Label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_ALOJAMIENTO.map((t) => (
            <button
              key={t.clave}
              type="button"
              onClick={() => cambiar({ tipo: t.clave })}
              className={`rounded-2xl px-3 py-3 text-left text-sm font-semibold ${
                borrador.tipo === t.clave
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {t.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Descripción</Label>
        <Textarea
          id="desc"
          value={borrador.descripcion}
          onChange={(e) => cambiar({ descripcion: e.target.value })}
          placeholder="Departamento con vista al mar, aire acondicionado y cocina equipada."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cap">Personas (máximo)</Label>
          <Input
            id="cap"
            value={borrador.capacidad}
            onChange={(e) => cambiar({ capacidad: e.target.value.replace(/\D/g, "") })}
            inputMode="numeric"
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uni">¿Cuántos iguales tienes?</Label>
          <Input
            id="uni"
            value={borrador.unidades}
            onChange={(e) => cambiar({ unidades: e.target.value.replace(/\D/g, "") })}
            inputMode="numeric"
            className="h-13 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="camas">Camas (opcional)</Label>
          <Input
            id="camas"
            value={borrador.camas}
            onChange={(e) => cambiar({ camas: e.target.value.replace(/\D/g, "") })}
            inputMode="numeric"
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tcamas">Tipo de camas</Label>
          <Input
            id="tcamas"
            value={borrador.tipo_camas}
            onChange={(e) => cambiar({ tipo_camas: e.target.value })}
            placeholder="1 matrimonial"
            className="h-13 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Precio</Label>
        <select
          value={borrador.precio_tipo}
          onChange={(e) => cambiar({ precio_tipo: e.target.value })}
          aria-label="Tipo de precio"
          className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
        >
          {TIPOS_PRECIO_HOSPEDAJE.map((t) => (
            <option key={t.clave} value={t.clave}>
              {t.nombre}
            </option>
          ))}
        </select>
        {borrador.precio_tipo === "consultar" ? null : (
          <Input
            value={borrador.precio}
            onChange={(e) => cambiar({ precio: e.target.value.replace(/\D/g, "") })}
            placeholder="1200"
            inputMode="numeric"
            aria-label="Precio por noche"
            className="h-13 text-base"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Servicios incluidos</Label>
        <div className="grid grid-cols-2 gap-2">
          {SERVICIOS_HOSPEDAJE.map((s) => {
            const activo = borrador.servicios.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  cambiar({
                    servicios: activo
                      ? borrador.servicios.filter((x) => x !== s)
                      : [...borrador.servicios, s],
                  })
                }
                className={`rounded-2xl px-3 py-3 text-left text-sm font-semibold ${
                  activo
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
        <span className="text-sm font-semibold">Disponible para recibir solicitudes</span>
        <input
          type="checkbox"
          checked={borrador.activo}
          onChange={(e) => cambiar({ activo: e.target.checked })}
          className="size-5 accent-[var(--color-primary)]"
        />
      </label>

      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <Button className="h-14 w-full text-base font-semibold" onClick={guardar} disabled={ocupado}>
        {ocupado ? <Loader2 className="size-5 animate-spin" /> : "GUARDAR"}
      </Button>

      {borrador.id ? (
        <MediosAlojamiento alojamientoId={borrador.id} medios={alojamiento?.medios ?? []} />
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Guarda primero para poder subir fotos y videos.
        </p>
      )}
    </div>
  );
}

function MediosAlojamiento({
  alojamientoId,
  medios,
}: {
  alojamientoId: string;
  medios: AlojamientoRow["medios"];
}) {
  const qc = useQueryClient();
  const agregar = useServerFn(agregarMedioAlojamiento);
  const borrar = useServerFn(borrarMedioAlojamiento);
  const portada = useServerFn(portadaAlojamiento);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(archivo: File, tipo: "image" | "video") {
    setError(null);
    setSubiendo(true);
    try {
      const r = await subirMedio(archivo, tipo);
      await agregar({
        data: {
          alojamiento_id: alojamientoId,
          tipo,
          public_id: r.public_id,
          secure_url: r.secure_url,
          resource_type: tipo === "video" ? "video" : "image",
          duration: r.duration ?? null,
          format: r.format ?? null,
          bytes: r.bytes ?? null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mis-alojamientos"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos subir el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <Label>Fotos y videos de este alojamiento</Label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl bg-secondary text-sm font-semibold">
          {subiendo ? <Loader2 className="size-4 animate-spin" /> : "Agregar foto"}
          <input
            type="file"
            accept={ACEPTA_FOTO}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void subir(f, "image");
              e.target.value = "";
            }}
          />
        </label>
        <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl bg-secondary text-sm font-semibold">
          {subiendo ? <Loader2 className="size-4 animate-spin" /> : "Agregar video"}
          <input
            type="file"
            accept={ACEPTA_VIDEO}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void subir(f, "video");
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <div className="grid grid-cols-3 gap-2">
        {medios.map((m) => (
          <div key={m.id} className="relative overflow-hidden rounded-xl bg-secondary">
            <img
              src={
                m.tipo === "video"
                  ? posterVideo(m.secure_url, "miniatura")
                  : urlImagen(m.secure_url, "miniatura")
              }
              alt="Contenido del alojamiento"
              loading="lazy"
              className="h-24 w-full object-cover"
            />
            {m.tipo === "video" ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                <Play className="size-5 fill-current" />
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/45 px-1 py-1">
              {m.tipo === "image" ? (
                <button
                  type="button"
                  aria-label="Usar como foto principal"
                  onClick={async () => {
                    await portada({ data: { id: m.id, alojamiento_id: alojamientoId } });
                    await qc.invalidateQueries({ queryKey: ["mis-alojamientos"] });
                  }}
                  className={m.es_portada ? "text-primary" : "text-white"}
                >
                  <Star className={`size-4 ${m.es_portada ? "fill-current" : ""}`} />
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                aria-label="Eliminar archivo"
                onClick={async () => {
                  await borrar({ data: { id: m.id } });
                  await qc.invalidateQueries({ queryKey: ["mis-alojamientos"] });
                }}
                className="text-white"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
