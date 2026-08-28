import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Loader2, MapPin, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  borrarFoto,
  guardarDatosNegocio,
  guardarHorarios,
  guardarPerfil,
  miNegocio,
  publicarNegocio,
  registrarFoto,
} from "@/lib/dueno.functions";
import { buscarLugares, direccionDePunto, type Lugar } from "@/lib/mapas.functions";
import { MapaPunto } from "@/components/mapa-punto";
import { DIAS, comprimirImagen, etiquetaHora, subirArchivo, urlFirmada } from "@/lib/dueno";
import { validarCelular } from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/mi-negocio/completar")({
  validateSearch: (search: Record<string, unknown>) => ({
    paso: Math.min(5, Math.max(1, Number(search["paso"] ?? 1) || 1)),
  }),
  head: () => ({
    meta: [
      { title: "Completar mi negocio — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Completa la información de tu negocio en cuatro pasos sencillos.",
      },
    ],
  }),
  component: Completar,
});

type Datos = NonNullable<Awaited<ReturnType<typeof miNegocio>>>;

function Completar() {
  const { paso } = Route.useSearch();
  const navigate = useNavigate();
  const cargar = useServerFn(miNegocio);
  const { data, isLoading } = useQuery({ queryKey: ["mi-negocio"], queryFn: () => cargar() });

  function ir(n: number) {
    void navigate({ to: "/mi-negocio/completar", search: { paso: n } });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return <p className="py-10 text-center">No encontramos tu negocio.</p>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => (paso === 1 ? navigate({ to: "/mi-negocio" }) : ir(paso - 1))}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Regresar
      </button>

      {paso <= 4 ? (
        <div>
          <p className="text-sm font-semibold text-primary">Paso {paso} de 4</p>
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`h-2 flex-1 rounded-full ${n <= paso ? "bg-primary" : "bg-secondary"}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {paso === 1 ? <Paso1 datos={data} alContinuar={() => ir(2)} /> : null}
      {paso === 2 ? <Paso2 datos={data} alContinuar={() => ir(3)} /> : null}
      {paso === 3 ? <Paso3 datos={data} alContinuar={() => ir(4)} /> : null}
      {paso === 4 ? <Paso4 datos={data} alContinuar={() => ir(5)} /> : null}
      {paso === 5 ? <Resumen datos={data} /> : null}
    </div>
  );
}

function Titulo({ texto, ayuda }: { texto: string; ayuda?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{texto}</h1>
      {ayuda ? <p className="mt-1 text-sm text-muted-foreground">{ayuda}</p> : null}
    </div>
  );
}

function OpcionGrande({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-2xl border-2 px-4 py-5 text-base font-semibold transition ${
        activa
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      {children}
    </div>
  );
}

function useGuardar() {
  const queryClient = useQueryClient();
  const [guardando, setGuardando] = useState(false);
  async function correr(fn: () => Promise<unknown>, despues?: () => void) {
    setGuardando(true);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["mi-negocio"] });
      despues?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }
  return { guardando, correr };
}

/* ---------------- Paso 1 ---------------- */
function Paso1({ datos, alContinuar }: { datos: Datos; alContinuar: () => void }) {
  const guardar = useServerFn(guardarDatosNegocio);
  const { guardando, correr } = useGuardar();
  const [nombreNegocio, setNombreNegocio] = useState(datos.negocio.nombre_negocio);
  const [nombreDueno, setNombreDueno] = useState(datos.negocio.nombre_dueno);
  const [celular, setCelular] = useState(datos.negocio.celular);
  const [descripcion, setDescripcion] = useState(datos.perfil.descripcion ?? "");

  function enviar() {
    const err = validarCelular(celular);
    if (!nombreNegocio.trim()) {
      toast.error("Escribe el nombre de tu negocio");
      return;
    }
    if (err) {
      toast.error(err);
      return;
    }
    if (!descripcion.trim()) {
      toast.error("Cuéntanos qué ofreces");
      return;
    }
    void correr(
      () =>
        guardar({
          data: { nombre_negocio: nombreNegocio, nombre_dueno: nombreDueno, celular, descripcion },
        }),
      alContinuar,
    );
  }

  return (
    <div className="space-y-5">
      <Titulo texto="Tu negocio" ayuda="Revisa que todo esté correcto." />
      <Tarjeta>
        <Campo etiqueta="Nombre del negocio">
          <Input
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            className="h-13 text-base"
          />
        </Campo>
        <Campo etiqueta="Tipo de negocio">
          <div className="rounded-xl bg-secondary px-4 py-3 text-base">{datos.negocio.tipo}</div>
        </Campo>
        <Campo etiqueta="Municipio">
          <div className="rounded-xl bg-secondary px-4 py-3 text-base">
            {datos.negocio.municipio}
          </div>
        </Campo>
        <Campo etiqueta="Tu nombre">
          <Input
            value={nombreDueno}
            onChange={(e) => setNombreDueno(e.target.value)}
            className="h-13 text-base"
          />
        </Campo>
        <Campo etiqueta="Celular / WhatsApp">
          <Input
            value={celular}
            inputMode="numeric"
            onChange={(e) => setCelular(e.target.value)}
            className="h-13 text-base"
          />
        </Campo>
        <Campo etiqueta="Descripción breve">
          <Textarea
            value={descripcion}
            maxLength={300}
            rows={4}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Cuéntale a las personas qué ofreces."
            className="text-base"
          />
          <p className="text-right text-xs text-muted-foreground">{descripcion.length}/300</p>
        </Campo>
      </Tarjeta>
      <BotonPrincipal cargando={guardando} onClick={enviar}>
        GUARDAR Y CONTINUAR
      </BotonPrincipal>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-base">{etiqueta}</Label>
      {children}
    </div>
  );
}

function BotonPrincipal({
  cargando,
  onClick,
  children,
}: {
  cargando?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button onClick={onClick} disabled={cargando} className="h-14 w-full text-base font-semibold">
      {cargando ? <Loader2 className="size-5 animate-spin" /> : children}
    </Button>
  );
}

/* ---------------- Paso 2 ---------------- */
function Paso2({ datos, alContinuar }: { datos: Datos; alContinuar: () => void }) {
  const guardar = useServerFn(guardarPerfil);
  const { guardando, correr } = useGuardar();
  const p = datos.perfil;
  const [recibe, setRecibe] = useState<boolean | null>(p.recibe_clientes);
  const [direccion, setDireccion] = useState(p.direccion ?? "");
  const [colonia, setColonia] = useState(p.colonia ?? "");
  const [cp, setCp] = useState(p.codigo_postal ?? "");
  const [lat, setLat] = useState<number | null>(p.latitud);
  const [lng, setLng] = useState<number | null>(p.longitud);
  const [domicilio, setDomicilio] = useState<boolean | null>(p.domicilio);
  const [tipoCosto, setTipoCosto] = useState(p.costo_entrega_tipo ?? "");
  const [costo, setCosto] = useState(p.costo_entrega ? String(p.costo_entrega) : "");
  const [km, setKm] = useState(p.distancia_km ? String(p.distancia_km) : "");
  const [notas, setNotas] = useState(p.notas_entrega ?? "");

  async function completarDesdeMapa(nlat: number, nlng: number) {
    setLat(nlat);
    setLng(nlng);
    try {
      const d = await direccionDePunto({ data: { lat: nlat, lng: nlng } });
      if (!d) return;
      if (!direccion.trim()) setDireccion(d.direccion);
      if (!colonia.trim() && d.colonia) setColonia(d.colonia);
      if (!cp.trim() && d.codigo_postal) setCp(d.codigo_postal);
    } catch {
      /* La dirección se puede escribir a mano. */
    }
  }

  function ubicar() {
    if (!navigator.geolocation) {
      toast.error("Tu teléfono no comparte la ubicación");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void completarDesdeMapa(pos.coords.latitude, pos.coords.longitude);
        toast.success("Ubicación guardada");
      },
      () => toast.error("No pudimos obtener tu ubicación"),
    );
  }

  function enviar() {
    if (recibe === null) {
      toast.error("Dinos si tus clientes pueden visitarte");
      return;
    }
    if (recibe && !direccion.trim()) {
      toast.error("Escribe tu dirección");
      return;
    }
    void correr(
      () =>
        guardar({
          data: {
            campos: {
              recibe_clientes: recibe,
              direccion: recibe ? direccion.trim() : null,
              colonia: recibe ? colonia.trim() : null,
              codigo_postal: recibe ? cp.trim() : null,
              latitud: recibe ? lat : null,
              longitud: recibe ? lng : null,
              domicilio,
              costo_entrega_tipo: domicilio ? tipoCosto : null,
              costo_entrega: domicilio && tipoCosto === "fijo" ? Number(costo) || 0 : null,
              distancia_km: domicilio && tipoCosto === "distancia" ? Number(km) || null : null,
              notas_entrega: domicilio ? notas.trim() : null,
              paso_actual: Math.max(p.paso_actual, 3),
            },
          },
        }),
      alContinuar,
    );
  }

  return (
    <div className="space-y-5">
      <Titulo texto="Ubicación" />
      <Tarjeta>
        <p className="text-base font-semibold">¿Tus clientes pueden visitarte?</p>
        <div className="flex gap-3">
          <OpcionGrande activa={recibe === true} onClick={() => setRecibe(true)}>
            SÍ
          </OpcionGrande>
          <OpcionGrande activa={recibe === false} onClick={() => setRecibe(false)}>
            NO
          </OpcionGrande>
        </div>

        {recibe ? (
          <div className="space-y-4 pt-2">
            <BuscadorDireccion
              etiqueta="Busca tu negocio, calle o localidad"
              onElegir={(l) => {
                setDireccion(l.direccion || l.nombre);
                setLat(l.latitud);
                setLng(l.longitud);
                toast.success("Ubicación encontrada");
              }}
            />
            <Campo etiqueta="Dirección">
              <Input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="h-13 text-base"
              />
            </Campo>
            <Campo etiqueta="Colonia o localidad">
              <Input
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
                className="h-13 text-base"
              />
            </Campo>
            <Campo etiqueta="Código postal">
              <Input
                value={cp}
                inputMode="numeric"
                onChange={(e) => setCp(e.target.value)}
                className="h-13 text-base"
              />
            </Campo>
            <Button
              type="button"
              variant="secondary"
              onClick={ubicar}
              className="h-13 w-full text-base"
            >
              <MapPin className="mr-2 size-5" /> Usar mi ubicación actual
            </Button>
            {lat && lng ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Confirma el punto. Puedes arrastrar el marcador rosa o tocar el mapa.
                </p>
                <MapaPunto
                  lat={lat}
                  lng={lng}
                  onMover={(a, b) => {
                    setLat(a);
                    setLng(b);
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Tarjeta>

      <Tarjeta>
        <p className="text-base font-semibold">¿Ofreces servicio a domicilio?</p>
        <div className="flex gap-3">
          <OpcionGrande activa={domicilio === true} onClick={() => setDomicilio(true)}>
            SÍ
          </OpcionGrande>
          <OpcionGrande activa={domicilio === false} onClick={() => setDomicilio(false)}>
            NO
          </OpcionGrande>
        </div>
        {domicilio ? (
          <div className="space-y-4 pt-2">
            <p className="text-base font-semibold">Costo de entrega</p>
            <div className="grid gap-3">
              {[
                { v: "gratis", t: "Gratis" },
                { v: "fijo", t: "Costo fijo" },
                { v: "distancia", t: "Depende de la distancia" },
              ].map((o) => (
                <OpcionGrande
                  key={o.v}
                  activa={tipoCosto === o.v}
                  onClick={() => setTipoCosto(o.v)}
                >
                  {o.t}
                </OpcionGrande>
              ))}
            </div>
            {tipoCosto === "fijo" ? (
              <Campo etiqueta="Costo de entrega $">
                <Input
                  value={costo}
                  inputMode="decimal"
                  onChange={(e) => setCosto(e.target.value)}
                  className="h-13 text-base"
                />
              </Campo>
            ) : null}
            {tipoCosto === "distancia" ? (
              <Campo etiqueta="¿Hasta qué distancia entregas? (kilómetros)">
                <Input
                  value={km}
                  inputMode="decimal"
                  onChange={(e) => setKm(e.target.value)}
                  className="h-13 text-base"
                />
              </Campo>
            ) : null}
            <Campo etiqueta="Información sobre tus entregas (opcional)">
              <Textarea
                value={notas}
                rows={3}
                placeholder="El costo depende de la colonia."
                onChange={(e) => setNotas(e.target.value)}
                className="text-base"
              />
            </Campo>
          </div>
        ) : null}
      </Tarjeta>

      <BotonPrincipal cargando={guardando} onClick={enviar}>
        GUARDAR Y CONTINUAR
      </BotonPrincipal>
    </div>
  );
}

/* Buscador de direcciones de Google. Sólo consulta al tocar BUSCAR,
   para no gastar llamadas de más. */
function BuscadorDireccion({
  etiqueta,
  onElegir,
}: {
  etiqueta: string;
  onElegir: (lugar: Lugar) => void;
}) {
  const [texto, setTexto] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [lugares, setLugares] = useState<Lugar[]>([]);

  async function buscar() {
    if (texto.trim().length < 3) {
      toast.error("Escribe al menos 3 letras");
      return;
    }
    setBuscando(true);
    try {
      const r = await buscarLugares({ data: { texto } });
      setLugares(r);
      if (!r.length) toast.error("No encontramos ese lugar");
    } catch {
      toast.error("El buscador de direcciones no está disponible");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-2">
      <Campo etiqueta={etiqueta}>
        <div className="flex gap-2">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Calle, colonia o nombre del lugar"
            className="h-13 text-base"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void buscar()}
            className="h-13 px-4"
          >
            {buscando ? <Loader2 className="size-5 animate-spin" /> : "BUSCAR"}
          </Button>
        </div>
      </Campo>
      {lugares.length ? (
        <ul className="space-y-2">
          {lugares.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  onElegir(l);
                  setLugares([]);
                }}
                className="w-full rounded-2xl border border-border bg-background p-3 text-left"
              >
                <p className="text-base font-semibold">{l.nombre}</p>
                <p className="text-sm text-muted-foreground">{l.direccion}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------------- Paso 3 ---------------- */
function Paso3({ datos, alContinuar }: { datos: Datos; alContinuar: () => void }) {
  const guardar = useServerFn(guardarHorarios);
  const { guardando, correr } = useGuardar();
  const inicial = useMemo(
    () =>
      DIAS.map((d) => {
        const fila = datos.horarios.find((h) => h.dia === d.dia);
        return {
          dia: d.dia as number,
          nombre: d.nombre,
          abierto: fila?.abierto ?? false,
          apertura: fila?.apertura?.slice(0, 5) ?? "09:00",
          cierre: fila?.cierre?.slice(0, 5) ?? "18:00",
        };
      }),
    [datos.horarios],
  );
  const [dias, setDias] = useState(inicial);
  const [soloReservacion, setSoloReservacion] = useState(datos.perfil.solo_reservacion);

  function cambiar(dia: number, campos: Partial<(typeof dias)[number]>) {
    setDias((prev) => prev.map((d) => (d.dia === dia ? { ...d, ...campos } : d)));
  }

  function copiarATodos() {
    const base = dias.find((d) => d.abierto) ?? dias[0];
    if (!base) return;
    setDias((prev) =>
      prev.map((d) => ({ ...d, abierto: true, apertura: base.apertura, cierre: base.cierre })),
    );
    toast.success("Aplicamos el mismo horario a todos los días");
  }

  function enviar() {
    void correr(
      () =>
        guardar({
          data: {
            dias: dias.map((d) => ({
              dia: d.dia,
              abierto: d.abierto,
              apertura: d.apertura,
              cierre: d.cierre,
            })),
            solo_reservacion: soloReservacion,
          },
        }),
      alContinuar,
    );
  }

  return (
    <div className="space-y-5">
      <Titulo texto="¿Cuándo estás disponible?" />

      <Tarjeta>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold">Solo con reservación</p>
            <p className="text-sm text-muted-foreground">Atiendes con cita previa.</p>
          </div>
          <Switch checked={soloReservacion} onCheckedChange={setSoloReservacion} />
        </div>
      </Tarjeta>

      <Button
        type="button"
        variant="secondary"
        onClick={copiarATodos}
        className="h-13 w-full text-sm font-semibold"
      >
        USAR ESTE HORARIO TODOS LOS DÍAS
      </Button>

      <div className="space-y-3">
        {dias.map((d) => (
          <div key={d.dia} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-base font-semibold">{d.nombre}</p>
              <button
                type="button"
                onClick={() => cambiar(d.dia, { abierto: !d.abierto })}
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  d.abierto
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {d.abierto ? "ABIERTO" : "CERRADO"}
              </button>
            </div>
            {d.abierto ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Abre</Label>
                  <Input
                    type="time"
                    value={d.apertura}
                    onChange={(e) => cambiar(d.dia, { apertura: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cierra</Label>
                  <Input
                    type="time"
                    value={d.cierre}
                    onChange={(e) => cambiar(d.dia, { cierre: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <BotonPrincipal cargando={guardando} onClick={enviar}>
        GUARDAR Y CONTINUAR
      </BotonPrincipal>
    </div>
  );
}

/* ---------------- Paso 4 ---------------- */
function Paso4({ datos, alContinuar }: { datos: Datos; alContinuar: () => void }) {
  const guardar = useServerFn(guardarPerfil);
  const registrar = useServerFn(registrarFoto);
  const borrar = useServerFn(borrarFoto);
  const { guardando, correr } = useGuardar();
  const queryClient = useQueryClient();
  const p = datos.perfil;
  const [subiendo, setSubiendo] = useState(false);
  const refPrincipal = useRef<HTMLInputElement>(null);
  const refMas = useRef<HTMLInputElement>(null);
  const refMenu = useRef<HTMLInputElement>(null);

  const [quiereMenu, setQuiereMenu] = useState<boolean | null>(p.menu_url ? true : null);
  const [waActivo, setWaActivo] = useState(p.whatsapp_activo);
  const [waNumero, setWaNumero] = useState(p.whatsapp_numero ?? datos.negocio.celular);
  const [facebook, setFacebook] = useState(p.facebook ?? "");
  const [instagram, setInstagram] = useState(p.instagram ?? "");
  const [sitio, setSitio] = useState(p.sitio_web ?? "");
  const [precioPromedio, setPrecioPromedio] = useState(
    p.precio_promedio ? String(p.precio_promedio) : "",
  );
  const [precioDesde, setPrecioDesde] = useState(p.precio_desde ? String(p.precio_desde) : "");
  const [duracion, setDuracion] = useState(p.duracion ?? "");
  const [puntoSalida, setPuntoSalida] = useState(p.punto_salida ?? "");
  const [salidaLat, setSalidaLat] = useState<number | null>(p.salida_latitud);
  const [salidaLng, setSalidaLng] = useState<number | null>(p.salida_longitud);
  const [precioNoche, setPrecioNoche] = useState(p.precio_noche ? String(p.precio_noche) : "");
  const [capacidad, setCapacidad] = useState(p.capacidad ? String(p.capacidad) : "");
  const [tipoServicio, setTipoServicio] = useState(p.tipo_servicio ?? "");

  async function subirFoto(archivo: File, principal: boolean) {
    setSubiendo(true);
    try {
      const comprimida = await comprimirImagen(archivo);
      const ruta = await subirArchivo(datos.negocio.id, "fotos", comprimida);
      const url = await urlFirmada(ruta);
      await registrar({ data: { ruta, url, principal } });
      await queryClient.invalidateQueries({ queryKey: ["mi-negocio"] });
      toast.success("Foto guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }

  async function subirMenu(archivo: File) {
    setSubiendo(true);
    try {
      const esImagen = archivo.type.startsWith("image/");
      const listo = esImagen ? await comprimirImagen(archivo) : archivo;
      const ruta = await subirArchivo(datos.negocio.id, "menu", listo);
      const url = await urlFirmada(ruta);
      await guardar({
        data: { campos: { menu_url: url, menu_tipo: esImagen ? "imagen" : "pdf" } },
      });
      await queryClient.invalidateQueries({ queryKey: ["mi-negocio"] });
      toast.success("Archivo guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  function camposGiro(): Record<string, unknown> {
    const t = datos.negocio.tipo;
    if (t === "Comida y bebida") return { precio_promedio: Number(precioPromedio) || null };
    if (t === "Turismo y experiencias")
      return {
        precio_desde: Number(precioDesde) || null,
        duracion: duracion.trim() || null,
        punto_salida: puntoSalida.trim() || null,
        salida_latitud: puntoSalida.trim() ? salidaLat : null,
        salida_longitud: puntoSalida.trim() ? salidaLng : null,
      };
    if (t === "Hospedaje y rentas")
      return { precio_noche: Number(precioNoche) || null, capacidad: Number(capacidad) || null };
    if (t === "Movilidad y transporte")
      return {
        precio_desde: Number(precioDesde) || null,
        tipo_servicio: tipoServicio.trim() || null,
      };
    if (t === "Diversión y entretenimiento") return { precio_desde: Number(precioDesde) || null };
    return {};
  }

  function enviar() {
    if (!p.foto_principal) {
      toast.error("Sube el logotipo de tu negocio");
      return;
    }
    void correr(
      () =>
        guardar({
          data: {
            campos: {
              ...camposGiro(),
              whatsapp_activo: waActivo,
              whatsapp_numero: waActivo ? waNumero.replace(/\D/g, "") : null,
              facebook: facebook.trim() || null,
              instagram: instagram.trim() || null,
              sitio_web: sitio.trim() || null,
              paso_actual: 4,
            },
          },
        }),
      alContinuar,
    );
  }

  const principal = datos.fotos.find((f) => f.ruta === p.foto_principal) ?? datos.fotos[0];

  return (
    <div className="space-y-5">
      <Titulo texto="Fotos e información" />

      <Tarjeta>
        <p className="text-base font-semibold">Logotipo de tu negocio</p>
        <p className="text-sm text-muted-foreground">
          Este logotipo identificará tu negocio dentro de Tomar el Fresco.
        </p>
        {principal ? (
          <img
            src={principal.url}
            alt="Logotipo de tu negocio"
            className="h-52 w-full rounded-2xl object-contain"
          />
        ) : null}
        <input
          ref={refPrincipal}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void subirFoto(f, true);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={subiendo}
          onClick={() => refPrincipal.current?.click()}
          className="h-13 w-full text-base"
        >
          <Camera className="mr-2 size-5" />
          {principal ? "Cambiar logotipo" : "Subir logotipo"}
        </Button>
      </Tarjeta>

      <Tarjeta>
        <p className="text-base font-semibold">Agrega más fotos</p>
        <p className="text-sm text-muted-foreground">{datos.fotos.length} de 10</p>
        <div className="grid grid-cols-3 gap-2">
          {datos.fotos.map((f) => (
            <div key={f.id} className="relative">
              <img
                src={f.url}
                alt="Foto de tu negocio"
                className="h-24 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={() =>
                  void correr(async () => {
                    await borrar({ data: { id: f.id } });
                  })
                }
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1.5"
              >
                <Trash2 className="size-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
        <input
          ref={refMas}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void subirFoto(f, false);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={subiendo || datos.fotos.length >= 10}
          onClick={() => refMas.current?.click()}
          className="h-13 w-full text-base"
        >
          <Upload className="mr-2 size-5" /> Agregar foto
        </Button>
      </Tarjeta>

      <Tarjeta>
        <p className="text-base font-semibold">
          ¿Quieres agregar un menú, catálogo o lista de servicios?
        </p>
        <div className="flex gap-3">
          <OpcionGrande activa={quiereMenu === true} onClick={() => setQuiereMenu(true)}>
            SÍ
          </OpcionGrande>
          <OpcionGrande activa={quiereMenu === false} onClick={() => setQuiereMenu(false)}>
            AHORA NO
          </OpcionGrande>
        </div>
        {quiereMenu ? (
          <>
            {p.menu_url ? (
              <a
                href={p.menu_url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-medium text-primary underline"
              >
                Ver el archivo que subiste
              </a>
            ) : null}
            <input
              ref={refMenu}
              type="file"
              accept="application/pdf,image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void subirMenu(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={subiendo}
              onClick={() => refMenu.current?.click()}
              className="h-13 w-full text-base"
            >
              <Upload className="mr-2 size-5" /> Subir PDF o imagen
            </Button>
          </>
        ) : null}
      </Tarjeta>

      <CamposGiro
        tipo={datos.negocio.tipo}
        valores={{
          precioPromedio,
          precioDesde,
          duracion,
          puntoSalida,
          precioNoche,
          capacidad,
          tipoServicio,
        }}
        set={{
          setPrecioPromedio,
          setPrecioDesde,
          setDuracion,
          setPuntoSalida,
          setPrecioNoche,
          setCapacidad,
          setTipoServicio,
        }}
      />

      {datos.negocio.tipo === "Turismo y experiencias" && puntoSalida.trim() ? (
        <Tarjeta>
          <p className="text-base font-semibold">Ubicación del punto de salida (opcional)</p>
          <p className="text-sm text-muted-foreground">
            Así las personas pueden llegar sin perderse.
          </p>
          <BuscadorDireccion
            etiqueta="Busca el punto de salida"
            onElegir={(l) => {
              setSalidaLat(l.latitud);
              setSalidaLng(l.longitud);
              toast.success("Punto de salida guardado");
            }}
          />
          {salidaLat && salidaLng ? (
            <MapaPunto
              lat={salidaLat}
              lng={salidaLng}
              altura="h-48"
              onMover={(a, b) => {
                setSalidaLat(a);
                setSalidaLng(b);
              }}
            />
          ) : null}
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <p className="text-base font-semibold">
          ¿Quieres que las personas puedan contactarte por WhatsApp?
        </p>
        <div className="flex gap-3">
          <OpcionGrande activa={waActivo} onClick={() => setWaActivo(true)}>
            SÍ
          </OpcionGrande>
          <OpcionGrande activa={!waActivo} onClick={() => setWaActivo(false)}>
            NO
          </OpcionGrande>
        </div>
        {waActivo ? (
          <Campo etiqueta="Número de WhatsApp">
            <Input
              value={waNumero}
              inputMode="numeric"
              onChange={(e) => setWaNumero(e.target.value)}
              className="h-13 text-base"
            />
          </Campo>
        ) : null}
        <Campo etiqueta="Facebook (opcional)">
          <Input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            className="h-13 text-base"
          />
        </Campo>
        <Campo etiqueta="Instagram (opcional)">
          <Input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="h-13 text-base"
          />
        </Campo>
        <Campo etiqueta="Sitio web (opcional)">
          <Input
            value={sitio}
            onChange={(e) => setSitio(e.target.value)}
            className="h-13 text-base"
          />
        </Campo>
      </Tarjeta>

      <BotonPrincipal cargando={guardando || subiendo} onClick={enviar}>
        GUARDAR Y CONTINUAR
      </BotonPrincipal>
    </div>
  );
}

function CamposGiro({
  tipo,
  valores,
  set,
}: {
  tipo: string;
  valores: Record<string, string>;
  set: Record<string, (v: string) => void>;
}) {
  const filas: { clave: string; setter: string; etiqueta: string; numerico?: boolean }[] = [];
  if (tipo === "Comida y bebida")
    filas.push({
      clave: "precioPromedio",
      setter: "setPrecioPromedio",
      etiqueta: "Precio promedio por persona (opcional)",
      numerico: true,
    });
  if (tipo === "Turismo y experiencias")
    filas.push(
      {
        clave: "precioDesde",
        setter: "setPrecioDesde",
        etiqueta: "Precio desde (opcional)",
        numerico: true,
      },
      { clave: "duracion", setter: "setDuracion", etiqueta: "Duración aproximada (opcional)" },
      { clave: "puntoSalida", setter: "setPuntoSalida", etiqueta: "Punto de salida (opcional)" },
    );
  if (tipo === "Hospedaje y rentas")
    filas.push(
      {
        clave: "precioNoche",
        setter: "setPrecioNoche",
        etiqueta: "Precio desde por noche (opcional)",
        numerico: true,
      },
      {
        clave: "capacidad",
        setter: "setCapacidad",
        etiqueta: "Capacidad máxima de personas (opcional)",
        numerico: true,
      },
    );
  if (tipo === "Movilidad y transporte")
    filas.push(
      {
        clave: "precioDesde",
        setter: "setPrecioDesde",
        etiqueta: "Precio desde (opcional)",
        numerico: true,
      },
      { clave: "tipoServicio", setter: "setTipoServicio", etiqueta: "Tipo de servicio (opcional)" },
    );
  if (tipo === "Diversión y entretenimiento")
    filas.push({
      clave: "precioDesde",
      setter: "setPrecioDesde",
      etiqueta: "Precio desde (opcional)",
      numerico: true,
    });

  if (!filas.length) return null;

  return (
    <Tarjeta>
      <p className="text-base font-semibold">Información de tu giro</p>
      {filas.map((f) => (
        <Campo key={f.clave} etiqueta={f.etiqueta}>
          <Input
            value={valores[f.clave] ?? ""}
            inputMode={f.numerico ? "decimal" : "text"}
            onChange={(e) => set[f.setter]?.(e.target.value)}
            className="h-13 text-base"
          />
        </Campo>
      ))}
    </Tarjeta>
  );
}

/* ---------------- Resumen y publicación ---------------- */
function Resumen({ datos }: { datos: Datos }) {
  const publicar = useServerFn(publicarNegocio);
  const { guardando, correr } = useGuardar();
  const navigate = useNavigate();
  const [listo, setListo] = useState(false);
  const p = datos.perfil;
  const principal = datos.fotos.find((f) => f.ruta === p.foto_principal) ?? datos.fotos[0];

  useEffect(() => {
    if (listo) {
      const t = setTimeout(() => void navigate({ to: "/mi-negocio" }), 2500);
      return () => clearTimeout(t);
    }
    return;
  }, [listo, navigate]);

  if (listo) {
    return (
      <div className="space-y-4 py-16 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/15">
          <Check className="size-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">¡Tu negocio está listo!</h1>
        <p className="text-muted-foreground">Ya completaste tu información.</p>
      </div>
    );
  }

  const abiertos = datos.horarios.filter((h) => h.abierto);

  return (
    <div className="space-y-5">
      <Titulo texto="Así se verá tu negocio" ayuda="Revisa que todo esté bien antes de publicar." />
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {principal ? (
          <img
            src={principal.url}
            alt={`Logotipo de ${datos.negocio.nombre_negocio}`}
            className="h-48 w-full bg-secondary object-contain"
          />
        ) : null}
        <div className="space-y-3 p-5">
          <div>
            <h2 className="text-xl font-bold">{datos.negocio.nombre_negocio}</h2>
            <p className="text-sm text-muted-foreground">
              {datos.negocio.tipo} · {datos.negocio.municipio}
            </p>
          </div>
          {p.descripcion ? <p className="text-base">{p.descripcion}</p> : null}
          <Dato titulo="Horario">
            {p.solo_reservacion
              ? "Solo con reservación"
              : abiertos.length
                ? abiertos
                    .map(
                      (h) =>
                        `${DIAS.find((d) => d.dia === h.dia)?.nombre}: ${etiquetaHora(h.apertura)} a ${etiquetaHora(h.cierre)}`,
                    )
                    .join(" · ")
                : "Sin horario"}
          </Dato>
          <Dato titulo="Contacto">
            {p.whatsapp_activo
              ? `WhatsApp ${p.whatsapp_numero ?? datos.negocio.celular}`
              : datos.negocio.celular}
          </Dato>
          <Dato titulo="Servicio a domicilio">
            {p.domicilio
              ? p.costo_entrega_tipo === "gratis"
                ? "Sí, entrega gratis"
                : p.costo_entrega_tipo === "fijo"
                  ? `Sí, $${p.costo_entrega ?? 0}`
                  : `Sí, hasta ${p.distancia_km ?? 0} km`
              : "No"}
          </Dato>
          {p.recibe_clientes ? (
            <Dato titulo="Dirección">
              {[p.direccion, p.colonia, p.codigo_postal].filter(Boolean).join(", ")}
            </Dato>
          ) : null}
        </div>
      </div>

      <BotonPrincipal
        cargando={guardando}
        onClick={() =>
          void correr(
            () => publicar(),
            () => setListo(true),
          )
        }
      >
        PUBLICAR MI NEGOCIO
      </BotonPrincipal>
    </div>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{titulo}</p>
      <p className="text-base">{children}</p>
    </div>
  );
}
