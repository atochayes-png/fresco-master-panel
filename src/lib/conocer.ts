/* Módulo CONOCER: catálogos compartidos entre el panel del dueño y la experiencia pública. */

export const TIPO_CONOCER = "Turismo y experiencias";

export function esConocer(tipo: string | null | undefined) {
  return (tipo ?? "") === TIPO_CONOCER;
}

export const CATEGORIAS_CONOCER = [
  { clave: "lancha", nombre: "Paseos en lancha", emoji: "🚤" },
  { clave: "cenotes", nombre: "Cenotes", emoji: "💧" },
  { clave: "cultura", nombre: "Cultura y zonas arqueológicas", emoji: "🏛️" },
  { clave: "naturaleza", nombre: "Naturaleza", emoji: "🌴" },
  { clave: "pesca", nombre: "Pesca", emoji: "🎣" },
  { clave: "paseos", nombre: "Experiencias y paseos", emoji: "🌅" },
] as const;

export const CLAVES_CONOCER = CATEGORIAS_CONOCER.map((c) => c.clave) as string[];

export function nombreCategoriaConocer(clave: string | null) {
  return CATEGORIAS_CONOCER.find((c) => c.clave === clave)?.nombre ?? "Experiencia";
}

export function emojiCategoriaConocer(clave: string | null) {
  return CATEGORIAS_CONOCER.find((c) => c.clave === clave)?.emoji ?? "🌿";
}

export type TipoPrecio = "persona" | "grupo" | "desde" | "consultar";

export const TIPOS_PRECIO: { clave: TipoPrecio; nombre: string }[] = [
  { clave: "persona", nombre: "Por persona" },
  { clave: "grupo", nombre: "Por grupo / embarcación" },
  { clave: "desde", nombre: "Desde" },
  { clave: "consultar", nombre: "Consultar precio" },
];

export const CLAVES_PRECIO = TIPOS_PRECIO.map((t) => t.clave) as string[];

export const DURACIONES = [
  "1 hora",
  "2 horas",
  "3 horas",
  "4 horas",
  "Medio día",
  "Día completo",
] as const;

export const HORARIOS_SUGERIDOS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "Horario a convenir",
] as const;

export type ExtraExperiencia = { nombre: string; precio: number | null; disponible: boolean };

function moneda(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

/** Texto público del precio: “$500 por persona”, “Desde $350”, “Consultar precio”. */
export function textoPrecio(precio: number | null, tipo: string | null): string {
  const t = (tipo ?? "consultar") as TipoPrecio;
  if (t === "consultar" || precio == null || precio <= 0) return "Consultar precio";
  if (t === "persona") return `${moneda(precio)} por persona`;
  if (t === "grupo") return `${moneda(precio)} por grupo`;
  return `Desde ${moneda(precio)}`;
}

/**
 * Total estimado sólo cuando es matemáticamente posible.
 * Si el precio es “Desde” o “Consultar”, no se inventa ningún total.
 */
export function totalEstimado(
  precio: number | null,
  tipo: string | null,
  personas: number,
  extras: ExtraExperiencia[],
): number | null {
  const t = (tipo ?? "consultar") as TipoPrecio;
  if (t !== "persona" && t !== "grupo") return null;
  if (precio == null || precio <= 0) return null;
  const base = t === "persona" ? precio * Math.max(1, personas) : precio;
  const suma = extras.reduce((a, e) => a + (e.precio ?? 0), 0);
  return base + suma;
}
