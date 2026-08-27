import { createServerFn } from "@tanstack/react-start";

export type Lugar = {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
};

export type DatosDireccion = {
  direccion: string;
  colonia: string | null;
  municipio: string | null;
  codigo_postal: string | null;
};

const PUERTA = "https://connector-gateway.lovable.dev/google_maps";

/* Centro aproximado de Yucatán para dar preferencia a resultados locales. */
const CENTRO = { latitude: 20.7099, longitude: -89.0943 };

function credenciales() {
  const lovable = process.env['LOVABLE_API_KEY'];
  const maps = process.env['GOOGLE_MAPS_API_KEY'];
  if (!lovable || !maps) throw new Error("El buscador de direcciones no está disponible por ahora");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": maps,
  };
}

async function fallar(res: Response): Promise<never> {
  const cuerpo = await res.text();
  console.error(`Google Maps [${res.status}]: ${cuerpo}`);
  if (res.status === 403) throw new Error("El servicio de mapas rechazó la consulta (403)");
  throw new Error("No pudimos consultar el mapa en este momento");
}

/* Busca lugares y direcciones. Se usa tanto por el dueño (su dirección)
   como por el usuario final (elegir zona). */
export const buscarLugares = createServerFn({ method: "POST" })
  .inputValidator((d: { texto: string }) => d)
  .handler(async ({ data }): Promise<Lugar[]> => {
    const texto = (data.texto ?? "").trim().slice(0, 120);
    if (texto.length < 3) return [];

    const res = await fetch(`${PUERTA}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        ...credenciales(),
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({
        textQuery: `${texto}, Yucatán, México`,
        languageCode: "es",
        regionCode: "MX",
        maxResultCount: 5,
        locationBias: { circle: { center: CENTRO, radius: 150000 } },
      }),
    });
    if (!res.ok) await fallar(res);

    const json = (await res.json()) as {
      places?: {
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
      }[];
    };

    return (json.places ?? [])
      .filter((p) => p.location)
      .map((p) => ({
        id: p.id,
        nombre: p.displayName?.text ?? p.formattedAddress ?? texto,
        direccion: p.formattedAddress ?? "",
        latitud: p.location!.latitude,
        longitud: p.location!.longitude,
      }));
  });

/* Convierte un punto del mapa en dirección legible (una sola llamada,
   al confirmar; nunca al mostrar una ficha). */
export const direccionDePunto = createServerFn({ method: "POST" })
  .inputValidator((d: { lat: number; lng: number }) => d)
  .handler(async ({ data }): Promise<DatosDireccion | null> => {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const res = await fetch(
      `${PUERTA}/maps/api/geocode/json?latlng=${lat},${lng}&language=es&region=mx`,
      { headers: credenciales() },
    );
    if (!res.ok) await fallar(res);

    const json = (await res.json()) as {
      results?: {
        formatted_address?: string;
        address_components?: { long_name: string; types: string[] }[];
      }[];
    };
    const mejor = json.results?.[0];
    if (!mejor) return null;

    const partes = mejor.address_components ?? [];
    const buscar = (tipo: string) => partes.find((c) => c.types.includes(tipo))?.long_name ?? null;

    return {
      direccion: mejor.formatted_address ?? "",
      colonia: buscar("sublocality_level_1") ?? buscar("neighborhood") ?? null,
      municipio: buscar("locality") ?? buscar("administrative_area_level_2") ?? null,
      codigo_postal: buscar("postal_code"),
    };
  });
