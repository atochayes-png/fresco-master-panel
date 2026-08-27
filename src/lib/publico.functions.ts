import { createServerFn } from "@tanstack/react-start";

export type TarjetaNegocio = {
  id: string;
  nombre: string;
  tipo: string;
  municipio: string;
  foto: string | null;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  domicilio: boolean;
  recibe_pedidos: boolean;
  precio_desde: number | null;
  precio_promedio: number | null;
  solo_reservacion: boolean;
  horarios: { dia: number; abierto: boolean; apertura: string | null; cierre: string | null }[];
  estrellas: number | null;
  resenas: number;
};

export type FichaPublica = TarjetaNegocio & {
  direccion: string | null;
  colonia: string | null;
  codigo_postal: string | null;
  recibe_clientes: boolean;
  costo_entrega_tipo: string | null;
  costo_entrega: number | null;
  distancia_km: number | null;
  notas_entrega: string | null;
  salida_latitud: number | null;
  salida_longitud: number | null;
  menu_url: string | null;
  menu_tipo: string | null;
  whatsapp: string | null;
  telefono: string | null;
  facebook: string | null;
  instagram: string | null;
  sitio_web: string | null;
  duracion: string | null;
  punto_salida: string | null;
  precio_noche: number | null;
  capacidad: number | null;
  tipo_servicio: string | null;
  galeria: string[];
  productos: { id: string; nombre: string; descripcion: string | null; precio: number; foto: string | null }[];
  comentarios: { id: string; estrellas: number; comentario: string | null; creado_en: string; telefono: string }[];
};

const HOY = () => new Date().toISOString().slice(0, 10);

