import { createFileRoute } from "@tanstack/react-router";

import { FormularioAcceso } from "@/components/acceso-form";

export const Route = createFileRoute("/master/login")({
  head: () => ({
    meta: [
      { title: "Acceso administrativo — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Acceso al panel administrativo de Tomar el Fresco en Yucatán.",
      },
      { property: "og:title", content: "Acceso administrativo — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Panel administrativo de Tomar el Fresco en Yucatán.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <FormularioAcceso subtitulo="Acceso administrativo" />,
});
