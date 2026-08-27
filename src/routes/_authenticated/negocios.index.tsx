import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { listarNegocios } from "@/lib/negocios.functions";
import { calcularEstatus, formatoFecha, type EstatusCalculado } from "@/lib/dominio";
import { EstatusBadge } from "@/components/estatus-negocio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FILTROS = [
  { id: "todos", texto: "Todos" },
  { id: "activo", texto: "Activos" },
  { id: "prueba", texto: "Prueba gratis" },
  { id: "por_vencer", texto: "Por vencer" },
  { id: "vencido", texto: "Vencidos" },
] as const;

export const Route = createFileRoute("/_authenticated/negocios/")({
  head: () => ({
    meta: [
      { title: "Negocios — Tomar el Fresco en Yucatán" },
      { name: "description", content: "Listado de negocios registrados en Tomar el Fresco." },
    ],
  }),
  component: Negocios,
});

function Negocios() {
  const listar = useServerFn(listarNegocios);
  const { data, isLoading } = useQuery({ queryKey: ["negocios"], queryFn: () => listar() });
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");

  const lista = (data ?? []).filter((n) => {
    const t = busqueda.trim().toLowerCase();
    const coincide =
      !t ||
      n.nombre_negocio.toLowerCase().includes(t) ||
      n.nombre_dueno.toLowerCase().includes(t) ||
      n.usuario.toLowerCase().includes(t);
    if (!coincide) return false;
    const e: EstatusCalculado = calcularEstatus(n);
    if (filtro === "todos") return true;
    if (filtro === "prueba") return n.plan_tipo === "prueba_gratis" && e !== "vencido";
    if (filtro === "activo") return e === "activo" || e === "por_vencer";
    return e === filtro;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Negocios</h1>
        <Button asChild className="h-11">
          <Link to="/negocios/nuevo">
            <Plus className="size-5" /> Crear
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar negocio o dueño"
          className="h-12 pl-11 text-base"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
              filtro === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay negocios aquí.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {lista.map((n) => (
              <Link
                key={n.id}
                to="/negocios/$id"
                params={{ id: n.id }}
                className="block rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{n.nombre_negocio}</p>
                    <p className="text-sm text-muted-foreground">{n.nombre_dueno}</p>
                  </div>
                  <EstatusBadge estatus={calcularEstatus(n)} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {n.tipo} · {n.municipio}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vence: {formatoFecha(n.fecha_fin)}
                </p>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Negocio</th>
                  <th className="p-3 font-medium">Dueño</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Municipio</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium">Inicio</th>
                  <th className="p-3 font-medium">Vence</th>
                  <th className="p-3 font-medium">Estatus</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {lista.map((n) => (
                  <tr key={n.id} className="border-t border-border">
                    <td className="p-3 font-medium">{n.nombre_negocio}</td>
                    <td className="p-3">{n.nombre_dueno}</td>
                    <td className="p-3">{n.tipo}</td>
                    <td className="p-3">{n.municipio}</td>
                    <td className="p-3">
                      {n.plan_tipo === "prueba_gratis" ? "Prueba gratis" : n.plan_tipo}
                    </td>
                    <td className="p-3">{formatoFecha(n.fecha_inicio)}</td>
                    <td className="p-3">{formatoFecha(n.fecha_fin)}</td>
                    <td className="p-3">
                      <EstatusBadge estatus={calcularEstatus(n)} />
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to="/negocios/$id"
                        params={{ id: n.id }}
                        className="font-medium text-primary"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
