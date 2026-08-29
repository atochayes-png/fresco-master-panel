import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";

import { misReservaciones } from "@/lib/conocer.functions";
import { pesos } from "@/lib/publico";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mi-negocio/reservaciones")({
  head: () => ({
    meta: [
      { title: "Solicitudes desde TFY — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Consulta las solicitudes de reservación que los visitantes generaron para ti.",
      },
      { property: "og:title", content: "Solicitudes desde TFY — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Solicitudes de reservación generadas desde tus experiencias.",
      },
    ],
  }),
  component: Reservaciones,
});

function Reservaciones() {
  const cargar = useServerFn(misReservaciones);
  const { data, isLoading } = useQuery({
    queryKey: ["mis-reservaciones"],
    queryFn: () => cargar(),
  });

  const lista = data ?? [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoy);
  inicioMes.setDate(1);
  const deHoy = lista.filter((r) => new Date(r.creado_en) >= hoy);
  const delMes = lista.filter((r) => new Date(r.creado_en) >= inicioMes);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Solicitudes desde TFY</h1>
        <p className="text-sm text-muted-foreground">
          Cada solicitud queda pendiente de tu confirmación directa por WhatsApp.
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
          {lista.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold">{r.folio}</span>
                {r.total_estimado != null ? (
                  <span className="text-sm font-semibold text-primary">
                    {pesos(r.total_estimado)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Precio a confirmar</span>
                )}
              </div>
              <p className="text-sm font-semibold">{r.experiencia_nombre}</p>
              <p className="text-sm">
                {r.cliente_nombre} · {r.personas} {r.personas === 1 ? "persona" : "personas"}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.fecha_solicitada ? r.fecha_solicitada : "Fecha por definir"}
                {r.horario ? ` · ${r.horario}` : ""} ·{" "}
                {new Date(r.creado_en).toLocaleString("es-MX")}
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
