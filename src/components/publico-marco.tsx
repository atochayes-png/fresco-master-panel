import { Link } from "@tanstack/react-router";
import { Heart, Search, Home } from "lucide-react";

import logoAsset from "@/assets/logo-tomar-el-fresco.png.asset.json";

export function MarcoPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-marca-negro p-1">
              <img
                src={logoAsset.url}
                alt="Tomar el Fresco en Yucatán"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="font-display text-base font-bold leading-tight">
              Tomar el Fresco
              <span className="block text-xs font-medium text-muted-foreground">en Yucatán</span>
            </span>
          </Link>
          <Link
            to="/acceso"
            className="rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            Soy un negocio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
        <div className="mx-auto grid max-w-3xl grid-cols-3">
          <Pestana to="/" texto="Inicio" icono={<Home className="size-5" />} />
          <Pestana to="/buscar" texto="Buscar" icono={<Search className="size-5" />} />
          <Pestana to="/guardados" texto="Guardados" icono={<Heart className="size-5" />} />
        </div>
      </nav>
    </div>
  );
}

function Pestana({ to, texto, icono }: { to: string; texto: string; icono: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground"
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "text-primary" }}
    >
      {icono}
      {texto}
    </Link>
  );
}
