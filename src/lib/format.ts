export function formatClp(amount: number): string {
  return amount.toLocaleString("es-CL");
}

export function formatWeddingDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
