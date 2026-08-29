import { createServerFn } from "@tanstack/react-start";
import { urlImagen } from "@/lib/cloudinary";
import { fechaValidaD, nombreSubcategoria, textoCover } from "@/lib/divertirme";

export type MedioLugar = { id: string; tipo: "image" | "video"; url: string; destacado: boolean };

export type EventoPublico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha: string | null;
  hora: string | null;
  foto_url: string | null;
  cover_monto: number | null;
};

export type TarjetaLugar = {
  id: string;
  nombre: string;
  municipio: string;
  descripcion: string | null;
  foto: string | null;
  logotipo: string | null;
  latitud: number | null;
  longitud: number | null;
  subcategorias: string[];
  ambiente: string[];
  restriccion_edad: string;
  cover_texto: string | null;
  reserva_recomendada: string;
  evento: EventoPublico | null;
  horarios: { dia: number; abierto: boolean; apertura: string | null; cierre: string | null }[];
};

export type FichaLugar = TarjetaLugar & {
  direccion: string | null;
  restriccion_notas: string | null;
  horario_notas: string | null;
  menu_url: string | null;
  menu_tipo: string | null;
  whatsapp: string | null;
  telefono: string | null;
  facebook: string | null;
  instagram: string | null;
  sitio_web: string | null;
  medios: MedioLugar[];
  eventos: EventoPublico[];
  promociones: {
    id: string;
    titulo: string;
    descripcion: string | null;
    foto_url: string | null;
    precio: number | null;
  }[];
};

const HOY = () => new Date().toISOString().slice(0, 10);
const TIPO = "Diversión y entretenimiento";

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

