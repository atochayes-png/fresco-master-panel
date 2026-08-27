import { useState } from "react";
import { Loader2 } from "lucide-react";

import { identificarse } from "@/lib/publico.functions";
import { guardarTelefono } from "@/lib/publico";
import { validarCelular } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Identificacion({
  titulo,
  onListo,
  onCancelar,
}: {
  titulo: string;
  onListo: (telefono: string) => void;
  onCancelar: () => void;
}) {
  const [telefono, setTelefono] = useState("");
  const [promos, setPromos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function continuar() {
    const problema = validarCelular(telefono);
    if (problema) {
      setError(problema);
      return;
    }
    setCargando(true);
    try {
      const r = await identificarse({
        data: { telefono, acepta_promociones: promos },
      });
      guardarTelefono(r.telefono);
      onListo(r.telefono);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos continuar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-sm space-y-4 rounded-t-3xl border border-border bg-card p-6 shadow-lg sm:rounded-3xl">
        <div>
          <h2 className="text-xl font-bold">{titulo}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Continúa con tu número de celular.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tel" className="text-base">
            Número de celular
          </Label>
          <Input
            id="tel"
            inputMode="numeric"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="9991234567"
            className="h-13 text-base"
          />
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={promos}
            onChange={(e) => setPromos(e.target.checked)}
            className="mt-1 size-5 accent-[var(--color-primary)]"
          />
          <span>
            Quiero recibir recomendaciones, promociones y novedades de Tomar el Fresco en Yucatán.
          </span>
        </label>

        <p className="text-xs text-muted-foreground">
          Tu número se guarda en este dispositivo para no volver a pedírtelo. Todavía no enviamos
          códigos de verificación por SMS.
        </p>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

        <div className="space-y-2">
          <Button
            onClick={continuar}
            disabled={cargando}
            className="h-14 w-full text-base font-semibold"
          >
            {cargando ? <Loader2 className="size-5 animate-spin" /> : "CONTINUAR"}
          </Button>
          <Button variant="ghost" onClick={onCancelar} className="h-12 w-full">
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  );
}
