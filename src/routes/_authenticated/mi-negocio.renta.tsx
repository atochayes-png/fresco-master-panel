import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  guardarConfiguracionRenta,
  miConfiguracionRenta,
  type ConfiguracionRenta,
} from "@/lib/moverme.functions";
import { COSTOS_ENTREGA, LUGARES_ENTREGA, TIPOS_TARJETA } from "@/lib/moverme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/renta")({
  head: () => ({
    meta: [
      { title: "Requisitos y entrega — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Configura los requisitos informativos de tu rentadora, la entrega, la devolución y cómo confirmas disponibilidad.",
      },
      { property: "og:title", content: "Requisitos y entrega — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Edad mínima, licencia, depósito, puntos de entrega y calendario de tu rentadora.",
      },
    ],
  }),
  component: ConfigRenta,
});

function ConfigRenta() {
  const qc = useQueryClient();
  const cargar = useServerFn(miConfiguracionRenta);
  const guardar = useServerFn(guardarConfiguracionRenta);
  const { data, isLoading } = useQuery({
    queryKey: ["config-renta"],
    queryFn: () => cargar(),
  });

  const [form, setForm] = useState<ConfiguracionRenta | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const cambiar = (c: Partial<ConfiguracionRenta>) =>
    setForm((f) => (f ? { ...f, ...c } : f));

  async function enviar() {
    if (!form) return;
    setError(null);
    setListo(false);
    setOcupado(true);
    try {
      await guardar({ data: form });
      await qc.invalidateQueries({ queryKey: ["config-renta"] });
      setListo(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar los cambios");
    } finally {
      setOcupado(false);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Requisitos y entrega</h1>
        <p className="text-sm text-muted-foreground">
          Esta información es sólo informativa para el cliente. Tú confirmas y validas todo
          directamente.
        </p>
      </div>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4">
        <h2 className="text-lg font-bold">¿Cómo quieres manejar la disponibilidad?</h2>
        <button
          type="button"
          onClick={() => cambiar({ renta_usa_calendario: true })}
          className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-semibold ${
            form.renta_usa_calendario
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          SÍ, QUIERO USAR EL CALENDARIO
          <span className="block text-xs font-normal opacity-80">
            Bloqueas las fechas ocupadas y el cliente ve sólo lo libre.
          </span>
        </button>
        <button
          type="button"
          onClick={() => cambiar({ renta_usa_calendario: false })}
          className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-semibold ${
            !form.renta_usa_calendario
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          NO, PREFIERO CONFIRMAR POR WHATSAPP
          <span className="block text-xs font-normal opacity-80">
            Tus autos siempre se muestran como “Disponibilidad por confirmar”.
          </span>
        </button>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-4">
        <h2 className="text-lg font-bold">Requisitos para rentar</h2>

        <div className="space-y-2">
          <Label htmlFor="edad">Edad mínima</Label>
          <Input
            id="edad"
            value={form.renta_edad_minima != null ? String(form.renta_edad_minima) : ""}
            onChange={(e) =>
              cambiar({ renta_edad_minima: Number(e.target.value.replace(/\D/g, "")) || null })
            }
            inputMode="numeric"
            placeholder="25"
            className="h-13 text-base"
          />
        </div>

        {(
          [
            ["renta_licencia", "Licencia de conducir vigente"],
            ["renta_identificacion", "Identificación oficial"],
            ["renta_deposito", "Se solicita depósito en garantía"],
          ] as const
        ).map(([clave, texto]) => (
          <label
            key={clave}
            className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3"
          >
            <span className="text-sm font-semibold">{texto}</span>
            <input
              type="checkbox"
              checked={form[clave] === true}
              onChange={(e) => cambiar({ [clave]: e.target.checked } as Partial<ConfiguracionRenta>)}
              className="size-5 accent-[var(--color-primary)]"
            />
          </label>
        ))}

        <div className="space-y-2">
          <Label htmlFor="tarjeta">Tarjeta</Label>
          <select
            id="tarjeta"
            value={form.renta_tarjeta}
            onChange={(e) => cambiar({ renta_tarjeta: e.target.value })}
            className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
          >
            {TIPOS_TARJETA.map((t) => (
              <option key={t.clave} value={t.clave}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notas-req">Notas de requisitos (opcional)</Label>
          <Textarea
            id="notas-req"
            value={form.renta_requisitos_notas ?? ""}
            onChange={(e) => cambiar({ renta_requisitos_notas: e.target.value })}
            rows={3}
            placeholder="El depósito se devuelve al entregar la unidad sin daños."
          />
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-4">
        <h2 className="text-lg font-bold">Entrega y devolución</h2>
        <div className="grid grid-cols-2 gap-2">
          {LUGARES_ENTREGA.map((l) => {
            const activo = form.renta_entrega_opciones.includes(l.clave);
            return (
              <button
                key={l.clave}
                type="button"
                onClick={() =>
                  cambiar({
                    renta_entrega_opciones: activo
                      ? form.renta_entrega_opciones.filter((x) => x !== l.clave)
                      : [...form.renta_entrega_opciones, l.clave],
                  })
                }
                className={`rounded-2xl px-3 py-3 text-left text-sm font-semibold ${
                  activo
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {l.nombre}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="costo-tipo">Costo por entrega</Label>
          <select
            id="costo-tipo"
            value={form.renta_entrega_costo_tipo}
            onChange={(e) => cambiar({ renta_entrega_costo_tipo: e.target.value })}
            className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
          >
            {COSTOS_ENTREGA.map((c) => (
              <option key={c.clave} value={c.clave}>
                {c.nombre}
              </option>
            ))}
          </select>
          {form.renta_entrega_costo_tipo === "fijo" ? (
            <Input
              value={form.renta_entrega_costo != null ? String(form.renta_entrega_costo) : ""}
              onChange={(e) =>
                cambiar({ renta_entrega_costo: Number(e.target.value.replace(/\D/g, "")) || null })
              }
              inputMode="numeric"
              placeholder="300"
              aria-label="Costo de entrega"
              className="h-13 text-base"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notas">Notas para el cliente (opcional)</Label>
          <Textarea
            id="notas"
            value={form.renta_notas ?? ""}
            onChange={(e) => cambiar({ renta_notas: e.target.value })}
            rows={3}
            placeholder="Entrega en el aeropuerto sin costo con 24 horas de anticipación."
          />
        </div>
      </section>

      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
      {listo ? <p className="text-sm font-semibold text-primary">Cambios guardados.</p> : null}

      <Button className="h-14 w-full text-base font-semibold" onClick={enviar} disabled={ocupado}>
        {ocupado ? <Loader2 className="size-5 animate-spin" /> : "GUARDAR"}
      </Button>
    </div>
  );
}
