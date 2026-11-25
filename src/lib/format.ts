export function formatClp(amount: number): string {
  return amount.toLocaleString("es-CL");
}

/** "viernes, 26 de marzo de 2027" (hora de Chile, para que no se corra de día). */
export function formatWeddingDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  })
    .format(date)
    .replace(",", "");
}

/** "Sofía & Cristóbal" -> ["Sofía", "Cristóbal"], para el título partido de la invitación. */
export function splitCoupleNames(coupleNames: string): [string, string | null] {
  const [first, ...rest] = coupleNames.split(/\s+(?:&|y)\s+/);
  return [(first ?? coupleNames).trim(), rest.length ? rest.join(" & ").trim() : null];
}
