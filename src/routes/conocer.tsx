import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Compass, Loader2, MapPin, Search, Users } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { SelectorUbicacion } from "@/components/ubicacion-selector";
import {
  buscarExperiencias,
  type TarjetaExperiencia,
} from "@/lib/conocer.publico.functions";
import {
  CATEGORIAS_CONOCER,
  emojiCategoriaConocer,
  nombreCategoriaConocer,
  textoPrecio,
} from "@/lib/conocer";
import { distanciaKm, textoDistancia, ubicacionGuardada, zonaGuardada } from "@/lib/publico";
import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Busqueda = { q: string; categoria: string; municipio: string };

export const Route = createFileRoute("/conocer")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    categoria: typeof s["categoria"] === "string" ? s["categoria"] : "",
    municipio: typeof s["municipio"] === "string" ? s["municipio"] : "",
  }),
  head: () => ({
    meta: [
      { title: "¿Qué quieres conocer? — Tours y experiencias en Yucatán | Tomar el Fresco" },
      {
        name: "description",
        content:
          "Descubre paseos en lancha, cenotes, zonas arqueológicas, naturaleza y pesca en Yucatán. Solicita tu reservación y continúa por WhatsApp con el prestador.",
      },
      { property: "og:title", content: "¿Qué quieres conocer? — Experiencias en Yucatán" },
      {
        property: "og:description",
        content: "Tours y paseos cerca de ti, con fotos, precios y punto de salida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conocer,
});

function Conocer() {
  const navigate = useNavigate();
  const busqueda = Route.useSearch();
  const [texto, setTexto] = useState(busqueda.q);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [zona, setZona] = useState("");
  const [resultados, setResultados] = useState<TarjetaExperiencia[] | null>(null);

  useEffect(() => {
    setUbicacion(ubicacionGuardada());
    setZona(zonaGuardada());
  }, []);

  useEffect(() => {
    setTexto(busqueda.q);
  }, [busqueda.q]);

  useEffect(() => {
    let vivo = true;
    setResultados(null);
    void buscarExperiencias({
      data: {
        texto: busqueda.q,
        categoria: busqueda.categoria || null,
        municipio: busqueda.municipio || null,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
      },
    }).then((r) => {
      if (vivo) setResultados(r);
    });
    return () => {
      vivo = false;
    };
  }, [busqueda.q, busqueda.categoria, busqueda.municipio, ubicacion]);

  function actualizar(cambios: Partial<Busqueda>) {
    void navigate({ to: "/conocer", search: { ...busqueda, ...cambios } });
  }

  return (
    <MarcoPublico>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">¿Qué quieres conocer?</h1>
          <p className="text-sm text-muted-foreground">
            Paseos, cenotes, cultura y naturaleza en Yucatán.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            actualizar({ q: texto });
          }}
          className="flex gap-2"
        >
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Isla Columpios, cenote, pesca…"
            className="h-13 text-base"
          />
          <Button type="submit" className="h-13 px-5" aria-label="Buscar experiencias">
            <Search className="size-5" />
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CATEGORIAS_CONOCER.map((c) => (
            <Chip
              key={c.clave}
              activo={busqueda.categoria === c.clave}
              emoji={c.emoji}
              texto={c.nombre}
              onClick={() => actualizar({ categoria: c.clave })}
            />
          ))}
          <Chip
            activo={!busqueda.categoria}
            emoji="🗺️"
            texto="Ver todo"
            onClick={() => actualizar({ categoria: "" })}
          />
        </div>

        <select
          value={busqueda.municipio}
          onChange={(e) => actualizar({ municipio: e.target.value })}
          aria-label="Municipio"
          className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">Todo Yucatán</option>
          {MUNICIPIOS_YUCATAN.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <SelectorUbicacion
          ubicacion={ubicacion}
          zona={zona}
          onCambio={(ubi, nombre) => {
            setUbicacion(ubi);
            setZona(nombre);
          }}
        />

        {resultados === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : resultados.length === 0 ? (
          <div className="space-y-3 py-12 text-center">
            <p className="text-base font-semibold">No encontramos experiencias</p>
            <p className="text-sm text-muted-foreground">Prueba con otro lugar u otra categoría.</p>
            <Button variant="secondary" onClick={() => actualizar({ q: "", categoria: "" })}>
              Ver todo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {resultados.length} {resultados.length === 1 ? "experiencia" : "experiencias"}
            </p>
            {resultados.map((e) => (
              <TarjetaExperienciaVista key={e.id} experiencia={e} ubicacion={ubicacion} />
            ))}
          </div>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          ¿Buscas algo más?{" "}
          <Link
            to="/buscar"
            search={{ q: "", categoria: "", municipio: "" }}
            className="font-semibold text-primary"
          >
            Ver todas las categorías
          </Link>
        </p>
      </div>
    </MarcoPublico>
  );
}

export function TarjetaExperienciaVista({
  experiencia,
  ubicacion,
}: {
  experiencia: TarjetaExperiencia;
  ubicacion: { lat: number; lng: number } | null;
}) {
  const km = distanciaKm(ubicacion, experiencia.latitud, experiencia.longitud);
  return (
    <Link
      to="/experiencia/$id"
      params={{ id: experiencia.id }}
      className="block overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
    >
      {experiencia.foto ? (
        <img
          src={experiencia.foto}
          alt={experiencia.nombre}
          loading="lazy"
          decoding="async"
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-secondary">
          <Compass className="size-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1 p-4">
        <h2 className="text-lg font-bold leading-tight">{experiencia.nombre}</h2>
        <p className="text-sm text-muted-foreground">{experiencia.negocio}</p>
        <p className="text-sm">
          {emojiCategoriaConocer(experiencia.categoria)}{" "}
          {nombreCategoriaConocer(experiencia.categoria)}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {experiencia.duracion ? (
            <span className="flex items-center gap-1">
              <Clock className="size-4" /> {experiencia.duracion}
            </span>
          ) : null}
          {experiencia.capacidad ? (
            <span className="flex items-center gap-1">
              <Users className="size-4" /> Hasta {experiencia.capacidad} personas
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <MapPin className="size-4" /> {experiencia.punto_salida ?? experiencia.municipio}
            {km != null ? ` · ${textoDistancia(km)}` : ""}
          </span>
        </div>
        <p className="text-base font-bold text-primary">
          {textoPrecio(experiencia.precio, experiencia.precio_tipo)}
        </p>
      </div>
    </Link>
  );
}

function Chip({
  activo,
  emoji,
  texto,
  onClick,
}: {
  activo: boolean;
  emoji: string;
  texto: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold leading-tight ${
        activo ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      }`}
    >
      <span className="text-lg">{emoji}</span>
      <span className="w-full text-center">{texto}</span>
    </button>
  );
}
