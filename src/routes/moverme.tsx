import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Car, Loader2, MapPin, Search, Users } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { SelectorUbicacion } from "@/components/ubicacion-selector";
import { buscarVehiculos, type TarjetaVehiculo } from "@/lib/moverme.publico.functions";
import {
  LUGARES_ENTREGA,
  hoyISO,
  nombreTransmision,
  textoDisponibilidadRenta,
  textoPrecioDia,
} from "@/lib/moverme";
import { distanciaKm, pesos, textoDistancia, ubicacionGuardada, zonaGuardada } from "@/lib/publico";
import { MUNICIPIOS_YUCATAN } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Busqueda = {
  q: string;
  municipio: string;
  inicio: string;
  hora_inicio: string;
  fin: string;
  hora_fin: string;
  pasajeros: number;
  entrega: string;
};

export const Route = createFileRoute("/moverme")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    municipio: typeof s["municipio"] === "string" ? s["municipio"] : "",
    inicio: typeof s["inicio"] === "string" ? s["inicio"] : "",
    hora_inicio: typeof s["hora_inicio"] === "string" ? s["hora_inicio"] : "10:00",
    fin: typeof s["fin"] === "string" ? s["fin"] : "",
    hora_fin: typeof s["hora_fin"] === "string" ? s["hora_fin"] : "10:00",
    pasajeros: Number(s["pasajeros"]) > 0 ? Number(s["pasajeros"]) : 0,
    entrega: typeof s["entrega"] === "string" ? s["entrega"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Renta de autos en Yucatán — Tomar el Fresco" },
      {
        name: "description",
        content:
          "Compara autos de renta en Yucatán: pasajeros, transmisión, precio por día y requisitos. Solicita tu renta directo por WhatsApp.",
      },
      { property: "og:title", content: "Renta de autos en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Rentadoras locales con fotos, precio por día y entrega en sucursal o aeropuerto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Moverme,
});

