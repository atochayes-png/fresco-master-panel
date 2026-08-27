import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Store, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });
    return { user: data.user };
  },
  component: Marco,
});

function Marco() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function salir() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
            <span className="font-display text-base font-bold">Tomar el Fresco</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <EnlaceMenu to="/resumen" texto="Resumen" />
            <EnlaceMenu to="/negocios" texto="Negocios" />
          </nav>
          <button
            onClick={salir}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card md:hidden">
        <div className="grid grid-cols-2">
          <EnlaceMovil to="/resumen" texto="Resumen" icono={<LayoutGrid className="size-5" />} />
          <EnlaceMovil to="/negocios" texto="Negocios" icono={<Store className="size-5" />} />
        </div>
      </nav>
    </div>
  );
}

function EnlaceMenu({ to, texto }: { to: string; texto: string }) {
  return (
    <Link
      to={to}
      className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
      activeProps={{ className: "bg-accent text-accent-foreground" }}
    >
      {texto}
    </Link>
  );
}

function EnlaceMovil({ to, texto, icono }: { to: string; texto: string; icono: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground"
      activeProps={{ className: "text-primary" }}
    >
      {icono}
      {texto}
    </Link>
  );
}
