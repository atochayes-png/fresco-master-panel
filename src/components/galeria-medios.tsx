import { useState } from "react";
import { Play, X } from "lucide-react";

import type { MedioPublico } from "@/lib/publico.functions";
import { posterVideo, urlImagen, urlVideo } from "@/lib/cloudinary";

/**
 * Galería integrada de fotos y videos: se desliza horizontalmente en móvil,
 * carga perezosa y los videos sólo se reproducen cuando el usuario los toca.
 */
export function GaleriaMedios({ medios, nombre }: { medios: MedioPublico[]; nombre: string }) {
  const [abierto, setAbierto] = useState<MedioPublico | null>(null);
  if (!medios.length) return null;

  const destacado = medios.find((m) => m.tipo === "video" && m.destacado);
  const lista = destacado ? [destacado, ...medios.filter((m) => m.id !== destacado.id)] : medios;

  return (
    <>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {lista.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setAbierto(m)}
            className="relative h-32 w-48 shrink-0 overflow-hidden rounded-2xl bg-secondary"
          >
            <img
              src={
                m.tipo === "video"
                  ? posterVideo(m.url, "tarjeta")
                  : urlImagen(m.url, "tarjeta")
              }
              alt={`${m.tipo === "video" ? "Video" : "Foto"} de ${nombre}`}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
            {m.tipo === "video" ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="size-5 fill-current" />
                </span>
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {abierto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAbierto(null)}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"
            onClick={() => setAbierto(null)}
          >
            <X className="size-5" />
          </button>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {abierto.tipo === "video" ? (
              <video
                src={urlVideo(abierto.url)}
                poster={posterVideo(abierto.url, "ficha")}
                controls
                autoPlay
                playsInline
                preload="none"
                className="max-h-[80vh] w-full rounded-2xl bg-black"
              />
            ) : (
              <img
                src={urlImagen(abierto.url, "visor")}
                alt={`Foto de ${nombre}`}
                className="max-h-[80vh] w-full rounded-2xl object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
