import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { TarjetaNegocioVista } from "@/components/tarjeta-negocio";
import { SelectorUbicacion } from "@/components/ubicacion-selector";
import { buscarNegocios, type TarjetaNegocio } from "@/lib/publico.functions";
import { ubicacionGuardada, zonaGuardada } from "@/lib/publico";
import { TIPO_COMER, TIPOS_COMIDA } from "@/lib/comer";
import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Busqueda = { q: string; comida: string; municipio: string };

export const Route = createFileRoute("/comer")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    comida: typeof s["comida"] === "string" ? s["comida"] : "",
    municipio: typeof s["municipio"] === "string" ? s["municipio"] : "",
  }),
  head: () => ({
    meta: [
      { title: "¿Qué se te antoja hoy? — Comer en Yucatán | Tomar el Fresco" },
      {
        name: "description",
        content:
          "Descubre dónde comer cerca de ti en Yucatán: comida yucateca, tacos, pizzas, mariscos, postres y más. Arma tu pedido y continúa por WhatsApp.",
      },
      { property: "og:title", content: "¿Qué se te antoja hoy? — Comer en Yucatán" },
      {
        property: "og:description",
        content: "Restaurantes, fondas y cocinas cerca de ti, ordenados por cercanía.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Comer,
});

function Comer() {
  const navigate = useNavigate();
  const busqueda = Route.useSearch();
  const [texto, setTexto] = useState(busqueda.q);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [zona, setZona] = useState("");
  const [resultados, setResultados] = useState<TarjetaNegocio[] | null>(null);

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
        categoria: TIPO_COMER,
        comida: busqueda.comida || null,
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
  }, [busqueda.q, busqueda.comida, busqueda.municipio, ubicacion]);

  function actualizar(cambios: Partial<Busqueda>) {
    void navigate({ to: "/comer", search: { ...busqueda, ...cambios } });
  }

  return (
    <MarcoPublico>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">¿Qué se te antoja hoy?</h1>
          <p className="text-sm text-muted-foreground">
            Encuentra dónde comer cerca de ti y arma tu pedido.
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
            placeholder="Cochinita, pizza, tacos…"
            className="h-13 text-base"
          />
          <Button type="submit" className="h-13 px-5" aria-label="Buscar comida">
            <Search className="size-5" />
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <Chip
            activo={!busqueda.comida}
            emoji="✨"
            texto="Todo"
            onClick={() => actualizar({ comida: "" })}
          />
          {TIPOS_COMIDA.map((t) => (
            <Chip
              key={t.clave}
              activo={busqueda.comida === t.clave}
              emoji={t.emoji}
              texto={t.nombre}
              onClick={() => actualizar({ comida: t.clave })}
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
            <p className="text-base font-semibold">No encontramos lugares para comer</p>
            <p className="text-sm text-muted-foreground">Prueba con otro antojo u otra zona.</p>
            <Button variant="secondary" onClick={() => actualizar({ q: "", comida: "" })}>
              Ver todo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {resultados.length} {resultados.length === 1 ? "lugar" : "lugares"} para comer
            </p>
            {resultados.map((n) => (
              <TarjetaNegocioVista key={n.id} negocio={n} ubicacion={ubicacion} />
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
