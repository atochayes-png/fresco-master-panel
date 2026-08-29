import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Car,
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
  crearSolicitudRenta,
  fechasNoDisponiblesVehiculo,
  fichaVehiculo,
  marcarSolicitudRentaEnviada,
  type FichaVehiculo,
} from "@/lib/moverme.publico.functions";
import {
  LUGARES_ENTREGA,
  ctaDisponibilidadRenta,
  diasRenta,
  fechaLargaRenta,
  fechasDelRango,
  horaTexto,
  hoyISO,
  nombreLugarEntrega,
  nombreTarjeta,
  nombreTransmision,
  textoDisponibilidadRenta,
  textoPrecioDia,
  totalRenta,
} from "@/lib/moverme";
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

type BusquedaFicha = {
  inicio: string;
  hora_inicio: string;
  fin: string;
  hora_fin: string;
  pasajeros: number;
  entrega: string;
};

export const Route = createFileRoute("/vehiculo/$id")({
  validateSearch: (s: Record<string, unknown>): BusquedaFicha => ({
    inicio: typeof s["inicio"] === "string" ? s["inicio"] : "",
    hora_inicio: typeof s["hora_inicio"] === "string" ? s["hora_inicio"] : "10:00",
    fin: typeof s["fin"] === "string" ? s["fin"] : "",
    hora_fin: typeof s["hora_fin"] === "string" ? s["hora_fin"] : "10:00",
    pasajeros: Number(s["pasajeros"]) > 0 ? Number(s["pasajeros"]) : 0,
    entrega: typeof s["entrega"] === "string" ? s["entrega"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Auto de renta — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Fotos, pasajeros, transmisión, precio por día, requisitos y solicitud de renta directa por WhatsApp.",
      },
      { property: "og:title", content: "Auto de renta en Yucatán — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Consulta disponibilidad y solicita tu renta directamente con la rentadora.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vehiculo,
});

const BUSQUEDA_VACIA = {
  q: "",
  municipio: "",
  inicio: "",
  hora_inicio: "10:00",
  fin: "",
  hora_fin: "10:00",
  pasajeros: 0,
  entrega: "",
};

function Vehiculo() {
  const { id } = useParams({ from: "/vehiculo/$id" });
  const busqueda = Route.useSearch();
  const [ficha, setFicha] = useState<FichaVehiculo | null | undefined>(undefined);
  const [bloqueadas, setBloqueadas] = useState<string[]>([]);
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void fichaVehiculo({
      data: {
        id,
        inicio: busqueda.inicio || null,
        hora_inicio: busqueda.hora_inicio,
        fin: busqueda.fin || null,
        hora_fin: busqueda.hora_fin,
      },
    }).then((f) => {
      if (vivo) setFicha(f);
    });
    void fechasNoDisponiblesVehiculo({ data: { vehiculo_id: id } }).then((f) => {
      if (vivo) setBloqueadas(f);
    });
    return () => {
      vivo = false;
    };
  }, [id, busqueda.inicio, busqueda.hora_inicio, busqueda.fin, busqueda.hora_fin]);

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
          <h1 className="text-xl font-bold">Este vehículo no está disponible</h1>
          <Button asChild variant="secondary">
            <Link to="/moverme" search={BUSQUEDA_VACIA}>
              Ver otras rentadoras
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
          <Link to="/moverme" search={{ ...BUSQUEDA_VACIA, ...busqueda }}>
            <ArrowLeft className="size-4" /> Renta de autos
          </Link>
        </Button>

        {ficha.medios.length ? (
          <GaleriaMedios
            medios={ficha.medios.map((m) => ({ ...m, destacado: false }))}
            nombre={ficha.nombre}
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-3xl bg-secondary">
            <Car className="size-8 text-muted-foreground" />
          </div>
        )}

        <header className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight">{ficha.nombre}</h1>
          {ficha.modelo_referencia ? (
            <p className="text-sm text-muted-foreground">{ficha.modelo_referencia}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {ficha.negocio} · {ficha.municipio}
          </p>
          <p className="text-lg font-bold text-primary">
            {textoPrecioDia(ficha.precio, ficha.precio_tipo)}
          </p>
          <p className="text-xs text-muted-foreground">
            {textoDisponibilidadRenta(ficha.modo_disponibilidad)}
          </p>
        </header>

        {ficha.descripcion ? <p className="text-sm">{ficha.descripcion}</p> : null}

        <section className="grid grid-cols-2 gap-2">
          <Dato
            icono={<Users className="size-4" />}
            titulo="Pasajeros"
            valor={`${ficha.pasajeros}`}
          />
          <Dato
            icono={<Car className="size-4" />}
            titulo="Transmisión"
            valor={nombreTransmision(ficha.transmision)}
          />
          <Dato
            icono={<Briefcase className="size-4" />}
            titulo="Equipaje"
            valor={ficha.equipaje ?? "Por confirmar"}
          />
          <Dato
            icono={<Car className="size-4" />}
            titulo="Aire acondicionado"
            valor={ficha.aire_acondicionado ? "Sí" : "No"}
          />
        </section>

        <section className="space-y-1 rounded-2xl bg-secondary p-4 text-sm">
          <h2 className="text-base font-bold">Requisitos para rentar</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {ficha.edad_minima ? <li>Edad mínima: {ficha.edad_minima} años</li> : null}
            {ficha.licencia ? <li>Licencia de conducir vigente</li> : null}
            {ficha.identificacion ? <li>Identificación oficial</li> : null}
            {ficha.requiere_deposito ? <li>Depósito en garantía</li> : null}
            {ficha.tarjeta !== "no" ? <li>{nombreTarjeta(ficha.tarjeta)}</li> : null}
          </ul>
          {ficha.requisitos_notas ? (
            <p className="text-muted-foreground">{ficha.requisitos_notas}</p>
          ) : null}
          <p className="text-muted-foreground">
            Tomar el Fresco no confirma rentas, no cobra ni valida documentos. Todo lo confirma la
            rentadora.
          </p>
        </section>

        {ficha.entrega_opciones.length ? (
          <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-base font-bold">Entrega y devolución</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {ficha.entrega_opciones.map((e) => (
                <li key={e} className="rounded-full bg-secondary px-3 py-1">
                  {nombreLugarEntrega(e)}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              {ficha.entrega_costo_tipo === "fijo" && ficha.entrega_costo != null
                ? `Costo de entrega: ${pesos(ficha.entrega_costo)}`
                : ficha.entrega_costo_tipo === "consultar"
                  ? "Costo de entrega a consultar"
                  : "Entrega sin costo"}
            </p>
            {ficha.notas ? <p className="text-sm text-muted-foreground">{ficha.notas}</p> : null}
          </section>
        ) : null}

        {bloqueadas.length ? (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Fechas ya ocupadas</h2>
            <ul className="flex flex-wrap gap-2">
              {bloqueadas.slice(0, 20).map((f) => (
                <li key={f} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {fechaLargaRenta(f)}
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
              <MessageCircle className="size-4" /> Escribir a la rentadora
            </a>
          </Button>
        ) : null}

        {ficha.activo ? (
          <Button
            className="h-14 w-full text-base font-semibold"
            onClick={() => setSolicitando(true)}
          >
            {ctaDisponibilidadRenta(ficha.modo_disponibilidad)}
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

type Resultado = Awaited<ReturnType<typeof crearSolicitudRenta>>;

function Solicitud({
  ficha,
  bloqueadas,
  inicial,
  cerrar,
}: {
  ficha: FichaVehiculo;
  bloqueadas: string[];
  inicial: BusquedaFicha;
  cerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [inicio, setInicio] = useState(inicial.inicio);
  const [horaInicio, setHoraInicio] = useState(inicial.hora_inicio);
  const [fin, setFin] = useState(inicial.fin);
  const [horaFin, setHoraFin] = useState(inicial.hora_fin);
  const [pasajeros, setPasajeros] = useState(
    inicial.pasajeros ? Math.min(inicial.pasajeros, ficha.pasajeros) : 0,
  );
  const [entrega, setEntrega] = useState(
    inicial.entrega || ficha.entrega_opciones[0] || "sucursal",
  );
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    setNombre(nombreGuardado());
    setTelefono(telefonoGuardado() ?? "");
  }, []);

  const dias = diasRenta(inicio, horaInicio, fin, horaFin);
  const total = totalRenta(ficha.precio, ficha.precio_tipo, dias);
  const excede = pasajeros > ficha.pasajeros;
  const chocaCalendario =
    ficha.modo_disponibilidad === "con_calendario" &&
    dias != null &&
    fechasDelRango(inicio, fin).some((f) => bloqueadas.includes(f));

  async function enviar() {
    setError(null);
    setOcupado(true);
    try {
      const r = await crearSolicitudRenta({
        data: {
          vehiculo_id: ficha.id,
          inicio,
          hora_inicio: horaInicio,
          fin,
          hora_fin: horaFin,
          pasajeros: pasajeros || null,
          lugar_entrega: entrega,
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
      "SOLICITUD DE RENTA DE AUTO — TOMAR EL FRESCO EN YUCATÁN",
      `Folio: #${resultado.folio}`,
      "",
      `Vehículo: ${resultado.vehiculo}${
        resultado.modelo_referencia ? ` (${resultado.modelo_referencia})` : ""
      }`,
      `Cliente: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Entrega: ${fechaLargaRenta(inicio)} ${horaTexto(horaInicio)}`,
      `Devolución: ${fechaLargaRenta(fin)} ${horaTexto(horaFin)}`,
      `Días: ${resultado.dias}`,
      `Lugar de entrega: ${nombreLugarEntrega(resultado.lugar_entrega)}`,
      resultado.pasajeros ? `Pasajeros: ${resultado.pasajeros}` : null,
      resultado.total_estimado != null
        ? `Total estimado: ${pesos(resultado.total_estimado)}`
        : "Precio sujeto a confirmación.",
      "",
      resultado.modo_disponibilidad === "con_calendario"
        ? "Estas fechas aparecen libres en el calendario, pero la disponibilidad final la confirma la rentadora."
        : "La disponibilidad está por confirmar directamente con la rentadora.",
      resultado.requiere_deposito ? "Esta rentadora indica que solicita depósito en garantía." : null,
      "Esta solicitud fue generada desde Tomar el Fresco en Yucatán.",
      "Por favor confirma directamente con el cliente disponibilidad, requisitos y condiciones.",
    ].filter(Boolean);

    void marcarSolicitudRentaEnviada({ data: { id: resultado.id } });
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
          <li>{resultado.vehiculo}</li>
          <li>{resultado.negocio}</li>
          <li>Cliente: {nombre}</li>
          <li>
            {fechaLargaRenta(inicio)} {horaTexto(horaInicio)} → {fechaLargaRenta(fin)}{" "}
            {horaTexto(horaFin)} · {resultado.dias} {resultado.dias === 1 ? "día" : "días"}
          </li>
          <li>Entrega: {nombreLugarEntrega(resultado.lugar_entrega)}</li>
          <li className="font-bold">
            {resultado.total_estimado != null
              ? `Total estimado: ${pesos(resultado.total_estimado)}`
              : "Precio sujeto a confirmación."}
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Esta solicitud está pendiente de confirmación de la rentadora. Tomar el Fresco no confirma
          ni cobra.
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
          ? "Solicitar renta"
          : "Consultar disponibilidad"}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="f1">Entrega</Label>
          <Input
            id="f1"
            type="date"
            min={hoyISO()}
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="h1">Hora</Label>
          <Input
            id="h1"
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f2">Devolución</Label>
          <Input
            id="f2"
            type="date"
            min={inicio || hoyISO()}
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="h2">Hora</Label>
          <Input
            id="h2"
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="h-13 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lugar">Lugar de entrega</Label>
        <select
          id="lugar"
          value={entrega}
          onChange={(e) => setEntrega(e.target.value)}
          className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
        >
          {(ficha.entrega_opciones.length
            ? LUGARES_ENTREGA.filter((l) => ficha.entrega_opciones.includes(l.clave))
            : LUGARES_ENTREGA
          ).map((l) => (
            <option key={l.clave} value={l.clave}>
              {l.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pax2">Pasajeros (opcional)</Label>
        <Input
          id="pax2"
          inputMode="numeric"
          value={pasajeros ? String(pasajeros) : ""}
          onChange={(e) => setPasajeros(Number(e.target.value.replace(/\D/g, "")) || 0)}
          placeholder={`Hasta ${ficha.pasajeros}`}
          className="h-13 text-base"
        />
        {excede ? (
          <p className="text-sm font-semibold text-destructive">
            Este vehículo es para máximo {ficha.pasajeros} pasajeros.
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
        {dias ? `${dias} ${dias === 1 ? "día" : "días"}` : "Elige tus fechas y horas"}
        {total != null ? ` · Total estimado: ${pesos(total)}` : " · Precio sujeto a confirmación."}
      </p>
      <p className="text-sm text-muted-foreground">
        {textoDisponibilidadRenta(ficha.modo_disponibilidad)}. La confirma la rentadora por WhatsApp.
      </p>

      {chocaCalendario ? (
        <p className="text-sm font-semibold text-destructive">
          Esas fechas ya están ocupadas, elige otras.
        </p>
      ) : null}
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <Button
        className="h-14 w-full text-base font-semibold"
        disabled={ocupado || excede || !dias || chocaCalendario}
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
