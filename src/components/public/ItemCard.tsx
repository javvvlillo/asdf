import Link from "next/link";
import type { Item } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { formatClp } from "@/lib/format";

export function ItemCard({ item, slug }: { item: Item; slug: string }) {
  const isAvailable = item.status === "AVAILABLE";

  const card = (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white/70 shadow-sm transition ${
        isAvailable ? "hover:-translate-y-0.5 hover:shadow-md" : "opacity-60"
      }`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-paper">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-charcoal/30">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-snug">{item.name}</h3>
          <StatusBadge status={item.status} />
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-charcoal/70">{item.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-lg text-terracotta-600">
            ${formatClp(item.price)}
          </span>
          {isAvailable && (
            <span className="text-sm font-medium text-gold group-hover:underline">
              Regalar →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!isAvailable) {
    return <div aria-disabled="true">{card}</div>;
  }

  return <Link href={`/${slug}/items/${item.id}/contribute`}>{card}</Link>;
}
