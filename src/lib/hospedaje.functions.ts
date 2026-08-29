import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CLAVES_ALOJAMIENTO,
  CLAVES_PRECIO_HOSPEDAJE,
  fechaValida,
  nochesDelRango,
} from "@/lib/hospedaje";

export type MedioAlojamiento = {
  id: string;
  tipo: "image" | "video";
  secure_url: string;
  public_id: string;
  orden: number;
  es_portada: boolean;
};

export type AlojamientoRow = {
  id: string;
  negocio_id: string;
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
  activo: boolean;
  orden: number;
  medios: MedioAlojamiento[];
};

export type BloqueoRow = { fecha: string; unidades: number };

export type SolicitudHospedajeRow = {
  id: string;
  folio: string;
  creado_en: string;
  alojamiento_nombre: string;
  check_in: string;
  check_out: string;
  noches: number;
  huespedes: number;
  precio_referencia: number | null;
  total_estimado: number | null;
  cliente_nombre: string;
  cliente_telefono: string;
  modo_disponibilidad: string;
  estado: string;
};

export type PoliticasHospedaje = {
  usa_calendario: boolean;
  checkin: string | null;
  checkout: string | null;
  acepta_mascotas: boolean;
  acepta_ninos: boolean;
  requiere_anticipo: boolean;
  notas_hospedaje: string | null;
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

export const misAlojamientos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlojamientoRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_alojamientos")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("orden")
      .order("creado_en");
    const filas = data ?? [];
    if (!filas.length) return [];

    const { data: medios } = await context.supabase
      .from("alojamiento_medios")
      .select("id, alojamiento_id, tipo, secure_url, public_id, orden, es_portada")
      .in(
        "alojamiento_id",
        filas.map((f) => f.id),
      )
      .order("orden");

    return filas.map((f) => ({
      id: f.id,
      negocio_id: f.negocio_id,
      nombre: f.nombre,
      tipo: f.tipo,
      descripcion: f.descripcion,
      capacidad: f.capacidad,
      camas: f.camas,
      tipo_camas: f.tipo_camas,
      precio: f.precio != null ? Number(f.precio) : null,
      precio_tipo: f.precio_tipo,
      servicios: (f.servicios ?? []) as string[],
      unidades: f.unidades,
      activo: f.activo,
      orden: f.orden,
      medios: (medios ?? [])
        .filter((m) => m.alojamiento_id === f.id)
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

export const guardarAlojamiento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string | null;
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
      activo: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const nombre = (data.nombre ?? "").trim();
    if (!nombre) throw new Error("Escribe el nombre del alojamiento");

    const fila = {
      negocio_id: negocioId,
      nombre: nombre.slice(0, 80),
      tipo: CLAVES_ALOJAMIENTO.includes(data.tipo) ? data.tipo : "habitacion",
      descripcion: (data.descripcion ?? "").trim().slice(0, 600) || null,
      capacidad: Math.min(50, Math.max(1, Math.round(Number(data.capacidad) || 1))),
      camas: data.camas != null && Number(data.camas) > 0 ? Math.round(Number(data.camas)) : null,
      tipo_camas: (data.tipo_camas ?? "").trim().slice(0, 60) || null,
      precio: data.precio != null && Number(data.precio) > 0 ? Number(data.precio) : null,
      precio_tipo: CLAVES_PRECIO_HOSPEDAJE.includes(data.precio_tipo)
        ? data.precio_tipo
        : "consultar",
      servicios: (data.servicios ?? []).map((s) => String(s).slice(0, 40)).slice(0, 20),
      unidades: Math.min(200, Math.max(1, Math.round(Number(data.unidades) || 1))),
      activo: data.activo !== false,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("negocio_alojamientos")
        .update(fila)
        .eq("id", data.id)
        .eq("negocio_id", negocioId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: creado, error } = await context.supabase
      .from("negocio_alojamientos")
      .insert(fila)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: creado.id as string };
  });

export const borrarAlojamiento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data: medios } = await context.supabase
      .from("alojamiento_medios")
      .select("public_id, resource_type")
      .eq("alojamiento_id", data.id)
      .eq("negocio_id", negocioId);
    for (const m of medios ?? []) {
      await context.supabase
        .from("medios_pendientes_borrado")
        .insert({ public_id: m.public_id, resource_type: m.resource_type });
    }
    const { error } = await context.supabase
      .from("negocio_alojamientos")
      .delete()
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const agregarMedioAlojamiento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      alojamiento_id: string;
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
      .from("alojamiento_medios")
      .select("id", { count: "exact", head: true })
      .eq("alojamiento_id", data.alojamiento_id)
      .eq("tipo", data.tipo);
    const limite = data.tipo === "video" ? 5 : 15;
    if ((count ?? 0) >= limite)
      throw new Error(
        data.tipo === "video"
          ? "Máximo 5 videos por alojamiento"
          : "Máximo 15 fotos por alojamiento",
      );

    const { error } = await context.supabase.from("alojamiento_medios").insert({
      alojamiento_id: data.alojamiento_id,
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

export const borrarMedioAlojamiento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data: medio } = await context.supabase
      .from("alojamiento_medios")
      .select("public_id, resource_type")
      .eq("id", data.id)
      .eq("negocio_id", negocioId)
      .maybeSingle();
    if (!medio) throw new Error("No encontramos ese archivo");
    await context.supabase
      .from("medios_pendientes_borrado")
      .insert({ public_id: medio.public_id, resource_type: medio.resource_type });
    await context.supabase.from("alojamiento_medios").delete().eq("id", data.id);
    return { ok: true };
  });

