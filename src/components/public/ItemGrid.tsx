import type { Item } from "@prisma/client";
import { ItemCard } from "./ItemCard";

export function ItemGrid({ items, slug }: { items: Item[]; slug: string }) {
  if (items.length === 0) {
    return <p className="text-center">Todavía no hay regalos cargados.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <ItemCard key={item.id} item={item} slug={slug} number={index + 1} />
      ))}
    </div>
  );
}
