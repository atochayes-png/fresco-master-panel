import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CLAVES_COMIDA, CLAVES_PAGO, TIEMPOS_PREPARACION } from "@/lib/comer";

export type PromocionRow = {
  id: string;
  negocio_id: string;
  titulo: string;
  descripcion: string | null;
  foto_url: string | null;
  precio: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
  orden: number;
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

export const guardarConfigComer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      comida_tipos?: string[];
      atiende_local?: boolean;
      atiende_recoger?: boolean;
      domicilio?: boolean;
      tiempo_preparacion?: string | null;
      formas_pago?: string[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const campos: Record<string, unknown> = {};

    if (data.comida_tipos)
      campos["comida_tipos"] = data.comida_tipos.filter((t) => CLAVES_COMIDA.includes(t));
    if (data.formas_pago)
      campos["formas_pago"] = data.formas_pago.filter((t) => CLAVES_PAGO.includes(t));
    if (typeof data.atiende_local === "boolean") campos["atiende_local"] = data.atiende_local;
    if (typeof data.atiende_recoger === "boolean") campos["atiende_recoger"] = data.atiende_recoger;
    if (typeof data.domicilio === "boolean") campos["domicilio"] = data.domicilio;
    if ("tiempo_preparacion" in data) {
      const t = data.tiempo_preparacion;
      campos["tiempo_preparacion"] =
        t && (TIEMPOS_PREPARACION as readonly string[]).includes(t) ? t : null;
    }

    const { error } = await context.supabase
      .from("negocio_perfil")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(campos as any)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const misPromociones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_promociones")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("orden")
      .order("creado_en");
    return (data ?? []) as PromocionRow[];
  });

export const guardarPromocion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      titulo: string;
      descripcion?: string;
      foto_url?: string | null;
      precio?: number | null;
      fecha_inicio?: string | null;
      fecha_fin?: string | null;
      activa?: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const titulo = (data.titulo ?? "").trim().slice(0, 80);
    if (!titulo) throw new Error("Escribe el título de tu promoción");

    const campos = {
      titulo,
      descripcion: (data.descripcion ?? "").trim().slice(0, 200) || null,
      foto_url: data.foto_url ?? null,
      precio: data.precio != null && data.precio > 0 ? data.precio : null,
      fecha_inicio: data.fecha_inicio || null,
      fecha_fin: data.fecha_fin || null,
      activa: data.activa !== false,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("negocio_promociones")
        .update(campos)
        .eq("id", data.id)
        .eq("negocio_id", negocioId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { count } = await context.supabase
      .from("negocio_promociones")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", negocioId);
    const { error } = await context.supabase
      .from("negocio_promociones")
      .insert({ negocio_id: negocioId, orden: count ?? 0, ...campos });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarPromocion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("negocio_promociones")
      .delete()
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
