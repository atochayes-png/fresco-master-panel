import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";

import { misContactosDivertirme } from "@/lib/divertirme.functions";
import { fechaLargaD, hora12 } from "@/lib/divertirme";

export const Route = createFileRoute("/_authenticated/mi-negocio/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos desde TFY — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Personas interesadas que te contactaron desde Tomar el Fresco en Yucatán.",
      },
      { property: "og:title", content: "Contactos desde TFY — Tomar el Fresco en Yucatán" },
      { property: "og:description", content: "Personas interesadas en visitar tu lugar." },
    ],
  }),
  component: Contactos,
});

function Contactos() {
  const cargar = useServerFn(misContactosDivertirme);
  const { data, isLoading } = useQuery({
    queryKey: ["mis-contactos-divertirme"],
    queryFn: () => cargar(),
  });

  return (
    <div className="space-y-5 pb-24">
      <Link to="/mi-negocio" className="inline-flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="size-4" /> Mi negocio
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ClipboardList className="size-6 text-primary" /> Contactos desde TFY
        </h1>
        <p className="text-sm text-muted-foreground">
          Personas que quisieron visitarte. La conversación sigue directo en tu WhatsApp.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Cifra titulo="Hoy" valor={data?.hoy ?? 0} />
            <Cifra titulo="Este mes" valor={data?.mes ?? 0} />
            <Cifra titulo="Histórico" valor={data?.total ?? 0} />
          </div>

          <div className="space-y-3">
            {(data?.lista ?? []).map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground">{c.folio}</p>
                <p className="font-bold">{c.cliente_nombre}</p>
                <p className="text-sm text-muted-foreground">{c.cliente_telefono}</p>
                <p className="mt-1 text-sm">
                  {c.fecha_visita ? fechaLargaD(c.fecha_visita) : "Sin fecha indicada"}
                  {c.hora_visita ? ` · ${hora12(c.hora_visita)}` : ""}
                  {c.personas ? ` · ${c.personas} personas` : ""}
                </p>
              </div>
            ))}
            {(data?.lista ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Todavía no hay contactos generados.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function Cifra({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-xs text-muted-foreground">{titulo}</p>
    </div>
  );
}
