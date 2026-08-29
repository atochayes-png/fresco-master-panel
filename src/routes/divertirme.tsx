import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Loader2, MapPin, PartyPopper, Search } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { SelectorUbicacion } from "@/components/ubicacion-selector";
import { buscarLugares, type TarjetaLugar } from "@/lib/divertirme.publico.functions";
import {
  SUBCATEGORIAS_DIVERTIRME,
  fechaLargaD,
  hora12,
  nombreSubcategoria,
  textoReserva,
  textoRestriccion,
} from "@/lib/divertirme";
import { distanciaKm, textoDistancia, ubicacionGuardada, zonaGuardada } from "@/lib/publico";
import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Busqueda = { q: string; sub: string; municipio: string };

export const Route = createFileRoute("/divertirme")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    sub: typeof s["sub"] === "string" ? s["sub"] : "",
    municipio: typeof s["municipio"] === "string" ? s["municipio"] : "",
  }),
  head: () => ({
    meta: [
      { title: "¿Qué plan traes hoy? — Antros, bares y música en vivo en Yucatán" },
      {
        name: "description",
        content:
          "Descubre antros, bares y cantinas, música en vivo, karaoke, billar y planes familiares cerca de ti en Yucatán. Pregunta directo por WhatsApp.",
      },
      { property: "og:title", content: "¿Qué plan traes hoy? — Diversión en Yucatán" },
      {
        property: "og:description",
        content: "Lugares para salir cerca de ti: ambiente, horarios, cover y eventos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Divertirme,
});

function Divertirme() {
  const navigate = useNavigate();
  const busqueda = Route.useSearch();
  const [texto, setTexto] = useState(busqueda.q);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [zona, setZona] = useState("");
  const [resultados, setResultados] = useState<TarjetaLugar[] | null>(null);

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
    void buscarLugares({
      data: {
        texto: busqueda.q,
        subcategoria: busqueda.sub || null,
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
  }, [busqueda.q, busqueda.sub, busqueda.municipio, ubicacion]);

  function actualizar(cambios: Partial<Busqueda>) {
    void navigate({ to: "/divertirme", search: { ...busqueda, ...cambios } });
  }

  return (
    <MarcoPublico>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">¿Qué plan traes hoy?</h1>
          <p className="text-sm text-muted-foreground">
            Antros, bares, música en vivo y planes para pasarla bien en Yucatán.
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
            placeholder="Música en vivo, cantina, karaoke, terraza…"
            className="h-13 text-base"
          />
          <Button type="submit" className="h-13 px-5" aria-label="Buscar lugares">
            <Search className="size-5" />
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <Chip
            activo={!busqueda.sub}
            emoji="✨"
            texto="Ver todo"
            onClick={() => actualizar({ sub: "" })}
          />
          {SUBCATEGORIAS_DIVERTIRME.map((s) => (
            <Chip
              key={s.clave}
              activo={busqueda.sub === s.clave}
              emoji={s.emoji}
              texto={s.nombre}
              onClick={() => actualizar({ sub: s.clave })}
            />
          ))}
        </div>

        <SelectorUbicacion
          ubicacion={ubicacion}
          zona={zona}
          onCambio={(ubi, nombre) => {
            setUbicacion(ubi);
            setZona(nombre);
          }}
        />

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

        {resultados === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : resultados.length === 0 ? (
          <div className="py-14 text-center">
            <PartyPopper className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">Todavía no hay lugares con ese plan</p>
            <p className="text-sm text-muted-foreground">Prueba con otra categoría o municipio.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resultados.map((l) => {
              const km = distanciaKm(ubicacion, l.latitud, l.longitud);
              const edad = textoRestriccion(l.restriccion_edad);
              return (
                <Link
                  key={l.id}
                  to="/lugar/$id"
                  params={{ id: l.id }}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
                >
                  {l.foto ? (
                    <img
                      src={l.foto}
                      alt={`Ambiente de ${l.nombre}`}
                      loading="lazy"
                      decoding="async"
                      className="size-24 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl">
                      🎉
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-bold">{l.nombre}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {l.subcategorias.map(nombreSubcategoria).join(" · ") || l.municipio}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {textoDistancia(km) ?? l.municipio}
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {edad ? <span className="font-semibold">🔞 {edad}</span> : null}
                      {l.cover_texto ? <span className="font-semibold">💰 {l.cover_texto}</span> : null}
                    </div>
                    {l.evento ? (
                      <p className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <Clock className="size-3" />
                        {l.evento.nombre}
                        {l.evento.fecha ? ` · ${fechaLargaD(l.evento.fecha)}` : ""}
                        {l.evento.hora ? ` ${hora12(l.evento.hora)}` : ""}
                      </p>
                    ) : textoReserva(l.reserva_recomendada) ? (
                      <p className="text-xs text-muted-foreground">
                        {textoReserva(l.reserva_recomendada)}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center text-xs font-semibold ${
        activo ? "border-primary bg-primary/10" : "border-border bg-card"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      {texto}
    </button>
  );
}
