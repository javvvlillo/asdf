import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ItemForm } from "@/components/admin/ItemForm";
import { updateItem } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl">Editar regalo</h1>
      <div className="mt-6 max-w-lg">
        <ItemForm action={updateItem.bind(null, item.id)} defaultValues={item} />
      </div>
    </div>
  );
}
