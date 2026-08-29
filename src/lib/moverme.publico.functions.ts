import { createServerFn } from "@tanstack/react-start";
import { urlImagen } from "@/lib/cloudinary";
import {
  diasRenta,
  fechasDelRango,
  totalRenta,
  type ModoDisponibilidadRenta,
} from "@/lib/moverme";

export type MedioVehiculoPublico = { id: string; tipo: "image" | "video"; url: string };

export type TarjetaVehiculo = {
  id: string;
  nombre: string;
  modelo_referencia: string | null;
  descripcion: string | null;
  pasajeros: number;
  transmision: string;
  aire_acondicionado: boolean;
  equipaje: string | null;
  precio: number | null;
  precio_tipo: string;
  unidades: number;
  foto: string | null;
  negocio_id: string;
  negocio: string;
  municipio: string;
  latitud: number | null;
  longitud: number | null;
  modo_disponibilidad: ModoDisponibilidadRenta;
  dias: number | null;
  total_estimado: number | null;
  entrega_opciones: string[];
  requiere_deposito: boolean;
};

export type FichaVehiculo = TarjetaVehiculo & {
  medios: MedioVehiculoPublico[];
  direccion: string | null;
  whatsapp: string | null;
  telefono: string | null;
  edad_minima: number | null;
  licencia: boolean;
  identificacion: boolean;
  tarjeta: string;
  requisitos_notas: string | null;
  entrega_costo_tipo: string;
  entrega_costo: number | null;
  notas: string | null;
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
 * Búsqueda pública de vehículos de renta.
 * Con calendario activo se descartan los rangos sin unidades libres;
 * sin calendario nunca se excluye: se muestra “Disponibilidad por confirmar”.
 */
export const buscarVehiculos = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      texto?: string;
      municipio?: string | null;
      inicio?: string | null;
      hora_inicio?: string | null;
      fin?: string | null;
      hora_fin?: string | null;
      pasajeros?: number | null;
      entrega?: string | null;
      lat?: number | null;
      lng?: number | null;
    }) => d,
  )
  .handler(async ({ data }): Promise<TarjetaVehiculo[]> => {
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
    const [{ data: vehiculos }, { data: perfiles }] = await Promise.all([
      db
        .from("negocio_vehiculos")
        .select("*")
        .in("negocio_id", ids)
        .eq("activo", true)
        .order("orden"),
      db
        .from("negocio_perfil")
        .select(
          "negocio_id, latitud, longitud, renta_usa_calendario, renta_entrega_opciones, renta_deposito",
        )
        .in("negocio_id", ids),
    ]);
    const lista = vehiculos ?? [];
    if (!lista.length) return [];

    const vehIds = lista.map((v) => v.id);
    const fechasBuscadas =
      data.inicio && data.fin ? fechasDelRango(data.inicio, data.fin) : [];

    const [{ data: medios }, { data: bloqueos }] = await Promise.all([
      db
        .from("vehiculo_medios")
        .select("vehiculo_id, secure_url, tipo, es_portada, orden")
        .in("vehiculo_id", vehIds)
        .order("orden"),
      fechasBuscadas.length
        ? db
            .from("vehiculo_bloqueos")
            .select("vehiculo_id, fecha, unidades")
            .in("vehiculo_id", vehIds)
            .in("fecha", fechasBuscadas)
        : Promise.resolve({ data: [] as { vehiculo_id: string; unidades: number }[] }),
    ]);

    const negocioPorId = new Map(visibles.map((n) => [n.id, n]));
    const perfilPorId = new Map((perfiles ?? []).map((p) => [p.negocio_id, p]));

    const texto = normalizar(data.texto ?? "");
    const palabras = texto.split(/\s+/).filter(Boolean);
    const pasajeros = data.pasajeros != null ? Math.max(1, Math.round(data.pasajeros)) : null;
    const dias =
      data.inicio && data.fin
        ? diasRenta(
            data.inicio,
            data.hora_inicio ?? "10:00",
            data.fin,
            data.hora_fin ?? "10:00",
          )
        : null;

    const resultado: (TarjetaVehiculo & { _puntos: number; _dist: number })[] = [];

    for (const v of lista) {
      const negocio = negocioPorId.get(v.negocio_id);
      if (!negocio) continue;
      if (data.municipio && negocio.municipio !== data.municipio) continue;
      if (pasajeros && v.pasajeros < pasajeros) continue;

      const perfil = perfilPorId.get(v.negocio_id);
      const entregas = (perfil?.renta_entrega_opciones ?? []) as string[];
      if (data.entrega && entregas.length && !entregas.includes(data.entrega)) continue;

      let puntos = palabras.length ? 0 : 1;
      for (const palabra of palabras) {
        if (normalizar(v.nombre).includes(palabra)) puntos += 5;
        if (normalizar(v.modelo_referencia ?? "").includes(palabra)) puntos += 4;
        if (normalizar(negocio.nombre_negocio).includes(palabra)) puntos += 3;
        if (normalizar(negocio.municipio).includes(palabra)) puntos += 3;
        if (normalizar(v.descripcion ?? "").includes(palabra)) puntos += 2;
      }
      if (!puntos) continue;

      const usaCalendario = perfil?.renta_usa_calendario === true;
      if (usaCalendario && fechasBuscadas.length) {
        const mios = (bloqueos ?? []).filter((b) => b.vehiculo_id === v.id);
        if (mios.some((b) => b.unidades >= v.unidades)) continue;
      }

      const fotos = (medios ?? []).filter((m) => m.vehiculo_id === v.id && m.tipo === "image");
      const portada = fotos.find((m) => m.es_portada) ?? fotos[0];
      const precio = v.precio != null ? Number(v.precio) : null;

      resultado.push({
        id: v.id,
        nombre: v.nombre,
        modelo_referencia: v.modelo_referencia,
        descripcion: v.descripcion,
        pasajeros: v.pasajeros,
        transmision: v.transmision,
        aire_acondicionado: v.aire_acondicionado,
        equipaje: v.equipaje,
        precio,
        precio_tipo: v.precio_tipo,
        unidades: v.unidades,
        foto: portada ? urlImagen(portada.secure_url, "tarjeta") : null,
        negocio_id: v.negocio_id,
        negocio: negocio.nombre_negocio,
        municipio: negocio.municipio,
        latitud: perfil?.latitud ?? null,
        longitud: perfil?.longitud ?? null,
        modo_disponibilidad: usaCalendario ? "con_calendario" : "sin_calendario",
        dias,
        total_estimado: totalRenta(precio, v.precio_tipo, dias),
        entrega_opciones: entregas,
        requiere_deposito: perfil?.renta_deposito === true,
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

export const fichaVehiculo = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id: string;
      inicio?: string | null;
      hora_inicio?: string | null;
      fin?: string | null;
      hora_fin?: string | null;
    }) => d,
  )
  .handler(async ({ data }): Promise<FichaVehiculo | null> => {
    const db = await admin();
    const { data: v } = await db
      .from("negocio_vehiculos")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!v) return null;

    const { data: negocio } = await db
      .from("negocios")
      .select("id, nombre_negocio, municipio, celular, estatus, estado_configuracion, fecha_fin")
      .eq("id", v.negocio_id)
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
          "latitud, longitud, direccion, whatsapp_activo, whatsapp_numero, renta_usa_calendario, renta_edad_minima, renta_licencia, renta_identificacion, renta_deposito, renta_tarjeta, renta_requisitos_notas, renta_entrega_opciones, renta_entrega_costo_tipo, renta_entrega_costo, renta_notas",
        )
        .eq("negocio_id", negocio.id)
        .maybeSingle(),
      db
        .from("vehiculo_medios")
        .select("id, tipo, secure_url, es_portada, orden")
        .eq("vehiculo_id", v.id)
        .order("orden"),
    ]);

    const fotos = (medios ?? []).filter((m) => m.tipo === "image");
    const portada = fotos.find((m) => m.es_portada) ?? fotos[0];
    const precio = v.precio != null ? Number(v.precio) : null;
    const dias =
      data.inicio && data.fin
        ? diasRenta(data.inicio, data.hora_inicio ?? "10:00", data.fin, data.hora_fin ?? "10:00")
        : null;

    return {
      id: v.id,
      nombre: v.nombre,
      modelo_referencia: v.modelo_referencia,
      descripcion: v.descripcion,
      pasajeros: v.pasajeros,
      transmision: v.transmision,
      aire_acondicionado: v.aire_acondicionado,
      equipaje: v.equipaje,
      precio,
      precio_tipo: v.precio_tipo,
      unidades: v.unidades,
      foto: portada ? urlImagen(portada.secure_url, "ficha") : null,
      negocio_id: negocio.id,
      negocio: negocio.nombre_negocio,
      municipio: negocio.municipio,
      latitud: perfil?.latitud ?? null,
      longitud: perfil?.longitud ?? null,
      modo_disponibilidad:
        perfil?.renta_usa_calendario === true ? "con_calendario" : "sin_calendario",
      dias,
      total_estimado: totalRenta(precio, v.precio_tipo, dias),
      entrega_opciones: (perfil?.renta_entrega_opciones ?? []) as string[],
      requiere_deposito: perfil?.renta_deposito === true,
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
      edad_minima: perfil?.renta_edad_minima ?? null,
      licencia: perfil?.renta_licencia !== false,
      identificacion: perfil?.renta_identificacion !== false,
      tarjeta: perfil?.renta_tarjeta ?? "no",
      requisitos_notas: perfil?.renta_requisitos_notas ?? null,
      entrega_costo_tipo: perfil?.renta_entrega_costo_tipo ?? "sin_costo",
      entrega_costo: perfil?.renta_entrega_costo != null ? Number(perfil.renta_entrega_costo) : null,
      notas: perfil?.renta_notas ?? null,
      activo: v.activo === true,
    };
  });

