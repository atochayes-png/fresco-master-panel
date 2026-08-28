import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import logoAsset from "@/assets/logo-tomar-el-fresco.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { usuarioAEmail } from "@/lib/dominio";
import { asegurarMaster } from "@/lib/negocios.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* Formulario de acceso compartido por las rutas de Dueño y Master.
   Usa la misma autenticación (usuario + contraseña) que ya existía. */
export function FormularioAcceso({ subtitulo }: { subtitulo: string }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void asegurarMaster();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/resumen", replace: true });
    });
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: usuarioAEmail(usuario),
      password: contrasena,
    });
    setCargando(false);
    if (err) {
      setError("Usuario o contraseña incorrectos");
      return;
    }
    void navigate({ to: "/resumen", replace: true });
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex size-28 items-center justify-center rounded-3xl bg-marca-negro p-3 shadow-sm">
            <img
              src={logoAsset.url}
              alt="Tomar el Fresco en Yucatán"
              width={112}
              height={112}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Tomar el Fresco</h1>
          <p className="text-sm text-muted-foreground">{subtitulo}</p>
        </div>

        <form
          onSubmit={enviar}
          className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-base">
              Usuario
            </Label>
            <Input
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              className="h-13 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contrasena" className="text-base">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="contrasena"
                type={ver ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
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
          </div>

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <Button type="submit" disabled={cargando} className="h-14 w-full text-base font-semibold">
            {cargando ? <Loader2 className="size-5 animate-spin" /> : "INICIAR SESIÓN"}
          </Button>
        </form>
      </div>
    </main>
  );
}
