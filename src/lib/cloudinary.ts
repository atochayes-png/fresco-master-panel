/**
 * Entrega y subida de fotos y videos.
 * El dueño nunca ve estos detalles: sólo FOTO, VIDEO, SUBIR, PORTADA, ORDENAR, ELIMINAR.
 */

export const CLOUD_NAME = "m2fm0tib";
export const UPLOAD_PRESET = "tomar_el_fresco_media";

/** Límites iniciales por negocio (modificables sin rehacer el módulo). */
export const LIMITE_FOTOS = 15;
export const LIMITE_VIDEOS = 5;
export const DURACION_MAXIMA = 60; // segundos

export const FORMATOS_FOTO = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
export const FORMATOS_VIDEO = ["mp4", "mov", "webm", "quicktime"];

export const ACEPTA_FOTO = ".jpg,.jpeg,.png,.webp,.heic,.heif,image/*";
export const ACEPTA_VIDEO = ".mp4,.mov,.webm,video/*";

export type TipoMedio = "image" | "video";

export function formatoValido(archivo: File, tipo: TipoMedio) {
  const ext = (archivo.name.split(".").pop() ?? "").toLowerCase();
  const lista = tipo === "image" ? FORMATOS_FOTO : FORMATOS_VIDEO;
  if (lista.includes(ext)) return true;
  const mime = (archivo.type || "").toLowerCase();
  return mime.startsWith(tipo === "image" ? "image/" : "video/");
}

export type ResultadoSubida = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  bytes?: number;
};

/** Sube el archivo directamente desde el navegador (preset unsigned, sin secretos). */
export function subirMedio(
  archivo: File,
  tipo: TipoMedio,
  alProgreso?: (porcentaje: number) => void,
): Promise<ResultadoSubida> {
  return new Promise((resolver, rechazar) => {
    const cuerpo = new FormData();
    cuerpo.append("file", archivo);
    cuerpo.append("upload_preset", UPLOAD_PRESET);

    const peticion = new XMLHttpRequest();
    peticion.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${tipo === "video" ? "video" : "image"}/upload`,
    );
    peticion.upload.onprogress = (e) => {
      if (e.lengthComputable && alProgreso) alProgreso(Math.round((e.loaded / e.total) * 100));
    };
    peticion.onerror = () => rechazar(new Error("No pudimos subir el archivo. Intenta de nuevo."));
    peticion.onload = () => {
      if (peticion.status < 200 || peticion.status >= 300) {
        rechazar(new Error("Este archivo no es compatible. Intenta con otra foto o video."));
        return;
      }
      try {
        resolver(JSON.parse(peticion.responseText) as ResultadoSubida);
      } catch {
        rechazar(new Error("No pudimos subir el archivo. Intenta de nuevo."));
      }
    };
    peticion.send(cuerpo);
  });
}

/** Inserta transformaciones de entrega sobre la dirección original (el archivo no cambia). */
function transformar(url: string, tx: string) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${tx}/`);
}

type Variante = "miniatura" | "tarjeta" | "ficha" | "visor";

const IMAGEN_TX: Record<Variante, string> = {
  miniatura: "f_auto,q_auto,c_fill,g_auto,w_240,h_240",
  tarjeta: "f_auto,q_auto,c_fill,g_auto,w_640,h_400",
  ficha: "f_auto,q_auto,c_fill,g_auto,w_1000,h_640",
  visor: "f_auto,q_auto,w_1600,c_limit",
};

export function urlImagen(secureUrl: string, variante: Variante = "tarjeta") {
  return transformar(secureUrl, IMAGEN_TX[variante]);
}

/** Reproducción optimizada y compatible con móviles. */
export function urlVideo(secureUrl: string) {
  return transformar(secureUrl, "f_auto,q_auto,vc_auto,w_1080,c_limit");
}

/** Imagen fija del video (poster) para no descargar el video hasta que lo toquen. */
export function posterVideo(secureUrl: string, variante: Variante = "tarjeta") {
  const base = transformar(secureUrl, `${IMAGEN_TX[variante]},so_0`);
  return base.replace(/\.(mp4|mov|webm|m4v|avi)(\?.*)?$/i, ".jpg");
}
