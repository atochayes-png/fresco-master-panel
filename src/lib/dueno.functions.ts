import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PerfilRow = {
  negocio_id: string;
  descripcion: string | null;
  recibe_clientes: boolean | null;
  direccion: string | null;
  colonia: string | null;
  codigo_postal: string | null;
  latitud: number | null;
  longitud: number | null;
  domicilio: boolean | null;
  costo_entrega_tipo: string | null;
  costo_entrega: number | null;
  distancia_km: number | null;
  notas_entrega: string | null;
  solo_reservacion: boolean;
  whatsapp_activo: boolean;
  whatsapp_numero: string | null;
  facebook: string | null;
  instagram: string | null;
  sitio_web: string | null;
  foto_principal: string | null;
  menu_url: string | null;
  menu_tipo: string | null;
  precio_promedio: number | null;
  precio_desde: number | null;
  duracion: string | null;
  punto_salida: string | null;
  salida_latitud: number | null;
  salida_longitud: number | null;
  precio_noche: number | null;
  capacidad: number | null;
  tipo_servicio: string | null;
  recibe_pedidos: boolean;
  paso_actual: number;
};

export type HorarioRow = {
  id: string;
  negocio_id: string;
  dia: number;
  abierto: boolean;
  apertura: string | null;
  cierre: string | null;
};

export type FotoRow = {
  id: string;
  negocio_id: string;
  ruta: string;
  url: string;
  orden: number;
};

export const miRol = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "master",
    });
    return { rol: data === true ? ("master" as const) : ("negocio" as const) };
  });

export const miNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: negocio } = await context.supabase
      .from("negocios")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!negocio) return null;

    let { data: perfil } = await context.supabase
      .from("negocio_perfil")
      .select("*")
      .eq("negocio_id", negocio.id)
      .maybeSingle();

    if (!perfil) {
      const { data: creado } = await context.supabase
        .from("negocio_perfil")
        .insert({ negocio_id: negocio.id, whatsapp_numero: negocio.celular })
        .select("*")
        .single();
      perfil = creado;
    }

    const { data: horarios } = await context.supabase
      .from("negocio_horarios")
      .select("*")
      .eq("negocio_id", negocio.id)
      .order("dia");

    const { data: fotos } = await context.supabase
      .from("negocio_fotos")
      .select("*")
      .eq("negocio_id", negocio.id)
      .order("orden");

    return {
      negocio,
      perfil: perfil as PerfilRow,
      horarios: (horarios ?? []) as HorarioRow[],
      fotos: (fotos ?? []) as FotoRow[],
    };
  });

export const guardarDatosNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      nombre_negocio: string;
      nombre_dueno: string;
      celular: string;
      descripcion: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: negocio } = await context.supabase
      .from("negocios")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!negocio) throw new Error("No encontramos tu negocio");

    const celular = data.celular.replace(/\D/g, "");
    const { error } = await context.supabase
      .from("negocios")
      .update({
        nombre_negocio: data.nombre_negocio.trim(),
        nombre_dueno: data.nombre_dueno.trim(),
        celular,
      })
      .eq("id", negocio.id);
    if (error) throw new Error(error.message);

    const { error: e2 } = await context.supabase
      .from("negocio_perfil")
      .update({ descripcion: data.descripcion.slice(0, 300) })
      .eq("negocio_id", negocio.id);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