function Moverme() {
  const navigate = useNavigate();
  const busqueda = Route.useSearch();
  const [texto, setTexto] = useState(busqueda.q);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [zona, setZona] = useState("");
  const [resultados, setResultados] = useState<TarjetaVehiculo[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    setUbicacion(ubicacionGuardada());
    setZona(zonaGuardada());
  }, []);

  useEffect(() => {
    setTexto(busqueda.q);
  }, [busqueda.q]);

  useEffect(() => {
    if (busqueda.inicio && busqueda.inicio < hoyISO()) {
      setAviso("La fecha de entrega ya pasó");
      return;
    }
    if (
      busqueda.inicio &&
      busqueda.fin &&
      (busqueda.fin < busqueda.inicio ||
        (busqueda.fin === busqueda.inicio && busqueda.hora_fin <= busqueda.hora_inicio))
    ) {
      setAviso("La devolución debe ser posterior a la entrega");
      return;
    }
    setAviso(null);
    let vivo = true;
    setResultados(null);
    void buscarVehiculos({
      data: {
        texto: busqueda.q,
        municipio: busqueda.municipio || null,
        inicio: busqueda.inicio || null,
        hora_inicio: busqueda.hora_inicio,
        fin: busqueda.fin || null,
        hora_fin: busqueda.hora_fin,
        pasajeros: busqueda.pasajeros || null,
        entrega: busqueda.entrega || null,
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
    busqueda.inicio,
    busqueda.hora_inicio,
    busqueda.fin,
    busqueda.hora_fin,
    busqueda.pasajeros,
    busqueda.entrega,
    ubicacion,
  ]);

  function actualizar(cambios: Partial<Busqueda>) {
    void navigate({ to: "/moverme", search: { ...busqueda, ...cambios } });
  }

  return (
    <MarcoPublico>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">¿Cómo te mueves?</h1>
          <p className="text-sm text-muted-foreground">
            Renta de autos con rentadoras locales de Yucatán.
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
            placeholder="Económico, SUV, van, Mérida…"
            className="h-13 text-base"
          />
          <Button type="submit" className="h-13 px-5" aria-label="Buscar autos de renta">
            <Search className="size-5" />
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="inicio">Entrega</Label>
            <Input
              id="inicio"
              type="date"
              min={hoyISO()}
              value={busqueda.inicio}
              onChange={(e) => actualizar({ inicio: e.target.value })}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hi">Hora</Label>
            <Input
              id="hi"
              type="time"
              value={busqueda.hora_inicio}
              onChange={(e) => actualizar({ hora_inicio: e.target.value })}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fin">Devolución</Label>
            <Input
              id="fin"
              type="date"
              min={busqueda.inicio || hoyISO()}
              value={busqueda.fin}
              onChange={(e) => actualizar({ fin: e.target.value })}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hf">Hora</Label>
            <Input
              id="hf"
              type="time"
              value={busqueda.hora_fin}
              onChange={(e) => actualizar({ hora_fin: e.target.value })}
              className="h-13 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="pax">Pasajeros (opcional)</Label>
            <Input
              id="pax"
              inputMode="numeric"
              value={busqueda.pasajeros ? String(busqueda.pasajeros) : ""}
              onChange={(e) =>
                actualizar({ pasajeros: Number(e.target.value.replace(/\D/g, "")) || 0 })
              }
              placeholder="Cualquiera"
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="entrega">Lugar de entrega</Label>
            <select
              id="entrega"
              value={busqueda.entrega}
              onChange={(e) => actualizar({ entrega: e.target.value })}
              className="h-13 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Cualquiera</option>
              {LUGARES_ENTREGA.map((l) => (
                <option key={l.clave} value={l.clave}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>
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
            <p className="text-base font-semibold">No encontramos autos de renta</p>
            <p className="text-sm text-muted-foreground">
              Prueba con otras fechas, otra zona o menos pasajeros.
            </p>
            <Button variant="secondary" onClick={() => actualizar({ q: "", municipio: "" })}>
              Ver todo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {resultados.length} {resultados.length === 1 ? "vehículo" : "vehículos"}
            </p>
            {resultados.map((v) => (
              <TarjetaVehiculoVista
                key={v.id}
                vehiculo={v}
                ubicacion={ubicacion}
                busqueda={busqueda}
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

function TarjetaVehiculoVista({
  vehiculo,
  ubicacion,
  busqueda,
}: {
  vehiculo: TarjetaVehiculo;
  ubicacion: { lat: number; lng: number } | null;
  busqueda: Busqueda;
}) {
  const km = distanciaKm(ubicacion, vehiculo.latitud, vehiculo.longitud);
  return (
    <Link
      to="/vehiculo/$id"
      params={{ id: vehiculo.id }}
      search={{
        inicio: busqueda.inicio,
        hora_inicio: busqueda.hora_inicio,
        fin: busqueda.fin,
        hora_fin: busqueda.hora_fin,
        pasajeros: busqueda.pasajeros,
        entrega: busqueda.entrega,
      }}
      className="block overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
    >
      {vehiculo.foto ? (
        <img
          src={vehiculo.foto}
          alt={vehiculo.nombre}
          loading="lazy"
          decoding="async"
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-secondary">
          <Car className="size-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1 p-4">
        <h2 className="text-lg font-bold leading-tight">{vehiculo.nombre}</h2>
        {vehiculo.modelo_referencia ? (
          <p className="text-sm text-muted-foreground">{vehiculo.modelo_referencia}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">{vehiculo.negocio}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-4" /> {vehiculo.pasajeros} pasajeros
          </span>
          <span>{nombreTransmision(vehiculo.transmision)}</span>
          {vehiculo.aire_acondicionado ? <span>A/C</span> : null}
          <span className="flex items-center gap-1">
            <MapPin className="size-4" /> {vehiculo.municipio}
            {km != null ? ` · ${textoDistancia(km)}` : ""}
          </span>
        </div>
        <p className="text-base font-bold text-primary">
          {textoPrecioDia(vehiculo.precio, vehiculo.precio_tipo)}
        </p>
        {vehiculo.total_estimado != null && vehiculo.dias ? (
          <p className="text-sm">
            {vehiculo.dias} {vehiculo.dias === 1 ? "día" : "días"} ·{" "}
            <span className="font-semibold">{pesos(vehiculo.total_estimado)} estimado</span>
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {textoDisponibilidadRenta(vehiculo.modo_disponibilidad)}
        </p>
      </div>
    </Link>
  );
}
