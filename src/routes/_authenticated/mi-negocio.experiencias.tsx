import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  Compass,
  Loader2,
  MapPin,
  Pencil,
  Play,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  agregarMedioExperiencia,
  borrarExperiencia,
  borrarMedioExperiencia,
  guardarExperiencia,
  misExperiencias,
  portadaExperiencia,
  type ExperienciaRow,
} from "@/lib/conocer.functions";
import {
  CATEGORIAS_CONOCER,
  DURACIONES,
  HORARIOS_SUGERIDOS,
  TIPOS_PRECIO,
  textoPrecio,
  type ExtraExperiencia,
} from "@/lib/conocer";
import { buscarLugares, type Lugar } from "@/lib/mapas.functions";
import { ACEPTA_FOTO, ACEPTA_VIDEO, posterVideo, subirMedio, urlImagen } from "@/lib/cloudinary";
import { MapaPunto } from "@/components/mapa-punto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/experiencias")({
  head: () => ({
    meta: [
      { title: "Mis experiencias — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Publica los tours y experiencias que ofreces con fotos, precio y horarios.",
      },
      { property: "og:title", content: "Mis experiencias — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Tours, paseos y experiencias visibles para los visitantes de Yucatán.",
      },
    ],
  }),
  component: Experiencias,
});

type Borrador = {
  id?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: string;
  precio_tipo: string;
  duracion: string;
  punto_salida: string;
  salida_latitud: number | null;
  salida_longitud: number | null;
  horarios: string[];
  capacidad: string;
  extras: ExtraExperiencia[];
  requiere_anticipo: boolean;
  activa: boolean;
};

const VACIO: Borrador = {
  nombre: "",
  descripcion: "",
  categoria: "",
  precio: "",
  precio_tipo: "persona",
  duracion: "",
  punto_salida: "",
  salida_latitud: null,
  salida_longitud: null,
  horarios: [],
  capacidad: "",
  extras: [],
  requiere_anticipo: false,
  activa: true,
};

function deFila(e: ExperienciaRow): Borrador {
  return {
    id: e.id,
    nombre: e.nombre,
    descripcion: e.descripcion ?? "",
    categoria: e.categoria ?? "",
    precio: e.precio != null ? String(e.precio) : "",
    precio_tipo: e.precio_tipo,
    duracion: e.duracion ?? "",
    punto_salida: e.punto_salida ?? "",
    salida_latitud: e.salida_latitud,
    salida_longitud: e.salida_longitud,
    horarios: e.horarios,
    capacidad: e.capacidad != null ? String(e.capacidad) : "",
    extras: e.extras,
    requiere_anticipo: e.requiere_anticipo,
    activa: e.activa,
  };
}

