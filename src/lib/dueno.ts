import { supabase } from "@/integrations/supabase/client";

export const DIAS = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
] as const;

export const BUCKET = "negocios";

/** Reduce el tamaño de la imagen antes de subirla. */
export async function comprimirImagen(archivo: File, maxLado = 1600, calidad = 0.8) {
  if (!archivo.type.startsWith("image/")) return archivo;
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return archivo;
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, "image/jpeg", calidad));
  if (!blob) return archivo;
  return new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" });
}

export async function subirArchivo(negocioId: string, carpeta: string, archivo: File) {
  const extension = (archivo.name.split(".").pop() ?? "bin").toLowerCase();
  const ruta = `${negocioId}/${carpeta}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo, { upsert: true });
  if (error) throw new Error(error.message);
  return ruta;
}

export async function urlFirmada(ruta: string) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

export function etiquetaHora(hora: string | null) {
  if (!hora) return "";
  const [h, m] = hora.split(":");
  const n = Number(h);
  const sufijo = n >= 12 ? "pm" : "am";
  const doce = n % 12 === 0 ? 12 : n % 12;
  return `${doce}:${m} ${sufijo}`;
}
