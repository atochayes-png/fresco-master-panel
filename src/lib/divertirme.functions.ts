import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CLAVES_COVER,
  CLAVES_DIVERTIRME,
  CLAVES_EDAD,
  CLAVES_RESERVA,
  fechaValidaD,
} from "@/lib/divertirme";

export type ConfiguracionDivertirme = {
  divertirme_tipos: string[];
  ambiente: string[];
  restriccion_edad: string;
  restriccion_notas: string | null;
  cover_activo: boolean;
  cover_tipo: string;
  cover_monto: number | null;
  reserva_recomendada: string;
  horario_notas: string | null;
};

export type EventoRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha: string | null;
  hora: string | null;
  foto_url: string | null;
  cover_monto: number | null;
  activo: boolean;
  orden: number;
};

export type ContactoRow = {
  id: string;
  folio: string;
  creado_en: string;
  fecha_visita: string | null;
  hora_visita: string | null;
  personas: number | null;
  cliente_nombre: string;
  cliente_telefono: string;
  tipo_contacto: string;
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

export const miConfiguracionDivertirme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConfiguracionDivertirme> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_perfil")
      .select(
        "divertirme_tipos, ambiente, restriccion_edad, restriccion_notas, cover_activo, cover_tipo, cover_monto, reserva_recomendada, horario_notas",
      )
      .eq("negocio_id", negocioId)
      .maybeSingle();
    return {
      divertirme_tipos: (data?.divertirme_tipos ?? []) as string[],
      ambiente: (data?.ambiente ?? []) as string[],
      restriccion_edad: data?.restriccion_edad ?? "sin_restriccion",
      restriccion_notas: data?.restriccion_notas ?? null,
      cover_activo: data?.cover_activo === true,
      cover_tipo: data?.cover_tipo ?? "consultar",
      cover_monto: data?.cover_monto != null ? Number(data.cover_monto) : null,
      reserva_recomendada: data?.reserva_recomendada ?? "no",
      horario_notas: data?.horario_notas ?? null,
    };
  });

export const guardarConfiguracionDivertirme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<ConfiguracionDivertirme>) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const cambios: {
      divertirme_tipos: string[];
      ambiente: string[];
      restriccion_edad: string;
      restriccion_notas: string | null;
      cover_activo: boolean;
      cover_tipo: string;
      cover_monto: number | null;
      reserva_recomendada: string;
      horario_notas: string | null;
    } = {
      divertirme_tipos: (data.divertirme_tipos ?? []).filter((t) => CLAVES_DIVERTIRME.includes(t)),
      ambiente: (data.ambiente ?? []).map((a) => a.slice(0, 40)),
      restriccion_edad: CLAVES_EDAD.includes(data.restriccion_edad ?? "")
        ? (data.restriccion_edad as string)
        : "sin_restriccion",
      restriccion_notas: (data.restriccion_notas ?? "").trim() || null,
      cover_activo: data.cover_activo === true,
      cover_tipo: CLAVES_COVER.includes(data.cover_tipo ?? "")
        ? (data.cover_tipo as string)
        : "consultar",
      cover_monto:
        data.cover_monto != null && Number(data.cover_monto) > 0 ? Number(data.cover_monto) : null,
      reserva_recomendada: CLAVES_RESERVA.includes(data.reserva_recomendada ?? "")
        ? (data.reserva_recomendada as string)
        : "no",
      horario_notas: (data.horario_notas ?? "").trim() || null,
    };

    const { error } = await context.supabase
      .from("negocio_perfil")
      .update(cambios)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const misEventos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EventoRow[]> => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_eventos")
      .select("id, nombre, descripcion, fecha, hora, foto_url, cover_monto, activo, orden")
      .eq("negocio_id", negocioId)
      .order("orden")
      .order("creado_en");
    return (data ?? []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      descripcion: e.descripcion,
      fecha: e.fecha,
      hora: e.hora,
      foto_url: e.foto_url,
      cover_monto: e.cover_monto != null ? Number(e.cover_monto) : null,
      activo: e.activo,
      orden: e.orden,
    }));
  });

export const guardarEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      nombre: string;
      descripcion?: string | null;
      fecha?: string | null;
      hora?: string | null;
      foto_url?: string | null;
      foto_public_id?: string | null;
      cover_monto?: number | null;
      activo?: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const nombre = (data.nombre ?? "").trim();
    if (!nombre) throw new Error("Escribe el nombre del evento");
    const fecha = data.fecha && fechaValidaD(data.fecha) ? data.fecha : null;

    const fila = {
      negocio_id: negocioId,
      nombre: nombre.slice(0, 80),
      descripcion: (data.descripcion ?? "").trim() || null,
      fecha,
      hora: (data.hora ?? "").trim() || null,
      foto_url: data.foto_url ?? null,
      foto_public_id: data.foto_public_id ?? null,
      cover_monto:
        data.cover_monto != null && Number(data.cover_monto) > 0 ? Number(data.cover_monto) : null,
      activo: data.activo !== false,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("negocio_eventos")
        .update(fila)
        .eq("id", data.id)
        .eq("negocio_id", negocioId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: creado, error } = await context.supabase
      .from("negocio_eventos")
      .insert(fila)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: creado.id as string };
  });

export const borrarEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("negocio_eventos")
      .delete()
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Contactos generados desde TFY para el dueño (sin CRM: sólo lectura y conteos). */
export const misContactosDivertirme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ hoy: number; mes: number; total: number; lista: ContactoRow[] }> => {
      const negocioId = await miNegocioId(context.supabase, context.userId);
      const { data } = await context.supabase
        .from("contactos_divertirme")
        .select(
          "id, folio, creado_en, fecha_visita, hora_visita, personas, cliente_nombre, cliente_telefono, tipo_contacto",
        )
        .eq("negocio_id", negocioId)
        .order("creado_en", { ascending: false })
        .limit(100);
      const lista = (data ?? []) as ContactoRow[];

      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      return {
        hoy: lista.filter((c) => new Date(c.creado_en) >= inicioDia).length,
        mes: lista.filter((c) => new Date(c.creado_en) >= inicioMes).length,
        total: lista.length,
        lista,
      };
    },
  );

/** Métricas para Master (sin cobros ni comisiones). */
export const contactosDivertirmeDeNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { negocio_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: filas } = await context.supabase
      .from("contactos_divertirme")
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