/** Fechas sin unidades libres (sólo cuando la rentadora usa calendario). */
export const fechasNoDisponiblesVehiculo = createServerFn({ method: "POST" })
  .inputValidator((d: { vehiculo_id: string }) => d)
  .handler(async ({ data }): Promise<string[]> => {
    const db = await admin();
    const { data: v } = await db
      .from("negocio_vehiculos")
      .select("id, negocio_id, unidades")
      .eq("id", data.vehiculo_id)
      .maybeSingle();
    if (!v) return [];
    const { data: perfil } = await db
      .from("negocio_perfil")
      .select("renta_usa_calendario")
      .eq("negocio_id", v.negocio_id)
      .maybeSingle();
    if (perfil?.renta_usa_calendario !== true) return [];
    const { data: bloqueos } = await db
      .from("vehiculo_bloqueos")
      .select("fecha, unidades")
      .eq("vehiculo_id", v.id)
      .gte("fecha", HOY())
      .order("fecha");
    return (bloqueos ?? []).filter((b) => b.unidades >= v.unidades).map((b) => b.fecha);
  });

/**
 * Registra la SOLICITUD DE RENTA antes de abrir WhatsApp.
 * TFY no confirma vehículos, no cobra renta ni depósitos: la rentadora confirma todo directamente.
 */
