import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LIMITE_FOTOS, LIMITE_VIDEOS } from "@/lib/cloudinary";

export type MedioRow = {
  id: string;
  negocio_id: string;
  tipo: "image" | "video";
  public_id: string;
  secure_url: string;
  resource_type: string;
  orden: number;
  es_portada: boolean;
  es_destacado: boolean;
  width: number | null;
  height: number | null;
  duration: number | null;
  format: string | null;
  bytes: number | null;
};

/** Nunca confiamos en el negocio que manda el navegador: lo resolvemos por el dueño. */
async function negocioDelDueno(
  supabase: { from: (t: string) => any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
) {
  const { data } = await supabase
    .from("negocios")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) throw new Error("No encontramos tu negocio");
  return data.id as string;
}

export const misMedios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const negocioId = await negocioDelDueno(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_medios")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("orden")
      .order("created_at");
    return { negocio_id: negocioId, medios: (data ?? []) as MedioRow[] };
  });

export const registrarMedio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      tipo: "image" | "video";
      public_id: string;
      secure_url: string;
      resource_type?: string;
      width?: number | null;
      height?: number | null;
      duration?: number | null;
      format?: string | null;
      bytes?: number | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await negocioDelDueno(context.supabase, context.userId);
    const tipo = data.tipo === "video" ? "video" : "image";

    const { data: existentes } = await context.supabase
      .from("negocio_medios")
      .select("id, tipo, es_portada, orden")
      .eq("negocio_id", negocioId);
    const lista = existentes ?? [];
    const cuantos = lista.filter((m) => m.tipo === tipo).length;
    if (tipo === "image" && cuantos >= LIMITE_FOTOS)
      throw new Error("Has alcanzado el límite de fotos.");
    if (tipo === "video" && cuantos >= LIMITE_VIDEOS)
      throw new Error("Has alcanzado el límite de videos.");

    const hayPortada = lista.some((m) => m.es_portada);
    const orden = lista.reduce((max, m) => Math.max(max, m.orden + 1), 0);

    const { data: creado, error } = await context.supabase
      .from("negocio_medios")
      .insert({
        negocio_id: negocioId,
        tipo,
        public_id: data.public_id,
        secure_url: data.secure_url,
        resource_type: data.resource_type ?? tipo,
        orden,
        // La portada preferentemente es una foto.
        es_portada: tipo === "image" && !hayPortada,
        width: data.width ?? null,
        height: data.height ?? null,
        duration: data.duration ?? null,
        format: data.format ?? null,
        bytes: data.bytes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return creado as MedioRow;
  });

export const marcarPortada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await negocioDelDueno(context.supabase, context.userId);
    await context.supabase
      .from("negocio_medios")
      .update({ es_portada: false })
      .eq("negocio_id", negocioId);
    const { error } = await context.supabase
      .from("negocio_medios")
      .update({ es_portada: true })
      .eq("id", data.id)
      .eq("negocio_id", negocioId)
      .eq("tipo", "image");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const marcarDestacado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; activo: boolean }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await negocioDelDueno(context.supabase, context.userId);
    await context.supabase
      .from("negocio_medios")
      .update({ es_destacado: false })
      .eq("negocio_id", negocioId);
    if (data.activo) {
      const { error } = await context.supabase
        .from("negocio_medios")
        .update({ es_destacado: true })
        .eq("id", data.id)
        .eq("negocio_id", negocioId)
        .eq("tipo", "video");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const ordenarMedios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await negocioDelDueno(context.supabase, context.userId);
    let i = 0;
    for (const id of data.ids) {
      await context.supabase
        .from("negocio_medios")
        .update({ orden: i })
        .eq("id", id)
        .eq("negocio_id", negocioId);
      i++;
    }
    return { ok: true };
  });

export const eliminarMedio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await negocioDelDueno(context.supabase, context.userId);
    const { data: medio } = await context.supabase
      .from("negocio_medios")
      .select("id, public_id, resource_type, es_portada, tipo")
      .eq("id", data.id)
      .eq("negocio_id", negocioId)
      .maybeSingle();
    if (!medio) throw new Error("No encontramos ese contenido");

    const { error } = await context.supabase
      .from("negocio_medios")
      .delete()
      .eq("id", medio.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);

    // El borrado físico requiere credenciales privadas: queda en cola del servidor.
    await context.supabase.from("medios_pendientes_borrado").insert({
      public_id: medio.public_id,
      resource_type: medio.resource_type,
    });

    if (medio.es_portada) {
      const { data: siguiente } = await context.supabase
        .from("negocio_medios")
        .select("id")
        .eq("negocio_id", negocioId)
        .eq("tipo", "image")
        .order("orden")
        .limit(1)
        .maybeSingle();
      if (siguiente) {
        await context.supabase
          .from("negocio_medios")
          .update({ es_portada: true })
          .eq("id", siguiente.id);
      }
    }
    return { ok: true };
  });

/** Master: consulta el contenido de cualquier negocio (sólo lectura en esta fase). */
export const mediosDeNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { negocio_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: medios } = await context.supabase
      .from("negocio_medios")
      .select("*")
      .eq("negocio_id", data.negocio_id)
      .order("orden");
    return (medios ?? []) as MedioRow[];
  });
