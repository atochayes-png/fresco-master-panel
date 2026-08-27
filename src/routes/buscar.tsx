import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { TarjetaNegocioVista } from "@/components/tarjeta-negocio";
import { buscarNegocios, type TarjetaNegocio } from "@/lib/publico.functions";
import { CATEGORIAS, pedirUbicacion, ubicacionGuardada } from "@/lib/publico";
import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Busqueda = { q: string; categoria: string; municipio: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: typeof s['q'] === "string" ? s['q'] : "",
    categoria: typeof s['categoria'] === "string" ? s['categoria'] : "",
    municipio: typeof s['municipio'] === "string" ? s['municipio'] : "",
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
  const [resultados, setResultados] = useState<TarjetaNegocio[] | null>(null);

  useEffect(() => {
    setUbicacion(ubicacionGuardada());
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

  async function usarUbicacion() {
    const ubi = await pedirUbicacion();
    if (ubi) setUbicacion(ubi);
  }

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

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip
            activo={!busqueda.categoria}
            texto="Todo"
            onClick={() => actualizar({ categoria: "" })}
          />
          {CATEGORIAS.map((c) => (
            <Chip
              key={c.clave}
              activo={busqueda.categoria === c.tipo}
              texto={`${c.emoji} ${c.clave}`}
              onClick={() => actualizar({ categoria: c.tipo })}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={busqueda.municipio}
            onChange={(e) => actualizar({ municipio: e.target.value })}
            aria-label="Municipio"
            className="h-12 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Todo Yucatán</option>
            {MUNICIPIOS_YUCATAN.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Button
            variant={ubicacion ? "secondary" : "outline"}
            onClick={usarUbicacion}
            className="h-12"
          >
            <MapPin className="size-4" />
            {ubicacion ? "Cerca de mí" : "Mi ubicación"}
          </Button>
        </div>

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
            <p className="text-sm text-muted-foreground">
              {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
            </p>
            {resultados.map((n) => (
              <TarjetaNegocioVista key={n.id} negocio={n} ubicacion={ubicacion} />
            ))}
          </div>
        )}
      </div>
    </MarcoPublico>
  );
}

function Chip({ activo, texto, onClick }: { activo: boolean; texto: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
        activo ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {texto}
    </button>
  );
}
