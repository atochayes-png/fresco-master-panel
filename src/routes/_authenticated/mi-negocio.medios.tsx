import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Image as ImageIcon,
  Loader2,
  Play,
  Plus,
  Star,
  Trash2,
  Video,
} from "lucide-react";

import {
  eliminarMedio,
  marcarDestacado,
  marcarPortada,
  misMedios,
  ordenarMedios,
  registrarMedio,
  type MedioRow,
} from "@/lib/medios.functions";
import {
  ACEPTA_FOTO,
  ACEPTA_VIDEO,
  DURACION_MAXIMA,
  LIMITE_FOTOS,
  LIMITE_VIDEOS,
  formatoValido,
  posterVideo,
  subirMedio,
  urlImagen,
  urlVideo,
  type TipoMedio,
} from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mi-negocio/medios")({
  head: () => ({
    meta: [
      { title: "Fotos y videos — Tomar el Fresco en Yucatán" },
      {
        name: "description",
        content: "Agrega fotos y videos de tu negocio, elige tu portada y ordena tu galería.",
      },
      { property: "og:title", content: "Fotos y videos — Tomar el Fresco en Yucatán" },
      {
        property: "og:description",
        content: "Muestra tu negocio con fotos y videos de calidad profesional.",
      },
    ],
  }),
  component: Medios,
});

