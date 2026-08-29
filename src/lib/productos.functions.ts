import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProductoRow = {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  foto_ruta: string | null;
  foto_url: string | null;
  orden: number;
  categoria: string | null;
};

export type PedidoRow = {
  id: string;
  folio: string;
  creado_en: string;
  total_estimado: number;
  estado: string;
  cliente_nombre: string;
  tipo_entrega: string;
};

async function miNegocioId(supabase: { from: (t: string) => any }, userId: string) {
  const { data } = await supabase
    .from("negocios")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) throw new Error("No encontramos tu negocio");
  return data.id as string;
}

export const misProductos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("negocio_productos")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("orden");
    return (data ?? []) as ProductoRow[];
  });

export const guardarProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      nombre: string;
      descripcion: string;
      precio: number;
      disponible: boolean;
      foto_ruta?: string | null;
      foto_url?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const nombre = data.nombre.trim().slice(0, 80);
    if (!nombre) throw new Error("Escribe el nombre del producto");
    const precio = Math.max(0, Number(data.precio) || 0);
    const campos = {
      nombre,
      descripcion: data.descripcion?.trim().slice(0, 160) || null,
      precio,
      disponible: data.disponible !== false,
      ...(data.foto_ruta ? { foto_ruta: data.foto_ruta, foto_url: data.foto_url ?? null } : {}),
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("negocio_productos")
        .update(campos)
        .eq("id", data.id)
        .eq("negocio_id", negocioId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { count } = await context.supabase
      .from("negocio_productos")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", negocioId);
    const { error } = await context.supabase
      .from("negocio_productos")
      .insert({ negocio_id: negocioId, orden: count ?? 0, ...campos });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("negocio_productos")
      .delete()
      .eq("id", data.id)
      .eq("negocio_id", negocioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const misPedidos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const negocioId = await miNegocioId(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("pedidos")
      .select("id, folio, creado_en, total_estimado, estado, cliente_nombre, tipo_entrega")
      .eq("negocio_id", negocioId)
      .order("creado_en", { ascending: false })
      .limit(100);
    return (data ?? []) as PedidoRow[];
  });

export const pedidosDeNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { negocio_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: filas } = await context.supabase
      .from("pedidos")
      .select("creado_en, total_estimado")
      .eq("negocio_id", data.negocio_id);
    const lista = filas ?? [];
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const mes = lista.filter((p) => new Date(p.creado_en) >= inicioMes);
    return {
      total: lista.length,
      mes: mes.length,
      total_monto: lista.reduce((a, p) => a + Number(p.total_estimado), 0),
    };
  });
