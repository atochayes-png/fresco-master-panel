import { usuarioAEmail } from "./dominio";

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function esMaster(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "master" });
  return data === true;
}

export async function crearUsuarioAuth(usuario: string, contrasena: string) {
  const db = await admin();
  const { data, error } = await db.auth.admin.createUser({
    email: usuarioAEmail(usuario),
    password: contrasena,
    email_confirm: true,
    user_metadata: { usuario },
  });
  if (error || !data.user) throw new Error(error?.message ?? "No se pudo crear el usuario");
  return data.user.id;
}
