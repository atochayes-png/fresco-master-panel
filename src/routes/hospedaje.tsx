import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BedDouble, Loader2, MapPin, Search, Users } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { SelectorUbicacion } from "@/components/ubicacion-selector";
import { buscarAlojamientos, type TarjetaAlojamiento } from "@/lib/hospedaje.publico.functions";
import {
  hoyISO,
  nombreTipoAlojamiento,
  textoDisponibilidad,
  textoPrecioNoche,
} from "@/lib/hospedaje";
import { distanciaKm, pesos, textoDistancia, ubicacionGuardada, zonaGuardada } from "@/lib/publico";
import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Busqueda = { q: string; municipio: string; entrada: string; salida: string; huespedes: number };

export const Route = createFileRoute("/hospedaje")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    municipio: typeof s["municipio"] === "string" ? s["municipio"] : "",
    entrada: typeof s["entrada"] === "string" ? s["entrada"] : "",
    salida: typeof s["salida"] === "string" ? s["salida"] : "",
    huespedes: Number(s["huespedes"]) > 0 ? Number(s["huespedes"]) : 2,
  }),
  head: () => ({
    meta: [
      { title: "¿Dónde te quedas? — Hospedaje en Yucatán | Tomar el Fresco" },
      {
        name: "description",
        content:
          "Encuentra hoteles, departamentos y cabañas en Yucatán. Consulta precio por noche y solicita tu hospedaje directamente por WhatsApp.",
      },
      { property: "og:title", content: "Hospedaje en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Alojamientos cerca de ti con fotos, capacidad y precio por noche.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hospedaje,
});

function Hospedaje() {
  const navigate = useNavigate();
  const busqueda = Route.useSearch();
  const [texto, setTexto] = useState(busqueda.q);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [zona, setZona] = useState("");
  const [resultados, setResultados] = useState<TarjetaAlojamiento[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    setUbicacion(ubicacionGuardada());
    setZona(zonaGuardada());
  }, []);

  useEffect(() => {
    setTexto(busqueda.q);
  }, [busqueda.q]);

  useEffect(() => {
    if (busqueda.entrada && busqueda.salida && busqueda.salida <= busqueda.entrada) {
      setAviso("La fecha de salida debe ser posterior a la de entrada");
      return;
    }
    setAviso(null);
    let vivo = true;
    setResultados(null);
    void buscarAlojamientos({
      data: {
        texto: busqueda.q,
        municipio: busqueda.municipio || null,
        entrada: busqueda.entrada || null,
        salida: busqueda.salida || null,
        huespedes: busqueda.huespedes,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
      },
    }).then((r) => {
      if (vivo) setResultados(r);
    });
    return () => {
      vivo = false;
    };
  }, [
    busqueda.q,
    busqueda.municipio,
    busqueda.entrada,
    busqueda.salida,
    busqueda.huespedes,
    ubicacion,
  ]);

  function actualizar(cambios: Partial<Busqueda>) {
    void navigate({ to: "/hospedaje", search: { ...busqueda, ...cambios } });
  }

  return (
    <MarcoPublico>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">¿Dónde te quedas?</h1>
          <p className="text-sm text-muted-foreground">
            Hoteles, departamentos, cabañas y casas en Yucatán.
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
            placeholder="Progreso, frente al mar, cabaña…"
            className="h-13 text-base"
          />
          <Button type="submit" className="h-13 px-5" aria-label="Buscar hospedaje">
            <Search className="size-5" />
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="entrada">Entrada</Label>
            <Input
              id="entrada"
              type="date"
              min={hoyISO()}
              value={busqueda.entrada}
              onChange={(e) => actualizar({ entrada: e.target.value })}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="salida">Salida</Label>
            <Input
              id="salida"
              type="date"
              min={busqueda.entrada || hoyISO()}
              value={busqueda.salida}
              onChange={(e) => actualizar({ salida: e.target.value })}
              className="h-13 text-base"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="huespedes">Huéspedes</Label>
          <Input
            id="huespedes"
            inputMode="numeric"
            value={String(busqueda.huespedes)}
            onChange={(e) => actualizar({ huespedes: Number(e.target.value.replace(/\D/g, "")) || 1 })}
            className="h-13 text-base"
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

        {aviso ? <p className="text-sm font-semibold text-destructive">{aviso}</p> : null}

        {resultados === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : resultados.length === 0 ? (
          <div className="space-y-3 py-12 text-center">
            <p className="text-base font-semibold">No encontramos alojamientos</p>
            <p className="text-sm text-muted-foreground">
              Prueba con otras fechas, otra zona o menos huéspedes.
            </p>
            <Button variant="secondary" onClick={() => actualizar({ q: "", municipio: "" })}>
              Ver todo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {resultados.length} {resultados.length === 1 ? "alojamiento" : "alojamientos"}
            </p>
            {resultados.map((a) => (
              <TarjetaAlojamientoVista
                key={a.id}
                alojamiento={a}
                ubicacion={ubicacion}
                entrada={busqueda.entrada}
                salida={busqueda.salida}
                huespedes={busqueda.huespedes}
              />
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

function TarjetaAlojamientoVista({
  alojamiento,
  ubicacion,
  entrada,
  salida,
  huespedes,
}: {
  alojamiento: TarjetaAlojamiento;
  ubicacion: { lat: number; lng: number } | null;
  entrada: string;
  salida: string;
  huespedes: number;
}) {
  const km = distanciaKm(ubicacion, alojamiento.latitud, alojamiento.longitud);
  return (
    <Link
      to="/alojamiento/$id"
      params={{ id: alojamiento.id }}
      search={{ entrada, salida, huespedes }}
      className="block overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
    >
      {alojamiento.foto ? (
        <img
          src={alojamiento.foto}
          alt={alojamiento.nombre}
          loading="lazy"
          decoding="async"
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-secondary">
          <BedDouble className="size-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1 p-4">
        <h2 className="text-lg font-bold leading-tight">{alojamiento.nombre}</h2>
        <p className="text-sm text-muted-foreground">{alojamiento.negocio}</p>
        <p className="text-sm">{nombreTipoAlojamiento(alojamiento.tipo)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-4" /> Hasta {alojamiento.capacidad} personas
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-4" /> {alojamiento.municipio}
            {km != null ? ` · ${textoDistancia(km)}` : ""}
          </span>
        </div>
        <p className="text-base font-bold text-primary">
          {textoPrecioNoche(alojamiento.precio, alojamiento.precio_tipo)}
        </p>
        {alojamiento.total_estimado != null && alojamiento.noches ? (
          <p className="text-sm">
            {alojamiento.noches} {alojamiento.noches === 1 ? "noche" : "noches"} ·{" "}
            <span className="font-semibold">{pesos(alojamiento.total_estimado)} estimado</span>
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {textoDisponibilidad(alojamiento.modo_disponibilidad)}
        </p>
      </div>
    </Link>
  );
}
