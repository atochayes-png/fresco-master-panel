import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { actualizarNegocio, cambiarEstatus, obtenerNegocio } from "@/lib/negocios.functions";
import { pedidosDeNegocio } from "@/lib/productos.functions";
import { reservacionesDeNegocio } from "@/lib/conocer.functions";
import { esConocer } from "@/lib/conocer";
import { mediosDeNegocio } from "@/lib/medios.functions";
import { posterVideo, urlImagen } from "@/lib/cloudinary";
import {
  MUNICIPIOS_YUCATAN,
  TIPOS_NEGOCIO,
  calcularEstatus,
  diasRestantes,
  formatoFecha,
} from "@/lib/dominio";
import { EstatusBadge } from "@/components/estatus-negocio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/negocios/$id")({
  head: () => ({
    meta: [
      { title: "Ficha del negocio — Tomar el Fresco en Yucatán" },
      { name: "description", content: "Datos, plan y estatus de un negocio registrado." },
    ],
  }),
  component: Ficha,
});

function Ficha() {
  const { id } = useParams({ from: "/_authenticated/negocios/$id" });
  const queryClient = useQueryClient();
  const obtener = useServerFn(obtenerNegocio);
  const actualizar = useServerFn(actualizarNegocio);
  const estatusFn = useServerFn(cambiarEstatus);

  const { data: negocio, isLoading } = useQuery({
    queryKey: ["negocio", id],
    queryFn: () => obtener({ data: { id } }),
  });

  const metricas = useServerFn(pedidosDeNegocio);
  const { data: pedidos } = useQuery({
    queryKey: ["pedidos-negocio", id],
    queryFn: () => metricas({ data: { negocio_id: id } }),
  });

  const cargarReservas = useServerFn(reservacionesDeNegocio);
  const { data: reservas } = useQuery({
    queryKey: ["reservaciones-negocio", id],
    queryFn: () => cargarReservas({ data: { negocio_id: id } }),
  });

  const cargarMedios = useServerFn(mediosDeNegocio);
  const { data: medios } = useQuery({
    queryKey: ["medios-negocio", id],
    queryFn: () => cargarMedios({ data: { negocio_id: id } }),
  });

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre_dueno: "",
    celular: "",
    nombre_negocio: "",
    tipo: "",
    municipio: "",
  });

  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: ["negocio", id] });
    void queryClient.invalidateQueries({ queryKey: ["negocios"] });
  };

  const guardar = useMutation({
    mutationFn: () => actualizar({ data: { id, ...form } }),
    onSuccess: () => {
      refrescar();
      setEditando(false);
    },
  });

  const cambiar = useMutation({
    mutationFn: (estatus: "activo" | "suspendido") => estatusFn({ data: { id, estatus } }),
    onSuccess: refrescar,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!negocio) return <p className="text-sm text-muted-foreground">Negocio no encontrado.</p>;

  return (
    <div className="space-y-5">
      <Link to="/negocios" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Negocios
      </Link>

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{negocio.nombre_negocio}</h1>
        <EstatusBadge estatus={calcularEstatus(negocio)} />
      </div>

      {editando ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            guardar.mutate();
          }}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="e-dueno">Nombre del dueño</Label>
            <Input
              id="e-dueno"
              value={form.nombre_dueno}
              onChange={(e) => setForm({ ...form, nombre_dueno: e.target.value })}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-celular">Celular / WhatsApp</Label>
            <Input
              id="e-celular"
              inputMode="tel"
              value={form.celular}
              onChange={(e) =>
                setForm({ ...form, celular: e.target.value.replace(/[^\d\s+-]/g, "") })
              }
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-negocio">Nombre del negocio</Label>
            <Input
              id="e-negocio"
              value={form.nombre_negocio}
              onChange={(e) => setForm({ ...form, nombre_negocio: e.target.value })}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-tipo">Tipo de negocio</Label>
            <select
              id="e-tipo"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
            >
              {TIPOS_NEGOCIO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-municipio">Municipio</Label>
            <select
              id="e-municipio"
              value={form.municipio}
              onChange={(e) => setForm({ ...form, municipio: e.target.value })}
              className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
            >
              {MUNICIPIOS_YUCATAN.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={guardar.isPending} className="h-13 flex-1">
              {guardar.isPending ? <Loader2 className="size-5 animate-spin" /> : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-13 flex-1"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Datos del negocio</h2>
            <Dato titulo="Nombre del dueño" valor={negocio.nombre_dueno} />
            <Dato titulo="Celular" valor={negocio.celular} />
            <Dato titulo="Nombre del negocio" valor={negocio.nombre_negocio} />
            <Dato titulo="Tipo" valor={negocio.tipo} />
            <Dato titulo="Municipio" valor={negocio.municipio} />
            <Dato titulo="Usuario" valor={negocio.usuario} />
            <Dato
              titulo="Plan"
              valor={negocio.plan_tipo === "prueba_gratis" ? "Prueba gratis" : negocio.plan_tipo}
            />
            <Dato titulo="Fecha inicio" valor={formatoFecha(negocio.fecha_inicio)} />
            <Dato titulo="Fecha fin" valor={formatoFecha(negocio.fecha_fin)} />
            <Dato
              titulo="Días restantes"
              valor={`${Math.max(diasRestantes(negocio.fecha_fin), 0)} días`}
            />
            <Dato
              titulo="Estado de configuración"
              valor={
                negocio.estado_configuracion === "perfil_incompleto"
                  ? "Perfil incompleto"
                  : "Perfil completo"
              }
            />
          </div>

          {esConocer(negocio.tipo) ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold">Solicitudes de reservación</h2>
              <Dato titulo="Este mes" valor={String(reservas?.mes ?? 0)} />
              <Dato titulo="Total histórico" valor={String(reservas?.total ?? 0)} />
            </div>
          ) : null}

          {esHospedaje(negocio.tipo) ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold">Solicitudes de hospedaje</h2>
              <Dato titulo="Este mes" valor={String(hospedaje?.mes ?? 0)} />
              <Dato titulo="Total histórico" valor={String(hospedaje?.total ?? 0)} />
            </div>
          ) : null}


          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Pedidos generados</h2>
            <Dato titulo="Este mes" valor={String(pedidos?.mes ?? 0)} />
            <Dato titulo="Total histórico" valor={String(pedidos?.total ?? 0)} />
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Fotos y videos</h2>
            <Dato
              titulo="Fotos"
              valor={String(medios?.filter((m) => m.tipo === "image").length ?? 0)}
            />
            <Dato
              titulo="Videos"
              valor={String(medios?.filter((m) => m.tipo === "video").length ?? 0)}
            />
            {medios?.length ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {medios.map((m) => (
                  <img
                    key={m.id}
                    src={
                      m.tipo === "video"
                        ? posterVideo(m.secure_url, "miniatura")
                        : urlImagen(m.secure_url, "miniatura")
                    }
                    alt={m.tipo === "video" ? "Video del negocio" : "Foto del negocio"}
                    loading="lazy"
                    className="size-20 shrink-0 rounded-xl object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <Button
              variant="outline"
              className="h-14 text-base font-semibold"
              onClick={() => {
                setForm({
                  nombre_dueno: negocio.nombre_dueno,
                  celular: negocio.celular,
                  nombre_negocio: negocio.nombre_negocio,
                  tipo: negocio.tipo,
                  municipio: negocio.municipio,
                });
                setEditando(true);
              }}
            >
              Editar datos
            </Button>
            {negocio.estatus === "activo" ? (
              <Button
                variant="outline"
                disabled={cambiar.isPending}
                className="h-14 border-destructive/40 text-base font-semibold text-destructive"
                onClick={() => cambiar.mutate("suspendido")}
              >
                Suspender negocio
              </Button>
            ) : (
              <Button
                disabled={cambiar.isPending}
                className="h-14 text-base font-semibold"
                onClick={() => cambiar.mutate("activo")}
              >
                Reactivar negocio
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{titulo}</span>
      <span className="text-right font-medium">{valor}</span>
    </div>
  );
}
