import { ItemForm } from "@/components/admin/ItemForm";
import { createItem } from "@/lib/admin/actions";

export default function NewItemPage() {
  return (
    <div>
      <h1 className="font-display text-2xl">Nuevo regalo</h1>
      <div className="mt-6 max-w-lg">
        <ItemForm action={createItem} />
      </div>
    </div>
  );
}
