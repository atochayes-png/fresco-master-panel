import { createFileRoute } from "@tanstack/react-router";

import { FormularioAcceso } from "@/components/acceso-form";

export const Route = createFileRoute("/negocio/login")({
  head: () => ({
    meta: [
      { title: "Acceso para negocios — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Entra con tu usuario y contraseña para administrar tu negocio en Yucatán.",
      },
      { property: "og:title", content: "Acceso para negocios — Tomar el Fresco" },
      {
        property: "og:description",
        content: "Panel para dueños de negocios de Tomar el Fresco en Yucatán.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <FormularioAcceso subtitulo="Acceso para negocios" />,
});
