import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Compass,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Users,
} from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { MapaPunto } from "@/components/mapa-punto";
import { GaleriaMedios } from "@/components/galeria-medios";
import {
  crearReservacion,
  fichaExperiencia,
  marcarReservacionEnviada,
  type FichaExperiencia,
} from "@/lib/conocer.publico.functions";
import {
  emojiCategoriaConocer,
  nombreCategoriaConocer,
  textoPrecio,
  totalEstimado,
} from "@/lib/conocer";
import {
  guardarNombre,
  guardarTelefono,
  nombreGuardado,
  pesos,
  telefonoGuardado,
} from "@/lib/publico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/experiencia/$id")({
  head: () => ({
    meta: [
      { title: "Experiencia — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Conoce los detalles de esta experiencia en Yucatán: fotos, precio, duración, punto de salida y solicitud de reservación.",
      },
      { property: "og:title", content: "Experiencia en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Fotos, precio, duración y punto de salida. Solicita tu reservación por WhatsApp.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Experiencia,
});

function Experiencia() {
  const { id } = useParams({ from: "/experiencia/$id" });
  const [ficha, setFicha] = useState<FichaExperiencia | null | undefined>(undefined);
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void fichaExperiencia({ data: { id } }).then((f) => {
      if (vivo) setFicha(f);
    });
    return () => {
      vivo = false;
    };
  }, [id]);

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
          <h1 className="text-xl font-bold">Esta experiencia no está disponible</h1>
          <Button asChild variant="secondary">
            <Link to="/conocer" search={{ q: "", categoria: "", municipio: "" }}>
              Ver otras experiencias
            </Link>
          </Button>
        </div>
      </MarcoPublico>
    );
  }

  return (
    <MarcoPublico>
      <article className="space-y-5">
        <Button asChild variant="ghost" size="sm">
          <Link to="/conocer" search={{ q: "", categoria: "", municipio: "" }}>
            <ArrowLeft className="size-4" /> Conocer
          </Link>
        </Button>

        {ficha.medios.length ? (
          <GaleriaMedios
            medios={ficha.medios.map((m) => ({ ...m, destacado: false }))}
            nombre={ficha.nombre}
          />
        ) : ficha.foto ? (
          <img src={ficha.foto} alt={ficha.nombre} className="h-52 w-full rounded-3xl object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-3xl bg-secondary">
            <Compass className="size-8 text-muted-foreground" />
          </div>
        )}

        <header className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight">{ficha.nombre}</h1>
          <p className="text-sm text-muted-foreground">{ficha.negocio}</p>
          <p className="text-sm">
            {emojiCategoriaConocer(ficha.categoria)} {nombreCategoriaConocer(ficha.categoria)}
          </p>
          <p className="text-lg font-bold text-primary">
            {textoPrecio(ficha.precio, ficha.precio_tipo)}
          </p>
        </header>

        {ficha.descripcion ? <p className="text-base">{ficha.descripcion}</p> : null}

        <div className="grid grid-cols-2 gap-3">
          {ficha.duracion ? (
            <Dato icono={<Clock className="size-4" />} titulo="Duración" valor={ficha.duracion} />
          ) : null}
          {ficha.capacidad ? (
            <Dato
              icono={<Users className="size-4" />}
              titulo="Capacidad"
              valor={`Hasta ${ficha.capacidad} personas`}
            />
          ) : null}
          {ficha.punto_salida ? (
            <Dato
              icono={<MapPin className="size-4" />}
              titulo="Punto de salida"
              valor={ficha.punto_salida}
            />
          ) : null}
          {ficha.horarios.length ? (
            <Dato
              icono={<Clock className="size-4" />}
              titulo="Horarios"
              valor={ficha.horarios.join(" · ")}
            />
          ) : null}
        </div>

        {ficha.extras.length ? (
          <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-base font-bold">Extras opcionales</h2>
            <ul className="text-sm">
              {ficha.extras.map((x) => (
                <li key={x.nombre}>
                  {x.nombre}
                  {x.precio ? ` · ${pesos(x.precio)}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {ficha.requiere_anticipo ? (
          <section className="space-y-1 rounded-2xl bg-secondary p-4">
            <p className="text-sm font-semibold">
              Esta experiencia requiere anticipo para confirmar la reservación.
            </p>
            <p className="text-sm text-muted-foreground">
              El establecimiento te indicará directamente el monto, condiciones y forma de pago al
              confirmar disponibilidad.
            </p>
          </section>
        ) : null}

        {ficha.latitud != null && ficha.longitud != null ? (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Punto de salida</h2>
            <MapaPunto lat={ficha.latitud} lng={ficha.longitud} altura="h-52" />
            <Button asChild variant="secondary" className="h-12 w-full">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${ficha.latitud},${ficha.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" /> CÓMO LLEGAR AL PUNTO DE SALIDA
              </a>
            </Button>
          </section>
        ) : null}

        {ficha.whatsapp ? (
          <Button asChild variant="secondary" className="h-12 w-full">
            <a
              href={`https://wa.me/52${ficha.whatsapp.replace(/\D/g, "").slice(-10)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" /> Escribir al prestador
            </a>
          </Button>
        ) : null}

        {ficha.activa ? (
          <Button
            className="h-14 w-full text-base font-semibold"
            onClick={() => setSolicitando(true)}
          >
            SOLICITAR RESERVACIÓN
          </Button>
        ) : (
          <p className="rounded-2xl bg-secondary p-4 text-center text-sm font-semibold">
            Temporalmente no disponible
          </p>
        )}

        {solicitando ? (
          <Solicitud ficha={ficha} cerrar={() => setSolicitando(false)} />
        ) : null}
      </article>
    </MarcoPublico>
  );
}

function Dato({
  icono,
  titulo,
  valor,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {icono} {titulo}
      </p>
      <p className="text-sm font-semibold">{valor}</p>
    </div>
  );
}

type Resultado = Awaited<ReturnType<typeof crearReservacion>>;

function Solicitud({ ficha, cerrar }: { ficha: FichaExperiencia; cerrar: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [horario, setHorario] = useState(ficha.horarios[0] ?? "Horario a convenir");
  const [personas, setPersonas] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    setNombre(nombreGuardado());
    setTelefono(telefonoGuardado() ?? "");
  }, []);

  const seleccionados = ficha.extras.filter((x) => extras.includes(x.nombre));
  const total = totalEstimado(ficha.precio, ficha.precio_tipo, personas, seleccionados);
  const excede = ficha.capacidad != null && personas > ficha.capacidad;

  async function enviar() {
    setError(null);
    setOcupado(true);
    try {
      const r = await crearReservacion({
        data: {
          experiencia_id: ficha.id,
          cliente_nombre: nombre,
          cliente_telefono: telefono,
          fecha,
          horario,
          personas,
          extras,
        },
      });
      guardarNombre(nombre.trim());
      guardarTelefono(telefono.replace(/\D/g, ""));
      setResultado(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos generar la solicitud");
    } finally {
      setOcupado(false);
    }
  }

  function abrirWhatsApp() {
    if (!resultado) return;
    const lineas = [
      "SOLICITUD DE RESERVACIÓN — TOMAR EL FRESCO EN YUCATÁN",
      `Folio: #${resultado.folio}`,
      "",
      `Experiencia: ${resultado.experiencia}`,
      `Cliente: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Fecha: ${fecha || "Por definir"}`,
      `Hora: ${horario}`,
      `Personas: ${resultado.personas}`,
      resultado.extras.length
        ? `Extras: ${resultado.extras.map((x) => x.nombre).join(", ")}`
        : null,
      resultado.total_estimado != null
        ? `Total estimado: ${pesos(resultado.total_estimado)}`
        : "Precio sujeto a confirmación.",
      "",
      resultado.requiere_anticipo
        ? "Esta experiencia indica que requiere anticipo para confirmar."
        : null,
      "Esta solicitud fue generada desde Tomar el Fresco en Yucatán.",
      "Por favor confirma directamente con el cliente disponibilidad y condiciones de la reservación.",
    ].filter(Boolean);

    void marcarReservacionEnviada({ data: { id: resultado.id } });
    window.open(
      `https://wa.me/52${resultado.whatsapp.slice(-10)}?text=${encodeURIComponent(lineas.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (resultado) {
    return (
      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-bold">Revisar solicitud</h2>
        <p className="text-sm font-semibold">{resultado.folio}</p>
        <ul className="space-y-1 text-sm">
          <li>{resultado.experiencia}</li>
          <li>{resultado.negocio}</li>
          <li>Cliente: {nombre}</li>
          <li>Fecha: {fecha || "Por definir"}</li>
          <li>Hora: {horario}</li>
          <li>Personas: {resultado.personas}</li>
          {resultado.extras.length ? (
            <li>Extras: {resultado.extras.map((x) => x.nombre).join(", ")}</li>
          ) : null}
          <li className="font-bold">
            {resultado.total_estimado != null
              ? `Total estimado: ${pesos(resultado.total_estimado)}`
              : "Precio sujeto a confirmación."}
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Esta solicitud está pendiente de confirmación del prestador.
        </p>
        {resultado.requiere_anticipo ? (
          <p className="text-sm text-muted-foreground">
            Esta experiencia requiere anticipo para confirmar. El prestador te indicará directamente
            los detalles después de confirmar disponibilidad.
          </p>
        ) : null}
        <Button className="h-14 w-full text-base font-semibold" onClick={abrirWhatsApp}>
          ENVIAR SOLICITUD POR WHATSAPP
        </Button>
        <Button variant="ghost" className="w-full" onClick={cerrar}>
          Cerrar
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-bold">Solicitar reservación</h2>

      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha</Label>
        <Input
          id="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="h-13 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hora">Horario</Label>
        <select
          id="hora"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
        >
          {(ficha.horarios.length ? ficha.horarios : ["Horario a convenir"]).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="personas">Número de personas</Label>
        <Input
          id="personas"
          inputMode="numeric"
          value={String(personas)}
          onChange={(e) => setPersonas(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
          className="h-13 text-base"
        />
        {excede ? (
          <p className="text-sm font-semibold text-destructive">
            Esta experiencia acepta máximo {ficha.capacidad} personas.
          </p>
        ) : null}
      </div>

      {ficha.extras.length ? (
        <div className="space-y-2">
          <Label>Extras</Label>
          {ficha.extras.map((x) => (
            <label key={x.nombre} className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
              <input
                type="checkbox"
                checked={extras.includes(x.nombre)}
                onChange={(e) =>
                  setExtras(
                    e.target.checked
                      ? [...extras, x.nombre]
                      : extras.filter((n) => n !== x.nombre),
                  )
                }
                className="size-5"
              />
              <span className="text-sm font-semibold">
                {x.nombre}
                {x.precio ? ` · ${pesos(x.precio)}` : ""}
              </span>
            </label>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="nombre">Tu nombre</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="h-13 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tel">Tu teléfono</Label>
        <Input
          id="tel"
          inputMode="numeric"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="h-13 text-base"
        />
      </div>

      <p className="text-sm font-semibold">
        {total != null ? `Total estimado: ${pesos(total)}` : "Precio sujeto a confirmación."}
      </p>
      <p className="text-sm text-muted-foreground">
        Solicitud pendiente de confirmación del prestador.
      </p>

      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <Button
        className="h-14 w-full text-base font-semibold"
        disabled={ocupado || excede}
        onClick={() => void enviar()}
      >
        {ocupado ? <Loader2 className="size-5 animate-spin" /> : "REVISAR SOLICITUD"}
      </Button>
      <Button variant="ghost" className="w-full" onClick={cerrar}>
        Cancelar
      </Button>
    </section>
  );
}
