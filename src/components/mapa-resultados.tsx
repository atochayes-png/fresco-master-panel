import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { cargarMapas, iconoMarcador } from "@/lib/google-maps";
import type { TarjetaNegocio } from "@/lib/publico.functions";

/* Mapa de resultados. Sólo se monta cuando la persona elige la vista MAPA,
   para no consumir el mapa de Google sin necesidad. */
export function MapaResultados({
  negocios,
  ubicacion,
  seleccionado,
  onSeleccionar,
}: {
  negocios: TarjetaNegocio[];
  ubicacion: { lat: number; lng: number } | null;
  seleccionado: string | null;
  onSeleccionar: (id: string | null) => void;
}) {
  const caja = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<google.maps.Map | null>(null);
  const marcadores = useRef<Map<string, google.maps.Marker>>(new Map());
  const seleccionar = useRef(onSeleccionar);
  seleccionar.current = onSeleccionar;
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conPunto = negocios.filter((n) => n.latitud != null && n.longitud != null);

  useEffect(() => {
    let vivo = true;
    cargarMapas()
      .then((maps) => {
        if (!vivo || !caja.current) return;
        mapa.current = new maps.Map(caja.current, {
          center: ubicacion ?? { lat: 20.9674, lng: -89.5926 },
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        if (ubicacion) {
          new maps.Marker({
            position: ubicacion,
            map: mapa.current,
            title: "Tu ubicación",
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#1d1d1d",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          });
        }
        const limites = new maps.LatLngBounds();
        for (const n of conPunto) {
          const posicion = { lat: n.latitud as number, lng: n.longitud as number };
          const marca = new maps.Marker({
            position: posicion,
            map: mapa.current,
            title: n.nombre,
            icon: iconoMarcador(maps),
          });
          marca.addListener("click", () => seleccionar.current(n.id));
          marcadores.current.set(n.id, marca);
          limites.extend(posicion);
        }
        if (ubicacion) limites.extend(ubicacion);
        if (conPunto.length) mapa.current.fitBounds(limites, 48);
        mapa.current.addListener("click", () => seleccionar.current(null));
        setListo(true);
      })
      .catch(() => {
        if (vivo) setError("No pudimos mostrar el mapa");
      });
    return () => {
      vivo = false;
      marcadores.current.forEach((m) => m.setMap(null));
      marcadores.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocios.length]);

  useEffect(() => {
    if (!listo || !window.google?.maps) return;
    marcadores.current.forEach((marca, id) => {
      marca.setIcon(iconoMarcador(window.google.maps, id === seleccionado));
      marca.setZIndex(id === seleccionado ? 10 : 1);
    });
  }, [seleccionado, listo]);

  if (error) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-3xl bg-secondary text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-[26rem] w-full overflow-hidden rounded-3xl border border-border">
      <div ref={caja} className="size-full" />
      {!listo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}
