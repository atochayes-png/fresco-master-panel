import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import {
  guardarConfiguracionDivertirme,
  miConfiguracionDivertirme,
  type ConfiguracionDivertirme,
} from "@/lib/divertirme.functions";
import {
  AMBIENTES,
  RESERVACIONES,
  RESTRICCIONES_EDAD,
  SUBCATEGORIAS_DIVERTIRME,
  TIPOS_COVER,
} from "@/lib/divertirme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/mi-negocio/divertirme")({
  head: () => ({
    meta: [
      { title: "Ambiente y acceso — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Configura el tipo de lugar, ambiente, restricción de edad, cover y si recomiendas reservar.",
      },
      { property: "og:title", content: "Ambiente y acceso — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Tipo de lugar, ambiente, edad, cover y reservación.",
      },
    ],
  }),
  component: ConfigDivertirme,
});

function ConfigDivertirme() {
  const qc = useQueryClient();
  const cargar = useServerFn(miConfiguracionDivertirme);
  const guardar = useServerFn(guardarConfiguracionDivertirme);
  const { data, isLoading } = useQuery({
    queryKey: ["config-divertirme"],
    queryFn: () => cargar(),
  });

  const [f, setF] = useState<ConfiguracionDivertirme | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (data && !f) setF(data);
  }, [data, f]);

  if (isLoading || !f) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function alternar(lista: string[], valor: string) {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
  }

  async function enviar() {
    if (!f) return;
    setOcupado(true);
    setAviso(null);
    try {
      await guardar({ data: f });
      await qc.invalidateQueries({ queryKey: ["config-divertirme"] });
      setAviso("Guardado. Así lo verán tus visitantes.");
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No pudimos guardar");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <Link to="/mi-negocio" className="inline-flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="size-4" /> Mi negocio
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="size-6 text-primary" /> Ambiente y acceso
        </h1>
        <p className="text-sm text-muted-foreground">
          Llena sólo lo que aplique a tu lugar. Puedes cambiarlo cuando quieras.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Label className="text-base">¿Qué tipo de lugar eres?</Label>
        <div className="grid grid-cols-2 gap-2">
          {SUBCATEGORIAS_DIVERTIRME.map((s) => (
            <button
              key={s.clave}
              type="button"
              onClick={() =>
                setF({ ...f, divertirme_tipos: alternar(f.divertirme_tipos, s.clave) })
              }
              className={`rounded-xl border p-3 text-left text-sm font-semibold ${
                f.divertirme_tipos.includes(s.clave)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <span className="mr-1">{s.emoji}</span>
              {s.nombre}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Label className="text-base">¿Qué tipo de ambiente ofreces?</Label>
        <div className="flex flex-wrap gap-2">
          {AMBIENTES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setF({ ...f, ambiente: alternar(f.ambiente, a) })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                f.ambiente.includes(a)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Label className="text-base">¿Hay restricción de edad?</Label>
        <div className="grid gap-2">
          {RESTRICCIONES_EDAD.map((r) => (
            <button
              key={r.clave}
              type="button"
              onClick={() => setF({ ...f, restriccion_edad: r.clave })}
              className={`rounded-xl border p-3 text-left text-sm font-semibold ${
                f.restriccion_edad === r.clave
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              {r.nombre}
            </button>
          ))}
        </div>
        <Label htmlFor="notas-edad">Notas (opcional)</Label>
        <Textarea
          id="notas-edad"
          value={f.restriccion_notas ?? ""}
          onChange={(e) => setF({ ...f, restriccion_notas: e.target.value })}
          placeholder="Menores permitidos hasta las 8 PM."
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Label className="text-base">¿Manejas cover o costo de acceso?</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setF({ ...f, cover_activo: false })}
            className={`flex-1 rounded-xl border p-3 text-sm font-semibold ${
              !f.cover_activo ? "border-primary bg-primary/10" : "border-border bg-background"
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => setF({ ...f, cover_activo: true })}
            className={`flex-1 rounded-xl border p-3 text-sm font-semibold ${
              f.cover_activo ? "border-primary bg-primary/10" : "border-border bg-background"
            }`}
          >
            Sí
          </button>
        </div>
        {f.cover_activo ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_COVER.map((t) => (
                <button
                  key={t.clave}
                  type="button"
                  onClick={() => setF({ ...f, cover_tipo: t.clave })}
                  className={`rounded-xl border p-3 text-sm font-semibold ${
                    f.cover_tipo === t.clave
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background"
                  }`}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
            {f.cover_tipo === "fijo" || f.cover_tipo === "desde" ? (
              <div>
                <Label htmlFor="cover">Monto</Label>
                <Input
                  id="cover"
                  inputMode="numeric"
                  value={f.cover_monto ?? ""}
                  onChange={(e) =>
                    setF({ ...f, cover_monto: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="150"
                />
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Tomar el Fresco no cobra el cover: lo cobras tú en tu lugar.
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Label className="text-base">¿Para visitarte generalmente se necesita reservar?</Label>
        <div className="grid gap-2">
          {RESERVACIONES.map((r) => (
            <button
              key={r.clave}
              type="button"
              onClick={() => setF({ ...f, reserva_recomendada: r.clave })}
              className={`rounded-xl border p-3 text-left text-sm font-semibold ${
                f.reserva_recomendada === r.clave
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              {r.nombre}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Es sólo información para tus visitantes. Tú confirmas por WhatsApp.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <Label htmlFor="horario-notas" className="text-base">
          Notas de horario (opcional)
        </Label>
        <Textarea
          id="horario-notas"
          value={f.horario_notas ?? ""}
          onChange={(e) => setF({ ...f, horario_notas: e.target.value })}
          placeholder="Música en vivo viernes y sábado desde las 9 PM."
        />
      </section>

      {aviso ? <p className="text-sm font-semibold text-primary">{aviso}</p> : null}

      <Button onClick={() => void enviar()} disabled={ocupado} className="h-13 w-full text-base">
        {ocupado ? <Loader2 className="size-5 animate-spin" /> : "GUARDAR"}
      </Button>
    </div>
  );
}
