import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";

import { crearNegocio, usuarioDisponible, type NegocioRow } from "@/lib/negocios.functions";
import {
  MUNICIPIOS_YUCATAN,
  TIPOS_NEGOCIO,
  formatoFecha,
  validarCelular,
  validarContrasena,
  validarUsuario,
} from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/negocios/nuevo")({
  head: () => ({
    meta: [
      { title: "Crear negocio — Tomar el Fresco en Yucatán" },
      { name: "description", content: "Alta rápida de un negocio con su primer mes gratis." },
    ],
  }),
  component: NuevoNegocio,
});

const hoy = new Date();
const vence = new Date(hoy.getTime() + 30 * 86400000);
const iso = (d: Date) => d.toISOString().slice(0, 10);

function NuevoNegocio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const crear = useServerFn(crearNegocio);
  const revisar = useServerFn(usuarioDisponible);

  const [f, setF] = useState({
    nombre_dueno: "",
    celular: "",
    nombre_negocio: "",
    tipo: "",
    municipio: "",
    usuario: "",
    contrasena: "",
  });
  const [ver, setVer] = useState(false);
  const [usuarioAviso, setUsuarioAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<NegocioRow | null>(null);
  const [copiado, setCopiado] = useState(false);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mutacion = useMutation({
    mutationFn: () => crear({ data: f }),
    onSuccess: (negocio) => {
      void queryClient.invalidateQueries({ queryKey: ["negocios"] });
      setCreado(negocio);
    },
    onError: (e: Error) => setError(e.message),
  });

  async function revisarUsuario() {
    const err = validarUsuario(f.usuario);
    if (err) {
      setUsuarioAviso(err);
      return;
    }
    const { disponible } = await revisar({ data: { usuario: f.usuario } });
    setUsuarioAviso(disponible ? null : "Ese usuario ya existe");
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err =
      (f.nombre_dueno.trim() ? null : "Escribe el nombre del dueño") ??
      validarCelular(f.celular) ??
      (f.nombre_negocio.trim() ? null : "Escribe el nombre del negocio") ??
      (f.tipo ? null : "Elige el tipo de negocio") ??
      (f.municipio ? null : "Elige el municipio") ??
      validarUsuario(f.usuario) ??
      validarContrasena(f.contrasena);
    if (err) {
      setError(err);
      return;
    }
    mutacion.mutate();
  }

  if (creado) {
    const texto = `Negocio: ${creado.nombre_negocio}\nUsuario: ${creado.usuario}\nContraseña: ${f.contrasena}\nGratis hasta: ${formatoFecha(creado.fecha_fin)}`;
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-exito/12 p-4 text-center">
          <Check className="mx-auto size-8 text-exito" />
          <p className="mt-2 text-lg font-semibold text-exito">Negocio creado correctamente</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Dato titulo="Negocio" valor={creado.nombre_negocio} />
          <Dato titulo="Usuario" valor={creado.usuario} />
          <Dato titulo="Contraseña temporal" valor={f.contrasena} />
          <Dato titulo="Vigencia gratuita hasta" valor={formatoFecha(creado.fecha_fin)} />
        </div>

        <div className="grid gap-3">
          <Button
            className="h-14 text-base font-semibold"
            onClick={() => {
              void navigator.clipboard.writeText(texto);
              setCopiado(true);
            }}
          >
            <Copy className="size-5" /> {copiado ? "DATOS COPIADOS" : "COPIAR DATOS"}
          </Button>
          <Button
            variant="outline"
            className="h-14 text-base font-semibold"
            onClick={() => void navigate({ to: "/negocios" })}
          >
            VOLVER A NEGOCIOS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/negocios" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Negocios
      </Link>
      <h1 className="text-2xl font-bold">Crear negocio</h1>

      <form onSubmit={enviar} className="space-y-5">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Campo id="dueno" etiqueta="Nombre del dueño">
            <Input
              id="dueno"
              value={f.nombre_dueno}
              onChange={(e) => set("nombre_dueno")(e.target.value)}
              className="h-13 text-base"
            />
          </Campo>

          <Campo id="celular" etiqueta="Celular / WhatsApp">
            <Input
              id="celular"
              inputMode="tel"
              value={f.celular}
              onChange={(e) => set("celular")(e.target.value.replace(/[^\d\s+-]/g, ""))}
              placeholder="9991234567"
              className="h-13 text-base"
            />
          </Campo>

          <Campo id="negocio" etiqueta="Nombre del negocio">
            <Input
              id="negocio"
              value={f.nombre_negocio}
              onChange={(e) => set("nombre_negocio")(e.target.value)}
              className="h-13 text-base"
            />
          </Campo>

          <Campo id="tipo" etiqueta="Tipo de negocio">
            <select
              id="tipo"
              value={f.tipo}
              onChange={(e) => set("tipo")(e.target.value)}
              className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
            >
              <option value="">Elegir…</option>
              {TIPOS_NEGOCIO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="municipio" etiqueta="Municipio">
            <select
              id="municipio"
              value={f.municipio}
              onChange={(e) => set("municipio")(e.target.value)}
              className="h-13 w-full rounded-xl border border-input bg-background px-3 text-base"
            >
              <option value="">Elegir…</option>
              {MUNICIPIOS_YUCATAN.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Campo id="usuario" etiqueta="Usuario">
            <Input
              id="usuario"
              value={f.usuario}
              autoCapitalize="none"
              onChange={(e) => set("usuario")(e.target.value.replace(/\s/g, ""))}
              onBlur={() => void revisarUsuario()}
              className="h-13 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres, una mayúscula y un número. Ejemplo: Carlos1
            </p>
            {usuarioAviso ? (
              <p className="text-sm font-medium text-destructive">{usuarioAviso}</p>
            ) : null}
          </Campo>

          <Campo id="contrasena" etiqueta="Contraseña">
            <div className="relative">
              <Input
                id="contrasena"
                type={ver ? "text" : "password"}
                value={f.contrasena}
                onChange={(e) => set("contrasena")(e.target.value)}
                className="h-13 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setVer((v) => !v)}
                aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground"
              >
                {ver ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres, una mayúscula y un número.
            </p>
          </Campo>
        </div>

        <div className="rounded-2xl border border-primary/25 bg-accent/50 p-5">
          <p className="font-semibold text-accent-foreground">Primer mes gratis</p>
          <p className="mt-1 text-sm">Inicio: {formatoFecha(iso(hoy))}</p>
          <p className="text-sm">Vence: {formatoFecha(iso(vence))}</p>
        </div>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

        <Button
          type="submit"
          disabled={mutacion.isPending}
          className="h-16 w-full text-base font-semibold"
        >
          {mutacion.isPending ? <Loader2 className="size-5 animate-spin" /> : "CREAR NEGOCIO"}
        </Button>
      </form>
    </div>
  );
}

function Campo({
  id,
  etiqueta,
  children,
}: {
  id: string;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {etiqueta}
      </Label>
      {children}
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
