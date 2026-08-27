import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NegocioRow = {
  id: string;
  owner_id: string | null;
  nombre_negocio: string;
  nombre_dueno: string;
  celular: string;
  tipo: string;
  municipio: string;
  usuario: string;
  plan_tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: "activo" | "suspendido";
  estado_configuracion: "perfil_incompleto" | "perfil_completo";
};

export const asegurarMaster = createServerFn({ method: "POST" }).handler(async () => {
  const { admin } = await import("./negocios.server");
  const { usuarioAEmail } = await import("./dominio");
  const db = await admin();
  const { data: existente } = await db
    .from("perfiles")
    .select("id")
    .eq("usuario", "master")
    .maybeSingle();
  if (existente) return { ok: true, creado: false };

  const { data, error } = await db.auth.admin.createUser({
    email: usuarioAEmail("master"),
    password: "master123",
    email_confirm: true,
    user_metadata: { usuario: "master" },
  });
  if (error || !data.user) return { ok: false, creado: false };
  await db.from("perfiles").insert({ id: data.user.id, usuario: "master" });
  await db.from("user_roles").insert({ user_id: data.user.id, role: "master" });
  return { ok: true, creado: true };
});

export const usuarioDisponible = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { usuario: string }) => d)
  .handler(async ({ data, context }) => {
    const { admin, esMaster } = await import("./negocios.server");
    if (!(await esMaster(context.supabase, context.userId))) throw new Error("No autorizado");
    const db = await admin();
    const { data: fila } = await db
      .from("perfiles")
      .select("id")
      .ilike("usuario", data.usuario.trim())
      .maybeSingle();
    return { disponible: !fila };
  });

export const listarNegocios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("negocios")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as NegocioRow[];
  });

export const obtenerNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: fila, error } = await context.supabase
      .from("negocios")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (fila ?? null) as NegocioRow | null;
  });

export const crearNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      nombre_dueno: string;
      celular: string;
      nombre_negocio: string;
      tipo: string;
      municipio: string;
      usuario: string;
      contrasena: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { admin, esMaster, crearUsuarioAuth } = await import("./negocios.server");
    const { validarUsuario, validarContrasena, validarCelular } = await import("./dominio");
    if (!(await esMaster(context.supabase, context.userId))) throw new Error("No autorizado");

    const err =
      validarUsuario(data.usuario) ??
      validarContrasena(data.contrasena) ??
      validarCelular(data.celular) ??
      (data.nombre_dueno.trim() ? null : "Falta el nombre del dueño") ??
      (data.nombre_negocio.trim() ? null : "Falta el nombre del negocio") ??
      (data.tipo ? null : "Falta el tipo de negocio") ??
      (data.municipio ? null : "Falta el municipio");
    if (err) throw new Error(err);

    const db = await admin();
    const { data: ocupado } = await db
      .from("perfiles")
      .select("id")
      .ilike("usuario", data.usuario.trim())
      .maybeSingle();
    if (ocupado) throw new Error("Ese usuario ya existe");

    const userId = await crearUsuarioAuth(data.usuario.trim(), data.contrasena);
    await db.from("perfiles").insert({ id: userId, usuario: data.usuario.trim() });
    await db.from("user_roles").insert({ user_id: userId, role: "negocio" });

    const inicio = new Date();
    const fin = new Date(inicio.getTime() + 30 * 86400000);
    const iso = (x: Date) => x.toISOString().slice(0, 10);

    const { data: negocio, error } = await db
      .from("negocios")
      .insert({
        owner_id: userId,
        nombre_negocio: data.nombre_negocio.trim(),
        nombre_dueno: data.nombre_dueno.trim(),
        celular: data.celular.replace(/\D/g, ""),
        tipo: data.tipo,
        municipio: data.municipio,
        usuario: data.usuario.trim(),
        plan_tipo: "prueba_gratis",
        fecha_inicio: iso(inicio),
        fecha_fin: iso(fin),
        estatus: "activo",
        estado_configuracion: "perfil_incompleto",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return negocio as NegocioRow;
  });

export const actualizarNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      nombre_dueno: string;
      celular: string;
      nombre_negocio: string;
      tipo: string;
      municipio: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { id, ...campos } = data;
    const { error } = await context.supabase
      .from("negocios")
      .update({ ...campos, celular: campos.celular.replace(/\D/g, "") })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cambiarEstatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; estatus: "activo" | "suspendido" }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("negocios")
      .update({ estatus: data.estatus })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
