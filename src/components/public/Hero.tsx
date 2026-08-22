import { formatWeddingDate } from "@/lib/format";

export function Hero({
  coupleNames,
  weddingDate,
  welcomeMessage,
}: {
  coupleNames: string;
  weddingDate: Date;
  welcomeMessage: string | null;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Lista de novios</p>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">{coupleNames}</h1>
      <p className="mt-3 text-charcoal/70">{formatWeddingDate(weddingDate)}</p>
      {welcomeMessage && (
        <p className="mx-auto mt-6 max-w-xl font-display text-lg italic text-charcoal/80">
          {welcomeMessage}
        </p>
      )}
    </div>
  );
}
