import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarCheck, Loader2, MessageCircle } from "lucide-react";

import {
  guardarPoliticasHospedaje,
  misPoliticasHospedaje,
  type PoliticasHospedaje,
} from "@/lib/hospedaje.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/hospedaje")({
  head: () => ({
    meta: [
      { title: "Políticas del hospedaje — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Define si usas calendario, horarios de entrada y salida, mascotas, niños y anticipo.",
      },
      { property: "og:title", content: "Políticas del hospedaje — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Configura cómo confirmas disponibilidad y las reglas básicas de tu hospedaje.",
      },
    ],
  }),
  component: Hospedaje,
});

function Hospedaje() {
  const qc = useQueryClient();
  const cargar = useServerFn(misPoliticasHospedaje);
  const guardar = useServerFn(guardarPoliticasHospedaje);
  const { data, isLoading } = useQuery({
    queryKey: ["politicas-hospedaje"],
    queryFn: () => cargar(),
  });

  const [form, setForm] = useState<PoliticasHospedaje | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const cambiar = (c: Partial<PoliticasHospedaje>) =>
    setForm((f) => (f ? { ...f, ...c } : f));

  async function enviar() {
    if (!form) return;
    setOcupado(true);
    setListo(false);
    try {
      await guardar({ data: form });
      await qc.invalidateQueries({ queryKey: ["politicas-hospedaje"] });
      setListo(true);
    } finally {
      setOcupado(false);
    }
  }

  if (isLoading || !form)
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
        <h1 className="text-2xl font-bold">Disponibilidad y políticas</h1>
        <p className="text-sm text-muted-foreground">
          Tú decides cómo quieres manejar la disponibilidad de tu hospedaje.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => cambiar({ usa_calendario: true })}
          className={`flex w-full items-start gap-3 rounded-3xl border p-4 text-left ${
            form.usa_calendario ? "border-primary bg-primary/10" : "border-border bg-card"
          }`}
        >
          <CalendarCheck className="mt-1 size-6 text-primary" />
          <span>
            <span className="block text-base font-bold">SÍ, QUIERO USAR EL CALENDARIO</span>
            <span className="block text-sm text-muted-foreground">
              Bloqueas las fechas ocupadas y los huéspedes sólo ven las libres.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => cambiar({ usa_calendario: false })}
          className={`flex w-full items-start gap-3 rounded-3xl border p-4 text-left ${
            !form.usa_calendario ? "border-primary bg-primary/10" : "border-border bg-card"
          }`}
        >
          <MessageCircle className="mt-1 size-6 text-primary" />
          <span>
            <span className="block text-base font-bold">NO, PREFIERO CONFIRMAR POR WHATSAPP</span>
            <span className="block text-sm text-muted-foreground">
              Se muestra “Disponibilidad por confirmar” y tú respondes directamente.
            </span>
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="in">Hora de entrada</Label>
          <Input
            id="in"
            value={form.checkin ?? ""}
            onChange={(e) => cambiar({ checkin: e.target.value })}
            placeholder="3:00 pm"
            className="h-13 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="out">Hora de salida</Label>
          <Input
            id="out"
            value={form.checkout ?? ""}
            onChange={(e) => cambiar({ checkout: e.target.value })}
            placeholder="12:00 pm"
            className="h-13 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        {[
          { clave: "acepta_ninos" as const, texto: "Se aceptan niños" },
          { clave: "acepta_mascotas" as const, texto: "Se aceptan mascotas" },
          { clave: "requiere_anticipo" as const, texto: "Pido anticipo (informativo)" },
        ].map((o) => (
          <label
            key={o.clave}
            className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3"
          >
            <span className="text-sm font-semibold">{o.texto}</span>
            <input
              type="checkbox"
              checked={form[o.clave]}
              onChange={(e) => cambiar({ [o.clave]: e.target.checked })}
              className="size-5 accent-[var(--color-primary)]"
            />
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Notas para el huésped</Label>
        <Textarea
          id="notas"
          value={form.notas_hospedaje ?? ""}
          onChange={(e) => cambiar({ notas_hospedaje: e.target.value })}
          placeholder="El anticipo se acuerda directamente por WhatsApp."
          rows={3}
        />
      </div>

      {listo ? <p className="text-sm font-semibold text-primary">Cambios guardados</p> : null}

      <Button className="h-14 w-full text-base font-semibold" onClick={enviar} disabled={ocupado}>
        {ocupado ? <Loader2 className="size-5 animate-spin" /> : "GUARDAR"}
      </Button>

      {form.usa_calendario ? (
        <Button asChild variant="secondary" className="h-13 w-full">
          <Link to="/mi-negocio/disponibilidad">Abrir mi calendario</Link>
        </Button>
      ) : null}
    </div>
  );
}
