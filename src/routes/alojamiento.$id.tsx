import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
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
  crearSolicitudHospedaje,
  fechasNoDisponibles,
  fichaAlojamiento,
  marcarSolicitudHospedajeEnviada,
  type FichaAlojamiento,
} from "@/lib/hospedaje.publico.functions";
import {
  ctaDisponibilidad,
  fechaLarga,
  hoyISO,
  noches,
  nochesDelRango,
  nombreTipoAlojamiento,
  textoDisponibilidad,
  textoPrecioNoche,
  totalHospedaje,
} from "@/lib/hospedaje";
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

type BusquedaFicha = { entrada: string; salida: string; huespedes: number };

export const Route = createFileRoute("/alojamiento/$id")({
  validateSearch: (s: Record<string, unknown>): BusquedaFicha => ({
    entrada: typeof s["entrada"] === "string" ? s["entrada"] : "",
    salida: typeof s["salida"] === "string" ? s["salida"] : "",
    huespedes: Number(s["huespedes"]) > 0 ? Number(s["huespedes"]) : 2,
  }),
  head: () => ({
    meta: [
      { title: "Alojamiento — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Fotos, capacidad, servicios, precio por noche y solicitud de hospedaje directa por WhatsApp.",
      },
      { property: "og:title", content: "Alojamiento en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Consulta disponibilidad y solicita tu hospedaje por WhatsApp.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Alojamiento,
});

function Alojamiento() {
  const { id } = useParams({ from: "/alojamiento/$id" });
  const busqueda = Route.useSearch();
  const [ficha, setFicha] = useState<FichaAlojamiento | null | undefined>(undefined);
  const [bloqueadas, setBloqueadas] = useState<string[]>([]);
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void fichaAlojamiento({
      data: { id, entrada: busqueda.entrada || null, salida: busqueda.salida || null },
    }).then((f) => {
      if (vivo) setFicha(f);
    });
    void fechasNoDisponibles({ data: { alojamiento_id: id } }).then((f) => {
      if (vivo) setBloqueadas(f);
    });
    return () => {
      vivo = false;
    };
  }, [id, busqueda.entrada, busqueda.salida]);

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
          <h1 className="text-xl font-bold">Este alojamiento no está disponible</h1>
          <Button asChild variant="secondary">
            <Link
              to="/hospedaje"
              search={{ q: "", municipio: "", entrada: "", salida: "", huespedes: 2 }}
            >
              Ver otros hospedajes
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
          <Link
            to="/hospedaje"
            search={{
              q: "",
              municipio: "",
              entrada: busqueda.entrada,
              salida: busqueda.salida,
              huespedes: busqueda.huespedes,
            }}
          >
            <ArrowLeft className="size-4" /> Hospedaje
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
            <BedDouble className="size-8 text-muted-foreground" />
          </div>
        )}

        <header className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight">{ficha.nombre}</h1>
          <p className="text-sm text-muted-foreground">{ficha.negocio}</p>
          <p className="text-sm">
            {nombreTipoAlojamiento(ficha.tipo)} · {ficha.municipio}
          </p>
          <p className="text-lg font-bold text-primary">
            {textoPrecioNoche(ficha.precio, ficha.precio_tipo)}
          </p>
          <p className="text-sm text-muted-foreground">
            {textoDisponibilidad(ficha.modo_disponibilidad)}
          </p>
        </header>

        {ficha.descripcion ? <p className="text-base">{ficha.descripcion}</p> : null}

        <div className="grid grid-cols-2 gap-3">
          <Dato
            icono={<Users className="size-4" />}
            titulo="Capacidad"
            valor={`Hasta ${ficha.capacidad} personas`}
          />
          {ficha.camas ? (
            <Dato
              icono={<BedDouble className="size-4" />}
              titulo="Camas"
              valor={`${ficha.camas}${ficha.tipo_camas ? ` · ${ficha.tipo_camas}` : ""}`}
            />
          ) : null}
          {ficha.checkin ? (
            <Dato
              icono={<CalendarDays className="size-4" />}
              titulo="Entrada"
              valor={ficha.checkin}
            />
          ) : null}
          {ficha.checkout ? (
            <Dato
              icono={<CalendarDays className="size-4" />}
              titulo="Salida"
              valor={ficha.checkout}
            />
          ) : null}
        </div>

        {ficha.servicios.length ? (
          <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-base font-bold">Servicios</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {ficha.servicios.map((s) => (
                <li key={s} className="rounded-full bg-secondary px-3 py-1">
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-1 rounded-2xl bg-secondary p-4 text-sm">
          <p className="font-semibold">
            {ficha.acepta_ninos ? "Se aceptan niños" : "No se aceptan niños"} ·{" "}
            {ficha.acepta_mascotas ? "Pet friendly" : "No se aceptan mascotas"}
          </p>
          {ficha.requiere_anticipo ? (
            <p className="text-muted-foreground">
              Este hospedaje indica que solicita anticipo. El monto y la forma de pago los acuerdas
              directamente con el anfitrión.
            </p>
          ) : null}
          {ficha.notas_hospedaje ? (
            <p className="text-muted-foreground">{ficha.notas_hospedaje}</p>
          ) : null}
          <p className="text-muted-foreground">
            Tomar el Fresco no confirma reservaciones ni recibe pagos.
          </p>
        </section>

        {bloqueadas.length ? (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Fechas ya ocupadas</h2>
            <ul className="flex flex-wrap gap-2">
              {bloqueadas.slice(0, 20).map((f) => (
                <li key={f} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {fechaLarga(f)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {ficha.latitud != null && ficha.longitud != null ? (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Ubicación</h2>
            {ficha.direccion ? (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {ficha.direccion}
              </p>
            ) : null}
            <MapaPunto lat={ficha.latitud} lng={ficha.longitud} altura="h-52" />
            <Button asChild variant="secondary" className="h-12 w-full">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${ficha.latitud},${ficha.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" /> CÓMO LLEGAR
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
              <MessageCircle className="size-4" /> Escribir al anfitrión
            </a>
          </Button>
        ) : null}

        {ficha.activo ? (
          <Button
            className="h-14 w-full text-base font-semibold"
            onClick={() => setSolicitando(true)}
          >
            {ctaDisponibilidad(ficha.modo_disponibilidad)}
          </Button>
        ) : (
          <p className="rounded-2xl bg-secondary p-4 text-center text-sm font-semibold">
            Temporalmente no disponible
          </p>
        )}

        {solicitando ? (
          <Solicitud
            ficha={ficha}
            bloqueadas={bloqueadas}
            inicial={busqueda}
            cerrar={() => setSolicitando(false)}
          />
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

type Resultado = Awaited<ReturnType<typeof crearSolicitudHospedaje>>;

function Solicitud({
  ficha,
  bloqueadas,
  inicial,
  cerrar,
}: {
  ficha: FichaAlojamiento;
  bloqueadas: string[];
  inicial: BusquedaFicha;
  cerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [entrada, setEntrada] = useState(inicial.entrada);
  const [salida, setSalida] = useState(inicial.salida);
  const [huespedes, setHuespedes] = useState(Math.min(inicial.huespedes, ficha.capacidad));
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    setNombre(nombreGuardado());
    setTelefono(telefonoGuardado() ?? "");
  }, []);

  const cantidadNoches = noches(entrada, salida);
  const total = totalHospedaje(ficha.precio, ficha.precio_tipo, cantidadNoches);
  const excede = huespedes > ficha.capacidad;
  const chocaCalendario =
    ficha.modo_disponibilidad === "con_calendario" &&
    cantidadNoches != null &&
    nochesDelRango(entrada, salida).some((f) => bloqueadas.includes(f));

  async function enviar() {
    setError(null);
    setOcupado(true);
    try {
      const r = await crearSolicitudHospedaje({
        data: {
          alojamiento_id: ficha.id,
          entrada,
          salida,
          huespedes,
          cliente_nombre: nombre,
          cliente_telefono: telefono,
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
      "SOLICITUD DE HOSPEDAJE — TOMAR EL FRESCO EN YUCATÁN",
      `Folio: #${resultado.folio}`,
      "",
      `Alojamiento: ${resultado.alojamiento}`,
      `Huésped: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Entrada: ${fechaLarga(entrada)}`,
      `Salida: ${fechaLarga(salida)}`,
      `Noches: ${resultado.noches}`,
      `Huéspedes: ${resultado.huespedes}`,
      resultado.total_estimado != null
        ? `Total estimado: ${pesos(resultado.total_estimado)}`
        : "Precio sujeto a confirmación.",
      "",
      resultado.modo_disponibilidad === "con_calendario"
        ? "Estas fechas aparecen libres en el calendario, pero la disponibilidad final la confirma el hospedaje."
        : "La disponibilidad está por confirmar directamente con el hospedaje.",
      resultado.requiere_anticipo
        ? "Este hospedaje indica que solicita anticipo para apartar."
        : null,
      "Esta solicitud fue generada desde Tomar el Fresco en Yucatán.",
      "Por favor confirma directamente con el huésped disponibilidad y condiciones.",
    ].filter(Boolean);

    void marcarSolicitudHospedajeEnviada({ data: { id: resultado.id } });
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
          <li>{resultado.alojamiento}</li>
          <li>{resultado.negocio}</li>
          <li>Huésped: {nombre}</li>
          <li>
            {fechaLarga(entrada)} al {fechaLarga(salida)} · {resultado.noches}{" "}
            {resultado.noches === 1 ? "noche" : "noches"}
          </li>
          <li>Huéspedes: {resultado.huespedes}</li>
          <li className="font-bold">
            {resultado.total_estimado != null
              ? `Total estimado: ${pesos(resultado.total_estimado)}`
              : "Precio sujeto a confirmación."}
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Esta solicitud está pendiente de confirmación del hospedaje. Tomar el Fresco no confirma ni
          cobra.
        </p>
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
      <h2 className="text-lg font-bold">
        {ficha.modo_disponibilidad === "con_calendario"
          ? "Solicitar hospedaje"
          : "Consultar disponibilidad"}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fin">Entrada</Label>
          <Input
            id="fin"
            type="date"
            min={hoyISO()}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fout">Salida</Label>
          <Input
            id="fout"
            type="date"
            min={entrada || hoyISO()}
            value={salida}
            onChange={(e) => setSalida(e.target.value)}
            className="h-13 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hue">Huéspedes</Label>
        <Input
          id="hue"
          inputMode="numeric"
          value={String(huespedes)}
          onChange={(e) => setHuespedes(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
          className="h-13 text-base"
        />
        {excede ? (
          <p className="text-sm font-semibold text-destructive">
            Este alojamiento acepta máximo {ficha.capacidad} personas.
          </p>
        ) : null}
      </div>

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
        {cantidadNoches
          ? `${cantidadNoches} ${cantidadNoches === 1 ? "noche" : "noches"}`
          : "Elige tus fechas"}
        {total != null ? ` · Total estimado: ${pesos(total)}` : " · Precio sujeto a confirmación."}
      </p>
      <p className="text-sm text-muted-foreground">
        {textoDisponibilidad(ficha.modo_disponibilidad)}. La confirma el hospedaje por WhatsApp.
      </p>

      {chocaCalendario ? (
        <p className="text-sm font-semibold text-destructive">
          Esas fechas ya están ocupadas, elige otras.
        </p>
      ) : null}
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <Button
        className="h-14 w-full text-base font-semibold"
        disabled={ocupado || excede || !cantidadNoches || chocaCalendario}
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
