import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Car, Loader2, Pencil, Play, Plus, Star, Trash2, X } from "lucide-react";

import {
  agregarMedioVehiculo,
  borrarMedioVehiculo,
  borrarVehiculo,
  guardarVehiculo,
  misVehiculos,
  portadaVehiculo,
  type VehiculoRow,
} from "@/lib/moverme.functions";
import { TIPOS_PRECIO_RENTA, TRANSMISIONES, textoPrecioDia } from "@/lib/moverme";
import { ACEPTA_FOTO, ACEPTA_VIDEO, posterVideo, subirMedio, urlImagen } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/vehiculos")({
  head: () => ({
    meta: [
      { title: "Mis vehículos — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Publica tus categorías o vehículos de renta con pasajeros, transmisión, precio por día y fotos.",
      },
      { property: "og:title", content: "Mis vehículos — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Configura tu flotilla y recibe solicitudes de renta por WhatsApp.",
      },
    ],
  }),
  component: Vehiculos,
});

type Borrador = {
  id?: string;
  nombre: string;
  modelo_referencia: string;
  descripcion: string;
  pasajeros: string;
  transmision: string;
  aire_acondicionado: boolean;
  equipaje: string;
  precio: string;
  precio_tipo: string;
  unidades: string;
  activo: boolean;
};

const VACIO: Borrador = {
  nombre: "",
  modelo_referencia: "",
  descripcion: "",
  pasajeros: "5",
  transmision: "automatica",
  aire_acondicionado: true,
  equipaje: "",
  precio: "",
  precio_tipo: "dia",
  unidades: "1",
  activo: true,
};

function deFila(v: VehiculoRow): Borrador {
  return {
    id: v.id,
    nombre: v.nombre,
    modelo_referencia: v.modelo_referencia ?? "",
    descripcion: v.descripcion ?? "",
    pasajeros: String(v.pasajeros),
    transmision: v.transmision,
    aire_acondicionado: v.aire_acondicionado,
    equipaje: v.equipaje ?? "",
    precio: v.precio != null ? String(v.precio) : "",
    precio_tipo: v.precio_tipo,
    unidades: String(v.unidades),
    activo: v.activo,
  };
}