function normalizar(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function soloDigitos(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function firmar(
  db: Awaited<ReturnType<typeof admin>>,
  rutas: string[],
): Promise<Record<string, string>> {
  const mapa: Record<string, string> = {};
  const limpias = rutas.filter(Boolean);
  if (!limpias.length) return mapa;
  const { data } = await db.storage.from("negocios").createSignedUrls(limpias, 60 * 60 * 6);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa[item.path] = item.signedUrl;
  }
  return mapa;
}

async function cargarVisibles(db: Awaited<ReturnType<typeof admin>>) {
  const { data: negocios } = await db
    .from("negocios")
    .select("id, nombre_negocio, tipo, municipio, celular, estatus, estado_configuracion, fecha_fin")
    .eq("estatus", "activo")
    .eq("estado_configuracion", "perfil_completo")
    .gte("fecha_fin", HOY());
  return negocios ?? [];
}

export const buscarNegocios = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      texto?: string;
      categoria?: string | null;
      municipio?: string | null;
      lat?: number | null;
      lng?: number | null;
    }) => d,
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const negocios = await cargarVisibles(db);
    if (!negocios.length) return [] as TarjetaNegocio[];
    const ids = negocios.map((n) => n.id);

    const [{ data: perfiles }, { data: fotos }, { data: horarios }, { data: productos }, { data: resenas }] =
      await Promise.all([
        db.from("negocio_perfil").select("*").in("negocio_id", ids),
        db.from("negocio_fotos").select("negocio_id, ruta, orden").in("negocio_id", ids).order("orden"),
        db.from("negocio_horarios").select("negocio_id, dia, abierto, apertura, cierre").in("negocio_id", ids),
        db.from("negocio_productos").select("negocio_id, nombre, descripcion").in("negocio_id", ids).eq("disponible", true),
        db.from("resenas").select("negocio_id, estrellas").in("negocio_id", ids),
      ]);

    const perfilPorId = new Map((perfiles ?? []).map((p) => [p.negocio_id, p]));
    const rutas: string[] = [];
    const fotoPorId = new Map<string, string>();
    for (const f of fotos ?? []) {
      const perfil = perfilPorId.get(f.negocio_id);
      const principal = perfil?.foto_principal;
      if (!fotoPorId.has(f.negocio_id) || f.ruta === principal) fotoPorId.set(f.negocio_id, f.ruta);
    }
    fotoPorId.forEach((ruta) => rutas.push(ruta));
    const firmadas = await firmar(db, rutas);

    const texto = normalizar(data.texto ?? "");
    const palabras = texto.split(/\s+/).filter(Boolean);

    const resultado: (TarjetaNegocio & { _puntos: number; _dist: number })[] = [];

    for (const n of negocios) {
      const perfil = perfilPorId.get(n.id);
      if (data.categoria && n.tipo !== data.categoria) continue;
      if (data.municipio && n.municipio !== data.municipio) continue;

      const misProductos = (productos ?? []).filter((p) => p.negocio_id === n.id);
      let puntos = palabras.length ? 0 : 1;
      for (const palabra of palabras) {
        if (normalizar(n.nombre_negocio).includes(palabra)) puntos += 4;
        if (normalizar(n.tipo).includes(palabra)) puntos += 2;
        if (normalizar(n.municipio).includes(palabra)) puntos += 2;
        if (normalizar(perfil?.descripcion ?? "").includes(palabra)) puntos += 1;
        if (
          misProductos.some(
            (p) =>
              normalizar(p.nombre).includes(palabra) ||
              normalizar(p.descripcion ?? "").includes(palabra),
          )
        )
          puntos += 3;
      }
      if (!puntos) continue;

      const mias = (resenas ?? []).filter((r) => r.negocio_id === n.id);
      const promedio = mias.length
        ? Math.round((mias.reduce((a, r) => a + r.estrellas, 0) / mias.length) * 10) / 10
        : null;

      let distancia = Number.MAX_SAFE_INTEGER;
      if (data.lat != null && data.lng != null && perfil?.latitud != null && perfil?.longitud != null) {
        const R = 6371;
        const dLat = ((perfil.latitud - data.lat) * Math.PI) / 180;
        const dLng = ((perfil.longitud - data.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((data.lat * Math.PI) / 180) *
            Math.cos((perfil.latitud * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        distancia = 2 * R * Math.asin(Math.sqrt(a));
      }

      const ruta = fotoPorId.get(n.id);
      resultado.push({
        id: n.id,
        nombre: n.nombre_negocio,
        tipo: n.tipo,
        municipio: n.municipio,
        foto: ruta ? (firmadas[ruta] ?? null) : null,
        descripcion: perfil?.descripcion ?? null,
        latitud: perfil?.latitud ?? null,
        longitud: perfil?.longitud ?? null,
        domicilio: perfil?.domicilio === true,
        recibe_pedidos: perfil?.recibe_pedidos === true,
        precio_desde: perfil?.precio_desde ?? null,
        precio_promedio: perfil?.precio_promedio ?? null,
        solo_reservacion: perfil?.solo_reservacion === true,
        horarios: (horarios ?? [])
          .filter((h) => h.negocio_id === n.id)
          .map((h) => ({ dia: h.dia, abierto: h.abierto, apertura: h.apertura, cierre: h.cierre })),
        estrellas: promedio,
        resenas: mias.length,
        _puntos: puntos,
        _dist: distancia,
      });
    }

    // Regla institucional: primero filtramos por relevancia (arriba) y
    // después ordenamos principalmente por cercanía. Las reseñas no influyen.
    const hayUbicacion = data.lat != null && data.lng != null;
    resultado.sort((a, b) =>
      hayUbicacion
        ? (a._dist - b._dist) || (b._puntos - a._puntos) || a.nombre.localeCompare(b.nombre)
        : (b._puntos - a._puntos) || a.nombre.localeCompare(b.nombre),
    );
    return resultado.map(({ _puntos, _dist, ...resto }) => resto) as TarjetaNegocio[];
  });

export const fichaNegocio = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: n } = await db
      .from("negocios")
      .select("id, nombre_negocio, tipo, municipio, celular, estatus, estado_configuracion, fecha_fin")
      .eq("id", data.id)
      .maybeSingle();
    if (
      !n ||
      n.estatus !== "activo" ||
      n.estado_configuracion !== "perfil_completo" ||
      n.fecha_fin < HOY()
    )
      return null;

    const [{ data: perfil }, { data: fotos }, { data: horarios }, { data: productos }, { data: resenas }] =
      await Promise.all([
        db.from("negocio_perfil").select("*").eq("negocio_id", n.id).maybeSingle(),
        db.from("negocio_fotos").select("ruta, orden").eq("negocio_id", n.id).order("orden"),
        db.from("negocio_horarios").select("dia, abierto, apertura, cierre").eq("negocio_id", n.id).order("dia"),
        db
          .from("negocio_productos")
          .select("id, nombre, descripcion, precio, foto_ruta")
          .eq("negocio_id", n.id)
          .eq("disponible", true)
          .order("orden"),
        db.from("resenas").select("id, estrellas, comentario, creado_en, telefono").eq("negocio_id", n.id).order("creado_en", { ascending: false }),
      ]);

    const rutas = [
      ...(fotos ?? []).map((f) => f.ruta),
      ...(productos ?? []).map((p) => p.foto_ruta ?? "").filter(Boolean),
    ];
    const firmadas = await firmar(db, rutas);
    const galeriaRutas = (fotos ?? []).map((f) => f.ruta);
    if (perfil?.foto_principal) {
      galeriaRutas.sort((a, b) => (a === perfil.foto_principal ? -1 : b === perfil.foto_principal ? 1 : 0));
    }

    const promedio = (resenas ?? []).length
      ? Math.round(((resenas ?? []).reduce((a, r) => a + r.estrellas, 0) / (resenas ?? []).length) * 10) / 10
      : null;

    const ficha: FichaPublica = {
      id: n.id,
      nombre: n.nombre_negocio,
      tipo: n.tipo,
      municipio: n.municipio,
      descripcion: perfil?.descripcion ?? null,
      foto: galeriaRutas[0] ? (firmadas[galeriaRutas[0]] ?? null) : null,
      galeria: galeriaRutas.map((r) => firmadas[r]).filter(Boolean) as string[],
      latitud: perfil?.latitud ?? null,
      longitud: perfil?.longitud ?? null,
      domicilio: perfil?.domicilio === true,
      recibe_pedidos: perfil?.recibe_pedidos === true && (productos ?? []).length > 0,
      precio_desde: perfil?.precio_desde ?? null,
      precio_promedio: perfil?.precio_promedio ?? null,
      solo_reservacion: perfil?.solo_reservacion === true,
      horarios: (horarios ?? []).map((h) => ({
        dia: h.dia,
        abierto: h.abierto,
        apertura: h.apertura,
        cierre: h.cierre,
      })),
      estrellas: promedio,
      resenas: (resenas ?? []).length,
      // La dirección exacta sólo se publica si el negocio recibe clientes.
      direccion: perfil?.recibe_clientes ? (perfil.direccion ?? null) : null,
      colonia: perfil?.recibe_clientes ? (perfil.colonia ?? null) : null,
      codigo_postal: perfil?.recibe_clientes ? (perfil.codigo_postal ?? null) : null,
      recibe_clientes: perfil?.recibe_clientes === true,
      costo_entrega_tipo: perfil?.costo_entrega_tipo ?? null,
      costo_entrega: perfil?.costo_entrega ?? null,
      distancia_km: perfil?.distancia_km != null ? Number(perfil.distancia_km) : null,
      notas_entrega: perfil?.notas_entrega ?? null,
      salida_latitud: perfil?.salida_latitud ?? null,
      salida_longitud: perfil?.salida_longitud ?? null,
      menu_url: perfil?.menu_url ? (await firmar(db, [perfil.menu_url]))[perfil.menu_url] ?? null : null,
      menu_tipo: perfil?.menu_tipo ?? null,
      whatsapp: perfil?.whatsapp_activo === false ? null : (perfil?.whatsapp_numero ?? n.celular),
      telefono: n.celular,
      facebook: perfil?.facebook ?? null,
      instagram: perfil?.instagram ?? null,
      sitio_web: perfil?.sitio_web ?? null,
      duracion: perfil?.duracion ?? null,
      punto_salida: perfil?.punto_salida ?? null,
      precio_noche: perfil?.precio_noche ?? null,
      capacidad: perfil?.capacidad ?? null,
      tipo_servicio: perfil?.tipo_servicio ?? null,
      productos: (productos ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        foto: p.foto_ruta ? (firmadas[p.foto_ruta] ?? null) : null,
      })),
      comentarios: (resenas ?? []).map((r) => ({
        id: r.id,
        estrellas: r.estrellas,
        comentario: r.comentario,
        creado_en: r.creado_en,
        telefono: `•••• ${r.telefono.slice(-4)}`,
      })),
    };
    return ficha;
  });

