import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Phone } from "lucide-react";

import { misSolicitudesRenta } from "@/lib/moverme.functions";
import { fechaLargaRenta, horaTexto, nombreLugarEntrega } from "@/lib/moverme";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mi-negocio/solicitudes-renta")({
  head: () => ({
    meta: [
      { title: "Solicitudes de renta — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Consulta las solicitudes de renta de autos que te llegaron desde TFY.",
      },
      { property: "og:title", content: "Solicitudes de renta — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Fechas, vehículo, cliente y total estimado de cada solicitud recibida.",
      },
    ],
  }),
  component: SolicitudesRenta,
});

function SolicitudesRenta() {
  const cargar = useServerFn(misSolicitudesRenta);
  const { data, isLoading } = useQuery({
    queryKey: ["mis-solicitudes-renta"],
    queryFn: () => cargar(),
  });

  const lista = data ?? [];
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const delMes = lista.filter((s) => new Date(s.creado_en) >= inicioMes).length;

  return (
    <div className="space-y-5 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Solicitudes desde TFY</h1>
        <p className="text-sm text-muted-foreground">
          Son solicitudes, no rentas confirmadas. Tú confirmas disponibilidad y condiciones
          directamente con el cliente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-2xl font-bold">{delMes}</p>
          <p className="text-xs text-muted-foreground">Este mes</p>
        </div>
        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-2xl font-bold">{lista.length}</p>
          <p className="text-xs text-muted-foreground">Históricas</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : lista.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Todavía no recibes solicitudes de renta.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((s) => (
            <li key={s.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{s.folio}</span>
                <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold">
                  {s.estado.replaceAll("_", " ")}
                </span>
              </div>
              <p className="font-semibold">{s.vehiculo_nombre}</p>
              <p className="text-sm text-muted-foreground">
                {fechaLargaRenta(s.fecha_inicio)} {horaTexto(s.hora_inicio)} →{" "}
                {fechaLargaRenta(s.fecha_fin)} {horaTexto(s.hora_fin)} · {s.dias}{" "}
                {s.dias === 1 ? "día" : "días"}
              </p>
              <p className="text-sm text-muted-foreground">
                Entrega: {nombreLugarEntrega(s.lugar_entrega)}
                {s.pasajeros ? ` · ${s.pasajeros} pasajeros` : ""}
              </p>
              {s.total_estimado != null ? (
                <p className="text-sm font-semibold">
                  Total estimado: ${s.total_estimado.toLocaleString("es-MX")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Precio a confirmar</p>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold">{s.cliente_nombre}</span>
                <a
                  href={`tel:${s.cliente_telefono}`}
                  className="flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  <Phone className="size-4" /> {s.cliente_telefono}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