/** Búsqueda pública de lugares para salir: relevancia + cercanía, sin dominar por estrellas. */
export const buscarLugares = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      texto?: string;
      subcategoria?: string | null;
      municipio?: string | null;
      lat?: number | null;
      lng?: number | null;
    }) => d,
  )
  .handler(async ({ data }): Promise<TarjetaLugar[]> => {
    const db = await admin();
    const { data: negocios } = await db
      .from("negocios")
      .select("id, nombre_negocio, municipio, tipo, estatus, estado_configuracion, fecha_fin")
      .eq("tipo", TIPO)
      .eq("estatus", "activo")
      .eq("estado_configuracion", "perfil_completo")
      .gte("fecha_fin", HOY());
    const visibles = negocios ?? [];
    if (!visibles.length) return [];

    const ids = visibles.map((n) => n.id);
    const [{ data: perfiles }, { data: medios }, { data: eventos }, { data: horarios }] =
      await Promise.all([
        db
          .from("negocio_perfil")
          .select(
            "negocio_id, descripcion, direccion, latitud, longitud, foto_principal, divertirme_tipos, ambiente, restriccion_edad, cover_activo, cover_tipo, cover_monto, reserva_recomendada",
          )
          .in("negocio_id", ids),
        db
          .from("negocio_medios")
          .select("negocio_id, secure_url, tipo, es_portada, orden")
          .in("negocio_id", ids)
          .eq("tipo", "image")
          .order("orden"),
        db
          .from("negocio_eventos")
          .select("id, negocio_id, nombre, descripcion, fecha, hora, foto_url, cover_monto")
          .in("negocio_id", ids)
          .eq("activo", true)
          .order("fecha"),
        db
          .from("negocio_horarios")
          .select("negocio_id, dia, abierto, apertura, cierre")
          .in("negocio_id", ids)
          .order("dia"),
      ]);

    const perfilPorId = new Map((perfiles ?? []).map((p) => [p.negocio_id, p]));
    const texto = normalizar(data.texto ?? "");
    const palabras = texto.split(/\s+/).filter(Boolean);

    const resultado: (TarjetaLugar & { _puntos: number; _dist: number })[] = [];

    for (const n of visibles) {
      if (data.municipio && n.municipio !== data.municipio) continue;
      const perfil = perfilPorId.get(n.id);
      const subcategorias = (perfil?.divertirme_tipos ?? []) as string[];
      const ambiente = (perfil?.ambiente ?? []) as string[];
      if (data.subcategoria && !subcategorias.includes(data.subcategoria)) continue;

      const eventosMios = (eventos ?? []).filter(
        (e) => e.negocio_id === n.id && (!e.fecha || e.fecha >= HOY()),
      );

      let puntos = palabras.length ? 0 : 1;
      for (const palabra of palabras) {
        if (normalizar(n.nombre_negocio).includes(palabra)) puntos += 5;
        if (normalizar(n.municipio).includes(palabra)) puntos += 3;
        if (subcategorias.some((s) => normalizar(nombreSubcategoria(s)).includes(palabra)))
          puntos += 4;
        if (ambiente.some((a) => normalizar(a).includes(palabra))) puntos += 3;
        if (normalizar(perfil?.descripcion ?? "").includes(palabra)) puntos += 2;
        if (eventosMios.some((e) => normalizar(e.nombre).includes(palabra))) puntos += 3;
      }
      if (!puntos) continue;

      const fotos = (medios ?? []).filter((m) => m.negocio_id === n.id);
      const portada = fotos.find((m) => m.es_portada) ?? fotos[0];
      const primerEvento = eventosMios[0];

      resultado.push({
        id: n.id,
        nombre: n.nombre_negocio,
        municipio: n.municipio,
        descripcion: perfil?.descripcion ?? null,
        foto: portada ? urlImagen(portada.secure_url, "tarjeta") : null,
        logotipo: perfil?.foto_principal ?? null,
        latitud: perfil?.latitud ?? null,
        longitud: perfil?.longitud ?? null,
        subcategorias,
        ambiente,
        restriccion_edad: perfil?.restriccion_edad ?? "sin_restriccion",
        cover_texto: textoCover(
          perfil?.cover_activo === true,
          perfil?.cover_tipo ?? null,
          perfil?.cover_monto != null ? Number(perfil.cover_monto) : null,
        ),
        reserva_recomendada: perfil?.reserva_recomendada ?? "no",
        evento: primerEvento
          ? {
              id: primerEvento.id,
              nombre: primerEvento.nombre,
              descripcion: primerEvento.descripcion,
              fecha: primerEvento.fecha,
              hora: primerEvento.hora,
              foto_url: primerEvento.foto_url,
              cover_monto:
                primerEvento.cover_monto != null ? Number(primerEvento.cover_monto) : null,
            }
          : null,
        horarios: (horarios ?? [])
          .filter((h) => h.negocio_id === n.id)
          .map((h) => ({
            dia: h.dia,
            abierto: h.abierto,
            apertura: h.apertura,
            cierre: h.cierre,
          })),
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

export const fichaLugar = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<FichaLugar | null> => {
    const db = await admin();
    const { data: n } = await db
      .from("negocios")
      .select("id, nombre_negocio, municipio, tipo, celular, estatus, estado_configuracion, fecha_fin")
      .eq("id", data.id)
      .maybeSingle();
    if (
      !n ||
      n.tipo !== TIPO ||
      n.estatus !== "activo" ||
      n.estado_configuracion !== "perfil_completo" ||
      n.fecha_fin < HOY()
    )
      return null;

    const [{ data: perfil }, { data: medios }, { data: eventos }, { data: horarios }, { data: promos }] =
      await Promise.all([
        db.from("negocio_perfil").select("*").eq("negocio_id", n.id).maybeSingle(),
        db
          .from("negocio_medios")
          .select("id, tipo, secure_url, es_portada, es_destacado, orden")
          .eq("negocio_id", n.id)
          .order("orden"),
        db
          .from("negocio_eventos")
          .select("id, nombre, descripcion, fecha, hora, foto_url, cover_monto")
          .eq("negocio_id", n.id)
          .eq("activo", true)
          .order("fecha"),
        db
          .from("negocio_horarios")
          .select("dia, abierto, apertura, cierre")
          .eq("negocio_id", n.id)
          .order("dia"),
        db
          .from("negocio_promociones")
          .select("id, titulo, descripcion, foto_url, precio, fecha_fin, activa")
          .eq("negocio_id", n.id)
          .eq("activa", true),
      ]);

    const fotos = (medios ?? []).filter((m) => m.tipo === "image");
    const portada = fotos.find((m) => m.es_portada) ?? fotos[0];
    const eventosVigentes = (eventos ?? [])
      .filter((e) => !e.fecha || e.fecha >= HOY())
      .map((e) => ({
        id: e.id,
        nombre: e.nombre,
        descripcion: e.descripcion,
        fecha: e.fecha,
        hora: e.hora,
        foto_url: e.foto_url,
        cover_monto: e.cover_monto != null ? Number(e.cover_monto) : null,
      }));

    return {
      id: n.id,
      nombre: n.nombre_negocio,
      municipio: n.municipio,
      descripcion: perfil?.descripcion ?? null,
      foto: portada ? urlImagen(portada.secure_url, "ficha") : null,
      logotipo: perfil?.foto_principal ?? null,
      latitud: perfil?.latitud ?? null,
      longitud: perfil?.longitud ?? null,
      subcategorias: (perfil?.divertirme_tipos ?? []) as string[],
      ambiente: (perfil?.ambiente ?? []) as string[],
      restriccion_edad: perfil?.restriccion_edad ?? "sin_restriccion",
      cover_texto: textoCover(
        perfil?.cover_activo === true,
        perfil?.cover_tipo ?? null,
        perfil?.cover_monto != null ? Number(perfil.cover_monto) : null,
      ),
      reserva_recomendada: perfil?.reserva_recomendada ?? "no",
      evento: eventosVigentes[0] ?? null,
      horarios: (horarios ?? []).map((h) => ({
        dia: h.dia,
        abierto: h.abierto,
        apertura: h.apertura,
        cierre: h.cierre,
      })),
      direccion: perfil?.direccion ?? null,
      restriccion_notas: perfil?.restriccion_notas ?? null,
      horario_notas: perfil?.horario_notas ?? null,
      menu_url: perfil?.menu_url ?? null,
      menu_tipo: perfil?.menu_tipo ?? null,
      whatsapp:
        perfil?.whatsapp_activo === false
          ? n.celular
          : (perfil?.whatsapp_numero ?? n.celular),
      telefono: n.celular,
      facebook: perfil?.facebook ?? null,
      instagram: perfil?.instagram ?? null,
      sitio_web: perfil?.sitio_web ?? null,
      medios: (medios ?? []).map((m) => ({
        id: m.id,
        tipo: m.tipo === "video" ? ("video" as const) : ("image" as const),
        url: m.secure_url,
        destacado: m.es_destacado === true,
      })),
      eventos: eventosVigentes,
      promociones: (promos ?? []).map((p) => ({
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        foto_url: p.foto_url,
        precio: p.precio != null ? Number(p.precio) : null,
      })),
    };
  });

/**
 * Registra el CONTACTO_GENERADO antes de abrir WhatsApp.
 * TFY no reserva mesas, no cobra cover y no confirma acceso: el negocio responde directo.
 */
export const crearContactoDivertirme = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      negocio_id: string;
      evento_id?: string | null;
      fecha_visita?: string | null;
      hora_visita?: string | null;
      personas?: number | null;
      cliente_nombre: string;
      cliente_telefono: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const nombre = (data.cliente_nombre ?? "").trim();
    const telefono = soloDigitos(data.cliente_telefono);
    if (!nombre) throw new Error("Escribe tu nombre");
    if (telefono.length < 10) throw new Error("Escribe un teléfono de 10 dígitos");

    const db = await admin();
    const { data: n } = await db
      .from("negocios")
      .select("id, nombre_negocio, celular, tipo, estatus, estado_configuracion, fecha_fin")
      .eq("id", data.negocio_id)
      .maybeSingle();
    if (
      !n ||
      n.tipo !== TIPO ||
      n.estatus !== "activo" ||
      n.estado_configuracion !== "perfil_completo" ||
      n.fecha_fin < HOY()
    )
      throw new Error("Este lugar no está disponible por ahora");

    const { data: perfil } = await db
      .from("negocio_perfil")
      .select("whatsapp_activo, whatsapp_numero, reserva_recomendada")
      .eq("negocio_id", n.id)
      .maybeSingle();

    const fecha = data.fecha_visita && fechaValidaD(data.fecha_visita) ? data.fecha_visita : null;
    const personas =
      data.personas != null && Number(data.personas) > 0
        ? Math.min(200, Math.round(Number(data.personas)))
        : null;

    const { data: contacto, error } = await db
      .from("contactos_divertirme")
      .insert({
        negocio_id: n.id,
        evento_id: data.evento_id ?? null,
        fecha_visita: fecha,
        hora_visita: (data.hora_visita ?? "").trim() || null,
        personas,
        cliente_nombre: nombre.slice(0, 80),
        cliente_telefono: telefono,
      })
      .select("id, folio")
      .single();
    if (error) throw new Error(error.message);

    const whatsapp =
      perfil?.whatsapp_activo === false ? n.celular : (perfil?.whatsapp_numero ?? n.celular);

    return {
      id: contacto.id as string,
      folio: contacto.folio as string,
      negocio: n.nombre_negocio,
      fecha_visita: fecha,
      hora_visita: (data.hora_visita ?? "").trim() || null,
      personas,
      reserva_recomendada: perfil?.reserva_recomendada ?? "no",
      whatsapp: soloDigitos(whatsapp ?? ""),
    };
  });

export const marcarContactoEnviado = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("contactos_divertirme")
      .update({ estado: "ENVIADO_A_WHATSAPP" })
      .eq("id", data.id)
      .eq("estado", "CONTACTO_GENERADO");
    return { ok: true };
  });
