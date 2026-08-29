import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  ClipboardList,
  Images,
  Loader2,
  MapPin,
  Phone,
  ShoppingBag,
  Store,
  Tag,
  Timer,
  UtensilsCrossed,
} from "lucide-react";

import { miNegocio } from "@/lib/dueno.functions";
import { esComer } from "@/lib/comer";
import { calcularEstatus, diasRestantes, formatoFecha } from "@/lib/dominio";
import { EstatusBadge } from "@/components/estatus-negocio";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mi-negocio/")({
  head: () => ({
    meta: [
      { title: "Mi negocio — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Administra la información, fotos y horarios de tu negocio desde tu celular.",
      },
      { property: "og:title", content: "Mi negocio — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Administra la información, fotos y horarios de tu negocio desde tu celular.",
      },
    ],
  }),
  component: MiNegocio,
});

function MiNegocio() {
  const cargar = useServerFn(miNegocio);
  const { data, isLoading } = useQuery({ queryKey: ["mi-negocio"], queryFn: () => cargar() });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-bold">Todavía no hay un negocio asignado</h1>
        <p className="mt-2 text-muted-foreground">
          Comunícate con Tomar el Fresco para activar tu negocio.
        </p>
      </div>
    );
  }

  const { negocio, perfil, fotos } = data;
  const estatus = calcularEstatus(negocio);
  const dias = diasRestantes(negocio.fecha_fin);
  const principal = fotos.find((f) => f.ruta === perfil.foto_principal) ?? fotos[0];
  const comer = esComer(negocio.tipo);

  if (negocio.estado_configuracion === "perfil_incompleto") {
    return (
      <div className="space-y-6 py-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">¡Bienvenido!</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Vamos a preparar tu negocio para que las personas puedan encontrarte.
          </p>
        </div>
        <Button asChild className="h-16 w-full text-base font-semibold">
          <Link to="/mi-negocio/completar" search={{ paso: perfil.paso_actual || 1 }}>
            COMPLETAR MI NEGOCIO
          </Link>
        </Button>
        <TarjetaPlan negocio={negocio} dias={dias} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {principal ? (
          <img
            src={principal.url}
            alt={`Foto de ${negocio.nombre_negocio}`}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="flex h-44 items-center justify-center bg-secondary">
            <Camera className="size-8 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-2 p-5">
          <h1 className="text-2xl font-bold">{negocio.nombre_negocio}</h1>
          <p className="text-sm text-muted-foreground">
            {negocio.tipo} · {negocio.municipio}
          </p>
          <EstatusBadge estatus={estatus} />
        </div>
      </div>

      {negocio.estatus === "suspendido" ? (
        <Aviso texto="Tu negocio se encuentra suspendido." />
      ) : null}
      {estatus === "vencido" ? <Aviso texto="Tu plan ha vencido." /> : null}

      <div className="grid grid-cols-2 gap-3">
        <Acceso paso={1} icono={<Store className="size-6" />} texto="MI INFORMACIÓN" />
        <Acceso paso={2} icono={<MapPin className="size-6" />} texto="UBICACIÓN" />
        <Acceso paso={3} icono={<CalendarClock className="size-6" />} texto="HORARIOS" />
        <Link
          to="/mi-negocio/medios"
          className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm"
        >
          <span className="text-primary">
            <Images className="size-6" />
          </span>
          FOTOS Y VIDEOS
        </Link>
        <Acceso paso={4} icono={<UtensilsCrossed className="size-6" />} texto="MENÚ / CATÁLOGO" />
        <Acceso paso={4} icono={<Phone className="size-6" />} texto="CONTACTO" />
        {comer ? (
          <>
            <Link
              to="/mi-negocio/comer"
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm"
            >
              <span className="text-primary">
                <Timer className="size-6" />
              </span>
              MI COCINA
            </Link>
            <Link
              to="/mi-negocio/promociones"
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm"
            >
              <span className="text-primary">
                <Tag className="size-6" />
              </span>
              PROMOCIONES
            </Link>
          </>
        ) : null}
        <Link
          to="/mi-negocio/productos"
          className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm"
        >
          <span className="text-primary">
            <ShoppingBag className="size-6" />
          </span>
          {comer ? "MI MENÚ" : "MIS PRODUCTOS"}
        </Link>
        <Link
          to="/mi-negocio/pedidos"
          className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm"
        >
          <span className="text-primary">
            <ClipboardList className="size-6" />
          </span>
          PEDIDOS
        </Link>
      </div>

      <TarjetaPlan negocio={negocio} dias={dias} />
    </div>
  );
}

function Acceso({ paso, icono, texto }: { paso: number; icono: React.ReactNode; texto: string }) {
  return (
    <Link
      to="/mi-negocio/completar"
      search={{ paso }}
      className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm"
    >
      <span className="text-primary">{icono}</span>
      {texto}
    </Link>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-destructive">
      <AlertTriangle className="size-5 shrink-0" />
      <p className="text-sm font-semibold">{texto}</p>
    </div>
  );
}

function TarjetaPlan({
  negocio,
  dias,
}: {
  negocio: { plan_tipo: string; fecha_inicio: string; fecha_fin: string };
  dias: number;
}) {
  const prueba = negocio.plan_tipo === "prueba_gratis";
  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <p className="text-base font-bold">Mi plan</p>
      <p className="text-lg font-semibold text-primary">
        {prueba ? "PRUEBA GRATIS" : negocio.plan_tipo}
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Inicio</p>
          <p className="font-medium">{formatoFecha(negocio.fecha_inicio)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Vencimiento</p>
          <p className="font-medium">{formatoFecha(negocio.fecha_fin)}</p>
        </div>
      </div>
      <p className="text-sm font-semibold">
        {dias < 0 ? "Tu plan ha vencido." : `Te quedan ${dias} días`}
      </p>
      {dias >= 0 && dias <= 7 ? (
        <p className="text-sm font-medium text-aviso">Tu periodo actual está por terminar.</p>
      ) : null}
    </div>
  );
}
