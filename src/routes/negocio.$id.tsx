import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bike,
  Camera,
  Clock,
  Facebook,
  Globe,
  Heart,
  Instagram,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Star,
  UtensilsCrossed,
} from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { MapaPunto } from "@/components/mapa-punto";
import { Identificacion } from "@/components/identificacion";
import {
  alternarGuardado,
  crearPedido,
  fichaNegocio,
  marcarPedidoEnviado,
  misGuardados,
  publicarResena,
  type FichaPublica,
} from "@/lib/publico.functions";
import {
  distanciaKm,
  enlaceWhatsApp,
  escribirCarrito,
  estaAbierto,
  guardarNombre,
  leerCarrito,
  limpiarCarrito,
  mensajePedido,
  nombreDia,
  nombreGuardado,
  pedirUbicacion,
  pesos,
  telefonoGuardado,
  textoDistancia,
  ubicacionGuardada,
  type Carrito,
} from "@/lib/publico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/negocio/$id")({
  head: () => ({
    meta: [
      { title: "Negocio en Yucatán — Tomar el Fresco" },
      {
        name: "description",
        content:
          "Consulta fotos, horarios, ubicación y menú, y contacta al negocio directamente por WhatsApp.",
      },
      { property: "og:title", content: "Negocio en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Fotos, horarios, ubicación y pedidos por WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ficha,
});

type Paso = "ficha" | "pedido";

function Ficha() {
  const { id } = Route.useParams();
  const [ficha, setFicha] = useState<FichaPublica | null | "vacio">(null);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [carrito, setCarrito] = useState<Carrito>({});
  const [paso, setPaso] = useState<Paso>("ficha");
  const [guardado, setGuardado] = useState(false);
  const [pedirTelefono, setPedirTelefono] = useState<null | "guardar" | "resena" | "pedido">(null);

  useEffect(() => {
    setUbicacion(ubicacionGuardada());
    setCarrito(leerCarrito(id));
    void fichaNegocio({ data: { id } }).then((r) => setFicha(r ?? "vacio"));
    const tel = telefonoGuardado();
    if (tel)
      void misGuardados({ data: { telefono: tel } }).then((l) => setGuardado(l.includes(id)));
  }, [id]);

  const total = useMemo(() => {
    if (!ficha || ficha === "vacio") return 0;
    return Object.entries(carrito).reduce((suma, [pid, cant]) => {
      const p = ficha.productos.find((x) => x.id === pid);
      return suma + (p ? p.precio * cant : 0);
    }, 0);
  }, [carrito, ficha]);

  const piezas = Object.values(carrito).reduce((a, b) => a + b, 0);

  if (ficha === null) {
    return (
      <MarcoPublico>
        <div className="flex justify-center py-24">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      </MarcoPublico>
    );
  }

  if (ficha === "vacio") {
    return (
      <MarcoPublico>
        <div className="space-y-4 py-20 text-center">
          <h1 className="text-xl font-bold">Este negocio no está disponible</h1>
          <Button asChild variant="secondary">
            <Link to="/buscar" search={{ q: "", categoria: "", municipio: "" }}>
              Ver otros negocios
            </Link>
          </Button>
        </div>
      </MarcoPublico>
    );
  }

  function cambiar(pid: string, delta: number) {
    setCarrito((prev) => {
      const cant = Math.max(0, (prev[pid] ?? 0) + delta);
      const siguiente = { ...prev };
      if (cant === 0) delete siguiente[pid];
      else siguiente[pid] = cant;
      escribirCarrito(id, siguiente);
      return siguiente;
    });
  }

  async function alternar() {
    const tel = telefonoGuardado();
    if (!tel) {
      setPedirTelefono("guardar");
      return;
    }
    const r = await alternarGuardado({ data: { telefono: tel, negocio_id: id } });
    setGuardado(r.guardado);
  }

  const km = distanciaKm(ubicacion, ficha.latitud, ficha.longitud);
  const abierto = estaAbierto(ficha.horarios);
  const fueraDeRango =
    ficha.domicilio && ficha.distancia_km != null && km != null && km > ficha.distancia_km;
  const whatsapp = ficha.whatsapp ?? ficha.telefono ?? "";

  if (paso === "pedido") {
    return (
      <Pedido
        ficha={ficha}
        carrito={carrito}
        onVolver={() => setPaso("ficha")}
        onLimpiar={() => {
          limpiarCarrito(id);
          setCarrito({});
        }}
      />
    );
  }

  return (
    <MarcoPublico>
      <div className="space-y-5 pb-20">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/buscar" search={{ q: "", categoria: "", municipio: "" }}>
              <ArrowLeft className="size-4" /> Volver
            </Link>
          </Button>
          <button
            onClick={alternar}
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold"
          >
            <Heart className={`size-4 ${guardado ? "fill-current text-primary" : ""}`} />
            {guardado ? "Guardado" : "Guardar"}
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {ficha.foto ? (
            <img
              src={ficha.foto}
              alt={`Foto de ${ficha.nombre}`}
              className="h-52 w-full object-cover"
            />
          ) : (
            <div className="flex h-52 items-center justify-center bg-secondary">
              <Camera className="size-8 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-2 p-5">
            <h1 className="text-2xl font-bold">{ficha.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {ficha.tipo} · {ficha.municipio}
              {km != null ? ` · a ${km} km` : ""}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {ficha.solo_reservacion ? (
                <span className="rounded-full bg-secondary px-2.5 py-1">Sólo con reservación</span>
              ) : abierto === null ? null : (
                <span
                  className={`rounded-full px-2.5 py-1 ${abierto ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {abierto ? "Abierto ahora" : "Cerrado ahora"}
                </span>
              )}
              {ficha.estrellas ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                  <Star className="size-3.5 fill-current" /> {ficha.estrellas} ({ficha.resenas})
                </span>
              ) : null}
            </div>
            {ficha.descripcion ? <p className="pt-1 text-sm">{ficha.descripcion}</p> : null}
          </div>
        </div>

        {ficha.galeria.length ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {ficha.galeria.map((url) => (
              <img
                key={url}
                src={url}
                alt={`Galería de ${ficha.nombre}`}
                className="h-28 w-40 shrink-0 rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : null}

        <Bloque titulo="Horarios" icono={<Clock className="size-5" />}>
          <ul className="space-y-1 text-sm">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const h = ficha.horarios.find((x) => x.dia === d);
              return (
                <li key={d} className="flex justify-between">
                  <span>{nombreDia(d)}</span>
                  <span className="text-muted-foreground">
                    {h?.abierto && h.apertura && h.cierre
                      ? `${h.apertura} a ${h.cierre}`
                      : "Cerrado"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Bloque>

        {ficha.recibe_clientes && (ficha.direccion || ficha.latitud) ? (
          <Bloque titulo="Ubicación" icono={<MapPin className="size-5" />}>
            {ficha.direccion ? <p className="text-sm">{ficha.direccion}</p> : null}
            {ficha.colonia ? (
              <p className="text-sm text-muted-foreground">{ficha.colonia}</p>
            ) : null}
            {km != null ? (
              <p className="mt-1 text-sm font-semibold">A {textoDistancia(km)} de ti</p>
            ) : null}
            {ficha.latitud && ficha.longitud ? (
              <>
                <div className="mt-3">
                  <ClientOnly fallback={<div className="h-56 w-full rounded-2xl bg-secondary" />}>
                    <MapaPunto lat={ficha.latitud} lng={ficha.longitud} />
                  </ClientOnly>
                </div>
                <Button asChild variant="secondary" className="mt-3 h-12 w-full">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${ficha.latitud},${ficha.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    CÓMO LLEGAR
                  </a>
                </Button>
              </>
            ) : null}
          </Bloque>
        ) : null}

        {ficha.punto_salida && ficha.salida_latitud && ficha.salida_longitud ? (
          <Bloque titulo="Punto de salida" icono={<MapPin className="size-5" />}>
            <p className="text-sm">{ficha.punto_salida}</p>
            <div className="mt-3">
              <ClientOnly fallback={<div className="h-48 w-full rounded-2xl bg-secondary" />}>
                <MapaPunto lat={ficha.salida_latitud} lng={ficha.salida_longitud} altura="h-48" />
              </ClientOnly>
            </div>
            <Button asChild variant="secondary" className="mt-3 h-12 w-full">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${ficha.salida_latitud},${ficha.salida_longitud}`}
                target="_blank"
                rel="noreferrer"
              >
                CÓMO LLEGAR AL PUNTO DE SALIDA
              </a>
            </Button>
          </Bloque>
        ) : null}

        {ficha.domicilio ? (
          <Bloque titulo="Servicio a domicilio" icono={<Bike className="size-5" />}>
            <p className="text-sm">
              {ficha.costo_entrega_tipo === "fijo" && ficha.costo_entrega
                ? `Costo de entrega: ${pesos(ficha.costo_entrega)}`
                : "El costo de entrega se acuerda con el negocio."}
            </p>
            {ficha.distancia_km ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Entregan hasta {ficha.distancia_km} km a la redonda.
              </p>
            ) : null}
            {fueraDeRango ? (
              <p className="mt-2 rounded-2xl bg-secondary p-3 text-sm font-semibold">
                Estás a {textoDistancia(km!)} y este negocio entrega hasta {ficha.distancia_km} km.
                Puedes preguntar por WhatsApp si te alcanzan a llevar.
              </p>
            ) : null}
            {ficha.notas_entrega ? (
              <p className="mt-1 text-sm text-muted-foreground">{ficha.notas_entrega}</p>
            ) : null}
          </Bloque>
        ) : null}

        {ficha.menu_url ? (
          <Bloque titulo="Menú / Catálogo" icono={<UtensilsCrossed className="size-5" />}>
            <Button asChild variant="secondary" className="h-12 w-full">
              <a href={ficha.menu_url} target="_blank" rel="noreferrer">
                VER MENÚ
              </a>
            </Button>
          </Bloque>
        ) : null}

        {ficha.recibe_pedidos && ficha.productos.length ? (
          <Bloque titulo="Haz tu pedido" icono={<UtensilsCrossed className="size-5" />}>
            <ul className="space-y-3">
              {ficha.productos.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
                  {p.foto ? (
                    <img src={p.foto} alt={p.nombre} className="size-16 rounded-xl object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.nombre}</p>
                    {p.descripcion ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.descripcion}</p>
                    ) : null}
                    <p className="text-sm font-bold text-primary">{pesos(p.precio)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {carrito[p.id] ? (
                      <>
                        <button
                          onClick={() => cambiar(p.id, -1)}
                          aria-label="Quitar uno"
                          className="flex size-9 items-center justify-center rounded-full bg-card"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-5 text-center font-bold">{carrito[p.id]}</span>
                      </>
                    ) : null}
                    <button
                      onClick={() => cambiar(p.id, 1)}
                      aria-label="Agregar uno"
                      className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Bloque>
        ) : null}

        <Bloque titulo="Contacto">
          <div className="space-y-2">
            {whatsapp ? (
              <Button asChild className="h-14 w-full text-base font-semibold">
                <a
                  href={enlaceWhatsApp(
                    whatsapp,
                    `Hola ${ficha.nombre}, los vi en Tomar el Fresco en Yucatán y quiero más información.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  CONTACTAR POR WHATSAPP
                </a>
              </Button>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {ficha.facebook ? (
                <Redes
                  url={ficha.facebook}
                  icono={<Facebook className="size-4" />}
                  texto="Facebook"
                />
              ) : null}
              {ficha.instagram ? (
                <Redes
                  url={ficha.instagram}
                  icono={<Instagram className="size-4" />}
                  texto="Instagram"
                />
              ) : null}
              {ficha.sitio_web ? (
                <Redes
                  url={ficha.sitio_web}
                  icono={<Globe className="size-4" />}
                  texto="Sitio web"
                />
              ) : null}
            </div>
          </div>
        </Bloque>

        <Resenas ficha={ficha} onPedirTelefono={() => setPedirTelefono("resena")} />

        {piezas > 0 ? (
          <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-3xl px-4">
            <Button
              onClick={() => setPaso("pedido")}
              className="h-14 w-full text-base font-semibold shadow-lg"
            >
              VER MI PEDIDO · {piezas} {piezas === 1 ? "producto" : "productos"} · {pesos(total)}
            </Button>
          </div>
        ) : null}
      </div>

      {pedirTelefono ? (
        <Identificacion
          titulo={pedirTelefono === "guardar" ? "Guarda este negocio" : "Deja tu opinión"}
          onListo={() => {
            const accion = pedirTelefono;
            setPedirTelefono(null);
            if (accion === "guardar") void alternar();
          }}
          onCancelar={() => setPedirTelefono(null)}
        />
      ) : null}
    </MarcoPublico>
  );
}

function Redes({ url, icono, texto }: { url: string; icono: React.ReactNode; texto: string }) {
  return (
    <a
      href={url.startsWith("http") ? url : `https://${url}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium"
    >
      {icono}
      {texto}
    </a>
  );
}

function Bloque({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold">
        {icono ? <span className="text-primary">{icono}</span> : null}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Resenas({ ficha, onPedirTelefono }: { ficha: FichaPublica; onPedirTelefono: () => void }) {
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    const tel = telefonoGuardado();
    if (!tel) {
      onPedirTelefono();
      return;
    }
    try {
      await publicarResena({
        data: { telefono: tel, negocio_id: ficha.id, estrellas, comentario },
      });
      setEnviado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar tu opinión");
    }
  }

  return (
    <Bloque titulo="Opiniones">
      {ficha.comentarios.length ? (
        <ul className="space-y-3">
          {ficha.comentarios.map((c) => (
            <li key={c.id} className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-sm font-semibold">
                {"★".repeat(c.estrellas)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{c.telefono}</span>
              </p>
              {c.comentario ? <p className="mt-1 text-sm">{c.comentario}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay opiniones. ¡Sé la primera persona!
        </p>
      )}

      {enviado ? (
        <p className="text-sm font-semibold text-primary">¡Gracias por tu opinión!</p>
      ) : (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm font-semibold">Califica este negocio</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setEstrellas(n)} aria-label={`${n} estrellas`}>
                <Star
                  className={`size-7 ${n <= estrellas ? "fill-current text-primary" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Cuéntanos cómo te fue (opcional)"
            className="text-base"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button onClick={enviar} variant="secondary" className="h-12 w-full font-semibold">
            ENVIAR OPINIÓN
          </Button>
        </div>
      )}
    </Bloque>
  );
}

function Pedido({
  ficha,
  carrito,
  onVolver,
  onLimpiar,
}: {
  ficha: FichaPublica;
  carrito: Carrito;
  onVolver: () => void;
  onLimpiar: () => void;
}) {
  const [nombre, setNombre] = useState(nombreGuardado());
  const [telefono, setTelefono] = useState(telefonoGuardado() ?? "");
  const [tipo, setTipo] = useState<"recoger" | "domicilio">(
    ficha.domicilio ? "domicilio" : "recoger",
  );
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState<{ folio: string; enlace: string; total: number } | null>(null);

  const items = Object.entries(carrito)
    .map(([id, cantidad]) => {
      const p = ficha.productos.find((x) => x.id === id);
      return p ? { id, nombre: p.nombre, cantidad, importe: p.precio * cantidad } : null;
    })
    .filter(Boolean) as { id: string; nombre: string; cantidad: number; importe: number }[];
  const subtotal = items.reduce((a, i) => a + i.importe, 0);

  const distancia = distanciaKm(punto, ficha.latitud, ficha.longitud);
  const lejos =
    tipo === "domicilio" &&
    ficha.distancia_km != null &&
    distancia != null &&
    distancia > ficha.distancia_km;

  async function usarMiUbicacion() {
    const ubi = await pedirUbicacion();
    if (ubi) setPunto(ubi);
    else setError("No pudimos obtener tu ubicación. Escribe tu dirección con referencias.");
  }

  async function confirmar() {
    setError(null);
    setCargando(true);
    try {
      const r = await crearPedido({
        data: {
          negocio_id: ficha.id,
          cliente_nombre: nombre,
          cliente_telefono: telefono,
          tipo_entrega: tipo,
          direccion,
          referencia,
          items: items.map((i) => ({ id: i.id, cantidad: i.cantidad })),
        },
      });
      guardarNombre(nombre);
      const mensaje = mensajePedido({
        folio: r.folio,
        negocio: r.negocio,
        cliente: nombre,
        telefono,
        items: r.items,
        subtotal: r.subtotal,
        costo_entrega: r.costo_entrega,
        total_estimado: r.total_estimado,
        tipo_entrega: tipo,
        direccion:
          punto && tipo === "domicilio"
            ? `${direccion}\nUbicación en el mapa: https://www.google.com/maps/search/?api=1&query=${punto.lat},${punto.lng}`
            : direccion,
        referencia,
      });
      void marcarPedidoEnviado({ data: { id: r.id } });
      onLimpiar();
      setListo({
        folio: r.folio,
        total: r.total_estimado,
        enlace: enlaceWhatsApp(r.whatsapp, mensaje),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos registrar tu pedido");
    } finally {
      setCargando(false);
    }
  }

  if (listo) {
    return (
      <MarcoPublico>
        <div className="space-y-5 py-8 text-center">
          <h1 className="text-2xl font-bold">Tu pedido está listo</h1>
          <p className="text-sm text-muted-foreground">
            Folio <span className="font-bold text-foreground">{listo.folio}</span> · Total estimado{" "}
            {pesos(listo.total)}
          </p>
          <p className="text-sm">
            Ahora continúa por WhatsApp con {ficha.nombre} para confirmar disponibilidad, entrega y
            forma de pago.
          </p>
          <Button asChild className="h-14 w-full text-base font-semibold">
            <a href={listo.enlace} target="_blank" rel="noreferrer">
              CONTINUAR EN WHATSAPP
            </a>
          </Button>
          <Button variant="ghost" onClick={onVolver} className="h-12 w-full">
            Volver al negocio
          </Button>
        </div>
      </MarcoPublico>
    );
  }

  return (
    <MarcoPublico>
      <div className="space-y-5 pb-8">
        <Button variant="ghost" size="sm" onClick={onVolver}>
          <ArrowLeft className="size-4" /> Volver
        </Button>
        <h1 className="text-2xl font-bold">Tu pedido</h1>

        <ul className="space-y-2 rounded-3xl border border-border bg-card p-5 text-sm shadow-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span>
                {i.cantidad} × {i.nombre}
              </span>
              <span className="font-semibold">{pesos(i.importe)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>Subtotal</span>
            <span>{pesos(subtotal)}</span>
          </li>
        </ul>

        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-base">
              Tu nombre
            </Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel" className="text-base">
              Tu celular
            </Label>
            <Input
              id="tel"
              inputMode="numeric"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="h-13 text-base"
            />
          </div>

          <div className="space-y-2">
            <p className="text-base font-medium">¿Cómo lo quieres?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tipo === "recoger" ? "default" : "secondary"}
                onClick={() => setTipo("recoger")}
                className="h-13"
              >
                Recoger
              </Button>
              <Button
                variant={tipo === "domicilio" ? "default" : "secondary"}
                onClick={() => setTipo("domicilio")}
                disabled={!ficha.domicilio}
                className="h-13"
              >
                A domicilio
              </Button>
            </div>
          </div>

          {tipo === "domicilio" ? (
            <>
              <div className="space-y-2">
                <Label className="text-base">Confirma dónde quieres recibir tu pedido</Label>
                <Button
                  type="button"
                  variant={punto ? "secondary" : "default"}
                  onClick={usarMiUbicacion}
                  className="h-13 w-full text-base font-semibold"
                >
                  <MapPin className="mr-2 size-5" />
                  {punto ? "Ubicación confirmada" : "Usar mi ubicación"}
                </Button>
                {punto ? (
                  <ClientOnly fallback={<div className="h-48 w-full rounded-2xl bg-secondary" />}>
                    <MapaPunto
                      lat={punto.lat}
                      lng={punto.lng}
                      altura="h-48"
                      onMover={(lat, lng) => setPunto({ lat, lng })}
                    />
                  </ClientOnly>
                ) : null}
                {lejos ? (
                  <p className="rounded-2xl bg-secondary p-3 text-sm font-semibold">
                    Estás fuera del área de entrega ({ficha.distancia_km} km). Puedes continuar y
                    preguntar al negocio por WhatsApp.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir" className="text-base">
                  Dirección de entrega
                </Label>
                <Textarea
                  id="dir"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref" className="text-base">
                  Referencia (opcional)
                </Label>
                <Input
                  id="ref"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="h-13 text-base"
                />
              </div>
            </>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          El pago no se realiza en la aplicación. El precio final, la entrega y la forma de pago se
          confirman directamente con el negocio por WhatsApp.
        </p>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

        <Button
          onClick={confirmar}
          disabled={cargando}
          className="h-14 w-full text-base font-semibold"
        >
          {cargando ? <Loader2 className="size-5 animate-spin" /> : "CONFIRMAR PEDIDO"}
        </Button>
      </div>
    </MarcoPublico>
  );
}
