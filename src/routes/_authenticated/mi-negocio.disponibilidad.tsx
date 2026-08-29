import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarX, Loader2, Unlock } from "lucide-react";

import {
  bloqueosAlojamiento,
  cambiarBloqueo,
  misAlojamientos,
  misPoliticasHospedaje,
} from "@/lib/hospedaje.functions";
import { fechaLarga, hoyISO } from "@/lib/hospedaje";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/mi-negocio/disponibilidad")({
  head: () => ({
    meta: [
      { title: "Mi calendario — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Bloquea y desbloquea las fechas ocupadas de cada alojamiento.",
      },
      { property: "og:title", content: "Mi calendario — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Controla qué fechas se muestran disponibles para tus huéspedes.",
      },
    ],
  }),
  component: Disponibilidad,
});

function enUnAno() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function Disponibilidad() {
  const qc = useQueryClient();
  const cargarAlojamientos = useServerFn(misAlojamientos);
  const cargarPoliticas = useServerFn(misPoliticasHospedaje);
  const cargarBloqueos = useServerFn(bloqueosAlojamiento);
  const cambiar = useServerFn(cambiarBloqueo);

  const { data: alojamientos, isLoading } = useQuery({
    queryKey: ["mis-alojamientos"],
    queryFn: () => cargarAlojamientos(),
  });
  const { data: politicas } = useQuery({
    queryKey: ["politicas-hospedaje"],
    queryFn: () => cargarPoliticas(),
  });

  const [seleccion, setSeleccion] = useState("");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!seleccion && alojamientos?.length) setSeleccion(alojamientos[0]!.id);
  }, [alojamientos, seleccion]);

  const { data: bloqueos } = useQuery({
    queryKey: ["bloqueos", seleccion],
    enabled: Boolean(seleccion),
    queryFn: () =>
      cargarBloqueos({ data: { alojamiento_id: seleccion, desde: hoyISO(), hasta: enUnAno() } }),
  });

  async function aplicar(bloquear: boolean) {
    if (!seleccion) return;
    setOcupado(true);
    setAviso(null);
    try {
      const r = await cambiar({ data: { alojamiento_id: seleccion, desde, hasta, bloquear } });
      await qc.invalidateQueries({ queryKey: ["bloqueos", seleccion] });
      setAviso(
        bloquear
          ? `Bloqueaste ${r.fechas} ${r.fechas === 1 ? "fecha" : "fechas"}`
          : `Liberaste ${r.fechas} ${r.fechas === 1 ? "fecha" : "fechas"}`,
      );
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No pudimos actualizar el calendario");
    } finally {
      setOcupado(false);
    }
  }

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-5 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mi calendario</h1>
        <p className="text-sm text-muted-foreground">
          Marca las fechas ocupadas. Las solicitudes que recibes no bloquean nada por sí solas.
        </p>
      </div>

      {politicas && !politicas.usa_calendario ? (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-semibold">Ahora confirmas por WhatsApp</p>
          <p className="text-muted-foreground">
            Los huéspedes ven “Disponibilidad por confirmar”. Puedes activar el calendario en las
            políticas de tu hospedaje.
          </p>
          <Button asChild variant="secondary" className="mt-3 h-12 w-full">
            <Link to="/mi-negocio/hospedaje">Cambiar esta decisión</Link>
          </Button>
        </div>
      ) : null}

      {(alojamientos ?? []).length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Primero agrega un alojamiento.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="aloj">Alojamiento</Label>
            <select
              id="aloj"
              value={seleccion}
              onChange={(e) => setSeleccion(e.target.value)}
              className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
            >
              {(alojamientos ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
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
                value={desde}
                min={hoyISO()}
                onChange={(e) => setDesde(e.target.value)}
                className="h-13 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d2">Hasta</Label>
              <Input
                id="d2"
                type="date"
                value={hasta}
                min={desde}
                onChange={(e) => setHasta(e.target.value)}
                className="h-13 text-base"
              />
            </div>
          </div>

          {aviso ? <p className="text-sm font-semibold text-primary">{aviso}</p> : null}

          <div className="grid gap-2">
            <Button
              className="h-14 text-base font-semibold"
              onClick={() => void aplicar(true)}
              disabled={ocupado}
            >
              {ocupado ? <Loader2 className="size-5 animate-spin" /> : <CalendarX className="size-5" />}
              BLOQUEAR ESTAS FECHAS
            </Button>
            <Button
              variant="secondary"
              className="h-14 text-base font-semibold"
              onClick={() => void aplicar(false)}
              disabled={ocupado}
            >
              <Unlock className="size-5" /> LIBERAR ESTAS FECHAS
            </Button>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold">Fechas bloqueadas</h2>
            {(bloqueos ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes fechas bloqueadas.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {(bloqueos ?? []).map((b) => (
                  <li
                    key={b.fecha}
                    className="rounded-full bg-secondary px-3 py-2 text-xs font-semibold"
                  >
                    {fechaLarga(b.fecha)}
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
