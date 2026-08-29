/* Módulo DIVERTIRME: catálogos y textos compartidos entre el panel del dueño y el usuario. */

export const TIPO_DIVERTIRME = "Diversión y entretenimiento";

export function esDivertirme(tipo: string | null | undefined) {
  return (tipo ?? "") === TIPO_DIVERTIRME;
}

/** Subcategorías (ampliable). Bares y cantinas pertenecen a DIVERTIRME, no a COMER. */
export const SUBCATEGORIAS_DIVERTIRME = [
  { clave: "antros", nombre: "Antros", emoji: "🪩" },
  { clave: "bares", nombre: "Bares y cantinas", emoji: "🍻" },
  { clave: "musica_vivo", nombre: "Música en vivo", emoji: "🎵" },
  { clave: "familiar", nombre: "Familiar", emoji: "👨‍👩‍👧" },
  { clave: "parques", nombre: "Parques y atracciones", emoji: "🎡" },
  { clave: "espectaculos", nombre: "Espectáculos y eventos", emoji: "🎭" },
  { clave: "karaoke", nombre: "Karaoke", emoji: "🎤" },
  { clave: "billar", nombre: "Billar", emoji: "🎱" },
  { clave: "otro", nombre: "Otro entretenimiento", emoji: "✨" },
] as const;

export const CLAVES_DIVERTIRME = SUBCATEGORIAS_DIVERTIRME.map((s) => s.clave) as string[];

export function nombreSubcategoria(clave: string) {
  return SUBCATEGORIAS_DIVERTIRME.find((s) => s.clave === clave)?.nombre ?? clave;
}

export function emojiSubcategoria(clave: string) {
  return SUBCATEGORIAS_DIVERTIRME.find((s) => s.clave === clave)?.emoji ?? "🎉";
}

export const AMBIENTES = [
  "Familiar",
  "Jóvenes",
  "Parejas",
  "Amigos",
  "Adultos",
  "Música en vivo",
  "Fiesta",
  "Tranquilo",
  "Al aire libre",
  "Interior",
  "Terraza",
  "Otro",
] as const;

export const RESTRICCIONES_EDAD = [
  { clave: "sin_restriccion", nombre: "Sin restricción" },
  { clave: "mayores_18", nombre: "Solo mayores de 18" },
  { clave: "depende_evento", nombre: "Depende del evento" },
  { clave: "otra", nombre: "Otra condición" },
] as const;

export const CLAVES_EDAD = RESTRICCIONES_EDAD.map((r) => r.clave) as string[];

export function textoRestriccion(clave: string | null): string | null {
  switch (clave) {
    case "mayores_18":
      return "Solo mayores de 18";
    case "depende_evento":
      return "Depende del evento";
    case "otra":
      return "Consulta condiciones de acceso";
    default:
      return null;
  }
}

export const TIPOS_COVER = [
  { clave: "fijo", nombre: "Monto fijo" },
  { clave: "desde", nombre: "Desde" },
  { clave: "depende_evento", nombre: "Depende del evento" },
  { clave: "consultar", nombre: "Consultar" },
] as const;

export const CLAVES_COVER = TIPOS_COVER.map((t) => t.clave) as string[];

export const RESERVACIONES = [
  { clave: "no", nombre: "No se necesita" },
  { clave: "si", nombre: "Sí, se necesita" },
  { clave: "recomendable", nombre: "Recomendable" },
  { clave: "depende", nombre: "Depende del día o evento" },
] as const;

export const CLAVES_RESERVA = RESERVACIONES.map((r) => r.clave) as string[];

export function textoReserva(clave: string | null): string | null {
  switch (clave) {
    case "si":
      return "Se necesita reservar";
    case "recomendable":
      return "Reservación recomendable";
    case "depende":
      return "Depende del día o evento";
    default:
      return null;
  }
}

function moneda(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

/** Texto público del cover: “Cover $150”, “Cover desde $100”, “Cover: consultar”. */
export function textoCover(
  activo: boolean,
  tipo: string | null,
  monto: number | null,
): string | null {
  if (!activo) return null;
  if (tipo === "fijo" && monto) return `Cover ${moneda(monto)}`;
  if (tipo === "desde" && monto) return `Cover desde ${moneda(monto)}`;
  if (tipo === "depende_evento") return "Cover según el evento";
  return "Cover: consultar";
}

export function fechaValidaD(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v ?? "");
}

export function hoyISOD() {
  return new Date().toISOString().slice(0, 10);
}

export function mananaISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function fechaLargaD(iso: string) {
  if (!fechaValidaD(iso)) return iso;
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** “21:00” → “9:00 PM” */
export function hora12(v: string | null): string | null {
  if (!v || !/^\d{1,2}:\d{2}$/.test(v)) return v ?? null;
  const partes = v.split(":");
  const h = Number(partes[0]);
  const m = partes[1] ?? "00";
  const sufijo = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${sufijo}`;
}

export const HORAS_SUGERIDAS = [
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
] as const;
