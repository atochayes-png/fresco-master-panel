export const EMAIL_DOMINIO = "tomarelfresco.app";

export function usuarioAEmail(usuario: string) {
  return `${usuario.trim().toLowerCase()}@${EMAIL_DOMINIO}`;
}

export const TIPOS_NEGOCIO = [
  "Comida y bebida",
  "Turismo y experiencias",
  "Hospedaje y rentas",
  "Movilidad y transporte",
  "Diversión y entretenimiento",
  "Otro",
] as const;

export const MUNICIPIOS_YUCATAN = [
  "Abalá","Acanceh","Akil","Baca","Bokobá","Buctzotz","Cacalchén","Calotmul","Cansahcab","Cantamayec",
  "Celestún","Cenotillo","Conkal","Cuncunul","Cuzamá","Chacsinkín","Chankom","Chapab","Chemax","Chicxulub Pueblo",
  "Chichimilá","Chikindzonot","Chocholá","Chumayel","Dzán","Dzemul","Dzidzantún","Dzilam de Bravo","Dzilam González","Dzitás",
  "Dzoncauich","Espita","Halachó","Hocabá","Hoctún","Homún","Huhí","Hunucmá","Ixil","Izamal",
  "Kanasín","Kantunil","Kaua","Kinchil","Kopomá","Mama","Maní","Maxcanú","Mayapán","Mérida",
  "Mocochá","Motul","Muna","Muxupip","Opichén","Oxkutzcab","Panabá","Peto","Progreso","Quintana Roo",
  "Río Lagartos","Sacalum","Samahil","Sanahcat","San Felipe","Santa Elena","Seyé","Sinanché","Sotuta","Sucilá",
  "Sudzal","Suma","Tahdziú","Tahmek","Teabo","Tecoh","Tekal de Venegas","Tekantó","Tekax","Tekit",
  "Tekom","Telchac Pueblo","Telchac Puerto","Temax","Temozón","Tepakán","Tetiz","Teya","Ticul","Timucuy",
  "Tinum","Tixcacalcupul","Tixkokob","Tixmehuac","Tixpéhual","Tizimín","Tunkás","Tzucacab","Uayma","Ucú",
  "Umán","Valladolid","Xocchel","Yaxcabá","Yaxkukul","Yobaín",
] as const;

export function validarUsuario(v: string): string | null {
  if (!v) return "Escribe un usuario";
  if (/\s/.test(v)) return "El usuario no puede tener espacios";
  if (v.length < 6) return "Mínimo 6 caracteres";
  if (!/[A-ZÁÉÍÓÚÑ]/.test(v)) return "Debe tener al menos una mayúscula";
  if (!/[0-9]/.test(v)) return "Debe tener al menos un número";
  return null;
}

export function validarContrasena(v: string): string | null {
  if (!v) return "Escribe una contraseña";
  if (v.length < 6) return "Mínimo 6 caracteres";
  if (!/[A-ZÁÉÍÓÚÑ]/.test(v)) return "Debe tener al menos una mayúscula";
  if (!/[0-9]/.test(v)) return "Debe tener al menos un número";
  return null;
}

export function validarCelular(v: string): string | null {
  const solo = v.replace(/\D/g, "");
  if (!solo) return "Escribe el celular";
  if (solo.length < 10) return "Debe tener 10 dígitos";
  if (solo.length > 13) return "Número demasiado largo";
  return null;
}

export type EstatusCalculado = "activo" | "por_vencer" | "vencido" | "suspendido";

export const ETIQUETA_ESTATUS: Record<EstatusCalculado, string> = {
  activo: "Activo",
  por_vencer: "Por vencer",
  vencido: "Vencido",
  suspendido: "Suspendido",
};

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function diasRestantes(fechaFin: string) {
  const fin = new Date(`${fechaFin}T00:00:00`);
  const hoy = new Date(`${hoyISO()}T00:00:00`);
  return Math.round((fin.getTime() - hoy.getTime()) / 86400000);
}

export function calcularEstatus(n: { fecha_fin: string; estatus: string }): EstatusCalculado {
  if (n.estatus === "suspendido") return "suspendido";
  const d = diasRestantes(n.fecha_fin);
  if (d < 0) return "vencido";
  if (d <= 7) return "por_vencer";
  return "activo";
}

export function formatoFecha(fecha: string) {
  const d = new Date(`${fecha}T00:00:00`);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}
