import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CLAVES_COSTO_ENTREGA,
  CLAVES_ENTREGA,
  CLAVES_PRECIO_RENTA,
  CLAVES_TARJETA,
  CLAVES_TRANSMISION,
  fechaValida,
  fechasDelRango,
} from "@/lib/moverme";

export type MedioVehiculo = {
  id: string;
  tipo: "image" | "video";
  secure_url: string;
  public_id: string;
  orden: number;
  es_portada: boolean;
};

export type VehiculoRow = {
  id: string;
  negocio_id: string;
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
  activo: boolean;
  orden: number;
  medios: MedioVehiculo[];
};

export type BloqueoVehiculoRow = { fecha: string; unidades: number };

export type SolicitudRentaRow = {
  id: string;
  folio: string;
  creado_en: string;
  vehiculo_nombre: string;
  fecha_inicio: string;
  hora_inicio: string;
  fecha_fin: string;
  hora_fin: string;
  dias: number;
  pasajeros: number | null;
  lugar_entrega: string;
  precio_referencia: number | null;
  costo_entrega: number | null;
  total_estimado: number | null;
  cliente_nombre: string;
  cliente_telefono: string;
  modo_disponibilidad: string;
  estado: string;
};

export type ConfiguracionRenta = {
  renta_usa_calendario: boolean;
  renta_edad_minima: number | null;
  renta_licencia: boolean;
  renta_identificacion: boolean;
  renta_deposito: boolean;
  renta_tarjeta: string;
  renta_requisitos_notas: string | null;
  renta_entrega_opciones: string[];
  renta_entrega_costo_tipo: string;
  renta_entrega_costo: number | null;
  renta_notas: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function miNegocioId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("negocios")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) throw new Error("No encontramos tu negocio");
  return data.id as string;
}

export const misVehiculos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VehiculoRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_vehiculos")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("orden")
      .order("creado_en");
    const filas = data ?? [];
    if (!filas.length) return [];

    const { data: medios } = await context.supabase
      .from("vehiculo_medios")
      .select("id, vehiculo_id, tipo, secure_url, public_id, orden, es_portada")
      .in(
        "vehiculo_id",
        filas.map((f) => f.id),
      )
      .order("orden");

    return filas.map((f) => ({
      id: f.id,
      negocio_id: f.negocio_id,
      nombre: f.nombre,
      modelo_referencia: f.modelo_referencia,
      descripcion: f.descripcion,
      pasajeros: f.pasajeros,
      transmision: f.transmision,
      aire_acondicionado: f.aire_acondicionado,
      equipaje: f.equipaje,
      precio: f.precio != null ? Number(f.precio) : null,
      precio_tipo: f.precio_tipo,
      unidades: f.unidades,
      activo: f.activo,
      orden: f.orden,
      medios: (medios ?? [])
        .filter((m) => m.vehiculo_id === f.id)
        .map((m) => ({
          id: m.id,
          tipo: m.tipo === "video" ? ("video" as const) : ("image" as const),
          secure_url: m.secure_url,
          public_id: m.public_id,
          orden: m.orden,
          es_portada: m.es_portada,
        })),
    }));
  });

export const guardarVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string | null;
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
      activo: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const nombre = (data.nombre ?? "").trim();
    if (!nombre) throw new Error("Escribe el nombre o la categoría del vehículo");

    const fila = {
      negocio_id: negocioId,
      nombre: nombre.slice(0, 80),
      modelo_referencia: (data.modelo_referencia ?? "").trim().slice(0, 80) || null,
      descripcion: (data.descripcion ?? "").trim().slice(0, 600) || null,
      pasajeros: Math.min(30, Math.max(1, Math.round(Number(data.pasajeros) || 5))),
      transmision: CLAVES_TRANSMISION.includes(data.transmision) ? data.transmision : "automatica",
      aire_acondicionado: data.aire_acondicionado !== false,
      equipaje: (data.equipaje ?? "").trim().slice(0, 80) || null,
      precio: data.precio != null && Number(data.precio) > 0 ? Number(data.precio) : null,
      precio_tipo: CLAVES_PRECIO_RENTA.includes(data.precio_tipo) ? data.precio_tipo : "consultar",
      unidades: Math.min(200, Math.max(1, Math.round(Number(data.unidades) || 1))),
      activo: data.activo !== false,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("negocio_vehiculos")
        .update(fila)
        .eq("id", data.id)
        .eq("negocio_id", negocioId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: creado, error } = await context.supabase
      .from("negocio_vehiculos")
      .insert(fila)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: creado.id as string };
  });

