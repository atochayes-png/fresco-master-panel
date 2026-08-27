import { Link } from "@tanstack/react-router";
import { Bike, Camera, MapPin, Star } from "lucide-react";

import type { TarjetaNegocio } from "@/lib/publico.functions";
import { distanciaKm, estaAbierto, pesos, textoDistancia } from "@/lib/publico";
import { Button } from "@/components/ui/button";

export function TarjetaNegocioVista({
  negocio,
  ubicacion,
}: {
  negocio: TarjetaNegocio;
  ubicacion: { lat: number; lng: number } | null;
}) {
  const km = distanciaKm(ubicacion, negocio.latitud, negocio.longitud);
  const abierto = estaAbierto(negocio.horarios);
  const precio = negocio.precio_desde ?? negocio.precio_promedio;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      {negocio.foto ? (
        <img
          src={negocio.foto}
          alt={`Foto de ${negocio.nombre}`}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-secondary">
          <Camera className="size-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-bold leading-tight">{negocio.nombre}</h3>
          <p className="text-sm text-muted-foreground">
            {negocio.tipo} · {negocio.municipio}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {km != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
              <MapPin className="size-3.5" /> {textoDistancia(km)}
            </span>
          ) : null}
          {negocio.solo_reservacion ? (
            <span className="rounded-full bg-secondary px-2.5 py-1">Sólo con reservación</span>
          ) : abierto === null ? null : (
            <span
              className={`rounded-full px-2.5 py-1 ${abierto ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {abierto ? "Abierto" : "Cerrado"}
            </span>
          )}
          {precio ? (
            <span className="rounded-full bg-secondary px-2.5 py-1">
              {negocio.precio_desde ? "Desde " : "Promedio "}
              {pesos(precio)}
            </span>
          ) : null}
          {negocio.domicilio ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
              <Bike className="size-3.5" /> A domicilio
            </span>
          ) : null}
          {negocio.resenas > 0 && negocio.estrellas ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
              <Star className="size-3.5 fill-current" /> {negocio.estrellas} ({negocio.resenas})
            </span>
          ) : (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">NUEVO</span>
          )}
        </div>

        <Button asChild className="h-12 w-full text-base font-semibold">
          <Link to="/negocio/$id" params={{ id: negocio.id }}>
            VER
          </Link>
        </Button>
      </div>
    </article>
  );
}
