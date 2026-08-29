import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Camera, Loader2, MapPin, Search } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { TarjetaNegocioVista } from "@/components/tarjeta-negocio";
import { MapaResultados } from "@/components/mapa-resultados";
import { SelectorUbicacion } from "@/components/ubicacion-selector";
import { buscarNegocios, type TarjetaNegocio } from "@/lib/publico.functions";
import {
  CATEGORIAS,
  distanciaKm,
  estaAbierto,
  textoDistancia,
  ubicacionGuardada,
  zonaGuardada,
} from "@/lib/publico";
import { TIPO_COMER } from "@/lib/comer";
import { TIPO_CONOCER } from "@/lib/conocer";
import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Busqueda = { q: string; categoria: string; municipio: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    categoria: typeof s["categoria"] === "string" ? s["categoria"] : "",
    municipio: typeof s["municipio"] === "string" ? s["municipio"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Buscar negocios y experiencias en Yucatán — Tomar el Fresco" },
      {
        name: "description",
        content:
          "Busca dónde comer, hospedarte, moverte o divertirte en Yucatán y encuentra lo más cercano a tu ubicación.",
      },
      { property: "og:title", content: "Buscar en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Resultados ordenados por relevancia y cercanía en todo Yucatán.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Buscar,
});

function Buscar() {
  const navigate = useNavigate();
  const busqueda = Route.useSearch();
  const [texto, setTexto] = useState(busqueda.q);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [zona, setZona] = useState("");
  const [resultados, setResultados] = useState<TarjetaNegocio[] | null>(null);
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

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
    void buscarNegocios({
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
    void navigate({ to: "/buscar", search: { ...busqueda, ...cambios } });
  }

  const conMapa = (resultados ?? []).filter((n) => n.latitud != null && n.longitud != null);
  const activo = (resultados ?? []).find((n) => n.id === seleccionado) ?? null;

  return (
    <MarcoPublico>
      <div className="space-y-4">
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
            placeholder="¿Qué estás buscando?"
            className="h-13 text-base"
          />
          <Button type="submit" className="h-13 px-5" aria-label="Buscar">
            <Search className="size-5" />
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Chip
            activo={!busqueda.categoria}
            emoji="✨"
            texto="Todo"
            onClick={() => actualizar({ categoria: "" })}
          />
          {CATEGORIAS.map((c) => (
            <Chip
              key={c.clave}
              activo={busqueda.categoria === c.tipo}
              emoji={c.emoji}
              texto={c.clave}
              onClick={() =>
                c.tipo === TIPO_COMER
                  ? void navigate({
                      to: "/comer",
                      search: { q: busqueda.q, comida: "", municipio: busqueda.municipio },
                    })
                  : c.tipo === TIPO_CONOCER
                    ? void navigate({
                        to: "/conocer",
                        search: { q: busqueda.q, categoria: "", municipio: busqueda.municipio },
                      })
                    : actualizar({ categoria: c.tipo })
              }
            />
          ))}
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
            <p className="text-base font-semibold">No encontramos resultados</p>
            <p className="text-sm text-muted-foreground">
              Prueba con otra palabra o revisa lo más cercano a ti.
            </p>
            <Button variant="secondary" onClick={() => actualizar({ q: "", categoria: "" })}>
              Ver todo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
              </p>
              <div className="flex rounded-full bg-secondary p-1">
                {(["lista", "mapa"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVista(v)}
                    disabled={v === "mapa" && conMapa.length === 0}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase disabled:opacity-40 ${
                      vista === v
                        ? "bg-primary text-primary-foreground"
                        : "text-secondary-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {vista === "lista" ? (
              resultados.map((n) => (
                <TarjetaNegocioVista key={n.id} negocio={n} ubicacion={ubicacion} />
              ))
            ) : (
              <div className="space-y-3">
                <ClientOnly
                  fallback={
                    <div className="flex h-[26rem] items-center justify-center rounded-3xl bg-secondary">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <MapaResultados
                    negocios={conMapa}
                    ubicacion={ubicacion}
                    seleccionado={seleccionado}
                    onSeleccionar={setSeleccionado}
                  />
                </ClientOnly>
                {activo ? (
                  <TarjetaMapa negocio={activo} ubicacion={ubicacion} />
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    Toca un punto rosa para ver el negocio.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MarcoPublico>
  );
}

function TarjetaMapa({
  negocio,
  ubicacion,
}: {
  negocio: TarjetaNegocio;
  ubicacion: { lat: number; lng: number } | null;
}) {
  const km = distanciaKm(ubicacion, negocio.latitud, negocio.longitud);
  const abierto = estaAbierto(negocio.horarios);
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3 shadow-sm">
      {negocio.foto ? (
        <img
          src={negocio.foto}
          alt={`Foto de ${negocio.nombre}`}
          className="size-20 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex size-20 items-center justify-center rounded-2xl bg-secondary">
          <Camera className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{negocio.nombre}</p>
        <p className="truncate text-xs text-muted-foreground">{negocio.tipo}</p>
        <p className="mt-1 flex items-center gap-2 text-xs font-semibold">
          {km != null ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {textoDistancia(km)}
            </span>
          ) : null}
          {abierto === null ? null : (
            <span className={abierto ? "text-primary" : "text-muted-foreground"}>
              {abierto ? "Abierto" : "Cerrado"}
            </span>
          )}
        </p>
      </div>
      <Button asChild className="h-11 px-5 font-semibold">
        <Link to="/negocio/$id" params={{ id: negocio.id }}>
          VER
        </Link>
      </Button>
    </div>
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