export const identificarse = createServerFn({ method: "POST" })
  .inputValidator((d: { telefono: string; acepta_promociones: boolean }) => d)
  .handler(async ({ data }) => {
    const telefono = soloDigitos(data.telefono);
    if (telefono.length < 10) throw new Error("El número debe tener 10 dígitos");
    const db = await admin();
    await db
      .from("usuarios_publicos")
      .upsert(
        { telefono, acepta_promociones: data.acepta_promociones === true },
        { onConflict: "telefono" },
      );
    return { telefono };
  });

export const misGuardados = createServerFn({ method: "POST" })
  .inputValidator((d: { telefono: string }) => d)
  .handler(async ({ data }) => {
    const telefono = soloDigitos(data.telefono);
    if (telefono.length < 10) return [] as string[];
    const db = await admin();
    const { data: filas } = await db.from("guardados").select("negocio_id").eq("telefono", telefono);
    return (filas ?? []).map((f) => f.negocio_id);
  });

export const alternarGuardado = createServerFn({ method: "POST" })
  .inputValidator((d: { telefono: string; negocio_id: string }) => d)
  .handler(async ({ data }) => {
    const telefono = soloDigitos(data.telefono);
    if (telefono.length < 10) throw new Error("Número inválido");
    const db = await admin();
    const { data: existe } = await db
      .from("guardados")
      .select("id")
      .eq("telefono", telefono)
      .eq("negocio_id", data.negocio_id)
      .maybeSingle();
    if (existe) {
      await db.from("guardados").delete().eq("id", existe.id);
      return { guardado: false };
    }
    await db.from("guardados").insert({ telefono, negocio_id: data.negocio_id });
    return { guardado: true };
  });

