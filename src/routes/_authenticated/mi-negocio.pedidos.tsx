import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";

import { misPedidos } from "@/lib/productos.functions";
import { pesos } from "@/lib/publico";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mi-negocio/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos recibidos — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Consulta los pedidos que tus clientes generaron y continuaron por WhatsApp.",
      },
      { property: "og:title", content: "Pedidos recibidos — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Historial de pedidos generados desde tu ficha.",
      },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  const cargar = useServerFn(misPedidos);
  const { data, isLoading } = useQuery({ queryKey: ["mis-pedidos"], queryFn: () => cargar() });

  const lista = data ?? [];
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const delMes = lista.filter((p) => new Date(p.creado_en) >= inicioMes);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Pedidos recibidos</h1>
        <p className="text-sm text-muted-foreground">
          Los pedidos se confirman contigo directamente por WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Indicador titulo="Este mes" valor={String(delMes.length)} />
        <Indicador titulo="Total" valor={String(lista.length)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : lista.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Todavía no has recibido pedidos.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold">{p.folio}</span>
                <span className="text-sm font-semibold text-primary">{pesos(p.total_estimado)}</span>
              </div>
              <p className="text-sm">{p.cliente_nombre}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(p.creado_en).toLocaleString("es-MX")} ·{" "}
                {p.tipo_entrega === "domicilio" ? "A domicilio" : "Recoger"}
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
