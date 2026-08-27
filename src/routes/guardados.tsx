import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";

import { MarcoPublico } from "@/components/publico-marco";
import { Identificacion } from "@/components/identificacion";
import { TarjetaNegocioVista } from "@/components/tarjeta-negocio";
import { buscarNegocios, misGuardados, type TarjetaNegocio } from "@/lib/publico.functions";
import { telefonoGuardado, ubicacionGuardada } from "@/lib/publico";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guardados")({
  head: () => ({
    meta: [
      { title: "Mis lugares guardados — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content:
          "Consulta los negocios y experiencias de Yucatán que guardaste para visitar después.",
      },
      { property: "og:title", content: "Mis lugares guardados — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Tus negocios favoritos de Yucatán, siempre a la mano.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guardados,
});

function Guardados() {
  const [telefono, setTelefono] = useState<string | null>(null);
  const [lista, setLista] = useState<TarjetaNegocio[] | null>(null);
  const [pedir, setPedir] = useState(false);
  const ubicacion = typeof window === "undefined" ? null : ubicacionGuardada();

  useEffect(() => {
    setTelefono(telefonoGuardado());
  }, []);

  useEffect(() => {
    if (!telefono) return;
    let vivo = true;
    void (async () => {
      const ids = await misGuardados({ data: { telefono } });
      const todos = await buscarNegocios({ data: { texto: "" } });
      if (vivo) setLista(todos.filter((n) => ids.includes(n.id)));
    })();
    return () => {
      vivo = false;
    };
  }, [telefono]);

  if (!telefono) {
    return (
      <MarcoPublico>
        <div className="space-y-4 py-20 text-center">
          <Heart className="mx-auto size-10 text-primary" />
          <h1 className="text-xl font-bold">Tus lugares guardados</h1>
          <p className="text-sm text-muted-foreground">
            Identifícate con tu celular para ver los negocios que guardaste.
          </p>
          <Button onClick={() => setPedir(true)} className="h-14 w-full text-base font-semibold">
            CONTINUAR
          </Button>
        </div>
        {pedir ? (
          <Identificacion
            titulo="Tus lugares guardados"
            onListo={(tel) => {
              setPedir(false);
              setTelefono(tel);
            }}
            onCancelar={() => setPedir(false)}
          />
        ) : null}
      </MarcoPublico>
    );
  }

  return (
    <MarcoPublico>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Mis lugares guardados</h1>
        {lista === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : lista.length === 0 ? (
          <div className="space-y-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">Todavía no has guardado ningún lugar.</p>
            <Button asChild variant="secondary">
              <Link to="/buscar" search={{ q: "", categoria: "", municipio: "" }}>
                Explorar Yucatán
              </Link>
            </Button>
          </div>
        ) : (
          lista.map((n) => <TarjetaNegocioVista key={n.id} negocio={n} ubicacion={ubicacion} />)
        )}
      </div>
    </MarcoPublico>
  );
}
