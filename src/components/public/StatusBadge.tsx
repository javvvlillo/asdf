/** Estado del regalo según stock. Con más de 1 unidad muestra cuántos aportes quedan. */
export function StatusBadge({ stock, tone = "light" }: { stock: number; tone?: "light" | "dark" }) {
  const label = stock <= 0 ? "Ya regalado" : stock === 1 ? "Queda 1" : `Quedan ${stock}`;

  const color =
    stock <= 0
      ? "bg-azul-900/10 text-azul-900/60"
      : tone === "light"
        ? "bg-white text-azul-600"
        : "bg-azul-600 text-white";

  return (
    <span
      className={`inline-block shrink-0 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide ${color}`}
    >
      {label}
    </span>
  );
}
