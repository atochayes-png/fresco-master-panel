import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";

import { listarNegocios } from "@/lib/negocios.functions";
import { calcularEstatus } from "@/lib/dominio";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/resumen")({
  head: () => ({
    meta: [
      { title: "Resumen — Tomar el Fresco en Yucatán" },
      { name: "description", content: "Indicadores de negocios de Tomar el Fresco en Yucatán." },
    ],
  }),
  component: Resumen,
});

function Resumen() {
  const listar = useServerFn(listarNegocios);
  const { data, isLoading } = useQuery({ queryKey: ["negocios"], queryFn: () => listar() });

  const negocios = data ?? [];
  const estados = negocios.map((n) => calcularEstatus(n));
  const activos = estados.filter((e) => e === "activo" || e === "por_vencer").length;
  const prueba = negocios.filter(
    (n) => n.plan_tipo === "prueba_gratis" && calcularEstatus(n) !== "vencido",
  ).length;
  const porVencer = estados.filter((e) => e === "por_vencer").length;
  const vencidos = estados.filter((e) => e === "vencido").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-sm text-muted-foreground">Cómo van tus negocios hoy</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Indicador titulo="Negocios activos" valor={activos} cargando={isLoading} />
        <Indicador titulo="Prueba gratis" valor={prueba} cargando={isLoading} />
        <Indicador titulo="Por vencer" valor={porVencer} cargando={isLoading} acento />
        <Indicador titulo="Vencidos" valor={vencidos} cargando={isLoading} />
      </div>

      <Button asChild className="h-16 w-full text-base font-semibold">
        <Link to="/negocios/nuevo">
          <Plus className="size-6" /> CREAR NEGOCIO
        </Link>
      </Button>
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  cargando,
  acento,
}: {
  titulo: string;
  valor: number;
  cargando: boolean;
  acento?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className={`mt-1 text-3xl font-bold ${acento ? "text-primary" : ""}`}>
        {cargando ? "—" : valor}
      </p>
    </div>
  );
}
