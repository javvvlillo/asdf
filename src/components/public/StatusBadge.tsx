import type { ItemStatus } from "@prisma/client";

const LABELS: Record<ItemStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  GIFTED: "¡Regalado!",
};

const STYLES: Record<ItemStatus, string> = {
  AVAILABLE: "bg-sage-100 text-sage-700",
  RESERVED: "bg-terracotta-50 text-terracotta-600",
  GIFTED: "bg-charcoal/10 text-charcoal/60",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