export const publicarResena = createServerFn({ method: "POST" })
  .inputValidator((d: { telefono: string; negocio_id: string; estrellas: number; comentario: string }) => d)
  .handler(async ({ data }) => {
    const telefono = soloDigitos(data.telefono);
    if (telefono.length < 10) throw new Error("Número inválido");
    const estrellas = Math.min(5, Math.max(1, Math.round(data.estrellas)));
    const db = await admin();
    const { error } = await db.from("resenas").upsert(
      {
        telefono,
        negocio_id: data.negocio_id,
        estrellas,
        comentario: (data.comentario ?? "").slice(0, 300) || null,
      },
      { onConflict: "telefono,negocio_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const crearPedido = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      negocio_id: string;
      cliente_nombre: string;
      cliente_telefono: string;
      tipo_entrega: "recoger" | "domicilio";
      direccion?: string;
      referencia?: string;
      items: { id: string; cantidad: number }[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const nombre = (data.cliente_nombre ?? "").trim();
    const telefono = soloDigitos(data.cliente_telefono);
    if (!nombre) throw new Error("Escribe tu nombre");
    if (telefono.length < 10) throw new Error("Escribe un teléfono de 10 dígitos");
    if (!data.items?.length) throw new Error("Tu pedido está vacío");

    const db = await admin();
    const { data: negocio } = await db
      .from("negocios")
      .select("id, nombre_negocio, celular, estatus, estado_configuracion, fecha_fin")
      .eq("id", data.negocio_id)
      .maybeSingle();
    if (
      !negocio ||
      negocio.estatus !== "activo" ||
      negocio.estado_configuracion !== "perfil_completo" ||
      negocio.fecha_fin < HOY()
    )
      throw new Error("Este negocio no está disponible");

    const { data: perfil } = await db
      .from("negocio_perfil")
      .select("recibe_pedidos, domicilio, costo_entrega, costo_entrega_tipo, whatsapp_numero, whatsapp_activo")
      .eq("negocio_id", negocio.id)
      .maybeSingle();
    if (!perfil?.recibe_pedidos) throw new Error("Este negocio no recibe pedidos por ahora");
    if (data.tipo_entrega === "domicilio" && !perfil.domicilio)
      throw new Error("Este negocio no ofrece entrega a domicilio");

    const { data: productos } = await db
      .from("negocio_productos")
      .select("id, nombre, precio")
      .eq("negocio_id", negocio.id)
      .eq("disponible", true);

    const items = data.items
      .map((i) => {
        const p = (productos ?? []).find((x) => x.id === i.id);
        if (!p) return null;
        const cantidad = Math.min(50, Math.max(1, Math.round(i.cantidad)));
        return { id: p.id, nombre: p.nombre, precio: Number(p.precio), cantidad, importe: Number(p.precio) * cantidad };
      })
      .filter(Boolean) as { id: string; nombre: string; precio: number; cantidad: number; importe: number }[];
    if (!items.length) throw new Error("Los productos ya no están disponibles");

    const subtotal = items.reduce((a, i) => a + i.importe, 0);
    const entrega =
      data.tipo_entrega === "domicilio" && perfil.costo_entrega_tipo === "fijo"
        ? Number(perfil.costo_entrega ?? 0)
        : 0;

    const { data: pedido, error } = await db
      .from("pedidos")
      .insert({
        negocio_id: negocio.id,
        cliente_nombre: nombre.slice(0, 80),
        cliente_telefono: telefono,
        tipo_entrega: data.tipo_entrega,
        direccion: data.tipo_entrega === "domicilio" ? (data.direccion ?? "").slice(0, 300) : null,
        referencia: (data.referencia ?? "").slice(0, 200) || null,
        items,
        subtotal,
        costo_entrega: entrega,
        total_estimado: subtotal + entrega,
      })
      .select("id, folio, subtotal, costo_entrega, total_estimado")
      .single();
    if (error) throw new Error(error.message);

    const whatsapp = perfil.whatsapp_activo === false ? negocio.celular : (perfil.whatsapp_numero ?? negocio.celular);

    return {
      id: pedido.id,
      folio: pedido.folio,
      negocio: negocio.nombre_negocio,
      whatsapp: soloDigitos(whatsapp ?? ""),
      items,
      subtotal,
      costo_entrega: entrega,
      total_estimado: subtotal + entrega,
    };
  });

export const marcarPedidoEnviado = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from("pedidos").update({ estado: "ENVIADO_A_WHATSAPP" }).eq("id", data.id).eq("estado", "GENERADO");
    return { ok: true };
  });
