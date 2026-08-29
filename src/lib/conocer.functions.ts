import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CLAVES_CONOCER, CLAVES_PRECIO, type ExtraExperiencia } from "@/lib/conocer";

export type MedioExperiencia = {
  id: string;
  tipo: "image" | "video";
  secure_url: string;
  public_id: string;
  orden: number;
  es_portada: boolean;
};

export type ExperienciaRow = {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  precio: number | null;
  precio_tipo: string;
  duracion: string | null;
  punto_salida: string | null;
  salida_latitud: number | null;
  salida_longitud: number | null;
  horarios: string[];
  capacidad: number | null;
  extras: ExtraExperiencia[];
  requiere_anticipo: boolean;
  activa: boolean;
  orden: number;
  medios: MedioExperiencia[];
};

export type ReservacionRow = {
  id: string;
  folio: string;
  creado_en: string;
  experiencia_nombre: string;
  fecha_solicitada: string | null;
  horario: string | null;
  personas: number;
  total_estimado: number | null;
  cliente_nombre: string;
  cliente_telefono: string;
  estado: string;
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

function limpiarExtras(extras: unknown): ExtraExperiencia[] {
  if (!Array.isArray(extras)) return [];
  return extras
    .map((e) => {
      const x = e as { nombre?: string; precio?: number | null; disponible?: boolean };
      const nombre = (x?.nombre ?? "").toString().trim().slice(0, 40);
      if (!nombre) return null;
      const precio = x?.precio != null && Number(x.precio) > 0 ? Number(x.precio) : null;
      return { nombre, precio, disponible: x?.disponible !== false };
    })
    .filter(Boolean)
    .slice(0, 12) as ExtraExperiencia[];
}

export const misExperiencias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExperienciaRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_experiencias")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("orden")
      .order("creado_en");
    const filas = data ?? [];
    if (!filas.length) return [];

    const { data: medios } = await context.supabase
      .from("experiencia_medios")
      .select("id, experiencia_id, tipo, secure_url, public_id, orden, es_portada")
      .in(
        "experiencia_id",
        filas.map((f) => f.id),
      )
      .order("orden");

    return filas.map((f) => ({
      id: f.id,
      negocio_id: f.negocio_id,
      nombre: f.nombre,
      descripcion: f.descripcion,
      categoria: f.categoria,
      precio: f.precio != null ? Number(f.precio) : null,
      precio_tipo: f.precio_tipo,
      duracion: f.duracion,
      punto_salida: f.punto_salida,
      salida_latitud: f.salida_latitud,
      salida_longitud: f.salida_longitud,
      horarios: (f.horarios ?? []) as string[],
      capacidad: f.capacidad,
      extras: limpiarExtras(f.extras),
      requiere_anticipo: f.requiere_anticipo,
      activa: f.activa,
      orden: f.orden,
      medios: (medios ?? [])
        .filter((m) => m.experiencia_id === f.id)
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

export const guardarExperiencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      nombre: string;
      descripcion?: string;
      categoria?: string | null;
      precio?: number | null;
      precio_tipo?: string;
      duracion?: string | null;
      punto_salida?: string | null;
      salida_latitud?: number | null;
      salida_longitud?: number | null;
      horarios?: string[];
      capacidad?: number | null;
      extras?: ExtraExperiencia[];
      requiere_anticipo?: boolean;
      activa?: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const nombre = (data.nombre ?? "").trim().slice(0, 80);
    if (!nombre) throw new Error("Escribe el nombre de la experiencia");

    const precioTipo = CLAVES_PRECIO.includes(data.precio_tipo ?? "")
      ? (data.precio_tipo as string)
      : "consultar";

    const campos = {
      nombre,
      descripcion: (data.descripcion ?? "").trim().slice(0, 500) || null,
      categoria: CLAVES_CONOCER.includes(data.categoria ?? "") ? (data.categoria as string) : null,
      precio: data.precio != null && data.precio > 0 ? data.precio : null,
      precio_tipo: precioTipo,
      duracion: (data.duracion ?? "").trim().slice(0, 40) || null,
      punto_salida: (data.punto_salida ?? "").trim().slice(0, 160) || null,
      salida_latitud: data.salida_latitud ?? null,
      salida_longitud: data.salida_longitud ?? null,
      horarios: (data.horarios ?? []).map((h) => h.slice(0, 30)).slice(0, 12),
      capacidad: data.capacidad != null && data.capacidad > 0 ? Math.round(data.capacidad) : null,
      extras: limpiarExtras(data.extras),
      requiere_anticipo: data.requiere_anticipo === true,
      activa: data.activa !== false,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("negocio_experiencias")
        .update(campos)
        .eq("id", data.id)
        .eq("negocio_id", negocioId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { count } = await context.supabase
      .from("negocio_experiencias")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", negocioId);
    const { data: creada, error } = await context.supabase
      .from("negocio_experiencias")
      .insert({ negocio_id: negocioId, orden: count ?? 0, ...campos })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: creada.id as string };
  });

export const borrarExperiencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("negocio_experiencias")
      .delete()
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const agregarMedioExperiencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      experiencia_id: string;
      tipo: "image" | "video";
      public_id: string;
      secure_url: string;
      duration?: number | null;
      format?: string | null;
      bytes?: number | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data: exp } = await context.supabase
      .from("negocio_experiencias")
      .select("id")
      .eq("id", data.experiencia_id)
      .eq("negocio_id", negocioId)
      .maybeSingle();
    if (!exp) throw new Error("No encontramos esta experiencia");

    const { count } = await context.supabase
      .from("experiencia_medios")
      .select("id", { count: "exact", head: true })
      .eq("experiencia_id", data.experiencia_id);
    const total = count ?? 0;
    if (total >= 20) throw new Error("Ya tienes el máximo de fotos y videos en esta experiencia");

    const { error } = await context.supabase.from("experiencia_medios").insert({
      experiencia_id: data.experiencia_id,
      negocio_id: negocioId,
      tipo: data.tipo,
      resource_type: data.tipo,
      public_id: data.public_id,
      secure_url: data.secure_url,
      orden: total,
      es_portada: total === 0 && data.tipo === "image",
      duration: data.duration ?? null,
      format: data.format ?? null,
      bytes: data.bytes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarMedioExperiencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data: medio } = await context.supabase
      .from("experiencia_medios")
      .select("id, public_id, resource_type")
      .eq("id", data.id)
      .eq("negocio_id", negocioId)
      .maybeSingle();
    if (!medio) throw new Error("No encontramos este archivo");

    const { error } = await context.supabase
      .from("experiencia_medios")
      .delete()
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);

    // El borrado físico se encola para ejecutarse de forma segura desde el backend.
    await context.supabase.from("medios_pendientes_borrado").insert({
      public_id: medio.public_id,
      resource_type: medio.resource_type ?? "image",
    });
    return { ok: true };
  });

export const portadaExperiencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; experiencia_id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    await context.supabase
      .from("experiencia_medios")
      .update({ es_portada: false })
      .eq("experiencia_id", data.experiencia_id)
      .eq("negocio_id", negocioId);
    const { error } = await context.supabase
      .from("experiencia_medios")
      .update({ es_portada: true })
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const misReservaciones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReservacionRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("reservaciones")
      .select(
        "id, folio, creado_en, experiencia_nombre, fecha_solicitada, horario, personas, total_estimado, cliente_nombre, cliente_telefono, estado",
      )
      .eq("negocio_id", negocioId)
      .order("creado_en", { ascending: false });
    return (data ?? []).map((r) => ({
      ...r,
      total_estimado: r.total_estimado != null ? Number(r.total_estimado) : null,
    })) as ReservacionRow[];
  });

/** Master: métricas de solicitudes generadas por un negocio. */
export const reservacionesDeNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { negocio_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: filas } = await context.supabase
      .from("reservaciones")
      .select("id, creado_en, total_estimado")
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