export const borrarVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("negocio_vehiculos")
      .delete()
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const agregarMedioVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      vehiculo_id: string;
      tipo: "image" | "video";
      public_id: string;
      secure_url: string;
      resource_type: string;
      duration?: number | null;
      format?: string | null;
      bytes?: number | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { count } = await context.supabase
      .from("vehiculo_medios")
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", data.vehiculo_id)
      .eq("tipo", data.tipo);
    const limite = data.tipo === "video" ? 5 : 15;
    if ((count ?? 0) >= limite)
      throw new Error(
        data.tipo === "video" ? "Máximo 5 videos por vehículo" : "Máximo 15 fotos por vehículo",
      );

    const { error } = await context.supabase.from("vehiculo_medios").insert({
      vehiculo_id: data.vehiculo_id,
      negocio_id: negocioId,
      tipo: data.tipo,
      public_id: data.public_id,
      secure_url: data.secure_url,
      resource_type: data.resource_type,
      orden: count ?? 0,
      es_portada: data.tipo === "image" && (count ?? 0) === 0,
      duration: data.duration ?? null,
      format: data.format ?? null,
      bytes: data.bytes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarMedioVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data: medio } = await context.supabase
      .from("vehiculo_medios")
      .select("public_id, resource_type")
      .eq("id", data.id)
      .eq("negocio_id", negocioId)
      .maybeSingle();
    if (!medio) throw new Error("No encontramos ese archivo");
    await context.supabase
      .from("medios_pendientes_borrado")
      .insert({ public_id: medio.public_id, resource_type: medio.resource_type });
    await context.supabase.from("vehiculo_medios").delete().eq("id", data.id);
    return { ok: true };
  });

export const portadaVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; vehiculo_id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    await context.supabase
      .from("vehiculo_medios")
      .update({ es_portada: false })
      .eq("vehiculo_id", data.vehiculo_id)
      .eq("negocio_id", negocioId);
    await context.supabase
      .from("vehiculo_medios")
      .update({ es_portada: true })
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    return { ok: true };
  });

/* ---------- Requisitos, entrega y decisión de calendario ---------- */

export const miConfiguracionRenta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConfiguracionRenta> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_perfil")
      .select(
        "renta_usa_calendario, renta_edad_minima, renta_licencia, renta_identificacion, renta_deposito, renta_tarjeta, renta_requisitos_notas, renta_entrega_opciones, renta_entrega_costo_tipo, renta_entrega_costo, renta_notas",
      )
      .eq("negocio_id", negocioId)
      .maybeSingle();
    return {
      renta_usa_calendario: data?.renta_usa_calendario === true,
      renta_edad_minima: data?.renta_edad_minima ?? null,
      renta_licencia: data?.renta_licencia !== false,
      renta_identificacion: data?.renta_identificacion !== false,
      renta_deposito: data?.renta_deposito === true,
      renta_tarjeta: data?.renta_tarjeta ?? "no",
      renta_requisitos_notas: data?.renta_requisitos_notas ?? null,
      renta_entrega_opciones: (data?.renta_entrega_opciones ?? []) as string[],
      renta_entrega_costo_tipo: data?.renta_entrega_costo_tipo ?? "sin_costo",
      renta_entrega_costo: data?.renta_entrega_costo != null ? Number(data.renta_entrega_costo) : null,
      renta_notas: data?.renta_notas ?? null,
    };
  });

export const guardarConfiguracionRenta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<ConfiguracionRenta>) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const cambios: {
      renta_usa_calendario?: boolean;
      renta_edad_minima?: number | null;
      renta_licencia?: boolean;
      renta_identificacion?: boolean;
      renta_deposito?: boolean;
      renta_tarjeta?: string;
      renta_requisitos_notas?: string | null;
      renta_entrega_opciones?: string[];
      renta_entrega_costo_tipo?: string;
      renta_entrega_costo?: number | null;
      renta_notas?: string | null;
    } = {};
    if (data.renta_usa_calendario !== undefined)
      cambios["renta_usa_calendario"] = data.renta_usa_calendario === true;
    if (data.renta_edad_minima !== undefined)
      cambios["renta_edad_minima"] =
        data.renta_edad_minima != null && Number(data.renta_edad_minima) > 0
          ? Math.min(99, Math.round(Number(data.renta_edad_minima)))
          : null;
    if (data.renta_licencia !== undefined) cambios["renta_licencia"] = data.renta_licencia === true;
    if (data.renta_identificacion !== undefined)
      cambios["renta_identificacion"] = data.renta_identificacion === true;
    if (data.renta_deposito !== undefined) cambios["renta_deposito"] = data.renta_deposito === true;
    if (data.renta_tarjeta !== undefined)
      cambios["renta_tarjeta"] = CLAVES_TARJETA.includes(data.renta_tarjeta ?? "")
        ? data.renta_tarjeta
        : "no";
    if (data.renta_requisitos_notas !== undefined)
      cambios["renta_requisitos_notas"] = (data.renta_requisitos_notas ?? "").slice(0, 600) || null;
    if (data.renta_entrega_opciones !== undefined)
      cambios["renta_entrega_opciones"] = (data.renta_entrega_opciones ?? []).filter((o) =>
        CLAVES_ENTREGA.includes(o),
      );
    if (data.renta_entrega_costo_tipo !== undefined)
      cambios["renta_entrega_costo_tipo"] = CLAVES_COSTO_ENTREGA.includes(
        data.renta_entrega_costo_tipo ?? "",
      )
        ? data.renta_entrega_costo_tipo
        : "sin_costo";
    if (data.renta_entrega_costo !== undefined)
      cambios["renta_entrega_costo"] =
        data.renta_entrega_costo != null && Number(data.renta_entrega_costo) > 0
          ? Number(data.renta_entrega_costo)
          : null;
    if (data.renta_notas !== undefined)
      cambios["renta_notas"] = (data.renta_notas ?? "").slice(0, 600) || null;

    const { error } = await context.supabase
      .from("negocio_perfil")
      .update(cambios)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Calendario simple por unidades ---------- */