export const guardarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { campos: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    const permitidos = [
      "descripcion",
      "recibe_clientes",
      "direccion",
      "colonia",
      "codigo_postal",
      "latitud",
      "longitud",
      "domicilio",
      "costo_entrega_tipo",
      "costo_entrega",
      "distancia_km",
      "notas_entrega",
      "solo_reservacion",
      "whatsapp_activo",
      "whatsapp_numero",
      "facebook",
      "instagram",
      "sitio_web",
      "foto_principal",
      "menu_url",
      "menu_tipo",
      "precio_promedio",
      "precio_desde",
      "duracion",
      "punto_salida",
      "salida_latitud",
      "salida_longitud",
      "precio_noche",
      "capacidad",
      "tipo_servicio",
      "recibe_pedidos",
      "paso_actual",
    ];
    const campos: Record<string, unknown> = {};
    for (const clave of permitidos) {
      if (clave in data.campos) campos[clave] = data.campos[clave];
    }

    const { data: negocio } = await context.supabase
      .from("negocios")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!negocio) throw new Error("No encontramos tu negocio");

    const { error } = await context.supabase
      .from("negocio_perfil")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(campos as any)
      .eq("negocio_id", negocio.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const guardarHorarios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      dias: { dia: number; abierto: boolean; apertura: string | null; cierre: string | null }[];
      solo_reservacion: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: negocio } = await context.supabase
      .from("negocios")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!negocio) throw new Error("No encontramos tu negocio");

    for (const d of data.dias) {
      const { data: existente } = await context.supabase
        .from("negocio_horarios")
        .select("id")
        .eq("negocio_id", negocio.id)
        .eq("dia", d.dia)
        .maybeSingle();
      const fila = {
        abierto: d.abierto,
        apertura: d.abierto ? d.apertura : null,
        cierre: d.abierto ? d.cierre : null,
      };
      if (existente) {
        await context.supabase.from("negocio_horarios").update(fila).eq("id", existente.id);
      } else {
        await context.supabase
          .from("negocio_horarios")
          .insert({ negocio_id: negocio.id, dia: d.dia, ...fila });
      }
    }

    await context.supabase
      .from("negocio_perfil")
      .update({ solo_reservacion: data.solo_reservacion })
      .eq("negocio_id", negocio.id);
    return { ok: true };
  });

export const registrarFoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ruta: string; url: string; principal: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: negocio } = await context.supabase
      .from("negocios")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!negocio) throw new Error("No encontramos tu negocio");

    const { count } = await context.supabase
      .from("negocio_fotos")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", negocio.id);
    if ((count ?? 0) >= 10) throw new Error("Ya tienes 10 fotos");

    const { error } = await context.supabase.from("negocio_fotos").insert({
      negocio_id: negocio.id,
      ruta: data.ruta,
      url: data.url,
      orden: count ?? 0,
    });
    if (error) throw new Error(error.message);

    if (data.principal) {
      await context.supabase
        .from("negocio_perfil")
        .update({ foto_principal: data.ruta })
        .eq("negocio_id", negocio.id);
    }
    return { ok: true };
  });

export const borrarFoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("negocio_fotos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publicarNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: negocio } = await context.supabase
      .from("negocios")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!negocio) throw new Error("No encontramos tu negocio");

    const { data: perfil } = await context.supabase
      .from("negocio_perfil")
      .select("*")
      .eq("negocio_id", negocio.id)
      .maybeSingle();
    const { data: horarios } = await context.supabase
      .from("negocio_horarios")
      .select("*")
      .eq("negocio_id", negocio.id);

    const faltan: string[] = [];
    if (!negocio.nombre_negocio?.trim()) faltan.push("el nombre de tu negocio");
    if (!negocio.tipo) faltan.push("el tipo de negocio");
    if (!negocio.celular) faltan.push("tu celular");
    if (!negocio.municipio) faltan.push("el municipio");
    if (!perfil?.descripcion?.trim()) faltan.push("una descripción");
    if (!perfil?.foto_principal) faltan.push("la foto principal");
    const abierto = (horarios ?? []).some((h) => h.abierto);
    if (!abierto && !perfil?.solo_reservacion) faltan.push("tus horarios o disponibilidad");
    if (perfil?.recibe_clientes && !perfil?.direccion?.trim()) faltan.push("tu dirección");
    if (faltan.length) throw new Error(`Todavía falta: ${faltan.join(", ")}.`);

    const { error } = await context.supabase
      .from("negocios")
      .update({ estado_configuracion: "perfil_completo" })
      .eq("id", negocio.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
