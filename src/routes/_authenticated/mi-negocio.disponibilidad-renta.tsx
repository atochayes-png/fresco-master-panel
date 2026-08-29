import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  bloqueosVehiculo,
  cambiarBloqueoVehiculo,
  miConfiguracionRenta,
  misVehiculos,
} from "@/lib/moverme.functions";
import { fechaLargaRenta, hoyISO } from "@/lib/moverme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/mi-negocio/disponibilidad-renta")({
  head: () => ({
    meta: [
      { title: "Disponibilidad de vehículos — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Bloquea o libera fechas y unidades de tus vehículos de renta.",
      },
      { property: "og:title", content: "Disponibilidad de vehículos — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Calendario simple para marcar qué unidades están ocupadas cada día.",
      },
    ],
  }),
  component: DisponibilidadRenta,
});

function DisponibilidadRenta() {
  const qc = useQueryClient();
  const cargarVehiculos = useServerFn(misVehiculos);
  const cargarConfig = useServerFn(miConfiguracionRenta);
  const cargarBloqueos = useServerFn(bloqueosVehiculo);
  const cambiar = useServerFn(cambiarBloqueoVehiculo);

  const vehiculos = useQuery({ queryKey: ["mis-vehiculos"], queryFn: () => cargarVehiculos() });
  const config = useQuery({ queryKey: ["config-renta"], queryFn: () => cargarConfig() });

  const lista = vehiculos.data ?? [];
  const [vehiculoId, setVehiculoId] = useState<string | null>(null);
  const actual = lista.find((v) => v.id === vehiculoId) ?? lista[0];

  const hoy = hoyISO();
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [unidades, setUnidades] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rango = useQuery({
    queryKey: ["bloqueos-vehiculo", actual?.id],
    enabled: !!actual,
    queryFn: () =>
      cargarBloqueos({
        data: { vehiculo_id: actual!.id, desde: hoy, hasta: "2100-01-01" },
      }),
  });

  async function accion(bloquear: boolean) {
    if (!actual) return;
    setError(null);
    setOcupado(true);
    try {
      await cambiar({
        data: {
          vehiculo_id: actual.id,
          desde,
          hasta,
          unidades: Number(unidades) || actual.unidades,
          bloquear,
        },
      });
      await qc.invalidateQueries({ queryKey: ["bloqueos-vehiculo", actual.id] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos actualizar el calendario");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Disponibilidad de vehículos</h1>
        <p className="text-sm text-muted-foreground">
          Marca las fechas en que un vehículo ya está ocupado. Las solicitudes que recibes nunca
          bloquean fechas automáticamente.
        </p>
      </div>

      {config.data && !config.data.renta_usa_calendario ? (
        <div className="rounded-2xl bg-secondary p-4 text-sm">
          Hoy confirmas por WhatsApp, así que tus vehículos se muestran como “Disponibilidad por
          confirmar”.{" "}
          <Link to="/mi-negocio/renta" className="font-semibold text-primary underline">
            Activar el calendario
          </Link>
        </div>
      ) : null}

      {vehiculos.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : lista.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Primero agrega un vehículo en “Mis vehículos”.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="veh">Vehículo</Label>
            <select
              id="veh"
              value={actual?.id ?? ""}
              onChange={(e) => setVehiculoId(e.target.value)}
              className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
            >
              {lista.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} ({v.unidades} unidades)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="d1">Desde</Label>
              <Input
                id="d1"
                type="date"
                min={hoy}
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="h-13 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d2">Hasta</Label>
              <Input
                id="d2"
                type="date"
                min={desde}
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="h-13 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="un">¿Cuántas unidades quedan ocupadas?</Label>
            <Input
              id="un"
              value={unidades}
              onChange={(e) => setUnidades(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder={`Todas (${actual?.unidades ?? 1})`}
              className="h-13 text-base"
            />
          </div>

          {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <Button className="h-13 font-semibold" onClick={() => accion(true)} disabled={ocupado}>
              {ocupado ? <Loader2 className="size-4 animate-spin" /> : "BLOQUEAR"}
            </Button>
            <Button
              variant="secondary"
              className="h-13 font-semibold"
              onClick={() => accion(false)}
              disabled={ocupado}
            >
              LIBERAR
            </Button>
          </div>

          <div className="space-y-2 rounded-3xl border border-border bg-card p-4">
            <h2 className="font-bold">Fechas bloqueadas</h2>
            {(rango.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes fechas bloqueadas para este vehículo.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(rango.data ?? []).map((b) => (
                  <li key={b.fecha} className="flex justify-between">
                    <span>{fechaLargaRenta(b.fecha)}</span>
                    <span className="text-muted-foreground">{b.unidades} ocupadas</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