function Medios() {
  const qc = useQueryClient();
  const cargar = useServerFn(misMedios);
  const registrar = useServerFn(registrarMedio);
  const portada = useServerFn(marcarPortada);
  const destacar = useServerFn(marcarDestacado);
  const ordenar = useServerFn(ordenarMedios);
  const eliminar = useServerFn(eliminarMedio);

  const { data, isLoading } = useQuery({ queryKey: ["mis-medios"], queryFn: () => cargar() });

  const [eligiendo, setEligiendo] = useState(false);
  const [tipo, setTipo] = useState<TipoMedio | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<MedioRow | null>(null);
  const [verVideo, setVerVideo] = useState<MedioRow | null>(null);

  const entradaCamara = useRef<HTMLInputElement>(null);
  const entradaArchivo = useRef<HTMLInputElement>(null);

  const medios = data?.medios ?? [];
  const fotos = medios.filter((m) => m.tipo === "image");
  const videos = medios.filter((m) => m.tipo === "video");

  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ["mis-medios"] });
    void qc.invalidateQueries({ queryKey: ["mi-negocio"] });
  };

  const limpiar = () => {
    if (vista) URL.revokeObjectURL(vista);
    setArchivo(null);
    setVista(null);
    setTipo(null);
    setEligiendo(false);
  };

  const elegirTipo = (t: TipoMedio) => {
    setError(null);
    if (t === "image" && fotos.length >= LIMITE_FOTOS) {
      setError("Has alcanzado el límite de fotos.");
      setEligiendo(false);
      return;
    }
    if (t === "video" && videos.length >= LIMITE_VIDEOS) {
      setError("Has alcanzado el límite de videos.");
      setEligiendo(false);
      return;
    }
    setTipo(t);
  };

  const tomarArchivo = (file: File | undefined) => {
    if (!file || !tipo) return;
    if (!formatoValido(file, tipo)) {
      setError("Este archivo no es compatible. Intenta con otra foto o video.");
      return;
    }
    setError(null);
    setArchivo(file);
    setVista(URL.createObjectURL(file));
  };

  const confirmarSubida = async () => {
    if (!archivo || !tipo) return;
    setSubiendo(true);
    setError(null);
    try {
      const r = await subirMedio(archivo, tipo);
      if (tipo === "video" && r.duration && r.duration > DURACION_MAXIMA) {
        setError(
          `Para que cargue rápidamente, utiliza videos de máximo ${DURACION_MAXIMA} segundos.`,
        );
        setSubiendo(false);
        return;
      }
      await registrar({
        data: {
          tipo,
          public_id: r.public_id,
          secure_url: r.secure_url,
          resource_type: r.resource_type,
          width: r.width ?? null,
          height: r.height ?? null,
          duration: r.duration ?? null,
          format: r.format ?? null,
          bytes: r.bytes ?? null,
        },
      });
      setAviso(tipo === "image" ? "Foto agregada correctamente" : "Video agregado correctamente");
      refrescar();
      limpiar();
      setTimeout(() => setAviso(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos subir el archivo. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  const mover = async (indice: number, direccion: -1 | 1) => {
    const nuevos = [...medios];
    const destino = indice + direccion;
    if (destino < 0 || destino >= nuevos.length) return;
    const a = nuevos[indice];
    const b = nuevos[destino];
    if (!a || !b) return;
    nuevos[indice] = b;
    nuevos[destino] = a;
    qc.setQueryData(["mis-medios"], { ...data, medios: nuevos });
    await ordenar({ data: { ids: nuevos.map((m) => m.id) } });
    refrescar();
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/mi-negocio">
            <ArrowLeft className="size-4" /> Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Fotos y videos</h1>
        <p className="text-sm text-muted-foreground">
          {fotos.length} de {LIMITE_FOTOS} fotos · {videos.length} de {LIMITE_VIDEOS} videos
        </p>
      </div>

      {aviso ? (
        <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          {aviso}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        className="h-16 w-full text-base font-semibold"
        onClick={() => {
          setError(null);
          setEligiendo(true);
        }}
      >
        <Plus className="size-5" /> AGREGAR CONTENIDO
      </Button>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : medios.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <Camera className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Todavía no tienes fotos ni videos. Agrega el primero para que tu negocio se vea mejor.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {medios.map((m, i) => (
            <li
              key={m.id}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => (m.tipo === "video" ? setVerVideo(m) : undefined)}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
              >
                <img
                  src={
                    m.tipo === "video"
                      ? posterVideo(m.secure_url, "miniatura")
                      : urlImagen(m.secure_url, "miniatura")
                  }
                  alt={m.tipo === "video" ? "Video del negocio" : "Foto del negocio"}
                  loading="lazy"
                  className="size-full object-cover"
                />
                {m.tipo === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                    <Play className="size-6 fill-current" />
                  </span>
                ) : null}
              </button>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                    {m.tipo === "video" ? (
                      <>
                        <Video className="size-3.5" /> Video
                      </>
                    ) : (
                      <>
                        <ImageIcon className="size-3.5" /> Foto
                      </>
                    )}
                  </span>
                  {m.es_portada ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                      Portada
                    </span>
                  ) : null}
                  {m.es_destacado ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                      Destacado
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {m.tipo === "image" && !m.es_portada ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await portada({ data: { id: m.id } });
                        refrescar();
                      }}
                    >
                      <Star className="size-4" /> Usar como portada
                    </Button>
                  ) : null}
                  {m.tipo === "video" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await destacar({ data: { id: m.id, activo: !m.es_destacado } });
                        refrescar();
                      }}
                    >
                      <Star className="size-4" />
                      {m.es_destacado ? "Quitar destacado" : "Destacar video"}
                    </Button>
                  ) : null}
                  <Button size="icon" variant="outline" onClick={() => void mover(i, -1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => void mover(i, 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setPorBorrar(m)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ¿Qué quieres agregar? */}
      {eligiendo && !tipo ? (
        <Hoja onCerrar={limpiar} titulo="¿Qué quieres agregar?">
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-24 flex-col text-base" onClick={() => elegirTipo("image")}>
              <ImageIcon className="size-7" /> FOTO
            </Button>
            <Button className="h-24 flex-col text-base" onClick={() => elegirTipo("video")}>
              <Video className="size-7" /> VIDEO
            </Button>
          </div>
        </Hoja>
      ) : null}

      {tipo && !archivo ? (
        <Hoja onCerrar={limpiar} titulo={tipo === "image" ? "Agregar foto" : "Agregar video"}>
          <div className="space-y-3">
            <Button
              className="h-16 w-full text-base"
              onClick={() => entradaCamara.current?.click()}
            >
              {tipo === "image" ? "TOMAR FOTO" : "GRABAR VIDEO"}
            </Button>
            <Button
              variant="outline"
              className="h-16 w-full text-base"
              onClick={() => entradaArchivo.current?.click()}
            >
              ELEGIR DE MI DISPOSITIVO
            </Button>
            <Button variant="ghost" className="h-12 w-full" onClick={limpiar}>
              CANCELAR
            </Button>
            {tipo === "video" ? (
              <p className="text-center text-xs text-muted-foreground">
                Para que cargue rápidamente, utiliza videos de máximo {DURACION_MAXIMA} segundos.
              </p>
            ) : null}
          </div>
        </Hoja>
      ) : null}

      {tipo && archivo ? (
        <Hoja
          onCerrar={subiendo ? () => undefined : limpiar}
          titulo={tipo === "image" ? "Vista previa" : "Vista previa del video"}
        >
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-secondary">
              {tipo === "image" ? (
                <img
                  src={vista ?? ""}
                  alt="Vista previa"
                  className="max-h-64 w-full object-cover"
                />
              ) : (
                <video src={vista ?? ""} controls playsInline className="max-h-64 w-full" />
              )}
            </div>
            {subiendo ? (
              <p className="flex items-center justify-center gap-2 py-2 text-sm font-semibold">
                <Loader2 className="size-4 animate-spin" />
                {tipo === "image" ? "Subiendo foto..." : "Subiendo video..."}
              </p>
            ) : (
              <>
                <Button className="h-14 w-full text-base" onClick={() => void confirmarSubida()}>
                  {tipo === "image" ? "SUBIR FOTO" : "SUBIR VIDEO"}
                </Button>
                <Button variant="ghost" className="h-12 w-full" onClick={limpiar}>
                  CANCELAR
                </Button>
              </>
            )}
          </div>
        </Hoja>
      ) : null}

      {porBorrar ? (
        <Hoja
          onCerrar={() => setPorBorrar(null)}
          titulo={
            porBorrar.tipo === "video"
              ? "¿Deseas eliminar este video?"
              : "¿Deseas eliminar esta foto?"
          }
        >
          <div className="space-y-3">
            <Button
              variant="destructive"
              className="h-14 w-full text-base"
              onClick={async () => {
                const id = porBorrar.id;
                setPorBorrar(null);
                await eliminar({ data: { id } });
                refrescar();
              }}
            >
              ELIMINAR
            </Button>
            <Button variant="ghost" className="h-12 w-full" onClick={() => setPorBorrar(null)}>
              CANCELAR
            </Button>
          </div>
        </Hoja>
      ) : null}

      {verVideo ? (
        <Hoja onCerrar={() => setVerVideo(null)} titulo="Video">
          <video
            src={urlVideo(verVideo.secure_url)}
            poster={posterVideo(verVideo.secure_url, "ficha")}
            controls
            playsInline
            preload="none"
            className="w-full rounded-2xl"
          />
        </Hoja>
      ) : null}

      <input
        ref={entradaCamara}
        type="file"
        accept={tipo === "video" ? "video/*" : "image/*"}
        capture="environment"
        className="hidden"
        onChange={(e) => tomarArchivo(e.target.files?.[0])}
      />
      <input
        ref={entradaArchivo}
        type="file"
        accept={tipo === "video" ? ACEPTA_VIDEO : ACEPTA_FOTO}
        className="hidden"
        onChange={(e) => tomarArchivo(e.target.files?.[0])}
      />
    </div>
  );
}

function Hoja({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onCerrar}>
      <div
        className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-3xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg font-bold">{titulo}</p>
        {children}
      </div>
    </div>
  );
}
