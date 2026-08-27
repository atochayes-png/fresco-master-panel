import { DIAS } from "@/lib/dueno";

export const CATEGORIAS = [
  { clave: "COMER", tipo: "Comida y bebida", emoji: "🍽️" },
  { clave: "CONOCER", tipo: "Turismo y experiencias", emoji: "🌿" },
  { clave: "HOSPEDARME", tipo: "Hospedaje y rentas", emoji: "🛏️" },
  { clave: "MOVERME", tipo: "Movilidad y transporte", emoji: "🚗" },
  { clave: "DIVERTIRME", tipo: "Diversión y entretenimiento", emoji: "🎉" },
] as const;

const CLAVE_TEL = "tfy_telefono";
const CLAVE_NOMBRE = "tfy_nombre";
const CLAVE_UBI = "tfy_ubicacion";

export function telefonoGuardado(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLAVE_TEL);
}

export function guardarTelefono(telefono: string) {
  window.localStorage.setItem(CLAVE_TEL, telefono);
}

export function nombreGuardado(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CLAVE_NOMBRE) ?? "";
}

export function guardarNombre(nombre: string) {
  window.localStorage.setItem(CLAVE_NOMBRE, nombre);
}

export function ubicacionGuardada(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  const crudo = window.localStorage.getItem(CLAVE_UBI);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as { lat: number; lng: number };
  } catch {
    return null;
  }
}

export function guardarUbicacion(ubi: { lat: number; lng: number }) {
  window.localStorage.setItem(CLAVE_UBI, JSON.stringify(ubi));
}

export async function pedirUbicacion(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ubi = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        guardarUbicacion(ubi);
        resolve(ubi);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export function distanciaKm(
  a: { lat: number; lng: number } | null,
  lat: number | null,
  lng: number | null,
): number | null {
  if (!a || lat == null || lng == null) return null;
  const R = 6371;
  const dLat = ((lat - a.lat) * Math.PI) / 180;
  const dLng = ((lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

export type HorarioPublico = { dia: number; abierto: boolean; apertura: string | null; cierre: string | null };

export function estaAbierto(horarios: HorarioPublico[]): boolean | null {
  if (!horarios.length) return null;
  const ahora = new Date();
  const hoy = horarios.find((h) => h.dia === ahora.getDay());
  if (!hoy || !hoy.abierto || !hoy.apertura || !hoy.cierre) return false;
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  const a = hoy.apertura.split(":").map(Number);
  const c = hoy.cierre.split(":").map(Number);
  const inicio = (a[0] ?? 0) * 60 + (a[1] ?? 0);
  const fin = (c[0] ?? 0) * 60 + (c[1] ?? 0);
  if (fin <= inicio) return minutos >= inicio || minutos <= fin;
  return minutos >= inicio && minutos <= fin;
}

export function nombreDia(dia: number) {
  return DIAS.find((d) => d.dia === dia)?.nombre ?? "";
}

export function pesos(v: number | null | undefined) {
  if (v == null) return "";
  return `$${Number(v).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
}

/* Carrito local, siempre de un solo negocio. */
export type Carrito = Record<string, number>;

export function leerCarrito(negocioId: string): Carrito {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(`tfy_carrito_${negocioId}`) ?? "{}") as Carrito;
  } catch {
    return {};
  }
}

export function escribirCarrito(negocioId: string, carrito: Carrito) {
  window.localStorage.setItem(`tfy_carrito_${negocioId}`, JSON.stringify(carrito));
}

export function limpiarCarrito(negocioId: string) {
  window.localStorage.removeItem(`tfy_carrito_${negocioId}`);
}

export function mensajePedido(datos: {
  folio: string;
  negocio: string;
  cliente: string;
  telefono: string;
  items: { nombre: string; cantidad: number; importe: number }[];
  subtotal: number;
  costo_entrega: number;
  total_estimado: number;
  tipo_entrega: "recoger" | "domicilio";
  direccion?: string;
  referencia?: string;
}) {
  const lineas = [
    "NUEVO PEDIDO",
    "Tomar el Fresco en Yucatán",
    "",
    `Negocio: ${datos.negocio}`,
    `Pedido: ${datos.folio}`,
    `Cliente: ${datos.cliente}`,
    `Teléfono: ${datos.telefono}`,
    "",
    "PEDIDO",
    ...datos.items.map((i) => `${i.cantidad} × ${i.nombre} — ${pesos(i.importe)}`),
    "",
    `Subtotal: ${pesos(datos.subtotal)}`,
  ];
  if (datos.costo_entrega > 0) lineas.push(`Entrega: ${pesos(datos.costo_entrega)}`);
  lineas.push(`Total estimado: ${pesos(datos.total_estimado)}`);
  lineas.push("", "Entrega:", datos.tipo_entrega === "domicilio" ? "A domicilio" : "Recoger en el negocio");
  if (datos.tipo_entrega === "domicilio" && datos.direccion) {
    lineas.push("Dirección:", datos.direccion);
    if (datos.referencia) lineas.push(`Referencia: ${datos.referencia}`);
  }
  lineas.push(
    "",
    "Este pedido fue generado desde Tomar el Fresco en Yucatán.",
    "Por favor confirma directamente con el cliente disponibilidad, entrega y forma de pago.",
  );
  return lineas.join("\n");
}

export function enlaceWhatsApp(telefono: string, mensaje: string) {
  const solo = telefono.replace(/\D/g, "");
  const conLada = solo.length === 10 ? `52${solo}` : solo;
  return `https://wa.me/${conLada}?text=${encodeURIComponent(mensaje)}`;
}
