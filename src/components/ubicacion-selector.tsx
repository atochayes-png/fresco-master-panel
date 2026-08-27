import { useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { buscarLugares, type Lugar } from "@/lib/mapas.functions";
import { guardarZona, limpiarZona, pedirUbicacion } from "@/lib/publico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* Tarjeta sencilla para decidir desde dónde buscar.
   Nunca se pide la ubicación sola: siempre la persona decide. */
export function SelectorUbicacion({
  ubicacion,
  zona,
  onCambio,
}: {
  ubicacion: { lat: number; lng: number } | null;
  zona: string;
  onCambio: (ubi: { lat: number; lng: number } | null, nombre: string) => void;
}) {
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [opciones, setOpciones] = useState<Lugar[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function usarGps() {
    setAviso(null);
    setBuscandoGps(true);
    const ubi = await pedirUbicacion();
    setBuscandoGps(false);
    if (!ubi) {
      setAviso("No pudimos usar tu ubicación. Puedes elegir una zona.");
      return;
    }
    limpiarZona();
    onCambio(ubi, "");
  }

  async function buscar() {
    if (texto.trim().length < 3) return;
    setCargando(true);
    setAviso(null);
    try {
      const r = await buscarLugares({ data: { texto } });
      setOpciones(r);
      if (!r.length) setAviso("No encontramos esa zona. Prueba con otro nombre.");
    } catch {
      setAviso("No pudimos buscar esa zona en este momento.");
    } finally {
      setCargando(false);
    }
  }

  function elegir(l: Lugar) {
    guardarZona(l.nombre, { lat: l.latitud, lng: l.longitud });
    onCambio({ lat: l.latitud, lng: l.longitud }, l.nombre);
    setAbierto(false);
    setOpciones(null);
    setTexto("");
  }

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
      {ubicacion ? (
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">{zona || "Buscando cerca de ti"}</span>
          </p>
          <button
            onClick={() => {
              limpiarZona();
              onCambio(null, "");
            }}
            className="shrink-0 rounded-full bg-secondary p-2"
            aria-label="Quitar ubicación"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Usaremos tu ubicación para mostrarte opciones cercanas.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={ubicacion && !zona ? "secondary" : "default"}
          onClick={usarGps}
          disabled={buscandoGps}
          className="h-12 text-sm font-semibold"
        >
          {buscandoGps ? <Loader2 className="size-5 animate-spin" /> : (
            <>
              <MapPin className="size-4" /> USAR MI UBICACIÓN
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setAbierto((v) => !v)}
          className="h-12 text-sm font-semibold"
        >
          ELEGIR ZONA
        </Button>
      </div>

      {abierto ? (
        <div className="space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void buscar();
            }}
            className="flex gap-2"
          >
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Centro de Mérida, Progreso, Altabrisa…"
              className="h-12 text-base"
            />
            <Button type="submit" className="h-12 px-4" aria-label="Buscar zona" disabled={cargando}>
              {cargando ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
            </Button>
          </form>
          {opciones?.length ? (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {opciones.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => elegir(l)}
                    className="w-full px-3 py-3 text-left text-sm hover:bg-secondary"
                  >
                    <span className="font-semibold">{l.nombre}</span>
                    <span className="block text-xs text-muted-foreground">{l.direccion}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {aviso ? <p className="text-xs text-muted-foreground">{aviso}</p> : null}
    </div>
  );
}
