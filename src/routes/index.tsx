import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import logoAsset from "@/assets/logo-tomar-el-fresco.png.asset.json";
import { MarcoPublico } from "@/components/publico-marco";
import { TarjetaNegocioVista } from "@/components/tarjeta-negocio";
import { SelectorUbicacion } from "@/components/ubicacion-selector";
import { buscarNegocios, type TarjetaNegocio } from "@/lib/publico.functions";
import { CATEGORIAS, ubicacionGuardada, zonaGuardada } from "@/lib/publico";
import { TIPO_COMER } from "@/lib/comer";
import { TIPO_CONOCER } from "@/lib/conocer";
import { TIPO_HOSPEDAJE } from "@/lib/hospedaje";

import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tomar el Fresco en Yucatán — Encuentra y pide cerca de ti" },
      {
        name: "description",
        content:
          "Encuentra dónde comer, qué conocer, dónde hospedarte, cómo moverte y dónde divertirte en Yucatán. Sin registro: busca, encuentra y contacta por WhatsApp.",
      },
      { property: "og:title", content: "Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content:
          "Negocios y experiencias de Yucatán cerca de ti. Contacta o haz tu pedido por WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [municipio, setMunicipio] = useState("");
  const [zona, setZona] = useState("");
  const [cercanos, setCercanos] = useState<TarjetaNegocio[] | null>(null);

  useEffect(() => {
    setUbicacion(ubicacionGuardada());
    setZona(zonaGuardada());
  }, []);

  useEffect(() => {
    let vivo = true;
    void buscarNegocios({
      data: {
        texto: "",
        municipio: municipio || null,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
      },
    }).then((r) => {
      if (vivo) setCercanos(r.slice(0, 6));
    });
    return () => {
      vivo = false;
    };
  }, [ubicacion, municipio]);

  function irABuscar(extra?: { categoria?: string; texto?: string }) {
    void navigate({
      to: "/buscar",
      search: {
        q: extra?.texto ?? texto,
        categoria: extra?.categoria ?? "",
        municipio,
      },
    });
  }

  return (
    <MarcoPublico>
      <section className="space-y-5">
        <div className="text-center">
          <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-marca-negro p-3 shadow-sm">
            <img
              src={logoAsset.url}
              alt="Tomar el Fresco en Yucatán"
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold">¿Qué quieres hacer?</h1>
          <p className="text-sm text-muted-foreground">Tomar el Fresco en Yucatán</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            irABuscar();
          }}
          className="flex gap-2"
        >
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="h-14 text-base"
          />
          <Button type="submit" className="h-14 px-5" aria-label="Buscar">
            <Search className="size-5" />
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIAS.map((c) =>
            c.tipo === TIPO_COMER ? (
              <Link
                key={c.clave}
                to="/comer"
                search={{ q: "", comida: "", municipio: "" }}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left text-base font-bold shadow-sm"
              >
                <span className="text-2xl">{c.emoji}</span>
                {c.clave}
              </Link>
            ) : c.tipo === TIPO_CONOCER ? (
              <Link
                key={c.clave}
                to="/conocer"
                search={{ q: "", categoria: "", municipio: "" }}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left text-base font-bold shadow-sm"
              >
                <span className="text-2xl">{c.emoji}</span>
                {c.clave}
              </Link>
            ) : c.tipo === TIPO_HOSPEDAJE ? (
              <Link
                key={c.clave}
                to="/hospedaje"
                search={{ q: "", municipio: "", entrada: "", salida: "", huespedes: 2 }}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left text-base font-bold shadow-sm"
              >
                <span className="text-2xl">{c.emoji}</span>
                {c.clave}
              </Link>
            ) : (


            <button
              key={c.clave}
              onClick={() => irABuscar({ categoria: c.tipo, texto: "" })}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left text-base font-bold shadow-sm"
            >
              <span className="text-2xl">{c.emoji}</span>
              {c.clave}
            </button>
            ),
          )}
        </div>

        <div className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">Para mostrarte lo más cercano</p>
          <SelectorUbicacion
            ubicacion={ubicacion}
            zona={zona}
            onCambio={(ubi, nombre) => {
              setUbicacion(ubi);
              setZona(nombre);
            }}
          />
          <div>
            <label htmlFor="mun" className="text-sm text-muted-foreground">
              O elige un municipio
            </label>
            <select
              id="mun"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="mt-1 h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
            >
              <option value="">Todo Yucatán</option>
              {MUNICIPIOS_YUCATAN.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {cercanos === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : cercanos.length ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">
              {ubicacion ? "Cerca de ti" : "Descubre en Yucatán"}
            </h2>
            {cercanos.map((n) => (
              <TarjetaNegocioVista key={n.id} negocio={n} ubicacion={ubicacion} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no hay negocios publicados en esta zona.
          </p>
        )}
      </section>
    </MarcoPublico>
  );
}
