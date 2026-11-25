import { formatWeddingDate, splitCoupleNames } from "@/lib/format";

export function Hero({
  coupleNames,
  weddingDate,
  eventTime,
  venue,
  welcomeMessage,
}: {
  coupleNames: string;
  weddingDate: Date;
  eventTime: string | null;
  venue: string | null;
  welcomeMessage: string | null;
}) {
  const [first, second] = splitCoupleNames(coupleNames);

  const details = [
    { label: "Fecha", value: formatWeddingDate(weddingDate) },
    eventTime && { label: "Horario", value: eventTime },
    venue && { label: "Lugar", value: venue },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <header className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-16">
      <h1 className="sr-only">{coupleNames}</h1>

      <p aria-hidden className="titulo text-center text-[clamp(4.5rem,22vw,10rem)]">
        {first}
        {second && " &"}
      </p>

      <div className="relative z-10 -mt-1 bg-azul-600 px-6 pb-8 pt-6 text-white sm:mx-10 sm:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/invitacion/pareja-brindis.png"
          alt="Sofía y Cristóbal brindando: ella con una copa gigante, él con una botella gigante"
          width={461}
          height={308}
          className="mx-auto w-full max-w-md"
        />
        <dl className="mt-6 flex flex-col gap-4">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="etiqueta min-w-[9rem]">{d.label}</dt>
              <dd className="mt-1 text-base uppercase sm:text-lg">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {second && (
        <p aria-hidden className="titulo relative z-20 mt-3 text-center text-[clamp(4.5rem,22vw,10rem)]">
          {second}
        </p>
      )}

      <div className="mt-16 text-center">
        <p className="titulo text-[clamp(3rem,14vw,6rem)]">Lista de regalos</p>
        {welcomeMessage && (
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed sm:text-base">
            {welcomeMessage}
          </p>
        )}
      </div>
    </header>
  );
}
