/* Módulo MOVERME (renta de autos): catálogos y cálculos compartidos entre la rentadora y el usuario. */

export const TIPO_MOVERME = "Movilidad y transporte";

export function esMoverme(tipo: string | null | undefined) {
  return (tipo ?? "") === TIPO_MOVERME;
}

export const TRANSMISIONES = [
  { clave: "automatica", nombre: "Automática" },
  { clave: "manual", nombre: "Manual" },
  { clave: "ambas", nombre: "Ambas / depende de disponibilidad" },
] as const;

export const CLAVES_TRANSMISION = TRANSMISIONES.map((t) => t.clave) as string[];

export function nombreTransmision(clave: string | null) {
  return TRANSMISIONES.find((t) => t.clave === clave)?.nombre ?? "Transmisión por confirmar";
}

export const LUGARES_ENTREGA = [
  { clave: "sucursal", nombre: "En sucursal" },
  { clave: "aeropuerto", nombre: "Aeropuerto" },
  { clave: "hotel", nombre: "Hotel" },
  { clave: "domicilio", nombre: "Entrega a domicilio" },
  { clave: "otro", nombre: "Otro punto acordado" },
] as const;

export const CLAVES_ENTREGA = LUGARES_ENTREGA.map((l) => l.clave) as string[];

export function nombreLugarEntrega(clave: string | null) {
  return LUGARES_ENTREGA.find((l) => l.clave === clave)?.nombre ?? "Por acordar";
}

export const TIPOS_TARJETA = [
  { clave: "no", nombre: "No se requiere tarjeta" },
  { clave: "credito", nombre: "Tarjeta de crédito" },
  { clave: "debito", nombre: "Tarjeta de débito" },
  { clave: "cualquiera", nombre: "Crédito o débito" },
] as const;

export const CLAVES_TARJETA = TIPOS_TARJETA.map((t) => t.clave) as string[];

export function nombreTarjeta(clave: string | null) {
  return TIPOS_TARJETA.find((t) => t.clave === clave)?.nombre ?? "No se requiere tarjeta";
}

export const COSTOS_ENTREGA = [
  { clave: "sin_costo", nombre: "Sin costo" },
  { clave: "fijo", nombre: "Costo fijo" },
  { clave: "consultar", nombre: "Consultar" },
] as const;

export const CLAVES_COSTO_ENTREGA = COSTOS_ENTREGA.map((c) => c.clave) as string[];

export type PrecioRenta = "dia" | "desde" | "consultar";

export const TIPOS_PRECIO_RENTA: { clave: PrecioRenta; nombre: string }[] = [
  { clave: "dia", nombre: "Precio por día" },
  { clave: "desde", nombre: "Desde (por día)" },
  { clave: "consultar", nombre: "Consultar precio" },
];

export const CLAVES_PRECIO_RENTA = TIPOS_PRECIO_RENTA.map((t) => t.clave) as string[];

function moneda(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

/** Texto público del precio: “$850 / día”, “Desde $850 / día”, “Consultar precio”. */
export function textoPrecioDia(precio: number | null, tipo: string | null): string {
  const t = (tipo ?? "consultar") as PrecioRenta;
  if (t === "consultar" || precio == null || precio <= 0) return "Consultar precio";
  if (t === "desde") return `Desde ${moneda(precio)} / día`;
  return `${moneda(precio)} / día`;
}

export function fechaValida(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v ?? "");
}

export function horaValida(v: string) {
  return /^\d{2}:\d{2}$/.test(v ?? "");
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Duración en días de renta.
 * Regla simple y consistente: cada 24 horas iniciadas cuenta como un día completo.
 */
export function diasRenta(
  fechaInicio: string,
  horaInicio: string,
  fechaFin: string,
  horaFin: string,
): number | null {
  if (!fechaValida(fechaInicio) || !fechaValida(fechaFin)) return null;
  const hi = horaValida(horaInicio) ? horaInicio : "10:00";
  const hf = horaValida(horaFin) ? horaFin : "10:00";
  const a = Date.parse(`${fechaInicio}T${hi}:00Z`);
  const b = Date.parse(`${fechaFin}T${hf}:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const horas = (b - a) / 3600000;
  if (horas <= 0) return null;
  return Math.max(1, Math.ceil(horas / 24 - 0.0001));
}

/** Fechas ISO que abarca la renta, incluyendo el día de entrega y el de devolución. */
export function fechasDelRango(fechaInicio: string, fechaFin: string): string[] {
  if (!fechaValida(fechaInicio) || !fechaValida(fechaFin)) return [];
  const lista: string[] = [];
  const cursor = new Date(`${fechaInicio}T00:00:00Z`);
  const fin = new Date(`${fechaFin}T00:00:00Z`);
  if (fin < cursor) return [];
  while (cursor <= fin && lista.length < 400) {
    lista.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return lista;
}

/** Total estimado de la renta; nunca se inventa cuando el precio es “Consultar”. */
export function totalRenta(
  precio: number | null,
  tipo: string | null,
  dias: number | null,
): number | null {
  const t = (tipo ?? "consultar") as PrecioRenta;
  if (t === "consultar" || precio == null || precio <= 0 || !dias) return null;
  return precio * dias;
}

export type ModoDisponibilidadRenta = "con_calendario" | "sin_calendario";

export function textoDisponibilidadRenta(modo: ModoDisponibilidadRenta) {
  return modo === "con_calendario" ? "Disponible según calendario" : "Disponibilidad por confirmar";
}

export function ctaDisponibilidadRenta(modo: ModoDisponibilidadRenta) {
  return modo === "con_calendario" ? "SOLICITAR RENTA" : "CONSULTAR DISPONIBILIDAD";
}

export function fechaLargaRenta(iso: string) {
  if (!fechaValida(iso)) return iso;
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

export function horaTexto(hora: string) {
  if (!horaValida(hora)) return hora;
  const [h, m] = hora.split(":").map(Number);
  const hh = h ?? 0;
  const sufijo = hh >= 12 ? "PM" : "AM";
  const doce = hh % 12 === 0 ? 12 : hh % 12;
  return `${doce}:${String(m ?? 0).padStart(2, "0")} ${sufijo}`;
}
