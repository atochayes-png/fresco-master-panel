import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  PartyPopper,
  Users,
} from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { MapaPunto } from "@/components/mapa-punto";
import { GaleriaMedios } from "@/components/galeria-medios";
import {
  crearContactoDivertirme,
  fichaLugar,
  marcarContactoEnviado,
  type FichaLugar,
} from "@/lib/divertirme.publico.functions";
import {
  HORAS_SUGERIDAS,
  fechaLargaD,
  hora12,
  hoyISOD,
  mananaISO,
  nombreSubcategoria,
  textoReserva,
  textoRestriccion,
} from "@/lib/divertirme";
import { DIAS } from "@/lib/dueno";
import {
  guardarNombre,
  guardarTelefono,
  nombreGuardado,
  pesos,
  telefonoGuardado,
} from "@/lib/publico";
import { urlImagen } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/lugar/$id")({
  head: () => ({
    meta: [
      { title: "Lugar para salir — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Ambiente, horarios, cover, eventos y promociones de este lugar en Yucatán. Pregunta directo por WhatsApp.",
      },
      { property: "og:title", content: "Lugar para salir en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Fotos, ambiente, horario, cover y eventos. Pregunta por WhatsApp.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lugar,
});

type Resultado = {
  id: string;
  folio: string;
  negocio: string;
  fecha_visita: string | null;
  hora_visita: string | null;
  personas: number | null;
  reserva_recomendada: string;
  whatsapp: string;
};

function Lugar() {
  const { id } = useParams({ from: "/lugar/$id" });
  const [ficha, setFicha] = useState<FichaLugar | null | undefined>(undefined);
  const [plan, setPlan] = useState(false);
  const [fecha, setFecha] = useState(hoyISOD());
  const [hora, setHora] = useState("21:00");
  const [personas, setPersonas] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    let vivo = true;
    void fichaLugar({ data: { id } }).then((f) => {
      if (vivo) setFicha(f);
    });
    return () => {
      vivo = false;
    };
  }, [id]);

  useEffect(() => {
    setNombre(nombreGuardado());
    setTelefono(telefonoGuardado() ?? "");
  }, []);

  if (ficha === undefined) {
    return (
      <MarcoPublico>
        <div className="flex justify-center py-20">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      </MarcoPublico>
    );
  }

  if (!ficha) {
    return (
      <MarcoPublico>
        <div className="space-y-4 py-16 text-center">
          <h1 className="text-xl font-bold">Este lugar no está disponible</h1>
          <Button asChild variant="secondary">
            <Link to="/divertirme" search={{ q: "", sub: "", municipio: "" }}>
              Ver otros planes
            </Link>
          </Button>
        </div>
      </MarcoPublico>
    );
  }

  const edad = textoRestriccion(ficha.restriccion_edad);
  const reserva = textoReserva(ficha.reserva_recomendada);
  const wa = ficha.whatsapp ? ficha.whatsapp.replace(/\D/g, "").slice(-10) : "";

  /** Mensaje corto: cero fricción, sin pedir fecha ni datos. */
  const mensajeSimple = encodeURIComponent(
    `Hola, los encontré en Tomar el Fresco en Yucatán y quisiera información para visitarlos.`,
  );

  async function enviarPlan() {
    if (!ficha) return;
    setOcupado(true);
    setError(null);
    try {
      const r = (await crearContactoDivertirme({
        data: {
          negocio_id: ficha.id,
          evento_id: ficha.evento?.id ?? null,
          fecha_visita: fecha || null,
          hora_visita: hora || null,
          personas: personas ? Number(personas) : null,
          cliente_nombre: nombre,
          cliente_telefono: telefono,
        },
      })) as Resultado;
      guardarNombre(nombre.trim());
      guardarTelefono(telefono.replace(/\D/g, ""));
      setResultado(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos registrar tu contacto");
    } finally {
      setOcupado(false);
    }
  }

  function abrirWhatsApp(r: Resultado) {
    const lineas = [
      `Hola, encontré ${r.negocio} en Tomar el Fresco en Yucatán.`,
      r.fecha_visita
        ? `Quiero visitarlos el ${fechaLargaD(r.fecha_visita)}${
            r.hora_visita ? ` alrededor de las ${hora12(r.hora_visita)}` : ""
          }.`
        : "Quiero visitarlos pronto.",
      r.personas ? `Somos aproximadamente ${r.personas} personas.` : "",
      r.reserva_recomendada === "recomendable"
        ? "Vi en Tomar el Fresco que recomiendan reservar. ¿Necesito reservar?"
        : "¿Necesito reservar?",
      "Gracias.",
    ].filter(Boolean);

    void marcarContactoEnviado({ data: { id: r.id } });
    window.open(
      `https://wa.me/52${r.whatsapp.slice(-10)}?text=${encodeURIComponent(lineas.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (resultado) {
    return (
      <MarcoPublico>
        <div className="space-y-5 py-6">
          <h1 className="text-2xl font-bold">Tu plan</h1>
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">{resultado.folio}</p>
            <p className="text-lg font-bold">{resultado.negocio}</p>
            {resultado.fecha_visita ? (
              <p className="text-sm">Día: {fechaLargaD(resultado.fecha_visita)}</p>
            ) : null}
            {resultado.hora_visita ? (
              <p className="text-sm">Hora aproximada: {hora12(resultado.hora_visita)}</p>
            ) : null}
            {resultado.personas ? <p className="text-sm">Personas: {resultado.personas}</p> : null}
            {textoReserva(resultado.reserva_recomendada) ? (
              <p className="text-sm">
                Reservación: {textoReserva(resultado.reserva_recomendada)} según el establecimiento
              </p>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Tomar el Fresco no reserva mesas ni confirma acceso: el lugar te responde directo.
          </p>
          <Button className="h-13 w-full text-base" onClick={() => abrirWhatsApp(resultado)}>
            <MessageCircle className="size-5" /> PREGUNTAR POR WHATSAPP
          </Button>
          <Button asChild variant="secondary" className="h-12 w-full">
            <Link to="/divertirme" search={{ q: "", sub: "", municipio: "" }}>
              Ver otros planes
            </Link>
          </Button>
        </div>
      </MarcoPublico>
    );
  }

  return (
    <MarcoPublico>
      <div className="space-y-5 pb-24">
        <Link
          to="/divertirme"
          search={{ q: "", sub: "", municipio: "" }}
          className="inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>

        <div className="flex items-center gap-3">
          {ficha.logotipo ? (
            <img
              src={urlImagen(ficha.logotipo, "tarjeta")}
              alt={`Logotipo de ${ficha.nombre}`}
              loading="lazy"
              className="size-16 rounded-2xl object-cover"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold">{ficha.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {ficha.subcategorias.map(nombreSubcategoria).join(" · ") || ficha.municipio}
            </p>
          </div>
        </div>

        <GaleriaMedios medios={ficha.medios} nombre={ficha.nombre} />

        {ficha.descripcion ? <p className="text-sm">{ficha.descripcion}</p> : null}

        <div className="flex flex-wrap gap-2 text-sm">
          {edad ? (
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold">🔞 {edad}</span>
          ) : null}
          {ficha.cover_texto ? (
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold">
              💰 {ficha.cover_texto}
            </span>
          ) : null}
          {reserva ? (
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold">📋 {reserva}</span>
          ) : null}
        </div>

        {ficha.restriccion_notas ? (
          <p className="text-sm text-muted-foreground">{ficha.restriccion_notas}</p>
        ) : null}

        {ficha.ambiente.length ? (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Ambiente</h2>
            <div className="flex flex-wrap gap-2">
              {ficha.ambiente.map((a) => (
                <span key={a} className="rounded-full border border-border px-3 py-1 text-sm">
                  {a}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {ficha.eventos.length ? (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <CalendarClock className="size-4 text-primary" /> Próximos eventos
            </h2>
            {ficha.eventos.map((e) => (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-3">
                {e.foto_url ? (
                  <img
                    src={urlImagen(e.foto_url, "tarjeta")}
                    alt={e.nombre}
                    loading="lazy"
                    className="mb-2 h-36 w-full rounded-xl object-cover"
                  />
                ) : null}
                <p className="font-bold">{e.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {e.fecha ? fechaLargaD(e.fecha) : ""}
                  {e.hora ? ` · ${hora12(e.hora)}` : ""}
                </p>
                {e.descripcion ? <p className="mt-1 text-sm">{e.descripcion}</p> : null}
                {e.cover_monto ? (
                  <p className="text-sm font-semibold">Cover {pesos(e.cover_monto)}</p>
                ) : null}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              El lugar confirma personalmente si todavía hay espacio.
            </p>
          </section>
        ) : null}

        {ficha.promociones.length ? (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Promociones</h2>
            {ficha.promociones.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-3">
                <p className="font-bold">{p.titulo}</p>
                {p.descripcion ? (
                  <p className="text-sm text-muted-foreground">{p.descripcion}</p>
                ) : null}
                {p.precio ? <p className="text-sm font-semibold">{pesos(p.precio)}</p> : null}
              </div>
            ))}
          </section>
        ) : null}

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Clock className="size-4 text-primary" /> Horario
          </h2>
          <div className="rounded-2xl border border-border bg-card p-3 text-sm">
            {ficha.horarios.filter((h) => h.abierto).length === 0 ? (
              <p className="text-muted-foreground">Consulta el horario por WhatsApp.</p>
            ) : (
              ficha.horarios
                .filter((h) => h.abierto)
                .map((h) => (
                  <p key={h.dia}>
                    {DIAS[h.dia]}: {hora12(h.apertura)} a {hora12(h.cierre)}
                  </p>
                ))
            )}
            {ficha.horario_notas ? (
              <p className="mt-2 text-muted-foreground">{ficha.horario_notas}</p>
            ) : null}
          </div>
        </section>

        {ficha.menu_url ? (
          <Button asChild variant="secondary" className="h-12 w-full">
            <a href={ficha.menu_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Ver carta o precios
            </a>
          </Button>
        ) : null}

        {ficha.latitud != null && ficha.longitud != null ? (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <MapPin className="size-4 text-primary" /> Ubicación
            </h2>
            {ficha.direccion ? <p className="text-sm">{ficha.direccion}</p> : null}
            <MapaPunto lat={ficha.latitud} lng={ficha.longitud} />
            <Button asChild variant="secondary" className="h-12 w-full">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${ficha.latitud},${ficha.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" /> Cómo llegar
              </a>
            </Button>
          </section>
        ) : null}

        {(ficha.facebook || ficha.instagram || ficha.sitio_web) && (
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            {ficha.facebook ? (
              <a href={ficha.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            ) : null}
            {ficha.instagram ? (
              <a href={ficha.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            ) : null}
            {ficha.sitio_web ? (
              <a href={ficha.sitio_web} target="_blank" rel="noopener noreferrer">
                Sitio web
              </a>
            ) : null}
          </div>
        )}

        {plan ? (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <PartyPopper className="size-4 text-primary" /> Cuéntales tu plan
            </h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={fecha === hoyISOD() ? "default" : "secondary"}
                className="h-11 flex-1"
                onClick={() => setFecha(hoyISOD())}
              >
                Hoy
              </Button>
              <Button
                type="button"
                variant={fecha === mananaISO() ? "default" : "secondary"}
                className="h-11 flex-1"
                onClick={() => setFecha(mananaISO())}
              >
                Mañana
              </Button>
            </div>
            <div>
              <Label htmlFor="fecha">Elegir fecha</Label>
              <Input
                id="fecha"
                type="date"
                min={hoyISOD()}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hora">Hora aproximada</Label>
              <div className="mb-2 flex flex-wrap gap-2">
                {HORAS_SUGERIDAS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHora(h)}
                    className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                      hora === h ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {hora12(h)}
                  </button>
                ))}
              </div>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="personas">
                <Users className="mr-1 inline size-4" />
                ¿Cuántas personas aproximadamente? (opcional)
              </Label>
              <Input
                id="personas"
                inputMode="numeric"
                value={personas}
                onChange={(e) => setPersonas(e.target.value)}
                placeholder="4"
              />
            </div>
            <div>
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tel">Tu teléfono</Label>
              <Input
                id="tel"
                inputMode="numeric"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="9991234567"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              className="h-13 w-full text-base"
              disabled={ocupado}
              onClick={() => void enviarPlan()}
            >
              {ocupado ? <Loader2 className="size-5 animate-spin" /> : "REVISAR MI PLAN"}
            </Button>
          </section>
        ) : (
          <Button className="h-13 w-full text-base" onClick={() => setPlan(true)}>
            <PartyPopper className="size-5" /> QUIERO IR
          </Button>
        )}

        {wa ? (
          <Button asChild variant="secondary" className="h-12 w-full">
            <a
              href={`https://wa.me/52${wa}?text=${mensajeSimple}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" /> Sólo quiero preguntar por WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    </MarcoPublico>
  );
}
