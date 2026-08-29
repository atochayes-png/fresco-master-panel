import { createServerFn } from "@tanstack/react-start";
import { urlImagen } from "@/lib/cloudinary";
import { noches, nochesDelRango, totalHospedaje, type ModoDisponibilidad } from "@/lib/hospedaje";

export type MedioAlojamientoPublico = { id: string; tipo: "image" | "video"; url: string };

export type TarjetaAlojamiento = {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  capacidad: number;
  camas: number | null;
  tipo_camas: string | null;
  precio: number | null;
  precio_tipo: string;
  servicios: string[];
  unidades: number;
  foto: string | null;
  negocio_id: string;
  negocio: string;
  municipio: string;
  latitud: number | null;
  longitud: number | null;
  modo_disponibilidad: ModoDisponibilidad;
  noches: number | null;
  total_estimado: number | null;
};

export type FichaAlojamiento = TarjetaAlojamiento & {
  medios: MedioAlojamientoPublico[];
  direccion: string | null;
  whatsapp: string | null;
  telefono: string | null;
  checkin: string | null;
  checkout: string | null;
  acepta_mascotas: boolean;
  acepta_ninos: boolean;
  requiere_anticipo: boolean;
  notas_hospedaje: string | null;
  activo: boolean;
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

function distancia(
  lat: number | null,
  lng: number | null,
  desdeLat?: number | null,
  desdeLng?: number | null,
) {
  if (desdeLat == null || desdeLng == null || lat == null || lng == null)
    return Number.MAX_SAFE_INTEGER;
  const R = 6371;
  const dLat = ((lat - desdeLat) * Math.PI) / 180;
  const dLng = ((lng - desdeLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((desdeLat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Búsqueda pública de alojamientos.
 * Con calendario activo se descartan las noches bloqueadas en todas las unidades;
 * sin calendario nunca se excluye: se muestra “Disponibilidad por confirmar”.
 */
export const buscarAlojamientos = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      texto?: string;
      municipio?: string | null;
      entrada?: string | null;
      salida?: string | null;
      huespedes?: number | null;
      lat?: number | null;
      lng?: number | null;
    }) => d,
  )
  .handler(async ({ data }): Promise<TarjetaAlojamiento[]> => {
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
    const [{ data: alojamientos }, { data: perfiles }] = await Promise.all([
      db
        .from("negocio_alojamientos")
        .select("*")
        .in("negocio_id", ids)
        .eq("activo", true)
        .order("orden"),
      db
        .from("negocio_perfil")
        .select("negocio_id, latitud, longitud, usa_calendario")
        .in("negocio_id", ids),
    ]);
    const lista = alojamientos ?? [];
    if (!lista.length) return [];

    const alojIds = lista.map((a) => a.id);
    const nochesBuscadas =
      data.entrada && data.salida ? nochesDelRango(data.entrada, data.salida) : [];

    const [{ data: medios }, { data: bloqueos }] = await Promise.all([
      db
        .from("alojamiento_medios")
        .select("alojamiento_id, secure_url, tipo, es_portada, orden")
        .in("alojamiento_id", alojIds)
        .order("orden"),
      nochesBuscadas.length
        ? db
            .from("alojamiento_bloqueos")
            .select("alojamiento_id, fecha, unidades")
            .in("alojamiento_id", alojIds)
            .in("fecha", nochesBuscadas)
        : Promise.resolve({ data: [] as { alojamiento_id: string; unidades: number }[] }),
    ]);

    const negocioPorId = new Map(visibles.map((n) => [n.id, n]));
    const perfilPorId = new Map((perfiles ?? []).map((p) => [p.negocio_id, p]));

    const texto = normalizar(data.texto ?? "");
    const palabras = texto.split(/\s+/).filter(Boolean);
    const huespedes = data.huespedes != null ? Math.max(1, Math.round(data.huespedes)) : null;
    const cantidadNoches = data.entrada && data.salida ? noches(data.entrada, data.salida) : null;

    const resultado: (TarjetaAlojamiento & { _puntos: number; _dist: number })[] = [];

    for (const a of lista) {
      const negocio = negocioPorId.get(a.negocio_id);
      if (!negocio) continue;
      if (data.municipio && negocio.municipio !== data.municipio) continue;
      if (huespedes && a.capacidad < huespedes) continue;

      let puntos = palabras.length ? 0 : 1;
      for (const palabra of palabras) {
        if (normalizar(a.nombre).includes(palabra)) puntos += 5;
        if (normalizar(negocio.nombre_negocio).includes(palabra)) puntos += 3;
        if (normalizar(negocio.municipio).includes(palabra)) puntos += 3;
        if (normalizar(a.descripcion ?? "").includes(palabra)) puntos += 2;
        if (normalizar(a.tipo).includes(palabra)) puntos += 1;
        if ((a.servicios ?? []).some((s: string) => normalizar(s).includes(palabra))) puntos += 1;
      }
      if (!puntos) continue;

      const perfil = perfilPorId.get(a.negocio_id);
      const usaCalendario = perfil?.usa_calendario === true;

      if (usaCalendario && nochesBuscadas.length) {
        const mios = (bloqueos ?? []).filter((b) => b.alojamiento_id === a.id);
        const sinCupo = mios.some((b) => b.unidades >= a.unidades);
        if (sinCupo) continue;
      }

      const mios = (medios ?? []).filter((m) => m.alojamiento_id === a.id && m.tipo === "image");
      const portada = mios.find((m) => m.es_portada) ?? mios[0];
      const precio = a.precio != null ? Number(a.precio) : null;

      resultado.push({
        id: a.id,
        nombre: a.nombre,
        tipo: a.tipo,
        descripcion: a.descripcion,
        capacidad: a.capacidad,
        camas: a.camas,
        tipo_camas: a.tipo_camas,
        precio,
        precio_tipo: a.precio_tipo,
        servicios: (a.servicios ?? []) as string[],
        unidades: a.unidades,
        foto: portada ? urlImagen(portada.secure_url, "tarjeta") : null,
        negocio_id: a.negocio_id,
        negocio: negocio.nombre_negocio,
        municipio: negocio.municipio,
        latitud: perfil?.latitud ?? null,
        longitud: perfil?.longitud ?? null,
        modo_disponibilidad: usaCalendario ? "con_calendario" : "sin_calendario",
        noches: cantidadNoches,
        total_estimado: totalHospedaje(precio, a.precio_tipo, cantidadNoches),
        _puntos: puntos,
        _dist: distancia(perfil?.latitud ?? null, perfil?.longitud ?? null, data.lat, data.lng),
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

export const fichaAlojamiento = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; entrada?: string | null; salida?: string | null }) => d)
  .handler(async ({ data }): Promise<FichaAlojamiento | null> => {
    const db = await admin();
    const { data: a } = await db
      .from("negocio_alojamientos")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!a) return null;

    const { data: negocio } = await db
      .from("negocios")
      .select("id, nombre_negocio, municipio, celular, estatus, estado_configuracion, fecha_fin")
      .eq("id", a.negocio_id)
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
        .select(
          "latitud, longitud, direccion, whatsapp_activo, whatsapp_numero, usa_calendario, checkin, checkout, acepta_mascotas, acepta_ninos, requiere_anticipo, notas_hospedaje",
        )
        .eq("negocio_id", negocio.id)
        .maybeSingle(),
      db
        .from("alojamiento_medios")
        .select("id, tipo, secure_url, es_portada, orden")
        .eq("alojamiento_id", a.id)
        .order("orden"),
    ]);

    const fotos = (medios ?? []).filter((m) => m.tipo === "image");
    const portada = fotos.find((m) => m.es_portada) ?? fotos[0];
    const precio = a.precio != null ? Number(a.precio) : null;
    const cantidadNoches = data.entrada && data.salida ? noches(data.entrada, data.salida) : null;

    return {
      id: a.id,
      nombre: a.nombre,
      tipo: a.tipo,
      descripcion: a.descripcion,
      capacidad: a.capacidad,
      camas: a.camas,
      tipo_camas: a.tipo_camas,
      precio,
      precio_tipo: a.precio_tipo,
      servicios: (a.servicios ?? []) as string[],
      unidades: a.unidades,
      foto: portada ? urlImagen(portada.secure_url, "ficha") : null,
      negocio_id: negocio.id,
      negocio: negocio.nombre_negocio,
      municipio: negocio.municipio,
      latitud: perfil?.latitud ?? null,
      longitud: perfil?.longitud ?? null,
      modo_disponibilidad: perfil?.usa_calendario === true ? "con_calendario" : "sin_calendario",
      noches: cantidadNoches,
      total_estimado: totalHospedaje(precio, a.precio_tipo, cantidadNoches),
      medios: (medios ?? []).map((m) => ({
        id: m.id,
        tipo: m.tipo === "video" ? ("video" as const) : ("image" as const),
        url: m.secure_url,
      })),
      direccion: perfil?.direccion ?? null,
      whatsapp:
        perfil?.whatsapp_activo === false
          ? negocio.celular
          : (perfil?.whatsapp_numero ?? negocio.celular),
      telefono: negocio.celular,
      checkin: perfil?.checkin ?? null,
      checkout: perfil?.checkout ?? null,
      acepta_mascotas: perfil?.acepta_mascotas === true,
      acepta_ninos: perfil?.acepta_ninos !== false,
      requiere_anticipo: perfil?.requiere_anticipo === true,
      notas_hospedaje: perfil?.notas_hospedaje ?? null,
      activo: a.activo === true,
    };
  });

/** Fechas bloqueadas (sólo cuando el hospedaje usa calendario) para pintar el rango en la ficha. */
export const fechasNoDisponibles = createServerFn({ method: "POST" })
  .inputValidator((d: { alojamiento_id: string }) => d)
  .handler(async ({ data }): Promise<string[]> => {
    const db = await admin();
    const { data: a } = await db
      .from("negocio_alojamientos")
      .select("id, negocio_id, unidades")
      .eq("id", data.alojamiento_id)
      .maybeSingle();
    if (!a) return [];
    const { data: perfil } = await db
      .from("negocio_perfil")
      .select("usa_calendario")
      .eq("negocio_id", a.negocio_id)
      .maybeSingle();
    if (perfil?.usa_calendario !== true) return [];
    const { data: bloqueos } = await db
      .from("alojamiento_bloqueos")
      .select("fecha, unidades")
      .eq("alojamiento_id", a.id)
      .gte("fecha", HOY())
      .order("fecha");
    return (bloqueos ?? []).filter((b) => b.unidades >= a.unidades).map((b) => b.fecha);
  });

/**
 * Registra la SOLICITUD antes de abrir WhatsApp.
 * TFY no confirma ni cobra: la disponibilidad la confirma el hospedaje directamente.
 */
export const crearSolicitudHospedaje = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      alojamiento_id: string;
      entrada: string;
      salida: string;
      huespedes: number;
      cliente_nombre: string;
      cliente_telefono: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const nombre = (data.cliente_nombre ?? "").trim();
    const telefono = soloDigitos(data.cliente_telefono);
    if (!nombre) throw new Error("Escribe tu nombre");
    if (telefono.length < 10) throw new Error("Escribe un teléfono de 10 dígitos");

    const cantidadNoches = noches(data.entrada, data.salida);
    if (!cantidadNoches) throw new Error("La fecha de salida debe ser posterior a la de entrada");
    if (data.entrada < HOY()) throw new Error("La fecha de entrada ya pasó");

    const db = await admin();
    const { data: a } = await db
      .from("negocio_alojamientos")
      .select("*")
      .eq("id", data.alojamiento_id)
      .maybeSingle();
    if (!a || a.activo !== true) throw new Error("Este alojamiento no está disponible por ahora");

    const { data: negocio } = await db
      .from("negocios")
      .select("id, nombre_negocio, municipio, celular, estatus, estado_configuracion, fecha_fin")
      .eq("id", a.negocio_id)
      .maybeSingle();
    if (
      !negocio ||
      negocio.estatus !== "activo" ||
      negocio.estado_configuracion !== "perfil_completo" ||
      negocio.fecha_fin < HOY()
    )
      throw new Error("Este hospedaje no está disponible");

    const huespedes = Math.max(1, Math.round(Number(data.huespedes) || 1));
    if (huespedes > a.capacidad)
      throw new Error(`Este alojamiento acepta máximo ${a.capacidad} huéspedes`);

    const { data: perfil } = await db
      .from("negocio_perfil")
      .select("whatsapp_activo, whatsapp_numero, usa_calendario, requiere_anticipo, checkin")
      .eq("negocio_id", negocio.id)
      .maybeSingle();
    const usaCalendario = perfil?.usa_calendario === true;

    if (usaCalendario) {
      const fechas = nochesDelRango(data.entrada, data.salida);
      const { data: bloqueos } = await db
        .from("alojamiento_bloqueos")
        .select("fecha, unidades")
        .eq("alojamiento_id", a.id)
        .in("fecha", fechas);
      if ((bloqueos ?? []).some((b) => b.unidades >= a.unidades))
        throw new Error("Esas fechas ya no están disponibles, elige otras");
    }

    const precio = a.precio != null ? Number(a.precio) : null;
    const total = totalHospedaje(precio, a.precio_tipo, cantidadNoches);

    const { data: solicitud, error } = await db
      .from("solicitudes_hospedaje")
      .insert({
        negocio_id: negocio.id,
        alojamiento_id: a.id,
        alojamiento_nombre: a.nombre,
        check_in: data.entrada,
        check_out: data.salida,
        noches: cantidadNoches,
        huespedes,
        precio_referencia: precio,
        total_estimado: total,
        cliente_nombre: nombre.slice(0, 80),
        cliente_telefono: telefono,
        modo_disponibilidad: usaCalendario ? "con_calendario" : "sin_calendario",
      })
      .select("id, folio")
      .single();
    if (error) throw new Error(error.message);

    const whatsapp =
      perfil?.whatsapp_activo === false
        ? negocio.celular
        : (perfil?.whatsapp_numero ?? negocio.celular);

    return {
      id: solicitud.id as string,
      folio: solicitud.folio as string,
      negocio: negocio.nombre_negocio,
      alojamiento: a.nombre,
      noches: cantidadNoches,
      huespedes,
      precio_referencia: precio,
      precio_tipo: a.precio_tipo as string,
      total_estimado: total,
      modo_disponibilidad: (usaCalendario
        ? "con_calendario"
        : "sin_calendario") as ModoDisponibilidad,
      requiere_anticipo: perfil?.requiere_anticipo === true,
      whatsapp: soloDigitos(whatsapp ?? ""),
    };
  });

export const marcarSolicitudHospedajeEnviada = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("solicitudes_hospedaje")
      .update({ estado: "ENVIADA_A_WHATSAPP" })
      .eq("id", data.id)
      .eq("estado", "SOLICITUD_GENERADA");
    return { ok: true };
  });
