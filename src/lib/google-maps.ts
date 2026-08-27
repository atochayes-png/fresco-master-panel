/// <reference types="google.maps" />
/* Carga perezosa del mapa de Google. Sólo navegador y sólo una vez por sesión. */

let promesa: Promise<typeof google.maps> | null = null;

export function cargarMapas(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("El mapa sólo funciona en el navegador"));
  }
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (promesa) return promesa;

  const clave = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'] as string | undefined;
  const canal = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'] as string | undefined;

  promesa = new Promise<typeof google.maps>((resolve, reject) => {
    if (!clave) {
      reject(new Error("Falta la clave del mapa"));
      return;
    }
    const nombreCallback = "__tfyMapaListo";
    (window as unknown as Record<string, unknown>)[nombreCallback] = () => resolve(window.google.maps);
    const script = document.createElement("script");
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${clave}` +
      `&loading=async&callback=${nombreCallback}&language=es&region=MX` +
      (canal ? `&channel=${canal}` : "");
    script.onerror = () => {
      promesa = null;
      reject(new Error("No pudimos cargar el mapa"));
    };
    document.head.appendChild(script);
  });

  return promesa;
}

/* Color institucional para los marcadores. */
export const ROSA = "#E5397F";

export function iconoMarcador(maps: typeof google.maps, activo = false): google.maps.Symbol {
  return {
    path: maps.SymbolPath.CIRCLE,
    scale: activo ? 11 : 8,
    fillColor: ROSA,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: activo ? 4 : 3,
  };
}
