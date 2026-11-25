import Link from "next/link";
import type { Item } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { PhotoCredit } from "./PhotoCredit";
import { formatClp } from "@/lib/format";

export function ItemCard({ item, slug, number }: { item: Item; slug: string; number: number }) {
  const isAvailable = item.stock > 0;
  const n = String(number).padStart(2, "0");

  return (
    <article
      aria-disabled={!isAvailable || undefined}
      className={`group relative flex h-full flex-col p-5 transition ${
        isAvailable
          ? "bg-azul-600 text-white focus-within:ring-4 focus-within:ring-azul-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_theme(colors.azul.900)]"
          : "border-2 border-dashed border-azul-600/40 text-azul-600/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`font-display text-5xl leading-none ${
            isAvailable ? "text-white/90" : "text-azul-600/30"
          }`}
        >
          {n}
        </span>
        <StatusBadge stock={item.stock} />
      </div>

      {item.imageUrl && (
        <figure className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className={`aspect-[4/3] w-full border-4 object-cover ${
              isAvailable ? "border-white" : "border-azul-600/20 grayscale"
            }`}
          />
          <PhotoCredit name={item.imageCredit} url={item.imageCreditUrl} className="mt-1" />
        </figure>
      )}

      <h3
        className={`mt-3 font-display text-2xl uppercase leading-[1.05] ${
          isAvailable ? "" : "line-through decoration-2"
        }`}
      >
        {isAvailable ? (
          // El enlace cubre toda la tarjeta (after:inset-0); los créditos quedan por encima.
          <Link
            href={`/${slug}/items/${item.id}/contribute`}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {item.name}
          </Link>
        ) : (
          item.name
        )}
      </h3>
      {item.description && (
        <p className={`mt-2 text-sm leading-snug ${isAvailable ? "text-white/80" : ""}`}>
          {item.description}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <span className="font-bold">
          ${formatClp(item.price)}
          {item.stock > 1 && (
            <span className="block text-[0.7rem] font-normal uppercase opacity-70">por aporte</span>
          )}
        </span>
        {isAvailable && (
          <span
            aria-hidden
            className="bg-white px-3 py-1.5 text-xs font-bold uppercase text-azul-600 transition group-hover:bg-beige-200"
          >
            Regalar →
          </span>
        )}
      </div>
    </article>
  );
}
