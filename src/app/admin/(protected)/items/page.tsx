import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";
import { deleteItem } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "tiene-aportes": "No se pudo eliminar: este regalo ya tiene aportes asociados.",
  "no-se-pudo-crear": "No se pudo crear el regalo. Revisa los datos e intenta de nuevo.",
  "no-se-pudo-guardar": "No se pudo guardar el regalo. Revisa los datos e intenta de nuevo.",
};

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const items = await prisma.item.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Regalos</h1>
        <Link
          href="/admin/items/new"
          className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600"
        >
          + Nuevo
        </Link>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-charcoal/50">
              <th className="py-2 pr-4">Nombre</th>
              <th className="pr-4">Precio</th>
              <th className="pr-4">Stock</th>
              <th className="pr-4">Orden</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-charcoal/5">
                <td className="py-2 pr-4">{item.name}</td>
                <td className="pr-4">${formatClp(item.price)}</td>
                <td className="pr-4">
                  {item.stock > 0 ? item.stock : <span className="text-charcoal/50">Agotado</span>}
                </td>
                <td className="pr-4">{item.order}</td>
                <td className="space-x-3 py-2 text-right">
                  <Link href={`/admin/items/${item.id}`} className="text-gold hover:underline">
                    Editar
                  </Link>
                  <form action={deleteItem.bind(null, item.id)} className="inline">
                    <button type="submit" className="text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="py-8 text-center text-charcoal/50">Todavía no hay regalos cargados.</p>
        )}
      </div>
    </div>
  );
}
