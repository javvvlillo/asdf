export function StatusBadge({ stock }: { stock: number }) {
  const available = stock > 0;

  return (
    <span
      className={`inline-block shrink-0 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${
        available ? "bg-sage-100 text-sage-700" : "bg-charcoal/10 text-charcoal/60"
      }`}
    >
      {available ? "Disponible" : "Agotado"}
    </span>
  );
}