export const crearSolicitudRenta = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      vehiculo_id: string;
      inicio: string;
      hora_inicio: string;
      fin: string;
      hora_fin: string;
      pasajeros?: number | null;
      lugar_entrega: string;
      cliente_nombre: string;
      cliente_telefono: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const nombre = (data.cliente_nombre ?? "").trim();
    const telefono = soloDigitos(data.cliente_telefono);
    if (!nombre) throw new Error("Escribe tu nombre");
    if (telefono.length < 10) throw new Error("Escribe un teléfono de 10 dígitos");

    const dias = diasRenta(data.inicio, data.hora_inicio, data.fin, data.hora_fin);
    if (!dias) throw new Error("La devolución debe ser posterior a la entrega");
    if (data.inicio < HOY()) throw new Error("La fecha de entrega ya pasó");

    const db = await admin();
    const { data: v } = await db
      .from("negocio_vehiculos")
      .select("*")
      .eq("id", data.vehiculo_id)
      .maybeSingle();
    if (!v || v.activo !== true) throw new Error("Este vehículo no está disponible por ahora");

    const { data: negocio } = await db
      .from("negocios")
      .select("id, nombre_negocio, municipio, celular, estatus, estado_configuracion, fecha_fin")
      .eq("id", v.negocio_id)
      .maybeSingle();
    if (
      !negocio ||
      negocio.estatus !== "activo" ||
      negocio.estado_configuracion !== "perfil_completo" ||
      negocio.fecha_fin < HOY()
    )
      throw new Error("Esta rentadora no está disponible");

    const { data: perfil } = await db
      .from("negocio_perfil")
      .select(
        "whatsapp_activo, whatsapp_numero, renta_usa_calendario, renta_deposito, renta_entrega_costo_tipo, renta_entrega_costo",
      )
      .eq("negocio_id", negocio.id)
      .maybeSingle();
    const usaCalendario = perfil?.renta_usa_calendario === true;

    if (usaCalendario) {
      const fechas = fechasDelRango(data.inicio, data.fin);
      const { data: bloqueos } = await db
        .from("vehiculo_bloqueos")
        .select("fecha, unidades")
        .eq("vehiculo_id", v.id)
        .in("fecha", fechas);
      if ((bloqueos ?? []).some((b) => b.unidades >= v.unidades))
        throw new Error("Esas fechas ya no están disponibles, elige otras");
    }

    const pasajeros =
      data.pasajeros != null && Number(data.pasajeros) > 0
        ? Math.round(Number(data.pasajeros))
        : null;
    if (pasajeros && pasajeros > v.pasajeros)
      throw new Error(`Este vehículo es para máximo ${v.pasajeros} pasajeros`);

    const precio = v.precio != null ? Number(v.precio) : null;
    const renta = totalRenta(precio, v.precio_tipo, dias);
    const costoEntrega =
      perfil?.renta_entrega_costo_tipo === "fijo" && perfil?.renta_entrega_costo != null
        ? Number(perfil.renta_entrega_costo)
        : null;
    const total = renta != null ? renta + (costoEntrega ?? 0) : null;

    const { data: solicitud, error } = await db
      .from("solicitudes_renta")
      .insert({
        negocio_id: negocio.id,
        vehiculo_id: v.id,
        vehiculo_nombre: v.nombre,
        fecha_inicio: data.inicio,
        hora_inicio: data.hora_inicio,
        fecha_fin: data.fin,
        hora_fin: data.hora_fin,
        dias,
        pasajeros,
        lugar_entrega: data.lugar_entrega,
        precio_referencia: precio,
        costo_entrega: costoEntrega,
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
      vehiculo: v.nombre as string,
      modelo_referencia: (v.modelo_referencia ?? null) as string | null,
      dias,
      pasajeros,
      lugar_entrega: data.lugar_entrega,
      precio_referencia: precio,
      precio_tipo: v.precio_tipo as string,
      costo_entrega: costoEntrega,
      total_estimado: total,
      modo_disponibilidad: (usaCalendario
        ? "con_calendario"
        : "sin_calendario") as ModoDisponibilidadRenta,
      requiere_deposito: perfil?.renta_deposito === true,
      whatsapp: soloDigitos(whatsapp ?? ""),
    };
  });

export const marcarSolicitudRentaEnviada = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("solicitudes_renta")
      .update({ estado: "ENVIADA_A_WHATSAPP" })
      .eq("id", data.id)
      .eq("estado", "SOLICITUD_GENERADA");
    return { ok: true };
  });
