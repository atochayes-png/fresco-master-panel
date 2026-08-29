import { createServerFn } from "@tanstack/react-start";
import { urlImagen } from "@/lib/cloudinary";
import { totalEstimado, type ExtraExperiencia } from "@/lib/conocer";

export type MedioExperienciaPublico = { id: string; tipo: "image" | "video"; url: string };

export type TarjetaExperiencia = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  precio: number | null;
  precio_tipo: string;
  duracion: string | null;
  capacidad: number | null;
  punto_salida: string | null;
  foto: string | null;
  negocio_id: string;
  negocio: string;
  municipio: string;
  latitud: number | null;
  longitud: number | null;
  requiere_anticipo: boolean;
};

export type FichaExperiencia = TarjetaExperiencia & {
  horarios: string[];
  extras: ExtraExperiencia[];
  salida_latitud: number | null;
  salida_longitud: number | null;
  medios: MedioExperienciaPublico[];
  whatsapp: string | null;
  telefono: string | null;
  activa: boolean;
};

const HOY = () => new Date().toISOString().slice(0, 10);

function normalizar(v: string) {
  return (v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function soloDigitos(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function extrasDe(valor: unknown): ExtraExperiencia[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((e) => {
      const x = e as { nombre?: string; precio?: number | null; disponible?: boolean };
      if (!x?.nombre) return null;
      return {
        nombre: String(x.nombre),
        precio: x.precio != null ? Number(x.precio) : null,
        disponible: x.disponible !== false,
      };
    })
    .filter(Boolean) as ExtraExperiencia[];
}

/** Descubrimiento público de experiencias: por lugar, nombre, descripción, categoría o negocio. */
export const buscarExperiencias = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      texto?: string;
      categoria?: string | null;
      municipio?: string | null;
      lat?: number | null;
      lng?: number | null;
    }) => d,
  )
  .handler(async ({ data }): Promise<TarjetaExperiencia[]> => {
    const db = await admin();
    const { data: negocios } = await db
      .from("negocios")
      .select("id, nombre_negocio, municipio, estatus, estado_configuracion, fecha_fin")
      .eq("estatus", "activo")
      .eq("estado_configuracion", "perfil_completo")
      .gte("fecha_fin", HOY());
    const visibles = negocios ?? [];
    if (!visibles.length) return [];

    const ids = visibles.map((n) => n.id);
    const [{ data: experiencias }, { data: perfiles }] = await Promise.all([
      db
        .from("negocio_experiencias")
        .select("*")
        .in("negocio_id", ids)
        .eq("activa", true)
        .order("orden"),
      db.from("negocio_perfil").select("negocio_id, latitud, longitud").in("negocio_id", ids),
    ]);
    const lista = experiencias ?? [];
    if (!lista.length) return [];

    const { data: medios } = await db
      .from("experiencia_medios")
      .select("experiencia_id, secure_url, tipo, es_portada, orden")
      .in(
        "experiencia_id",
        lista.map((e) => e.id),
      )
      .order("orden");

    const negocioPorId = new Map(visibles.map((n) => [n.id, n]));
    const perfilPorId = new Map((perfiles ?? []).map((p) => [p.negocio_id, p]));

    const texto = normalizar(data.texto ?? "");
    const palabras = texto.split(/\s+/).filter(Boolean);

    const resultado: (TarjetaExperiencia & { _puntos: number; _dist: number })[] = [];

    for (const e of lista) {
      const negocio = negocioPorId.get(e.negocio_id);
      if (!negocio) continue;
      if (data.categoria && e.categoria !== data.categoria) continue;
      if (data.municipio && negocio.municipio !== data.municipio) continue;

      let puntos = palabras.length ? 0 : 1;
      for (const palabra of palabras) {
        if (normalizar(e.nombre).includes(palabra)) puntos += 5;
        if (normalizar(e.punto_salida ?? "").includes(palabra)) puntos += 3;
        if (normalizar(e.descripcion ?? "").includes(palabra)) puntos += 2;
        if (normalizar(e.categoria ?? "").includes(palabra)) puntos += 2;
        if (normalizar(negocio.nombre_negocio).includes(palabra)) puntos += 2;
        if (normalizar(negocio.municipio).includes(palabra)) puntos += 2;
      }
      if (!puntos) continue;

      const perfil = perfilPorId.get(e.negocio_id);
      const lat = e.salida_latitud ?? perfil?.latitud ?? null;
      const lng = e.salida_longitud ?? perfil?.longitud ?? null;

      let distancia = Number.MAX_SAFE_INTEGER;
      if (data.lat != null && data.lng != null && lat != null && lng != null) {
        const R = 6371;
        const dLat = ((lat - data.lat) * Math.PI) / 180;
        const dLng = ((lng - data.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((data.lat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        distancia = 2 * R * Math.asin(Math.sqrt(a));
      }

      const mios = (medios ?? []).filter((m) => m.experiencia_id === e.id && m.tipo === "image");
      const portada = mios.find((m) => m.es_portada) ?? mios[0];

      resultado.push({
        id: e.id,
        nombre: e.nombre,
        descripcion: e.descripcion,
        categoria: e.categoria,
        precio: e.precio != null ? Number(e.precio) : null,
        precio_tipo: e.precio_tipo,
        duracion: e.duracion,
        capacidad: e.capacidad,
        punto_salida: e.punto_salida,
        foto: portada ? urlImagen(portada.secure_url, "tarjeta") : null,
        negocio_id: e.negocio_id,
        negocio: negocio.nombre_negocio,
        municipio: negocio.municipio,
        latitud: lat,
        longitud: lng,
        requiere_anticipo: e.requiere_anticipo === true,
        _puntos: puntos,
        _dist: distancia,
      });
    }

    const hayUbicacion = data.lat != null && data.lng != null;
    resultado.sort((a, b) =>
      hayUbicacion
        ? a._dist - b._dist || b._puntos - a._puntos || a.nombre.localeCompare(b.nombre)
        : b._puntos - a._puntos || a.nombre.localeCompare(b.nombre),
    );
    return resultado.map(({ _puntos, _dist, ...resto }) => resto);
  });

export const fichaExperiencia = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<FichaExperiencia | null> => {
    const db = await admin();
    const { data: e } = await db
      .from("negocio_experiencias")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!e) return null;

    const { data: negocio } = await db
      .from("negocios")
      .select(
        "id, nombre_negocio, municipio, celular, estatus, estado_configuracion, fecha_fin",
      )
      .eq("id", e.negocio_id)
      .maybeSingle();
    if (
      !negocio ||
      negocio.estatus !== "activo" ||
      negocio.estado_configuracion !== "perfil_completo" ||
      negocio.fecha_fin < HOY()
    )
      return null;

    const [{ data: perfil }, { data: medios }] = await Promise.all([
      db
        .from("negocio_perfil")
        .select("latitud, longitud, whatsapp_activo, whatsapp_numero")
        .eq("negocio_id", negocio.id)
        .maybeSingle(),
      db
        .from("experiencia_medios")
        .select("id, tipo, secure_url, es_portada, orden")
        .eq("experiencia_id", e.id)
        .order("orden"),
    ]);

    const fotos = (medios ?? []).filter((m) => m.tipo === "image");
    const portada = fotos.find((m) => m.es_portada) ?? fotos[0];

    return {
      id: e.id,
      nombre: e.nombre,
      descripcion: e.descripcion,
      categoria: e.categoria,
      precio: e.precio != null ? Number(e.precio) : null,
      precio_tipo: e.precio_tipo,
      duracion: e.duracion,
      capacidad: e.capacidad,
      punto_salida: e.punto_salida,
      foto: portada ? urlImagen(portada.secure_url, "ficha") : null,
      negocio_id: negocio.id,
      negocio: negocio.nombre_negocio,
      municipio: negocio.municipio,
      latitud: e.salida_latitud ?? perfil?.latitud ?? null,
      longitud: e.salida_longitud ?? perfil?.longitud ?? null,
      salida_latitud: e.salida_latitud,
      salida_longitud: e.salida_longitud,
      requiere_anticipo: e.requiere_anticipo === true,
      horarios: (e.horarios ?? []) as string[],
      extras: extrasDe(e.extras).filter((x) => x.disponible),
      medios: (medios ?? []).map((m) => ({
        id: m.id,
        tipo: m.tipo === "video" ? ("video" as const) : ("image" as const),
        url: m.secure_url,
      })),
      whatsapp:
        perfil?.whatsapp_activo === false
          ? negocio.celular
          : (perfil?.whatsapp_numero ?? negocio.celular),
      telefono: negocio.celular,
      activa: e.activa === true,
    };
  });

/**
 * Registra la SOLICITUD antes de abrir WhatsApp.
 * TFY nunca confirma la reservación: la confirma el prestador directamente.
 */
export const crearReservacion = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      experiencia_id: string;
      cliente_nombre: string;
      cliente_telefono: string;
      fecha: string;
      horario: string;
      personas: number;
      extras: string[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const nombre = (data.cliente_nombre ?? "").trim();
    const telefono = soloDigitos(data.cliente_telefono);
    if (!nombre) throw new Error("Escribe tu nombre");
    if (telefono.length < 10) throw new Error("Escribe un teléfono de 10 dígitos");

    const db = await admin();
    const { data: e } = await db
      .from("negocio_experiencias")
      .select("*")
      .eq("id", data.experiencia_id)
      .maybeSingle();
    if (!e || e.activa !== true) throw new Error("Esta experiencia no está disponible por ahora");

    const { data: negocio } = await db
      .from("negocios")
      .select(
        "id, nombre_negocio, municipio, celular, estatus, estado_configuracion, fecha_fin",
      )
      .eq("id", e.negocio_id)
      .maybeSingle();
    if (
      !negocio ||
      negocio.estatus !== "activo" ||
      negocio.estado_configuracion !== "perfil_completo" ||
      negocio.fecha_fin < HOY()
    )
      throw new Error("Este prestador no está disponible");

    const personas = Math.max(1, Math.round(Number(data.personas) || 1));
    if (e.capacidad && personas > e.capacidad)
      throw new Error(`Esta experiencia acepta máximo ${e.capacidad} personas`);

    const disponibles = extrasDe(e.extras).filter((x) => x.disponible);
    const extras = disponibles.filter((x) => (data.extras ?? []).includes(x.nombre));
    const total = totalEstimado(
      e.precio != null ? Number(e.precio) : null,
      e.precio_tipo,
      personas,
      extras,
    );

    const { data: perfil } = await db
      .from("negocio_perfil")
      .select("whatsapp_activo, whatsapp_numero")
      .eq("negocio_id", negocio.id)
      .maybeSingle();

    const { data: reservacion, error } = await db
      .from("reservaciones")
      .insert({
        negocio_id: negocio.id,
        experiencia_id: e.id,
        experiencia_nombre: e.nombre,
        fecha_solicitada: data.fecha || null,
        horario: (data.horario ?? "").slice(0, 30) || null,
        personas,
        extras,
        total_estimado: total,
        cliente_nombre: nombre.slice(0, 80),
        cliente_telefono: telefono,
      })
      .select("id, folio")
      .single();
    if (error) throw new Error(error.message);

    const whatsapp =
      perfil?.whatsapp_activo === false
        ? negocio.celular
        : (perfil?.whatsapp_numero ?? negocio.celular);

    return {
      id: reservacion.id as string,
      folio: reservacion.folio as string,
      negocio: negocio.nombre_negocio,
      experiencia: e.nombre,
      personas,
      extras,
      total_estimado: total,
      requiere_anticipo: e.requiere_anticipo === true,
      whatsapp: soloDigitos(whatsapp ?? ""),
    };
  });

export const marcarReservacionEnviada = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("reservaciones")
      .update({ estado: "ENVIADA_A_WHATSAPP" })
      .eq("id", data.id)
      .eq("estado", "SOLICITUD_GENERADA");
    return { ok: true };
  });
