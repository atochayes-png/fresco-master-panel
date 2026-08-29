import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

import { miNegocio } from "@/lib/dueno.functions";
import { guardarConfigComer } from "@/lib/comer.functions";
import { FORMAS_PAGO, TIEMPOS_PREPARACION, TIPOS_COMIDA } from "@/lib/comer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mi-negocio/comer")({
  head: () => ({
    meta: [
      { title: "Mi cocina — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Configura el tipo de comida que ofreces, cómo atiendes, el tiempo de preparación y las formas de pago que aceptas.",
      },
      { property: "og:title", content: "Mi cocina — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Tipo de comida, atención, tiempo de preparación y formas de pago.",
      },
    ],
  }),
  component: ConfigComer,
});

function ConfigComer() {
  const qc = useQueryClient();
  const cargar = useServerFn(miNegocio);
  const guardar = useServerFn(guardarConfigComer);
  const { data, isLoading } = useQuery({ queryKey: ["mi-negocio"], queryFn: () => cargar() });

  const [comidas, setComidas] = useState<string[]>([]);
  const [local, setLocal] = useState(false);
  const [recoger, setRecoger] = useState(false);
  const [domicilio, setDomicilio] = useState(false);
  const [tiempo, setTiempo] = useState<string>("");
  const [pagos, setPagos] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!data) return;
    setComidas(data.perfil.comida_tipos ?? []);
    setLocal(data.perfil.atiende_local === true);
    setRecoger(data.perfil.atiende_recoger === true);
    setDomicilio(data.perfil.domicilio === true);
    setTiempo(data.perfil.tiempo_preparacion ?? "");
    setPagos(data.perfil.formas_pago ?? []);
  }, [data]);

  function alternar(lista: string[], clave: string, set: (v: string[]) => void) {
    set(lista.includes(clave) ? lista.filter((x) => x !== clave) : [...lista, clave]);
    setListo(false);
  }

  async function guardarTodo() {
    setOcupado(true);
    try {
      await guardar({
        data: {
          comida_tipos: comidas,
          atiende_local: local,
          atiende_recoger: recoger,
          domicilio,
          tiempo_preparacion: tiempo || null,
          formas_pago: pagos,
        },
      });
      await qc.invalidateQueries({ queryKey: ["mi-negocio"] });
      setListo(true);
    } finally {
      setOcupado(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <Button asChild variant="ghost" size="sm">
        <Link to="/mi-negocio">
          <ArrowLeft className="size-4" /> Mi negocio
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mi cocina</h1>
        <p className="text-sm text-muted-foreground">
          Configúralo una sola vez. Así tus clientes saben qué ofreces y cómo pedirte.
        </p>
      </div>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold">¿QUÉ TIPO DE COMIDA OFRECES?</h2>
        <p className="text-sm text-muted-foreground">Puedes elegir varias.</p>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_COMIDA.map((t) => {
            const activo = comidas.includes(t.clave);
            return (
              <button
                key={t.clave}
                onClick={() => alternar(comidas, t.clave, setComidas)}
                className={`flex min-h-14 items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-semibold ${
                  activo
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <span className="leading-tight">{t.nombre}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold">¿CÓMO ATIENDES A TUS CLIENTES?</h2>
        <Casilla
          texto="Comer en el establecimiento"
          valor={local}
          onCambio={(v) => {
            setLocal(v);
            setListo(false);
          }}
        />
        <Casilla
          texto="Pedidos para recoger"
          valor={recoger}
          onCambio={(v) => {
            setRecoger(v);
            setListo(false);
          }}
        />
        <Casilla
          texto="Servicio a domicilio"
          valor={domicilio}
          onCambio={(v) => {
            setDomicilio(v);
            setListo(false);
          }}
        />
        <p className="text-xs text-muted-foreground">
          No estás obligado a ofrecer domicilio. Elige sólo lo que realmente haces.
        </p>
      </section>

      {recoger || domicilio ? (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-bold">TIEMPO HABITUAL DE PREPARACIÓN</h2>
          <div className="grid grid-cols-2 gap-2">
            {TIEMPOS_PREPARACION.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTiempo(t === tiempo ? "" : t);
                  setListo(false);
                }}
                className={`min-h-13 rounded-2xl px-3 py-2 text-sm font-semibold ${
                  tiempo === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Es sólo una referencia. Tú confirmas el tiempo con cada cliente.
          </p>
        </section>
      ) : null}

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold">¿QUÉ FORMAS DE PAGO ACEPTAS?</h2>
        {FORMAS_PAGO.map((f) => (
          <Casilla
            key={f.clave}
            texto={f.nombre}
            valor={pagos.includes(f.clave)}
            onCambio={() => alternar(pagos, f.clave, setPagos)}
          />
        ))}
        <p className="text-xs text-muted-foreground">
          El pago se hace directamente contigo. La aplicación no cobra ni procesa dinero.
        </p>
      </section>

      <Button onClick={guardarTodo} disabled={ocupado} className="h-14 w-full text-base font-bold">
        {ocupado ? (
          <Loader2 className="size-5 animate-spin" />
        ) : listo ? (
          <>
            <Check className="size-5" /> GUARDADO
          </>
        ) : (
          "GUARDAR"
        )}
      </Button>
    </div>
  );
}

function Casilla({
  texto,
  valor,
  onCambio,
}: {
  texto: string;
  valor: boolean;
  onCambio: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3 text-base font-medium">
      <input
        type="checkbox"
        checked={valor}
        onChange={(e) => onCambio(e.target.checked)}
        className="size-6 accent-[var(--color-primary)]"
      />
      {texto}
    </label>
  );
}
