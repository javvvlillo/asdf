import type { Item } from "@prisma/client";

const inputClass =
  "rounded-lg border border-charcoal/20 bg-white px-3 py-2 focus:border-gold focus:outline-none";

export function ItemForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Pick<Item, "name" | "description" | "imageUrl" | "price" | "order" | "stock">;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          className={inputClass}
          placeholder="Set de sábanas de lino"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Descripción (opcional)
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        URL de la foto (opcional)
        <input
          name="imageUrl"
          type="url"
          defaultValue={defaultValues?.imageUrl ?? ""}
          className={inputClass}
          placeholder="https://..."
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Precio (CLP)
        <input
          name="price"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={defaultValues?.price}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Stock (cuántos se pueden regalar)
        <input
          name="stock"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={defaultValues?.stock ?? 1}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Orden en la grilla
        <input
          name="order"
          type="number"
          step={1}
          defaultValue={defaultValues?.order ?? 0}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        className="mt-2 rounded-full bg-gold px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-terracotta-600"
      >
        Guardar
      </button>
    </form>
  );
}
