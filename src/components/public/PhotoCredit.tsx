/** Crédito de la foto: "Foto: Nombre / Unsplash", como exige la guía de Unsplash. */
export function PhotoCredit({
  name,
  url,
  className = "",
}: {
  name: string | null;
  url: string | null;
  className?: string;
}) {
  if (!name) return null;
  const isUnsplash = url?.includes("unsplash.com");

  return (
    <p className={`relative z-10 text-[0.65rem] leading-tight ${className}`}>
      <span className="opacity-70">
      Foto:{" "}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {name}
        </a>
      ) : (
        name
      )}
      {isUnsplash && (
        <>
          {" / "}
          <a
            href="https://unsplash.com/?utm_source=lista_sofia_cristobal&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Unsplash
          </a>
        </>
      )}
      </span>
    </p>
  );
}
