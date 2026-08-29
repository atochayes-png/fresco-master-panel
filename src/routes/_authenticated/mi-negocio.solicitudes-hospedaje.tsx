import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";

import { misSolicitudesHospedaje } from "@/lib/hospedaje.functions";
import { fechaLarga } from "@/lib/hospedaje";
import { pesos } from "@/lib/publico";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mi-negocio/solicitudes-hospedaje")({
  head: () => ({
    meta: [
      { title: "Solicitudes de hospedaje — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Consulta las solicitudes de hospedaje que los huéspedes generaron para ti.",
      },
      { property: "og:title", content: "Solicitudes de hospedaje — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Solicitudes generadas desde tus alojamientos publicados en TFY.",
      },
    ],
  }),
  component: SolicitudesHospedaje,
});

function SolicitudesHospedaje() {
  const cargar = useServerFn(misSolicitudesHospedaje);
  const { data, isLoading } = useQuery({
    queryKey: ["mis-solicitudes-hospedaje"],
    queryFn: () => cargar(),
  });

  const lista = data ?? [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoy);
  inicioMes.setDate(1);
  const deHoy = lista.filter((s) => new Date(s.creado_en) >= hoy);
  const delMes = lista.filter((s) => new Date(s.creado_en) >= inicioMes);

  return (
    <div className="space-y-5 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Solicitudes de hospedaje</h1>
        <p className="text-sm text-muted-foreground">
          Cada solicitud queda pendiente de que tú confirmes la disponibilidad por WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Indicador titulo="Hoy" valor={String(deHoy.length)} />
        <Indicador titulo="Este mes" valor={String(delMes.length)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : lista.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Todavía no has recibido solicitudes.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((s) => (
            <li key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.folio}</span>
                {s.total_estimado != null ? (
                  <span className="text-sm font-semibold text-primary">
                    {pesos(s.total_estimado)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Precio a confirmar</span>
                )}
              </div>
              <p className="text-sm font-semibold">{s.alojamiento_nombre}</p>
              <p className="text-sm">
                {s.cliente_nombre} · {s.huespedes} {s.huespedes === 1 ? "huésped" : "huéspedes"} ·{" "}
                {s.cliente_telefono}
              </p>
              <p className="text-xs text-muted-foreground">
                {fechaLarga(s.check_in)} al {fechaLarga(s.check_out)} · {s.noches}{" "}
                {s.noches === 1 ? "noche" : "noches"} · {new Date(s.creado_en).toLocaleString("es-MX")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="text-2xl font-bold">{valor}</p>
    </div>
  );
}
