import { ETIQUETA_ESTATUS, type EstatusCalculado } from "@/lib/dominio";
import { cn } from "@/lib/utils";

const ESTILOS: Record<EstatusCalculado, string> = {
  activo: "bg-exito/12 text-exito",
  por_vencer: "bg-aviso/15 text-aviso",
  vencido: "bg-destructive/12 text-destructive",
  suspendido: "bg-muted text-muted-foreground",
};

export function EstatusBadge({ estatus, className }: { estatus: EstatusCalculado; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        ESTILOS[estatus],
        className,
      )}
    >
      {ETIQUETA_ESTATUS[estatus]}
    </span>
  );
}