function Vehiculos() {
  const qc = useQueryClient();
  const cargar = useServerFn(misVehiculos);
  const guardar = useServerFn(guardarVehiculo);
  const borrar = useServerFn(borrarVehiculo);

  const { data, isLoading } = useQuery({ queryKey: ["mis-vehiculos"], queryFn: () => cargar() });

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
          modelo_referencia: borrador.modelo_referencia || null,
          descripcion: borrador.descripcion || null,
          pasajeros: Number(borrador.pasajeros) || 5,
          transmision: borrador.transmision,
          aire_acondicionado: borrador.aire_acondicionado,
          equipaje: borrador.equipaje || null,
          precio: Number(borrador.precio.replace(/[^\d.]/g, "")) || null,
          precio_tipo: borrador.precio_tipo,
          unidades: Number(borrador.unidades) || 1,
          activo: borrador.activo,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
      setBorrador((b) => (b ? { ...b, id: r.id } : b));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el vehículo");
    } finally {
      setOcupado(false);
    }
  }

  const actual = borrador?.id ? (data ?? []).find((v) => v.id === borrador.id) : undefined;

  return (
    <div className="space-y-5 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mis vehículos</h1>
        <p className="text-sm text-muted-foreground">
          Puedes publicar por categoría (Económico, SUV, Van) o por vehículo específico. No pedimos
          placas ni datos técnicos.
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
          vehiculo={actual}
        />
      ) : (
        <>
          <Button className="h-14 w-full text-base font-semibold" onClick={() => setBorrador(VACIO)}>
            <Plus className="size-5" /> AGREGAR VEHÍCULO O CATEGORÍA
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Todavía no tienes vehículos publicados.
            </p>
          ) : (
            <ul className="space-y-3">
              {(data ?? []).map((v) => {
                const portada = v.medios.find((m) => m.es_portada) ?? v.medios[0];
                return (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    {portada ? (
                      <img
                        src={
                          portada.tipo === "video"
                            ? posterVideo(portada.secure_url, "miniatura")
                            : urlImagen(portada.secure_url, "miniatura")
                        }
                        alt={v.nombre}
                        loading="lazy"
                        className="size-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
                        <Car className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{v.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {textoPrecioDia(v.precio, v.precio_tipo)} · {v.pasajeros} pasajeros
                      </p>
                      <p
                        className={`text-xs font-semibold ${v.activo ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {v.activo ? "Activo" : "No disponible temporalmente"}
                      </p>
                    </div>
                    <button
                      aria-label={`Editar ${v.nombre}`}
                      onClick={() => setBorrador(deFila(v))}
                      className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      aria-label={`Eliminar ${v.nombre}`}
                      onClick={async () => {
                        await borrar({ data: { id: v.id } });
                        await qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
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
              <Link to="/mi-negocio/disponibilidad-renta">Disponibilidad de vehículos</Link>
            </Button>
            <Button asChild variant="secondary" className="h-13">
              <Link to="/mi-negocio/renta">Requisitos y entrega</Link>
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
  vehiculo,
}: {
  borrador: Borrador;
  setBorrador: (b: Borrador | null | ((b: Borrador | null) => Borrador | null)) => void;
  guardar: () => Promise<void>;
  cerrar: () => void;
  ocupado: boolean;
  error: string | null;
  vehiculo?: VehiculoRow | undefined;
}) {
  const cambiar = (cambios: Partial<Borrador>) =>
    setBorrador((b) => (b ? { ...b, ...cambios } : b));

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{borrador.id ? "Editar vehículo" : "Nuevo vehículo"}</h2>
        <button aria-label="Cerrar" onClick={cerrar} className="rounded-full p-2 hover:bg-secondary">
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre o categoría</Label>
        <Input
          id="nombre"
          value={borrador.nombre}
          onChange={(e) => cambiar({ nombre: e.target.value })}
          placeholder="ECONÓMICO"
          className="h-13 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelo">Modelo de referencia (opcional)</Label>
        <Input
          id="modelo"
          value={borrador.modelo_referencia}
          onChange={(e) => cambiar({ modelo_referencia: e.target.value })}
          placeholder="Nissan March o similar"
          className="h-13 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Descripción</Label>
        <Textarea
          id="desc"
          value={borrador.descripcion}
          onChange={(e) => cambiar({ descripcion: e.target.value })}
          placeholder="Auto compacto, ideal para ciudad y playa."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="pax">Pasajeros</Label>
          <Input
            id="pax"
            value={borrador.pasajeros}
            onChange={(e) => cambiar({ pasajeros: e.target.value.replace(/\D/g, "") })}
            inputMode="numeric"
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uni">Unidades disponibles</Label>
          <Input
            id="uni"
            value={borrador.unidades}
            onChange={(e) => cambiar({ unidades: e.target.value.replace(/\D/g, "") })}
            inputMode="numeric"
            className="h-13 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Transmisión</Label>
        <div className="grid grid-cols-3 gap-2">
          {TRANSMISIONES.map((t) => (
            <button
              key={t.clave}
              type="button"
              onClick={() => cambiar({ transmision: t.clave })}
              className={`rounded-2xl px-2 py-3 text-sm font-semibold ${
                borrador.transmision === t.clave
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
        <Label htmlFor="eq">Equipaje (opcional)</Label>
        <Input
          id="eq"
          value={borrador.equipaje}
          onChange={(e) => cambiar({ equipaje: e.target.value })}
          placeholder="2 maletas grandes"
          className="h-13 text-base"
        />
      </div>

      <label className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
        <span className="text-sm font-semibold">Aire acondicionado</span>
        <input
          type="checkbox"
          checked={borrador.aire_acondicionado}
          onChange={(e) => cambiar({ aire_acondicionado: e.target.checked })}
          className="size-5 accent-[var(--color-primary)]"
        />
      </label>

      <div className="space-y-2">
        <Label>Precio</Label>
        <select
          value={borrador.precio_tipo}
          onChange={(e) => cambiar({ precio_tipo: e.target.value })}
          aria-label="Tipo de precio"
          className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
        >
          {TIPOS_PRECIO_RENTA.map((t) => (
            <option key={t.clave} value={t.clave}>
              {t.nombre}
            </option>
          ))}
        </select>
        {borrador.precio_tipo === "consultar" ? null : (
          <Input
            value={borrador.precio}
            onChange={(e) => cambiar({ precio: e.target.value.replace(/\D/g, "") })}
            placeholder="850"
            inputMode="numeric"
            aria-label="Precio por día"
            className="h-13 text-base"
          />
        )}
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
        <MediosVehiculo vehiculoId={borrador.id} medios={vehiculo?.medios ?? []} />
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Guarda primero para poder subir fotos y videos.
        </p>
      )}
    </div>
  );
}

function MediosVehiculo({
  vehiculoId,
  medios,
}: {
  vehiculoId: string;
  medios: VehiculoRow["medios"];
}) {
  const qc = useQueryClient();
  const agregar = useServerFn(agregarMedioVehiculo);
  const borrar = useServerFn(borrarMedioVehiculo);
  const portada = useServerFn(portadaVehiculo);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(archivo: File, tipo: "image" | "video") {
    setError(null);
    setSubiendo(true);
    try {
      const r = await subirMedio(archivo, tipo);
      await agregar({
        data: {
          vehiculo_id: vehiculoId,
          tipo,
          public_id: r.public_id,
          secure_url: r.secure_url,
          resource_type: tipo === "video" ? "video" : "image",
          duration: r.duration ?? null,
          format: r.format ?? null,
          bytes: r.bytes ?? null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos subir el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <Label>Fotos y videos de este vehículo</Label>
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
              alt="Contenido del vehículo"
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
                    await portada({ data: { id: m.id, vehiculo_id: vehiculoId } });
                    await qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
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
                  await qc.invalidateQueries({ queryKey: ["mis-vehiculos"] });
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