export const portadaAlojamiento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; alojamiento_id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    await context.supabase
      .from("alojamiento_medios")
      .update({ es_portada: false })
      .eq("alojamiento_id", data.alojamiento_id)
      .eq("negocio_id", negocioId);
    await context.supabase
      .from("alojamiento_medios")
      .update({ es_portada: true })
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    return { ok: true };
  });

/* ---------- Políticas y decisión de calendario ---------- */

export const misPoliticasHospedaje = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PoliticasHospedaje> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_perfil")
      .select(
        "usa_calendario, checkin, checkout, acepta_mascotas, acepta_ninos, requiere_anticipo, notas_hospedaje",
      )
      .eq("negocio_id", negocioId)
      .maybeSingle();
    return {
      usa_calendario: data?.usa_calendario === true,
      checkin: data?.checkin ?? null,
      checkout: data?.checkout ?? null,
      acepta_mascotas: data?.acepta_mascotas === true,
      acepta_ninos: data?.acepta_ninos !== false,
      requiere_anticipo: data?.requiere_anticipo === true,
      notas_hospedaje: data?.notas_hospedaje ?? null,
    };
  });

export const guardarPoliticasHospedaje = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<PoliticasHospedaje>) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const cambios: {
      usa_calendario?: boolean;
      checkin?: string | null;
      checkout?: string | null;
      acepta_mascotas?: boolean;
      acepta_ninos?: boolean;
      requiere_anticipo?: boolean;
      notas_hospedaje?: string | null;
    } = {};
    if (data.usa_calendario !== undefined) cambios.usa_calendario = data.usa_calendario === true;
    if (data.checkin !== undefined) cambios.checkin = (data.checkin ?? "").slice(0, 20) || null;
    if (data.checkout !== undefined) cambios.checkout = (data.checkout ?? "").slice(0, 20) || null;
    if (data.acepta_mascotas !== undefined)
      cambios.acepta_mascotas = data.acepta_mascotas === true;
    if (data.acepta_ninos !== undefined) cambios.acepta_ninos = data.acepta_ninos === true;
    if (data.requiere_anticipo !== undefined)
      cambios.requiere_anticipo = data.requiere_anticipo === true;
    if (data.notas_hospedaje !== undefined)
      cambios.notas_hospedaje = (data.notas_hospedaje ?? "").slice(0, 600) || null;


    const { error } = await context.supabase
      .from("negocio_perfil")
      .update(cambios)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Calendario simple: bloquear / desbloquear ---------- */

export const bloqueosAlojamiento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { alojamiento_id: string; desde: string; hasta: string }) => d)
  .handler(async ({ data, context }): Promise<BloqueoRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data: filas } = await context.supabase
      .from("alojamiento_bloqueos")
      .select("fecha, unidades")
      .eq("negocio_id", negocioId)
      .eq("alojamiento_id", data.alojamiento_id)
      .gte("fecha", data.desde)
      .lte("fecha", data.hasta)
      .order("fecha");
    return (filas ?? []).map((f) => ({ fecha: f.fecha, unidades: f.unidades }));
  });

export const cambiarBloqueo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { alojamiento_id: string; desde: string; hasta: string; bloquear: boolean }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    if (!fechaValida(data.desde) || !fechaValida(data.hasta)) throw new Error("Fechas inválidas");

    const { data: alojamiento } = await context.supabase
      .from("negocio_alojamientos")
      .select("id, unidades")
      .eq("id", data.alojamiento_id)
      .eq("negocio_id", negocioId)
      .maybeSingle();
    if (!alojamiento) throw new Error("No encontramos ese alojamiento");

    const inicio = data.desde <= data.hasta ? data.desde : data.hasta;
    const fin = data.desde <= data.hasta ? data.hasta : data.desde;
    const siguiente = new Date(`${fin}T00:00:00Z`);
    siguiente.setUTCDate(siguiente.getUTCDate() + 1);
    const fechas = nochesDelRango(inicio, siguiente.toISOString().slice(0, 10));

    if (!data.bloquear) {
      const { error } = await context.supabase
        .from("alojamiento_bloqueos")
        .delete()
        .eq("negocio_id", negocioId)
        .eq("alojamiento_id", data.alojamiento_id)
        .in("fecha", fechas);
      if (error) throw new Error(error.message);
      return { ok: true, fechas: fechas.length };
    }

    const { error } = await context.supabase.from("alojamiento_bloqueos").upsert(
      fechas.map((fecha) => ({
        negocio_id: negocioId,
        alojamiento_id: data.alojamiento_id,
        fecha,
        unidades: alojamiento.unidades,
      })),
      { onConflict: "alojamiento_id,fecha" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, fechas: fechas.length };
  });

/* ---------- Solicitudes ---------- */

export const misSolicitudesHospedaje = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SolicitudHospedajeRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("solicitudes_hospedaje")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("creado_en", { ascending: false })
      .limit(200);
    return (data ?? []).map((s) => ({
      id: s.id,
      folio: s.folio,
      creado_en: s.creado_en,
      alojamiento_nombre: s.alojamiento_nombre,
      check_in: s.check_in,
      check_out: s.check_out,
      noches: s.noches,
      huespedes: s.huespedes,
      precio_referencia: s.precio_referencia != null ? Number(s.precio_referencia) : null,
      total_estimado: s.total_estimado != null ? Number(s.total_estimado) : null,
      cliente_nombre: s.cliente_nombre,
      cliente_telefono: s.cliente_telefono,
      modo_disponibilidad: s.modo_disponibilidad,
      estado: s.estado,
    }));
  });

/** Métrica para el panel Master. */
export const solicitudesHospedajeDeNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { negocio_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: filas } = await context.supabase
      .from("solicitudes_hospedaje")
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
