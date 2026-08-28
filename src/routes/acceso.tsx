import { createFileRoute } from "@tanstack/react-router";

import { FormularioAcceso } from "@/components/acceso-form";

export const Route = createFileRoute("/acceso")({
  head: () => ({
    meta: [
      { title: "Entrar — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Acceso al panel de administración de Tomar el Fresco en Yucatán.",
      },
      { property: "og:title", content: "Entrar — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Acceso al panel de administración de Tomar el Fresco en Yucatán.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <FormularioAcceso subtitulo="Acceso" />,
});
