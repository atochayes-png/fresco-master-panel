/* Módulo COMER: catálogos compartidos entre el panel del dueño y la experiencia pública. */

export const TIPO_COMER = "Comida y bebida";

export function esComer(tipo: string | null | undefined) {
  return (tipo ?? "") === TIPO_COMER;
}

export const TIPOS_COMIDA = [
  { clave: "yucateca", nombre: "Comida yucateca", emoji: "🌴" },
  { clave: "pizzas", nombre: "Pizzas", emoji: "🍕" },
  { clave: "tacos", nombre: "Tacos", emoji: "🌮" },
  { clave: "hamburguesas", nombre: "Hamburguesas", emoji: "🍔" },
  { clave: "postres", nombre: "Postres", emoji: "🍰" },
  { clave: "pastas", nombre: "Pastas", emoji: "🍝" },
  { clave: "carnes", nombre: "Carnes", emoji: "🥩" },
  { clave: "mariscos", nombre: "Mariscos", emoji: "🐟" },
  { clave: "desayunos", nombre: "Desayunos", emoji: "🍳" },
  { clave: "cafes", nombre: "Cafés", emoji: "☕" },
] as const;

export const CLAVES_COMIDA = TIPOS_COMIDA.map((t) => t.clave) as string[];

export function nombreComida(clave: string) {
  return TIPOS_COMIDA.find((t) => t.clave === clave)?.nombre ?? clave;
}

export function emojiComida(clave: string) {
  return TIPOS_COMIDA.find((t) => t.clave === clave)?.emoji ?? "🍽️";
}

export const TIEMPOS_PREPARACION = [
  "10 min",
  "15 min",
  "20 min",
  "30 min",
  "45 min",
  "60 min",
  "Consultar con establecimiento",
] as const;

export const FORMAS_PAGO = [
  { clave: "efectivo", nombre: "Efectivo" },
  { clave: "tarjeta", nombre: "Tarjeta" },
  { clave: "transferencia", nombre: "Transferencia" },
] as const;

export const CLAVES_PAGO = FORMAS_PAGO.map((f) => f.clave) as string[];

export function nombrePago(clave: string) {
  return FORMAS_PAGO.find((f) => f.clave === clave)?.nombre ?? clave;
}

export type Modalidad = "local" | "recoger" | "domicilio";

export const MODALIDADES: { clave: Modalidad; nombre: string }[] = [
  { clave: "local", nombre: "Comer en el establecimiento" },
  { clave: "recoger", nombre: "Recoger en el establecimiento" },
  { clave: "domicilio", nombre: "Servicio a domicilio" },
];

export function nombreModalidad(clave: string) {
  return MODALIDADES.find((m) => m.clave === clave)?.nombre ?? clave;
}