export const bloqueosVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { vehiculo_id: string; desde: string; hasta: string }) => d)
  .handler(async ({ data, context }): Promise<BloqueoVehiculoRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data: filas } = await context.supabase
      .from("vehiculo_bloqueos")
      .select("fecha, unidades")
      .eq("negocio_id", negocioId)
      .eq("vehiculo_id", data.vehiculo_id)
      .gte("fecha", data.desde)
      .lte("fecha", data.hasta)
      .order("fecha");
    return (filas ?? []).map((f) => ({ fecha: f.fecha, unidades: f.unidades }));
  });

export const cambiarBloqueoVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      vehiculo_id: string;
      desde: string;
      hasta: string;
      unidades?: number | null;
      bloquear: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    if (!fechaValida(data.desde) || !fechaValida(data.hasta)) throw new Error("Fechas inválidas");

    const { data: vehiculo } = await context.supabase
      .from("negocio_vehiculos")
      .select("id, unidades")
      .eq("id", data.vehiculo_id)
      .eq("negocio_id", negocioId)
      .maybeSingle();
    if (!vehiculo) throw new Error("No encontramos ese vehículo");

    const inicio = data.desde <= data.hasta ? data.desde : data.hasta;
    const fin = data.desde <= data.hasta ? data.hasta : data.desde;
    const fechas = fechasDelRango(inicio, fin);

    if (!data.bloquear) {
      const { error } = await context.supabase
        .from("vehiculo_bloqueos")
        .delete()
        .eq("negocio_id", negocioId)
        .eq("vehiculo_id", data.vehiculo_id)
        .in("fecha", fechas);
      if (error) throw new Error(error.message);
      return { ok: true, fechas: fechas.length, unidades: 0 };
    }

    const unidades = Math.min(
      vehiculo.unidades,
      Math.max(1, Math.round(Number(data.unidades) || vehiculo.unidades)),
    );

    const { error } = await context.supabase.from("vehiculo_bloqueos").upsert(
      fechas.map((fecha) => ({
        negocio_id: negocioId,
        vehiculo_id: data.vehiculo_id,
        fecha,
        unidades,
      })),
      { onConflict: "vehiculo_id,fecha" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, fechas: fechas.length, unidades };
  });

/* ---------- Solicitudes ---------- */

export const misSolicitudesRenta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SolicitudRentaRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("solicitudes_renta")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("creado_en", { ascending: false })
      .limit(200);
    return (data ?? []).map((s) => ({
      id: s.id,
      folio: s.folio,
      creado_en: s.creado_en,
      vehiculo_nombre: s.vehiculo_nombre,
      fecha_inicio: s.fecha_inicio,
      hora_inicio: s.hora_inicio,
      fecha_fin: s.fecha_fin,
      hora_fin: s.hora_fin,
      dias: s.dias,
      pasajeros: s.pasajeros,
      lugar_entrega: s.lugar_entrega,
      precio_referencia: s.precio_referencia != null ? Number(s.precio_referencia) : null,
      costo_entrega: s.costo_entrega != null ? Number(s.costo_entrega) : null,
      total_estimado: s.total_estimado != null ? Number(s.total_estimado) : null,
      cliente_nombre: s.cliente_nombre,
      cliente_telefono: s.cliente_telefono,
      modo_disponibilidad: s.modo_disponibilidad,
      estado: s.estado,
    }));
  });

/** Métrica para el panel Master. */
export const solicitudesRentaDeNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { negocio_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: filas } = await context.supabase
      .from("solicitudes_renta")
      .select("id, creado_en")
      .eq("negocio_id", data.negocio_id);
    const lista = filas ?? [];
    const inicio = new Date();
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    return {
      total: lista.length,
      mes: lista.filter((r) => new Date(r.creado_en) >= inicio).length,
    };
  });
