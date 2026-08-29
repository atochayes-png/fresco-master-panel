/* Módulo HOSPEDAJE: catálogos y cálculos compartidos entre el panel del dueño y el huésped. */

export const TIPO_HOSPEDAJE = "Hospedaje y rentas";

export function esHospedaje(tipo: string | null | undefined) {
  return (tipo ?? "") === TIPO_HOSPEDAJE;
}

export const TIPOS_ALOJAMIENTO = [
  { clave: "habitacion", nombre: "Habitación" },
  { clave: "suite", nombre: "Suite" },
  { clave: "departamento", nombre: "Departamento" },
  { clave: "cabana", nombre: "Cabaña" },
  { clave: "casa", nombre: "Casa vacacional" },
  { clave: "bungalow", nombre: "Bungalow" },
  { clave: "villa", nombre: "Villa" },
  { clave: "otro", nombre: "Otro alojamiento" },
] as const;

export const CLAVES_ALOJAMIENTO = TIPOS_ALOJAMIENTO.map((t) => t.clave) as string[];

export function nombreTipoAlojamiento(clave: string | null) {
  return TIPOS_ALOJAMIENTO.find((t) => t.clave === clave)?.nombre ?? "Alojamiento";
}

export const SERVICIOS_HOSPEDAJE = [
  "Aire acondicionado",
  "WiFi",
  "Estacionamiento",
  "Alberca",
  "Cocina",
  "TV",
  "Baño privado",
  "Vista al mar",
  "Balcón",
  "Pet friendly",
  "Agua caliente",
  "Ventilador",
] as const;

export type PrecioHospedaje = "noche" | "desde" | "consultar";

export const TIPOS_PRECIO_HOSPEDAJE: { clave: PrecioHospedaje; nombre: string }[] = [
  { clave: "noche", nombre: "Precio por noche" },
  { clave: "desde", nombre: "Desde (por noche)" },
  { clave: "consultar", nombre: "Consultar precio" },
];

export const CLAVES_PRECIO_HOSPEDAJE = TIPOS_PRECIO_HOSPEDAJE.map((t) => t.clave) as string[];

function moneda(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

/** Texto público del precio: “$1,200 / noche”, “Desde $1,200”, “Consultar precio”. */
export function textoPrecioNoche(precio: number | null, tipo: string | null): string {
  const t = (tipo ?? "consultar") as PrecioHospedaje;
  if (t === "consultar" || precio == null || precio <= 0) return "Consultar precio";
  if (t === "desde") return `Desde ${moneda(precio)} / noche`;
  return `${moneda(precio)} / noche`;
}

export function fechaValida(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v ?? "");
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Noches entre dos fechas ISO; null cuando el rango no es válido. */
export function noches(entrada: string, salida: string): number | null {
  if (!fechaValida(entrada) || !fechaValida(salida)) return null;
  const a = Date.parse(`${entrada}T00:00:00Z`);
  const b = Date.parse(`${salida}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const dias = Math.round((b - a) / 86400000);
  return dias > 0 ? dias : null;
}

/** Fechas ISO de las noches ocupadas (entrada incluida, salida excluida). */
export function nochesDelRango(entrada: string, salida: string): string[] {
  const total = noches(entrada, salida);
  if (total == null) return [];
  const lista: string[] = [];
  const cursor = new Date(`${entrada}T00:00:00Z`);
  for (let i = 0; i < total; i += 1) {
    lista.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return lista;
}

/**
 * Total estimado sólo cuando existe precio por noche.
 * Con “Desde” se devuelve el mínimo y con “Consultar” no se inventa ningún total.
 */
export function totalHospedaje(
  precio: number | null,
  tipo: string | null,
  cantidadNoches: number | null,
): number | null {
  const t = (tipo ?? "consultar") as PrecioHospedaje;
  if (t === "consultar" || precio == null || precio <= 0 || !cantidadNoches) return null;
  return precio * cantidadNoches;
}

export type ModoDisponibilidad = "con_calendario" | "sin_calendario";

export function textoDisponibilidad(modo: ModoDisponibilidad) {
  return modo === "con_calendario" ? "Disponible según calendario" : "Disponibilidad por confirmar";
}

export function ctaDisponibilidad(modo: ModoDisponibilidad) {
  return modo === "con_calendario" ? "SOLICITAR HOSPEDAJE" : "CONSULTAR DISPONIBILIDAD";
}

export function fechaLarga(iso: string) {
  if (!fechaValida(iso)) return iso;
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}