function Experiencias() {
  const qc = useQueryClient();
  const cargar = useServerFn(misExperiencias);
  const guardar = useServerFn(guardarExperiencia);
  const borrar = useServerFn(borrarExperiencia);

  const { data, isLoading } = useQuery({
    queryKey: ["mis-experiencias"],
    queryFn: () => cargar(),
  });

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
          descripcion: borrador.descripcion,
          categoria: borrador.categoria || null,
          precio: Number(borrador.precio.replace(/[^\d.]/g, "")) || null,
          precio_tipo: borrador.precio_tipo,
          duracion: borrador.duracion || null,
          punto_salida: borrador.punto_salida || null,
          salida_latitud: borrador.salida_latitud,
          salida_longitud: borrador.salida_longitud,
          horarios: borrador.horarios,
          capacidad: Number(borrador.capacidad) || null,
          extras: borrador.extras,
          requiere_anticipo: borrador.requiere_anticipo,
          activa: borrador.activa,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mis-experiencias"] });
      setBorrador((b) => (b ? { ...b, id: r.id } : b));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar la experiencia");
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar(e: ExperienciaRow) {
    await borrar({ data: { id: e.id } });
    await qc.invalidateQueries({ queryKey: ["mis-experiencias"] });
  }

  const actual = borrador?.id ? (data ?? []).find((e) => e.id === borrador.id) : undefined;

  return (
    <div className="space-y-5 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mis experiencias</h1>
        <p className="text-sm text-muted-foreground">
          Publica cada tour o paseo que ofreces: “Tour Isla Columpios”, “Pesca recreativa”…
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
          experiencia={actual}
        />
      ) : (
        <>
          <Button className="h-14 w-full text-base font-semibold" onClick={() => setBorrador(VACIO)}>
            <Plus className="size-5" /> AGREGAR EXPERIENCIA
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Todavía no tienes experiencias publicadas.
            </p>
          ) : (
            <ul className="space-y-3">
              {(data ?? []).map((e) => {
                const portada = e.medios.find((m) => m.es_portada) ?? e.medios[0];
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    {portada ? (
                      <img
                        src={
                          portada.tipo === "video"
                            ? posterVideo(portada.secure_url, "miniatura")
                            : urlImagen(portada.secure_url, "miniatura")
                        }
                        alt={e.nombre}
                        loading="lazy"
                        className="size-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
                        <Compass className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {textoPrecio(e.precio, e.precio_tipo)}
                        {e.duracion ? ` · ${e.duracion}` : ""}
                      </p>
                      <p
                        className={`text-xs font-semibold ${e.activa ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {e.activa ? "Activa" : "No disponible temporalmente"}
                      </p>
                    </div>
                    <button
                      aria-label={`Editar ${e.nombre}`}
                      onClick={() => setBorrador(deFila(e))}
                      className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      aria-label={`Eliminar ${e.nombre}`}
                      onClick={() => void eliminar(e)}
                      className="rounded-full p-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
  experiencia,
}: {
  borrador: Borrador;
  setBorrador: (b: Borrador | null | ((b: Borrador | null) => Borrador | null)) => void;
  guardar: () => Promise<void>;
  cerrar: () => void;
  ocupado: boolean;
  error: string | null;
  experiencia?: ExperienciaRow;
}) {
  const cambiar = (cambios: Partial<Borrador>) =>
    setBorrador((b) => (b ? { ...b, ...cambios } : b));

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {borrador.id ? "Editar experiencia" : "Nueva experiencia"}
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
          placeholder="Tour Isla Columpios"
          className="h-13 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Descripción breve</Label>
        <Textarea
          id="desc"
          value={borrador.descripcion}
          onChange={(e) => cambiar({ descripcion: e.target.value })}
          placeholder="Paseo en lancha para conocer Isla Columpios y disfrutar sus aguas."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>¿De qué tipo es?</Label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS_CONOCER.map((c) => (
            <button
              key={c.clave}
              type="button"
              onClick={() => cambiar({ categoria: borrador.categoria === c.clave ? "" : c.clave })}
              className={`rounded-2xl px-3 py-3 text-left text-sm font-semibold ${
                borrador.categoria === c.clave
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.nombre}
            </button>
          ))}
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
          {TIPOS_PRECIO.map((t) => (
            <option key={t.clave} value={t.clave}>
              {t.nombre}
            </option>
          ))}
        </select>
        {borrador.precio_tipo === "consultar" ? null : (
          <Input
            inputMode="numeric"
            value={borrador.precio}
            onChange={(e) => cambiar({ precio: e.target.value })}
            placeholder="500"
            className="h-13 text-base"
            aria-label="Cantidad en pesos"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Duración aproximada</Label>
        <div className="grid grid-cols-3 gap-2">
          {DURACIONES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => cambiar({ duracion: borrador.duracion === d ? "" : d })}
              className={`rounded-xl px-2 py-3 text-sm font-semibold ${
                borrador.duracion === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <PuntoSalida borrador={borrador} cambiar={cambiar} />

      <div className="space-y-2">
        <Label>Horarios disponibles</Label>
        <p className="text-xs text-muted-foreground">
          Son opciones para solicitar. La disponibilidad la confirmas tú.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {HORARIOS_SUGERIDOS.map((h) => {
            const activo = borrador.horarios.includes(h);
            return (
              <button
                key={h}
                type="button"
                onClick={() =>
                  cambiar({
                    horarios: activo
                      ? borrador.horarios.filter((x) => x !== h)
                      : [...borrador.horarios, h],
                  })
                }
                className={`rounded-xl px-2 py-3 text-xs font-semibold ${
                  activo
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cap">Capacidad máxima (opcional)</Label>
        <Input
          id="cap"
          inputMode="numeric"
          value={borrador.capacidad}
          onChange={(e) => cambiar({ capacidad: e.target.value.replace(/\D/g, "") })}
          placeholder="8"
          className="h-13 text-base"
        />
      </div>

      <Extras borrador={borrador} cambiar={cambiar} />

      <label className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
        <input
          type="checkbox"
          checked={borrador.requiere_anticipo}
          onChange={(e) => cambiar({ requiere_anticipo: e.target.checked })}
          className="size-5"
        />
        <span className="text-sm font-semibold">
          Esta experiencia requiere anticipo para confirmar
        </span>
      </label>

      <label className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
        <input
          type="checkbox"
          checked={borrador.activa}
          onChange={(e) => cambiar({ activa: e.target.checked })}
          className="size-5"
        />
        <span className="text-sm font-semibold">Disponible para los visitantes</span>
      </label>

      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <Button className="h-14 w-full text-base font-semibold" disabled={ocupado} onClick={() => void guardar()}>
        {ocupado ? <Loader2 className="size-5 animate-spin" /> : "GUARDAR EXPERIENCIA"}
      </Button>

      {borrador.id ? (
        <MediosExperiencia experienciaId={borrador.id} medios={experiencia?.medios ?? []} />
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Guarda la experiencia para poder agregar fotos y videos.
        </p>
      )}
    </div>
  );
}

function PuntoSalida({
  borrador,
  cambiar,
}: {
  borrador: Borrador;
  cambiar: (c: Partial<Borrador>) => void;
}) {
  const buscar = useServerFn(buscarLugares);
  const [texto, setTexto] = useState("");
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);

  async function buscarPunto() {
    setBuscando(true);
    try {
      setLugares(await buscar({ data: { texto } }));
    } catch {
      setLugares([]);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>Punto de salida o encuentro</Label>
      <p className="text-xs text-muted-foreground">
        Puede ser distinto a la dirección de tu negocio.
      </p>
      <Input
        value={borrador.punto_salida}
        onChange={(e) => cambiar({ punto_salida: e.target.value })}
        placeholder="Muelle de Chuburná Puerto"
        className="h-13 text-base"
      />
      <div className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar el punto en el mapa"
          className="h-12"
        />
        <Button type="button" variant="secondary" className="h-12" onClick={() => void buscarPunto()}>
          {buscando ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
        </Button>
      </div>
      {lugares.length ? (
        <ul className="space-y-1">
          {lugares.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  cambiar({
                    salida_latitud: l.latitud,
                    salida_longitud: l.longitud,
                    punto_salida: borrador.punto_salida || l.nombre,
                  });
                  setLugares([]);
                }}
                className="w-full rounded-xl bg-secondary px-3 py-2 text-left text-sm"
              >
                <span className="font-semibold">{l.nombre}</span>
                <span className="block text-xs text-muted-foreground">{l.direccion}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {borrador.salida_latitud != null && borrador.salida_longitud != null ? (
        <MapaPunto
          lat={borrador.salida_latitud}
          lng={borrador.salida_longitud}
          altura="h-44"
          onMover={(lat, lng) => cambiar({ salida_latitud: lat, salida_longitud: lng })}
        />
      ) : null}
    </div>
  );
}

function Extras({
  borrador,
  cambiar,
}: {
  borrador: Borrador;
  cambiar: (c: Partial<Borrador>) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");

  return (
    <div className="space-y-2">
      <Label>Extras opcionales</Label>
      <ul className="space-y-2">
        {borrador.extras.map((x, i) => (
          <li key={`${x.nombre}-${i}`} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
            <span className="flex-1 text-sm font-semibold">
              {x.nombre}
              {x.precio ? ` · $${x.precio}` : ""}
            </span>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={x.disponible}
                onChange={(e) =>
                  cambiar({
                    extras: borrador.extras.map((y, j) =>
                      j === i ? { ...y, disponible: e.target.checked } : y,
                    ),
                  })
                }
              />
              Disponible
            </label>
            <button
              type="button"
              aria-label={`Quitar ${x.nombre}`}
              onClick={() => cambiar({ extras: borrador.extras.filter((_, j) => j !== i) })}
              className="text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Kayak"
          className="h-12"
          aria-label="Nombre del extra"
        />
        <Input
          value={precio}
          onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ""))}
          placeholder="$"
          className="h-12 w-24"
          inputMode="numeric"
          aria-label="Precio del extra"
        />
        <Button
          type="button"
          variant="secondary"
          className="h-12"
          onClick={() => {
            if (!nombre.trim()) return;
            cambiar({
              extras: [
                ...borrador.extras,
                { nombre: nombre.trim(), precio: Number(precio) || null, disponible: true },
              ],
            });
            setNombre("");
            setPrecio("");
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MediosExperiencia({
  experienciaId,
  medios,
}: {
  experienciaId: string;
  medios: ExperienciaRow["medios"];
}) {
  const qc = useQueryClient();
  const agregar = useServerFn(agregarMedioExperiencia);
  const borrar = useServerFn(borrarMedioExperiencia);
  const portada = useServerFn(portadaExperiencia);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(archivo: File, tipo: "image" | "video") {
    setError(null);
    setSubiendo(true);
    try {
      const r = await subirMedio(archivo, tipo);
      await agregar({
        data: {
          experiencia_id: experienciaId,
          tipo,
          public_id: r.public_id,
          secure_url: r.secure_url,
          duration: r.duration ?? null,
          format: r.format ?? null,
          bytes: r.bytes ?? null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mis-experiencias"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos subir el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <Label>Fotos y videos de esta experiencia</Label>
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
              alt="Contenido de la experiencia"
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
                    await portada({ data: { id: m.id, experiencia_id: experienciaId } });
                    await qc.invalidateQueries({ queryKey: ["mis-experiencias"] });
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
                  await qc.invalidateQueries({ queryKey: ["mis-experiencias"] });
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
