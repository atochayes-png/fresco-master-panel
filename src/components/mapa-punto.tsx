import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { cargarMapas, iconoMarcador } from "@/lib/google-maps";

/* Mapa pequeño con un solo punto. Si se pasa onMover, el punto se puede
   arrastrar o tocar para corregir la ubicación. */
export function MapaPunto({
  lat,
  lng,
  onMover,
  altura = "h-56",
  zoom = 16,
}: {
  lat: number;
  lng: number;
  onMover?: (lat: number, lng: number) => void;
  altura?: string;
  zoom?: number;
}) {
  const caja = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<google.maps.Map | null>(null);
  const marcador = useRef<google.maps.Marker | null>(null);
  const mover = useRef(onMover);
  mover.current = onMover;
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    cargarMapas()
      .then((maps) => {
        if (!vivo || !caja.current) return;
        mapa.current = new maps.Map(caja.current, {
          center: { lat, lng },
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        marcador.current = new maps.Marker({
          position: { lat, lng },
          map: mapa.current,
          draggable: Boolean(mover.current),
          icon: iconoMarcador(maps, true),
        });
        marcador.current.addListener("dragend", (e: google.maps.MapMouseEvent) => {
          if (e.latLng && mover.current) mover.current(e.latLng.lat(), e.latLng.lng());
        });
        mapa.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng && mover.current) mover.current(e.latLng.lat(), e.latLng.lng());
        });
        setListo(true);
      })
      .catch(() => {
        if (vivo) setError("No pudimos mostrar el mapa");
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listo) return;
    marcador.current?.setPosition({ lat, lng });
    mapa.current?.panTo({ lat, lng });
  }, [lat, lng, listo]);

  if (error) {
    return (
      <div
        className={`flex ${altura} w-full items-center justify-center rounded-2xl bg-secondary text-sm text-muted-foreground`}
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`relative ${altura} w-full overflow-hidden rounded-2xl border border-border`}>
      <div ref={caja} className="size-full" />
      {!listo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}
