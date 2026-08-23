import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export default async function AdminContributionsPage() {
  const contributions = await prisma.contribution.findMany({
    orderBy: { createdAt: "desc" },
    include: { item: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Aportes</h1>
        <a
          href="/api/admin/contributions/export"
          className="rounded-full border border-charcoal/20 px-4 py-2 text-sm hover:border-gold hover:text-gold"
        >
          Exportar CSV
        </a>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-charcoal/50">
              <th className="py-2 pr-4">Fecha</th>
              <th className="pr-4">Invitado</th>
              <th className="pr-4">Regalo</th>
              <th className="pr-4">Monto</th>
              <th className="pr-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((c) => (
              <tr key={c.id} className="border-b border-charcoal/5">
                <td className="py-2 pr-4">{c.createdAt.toLocaleDateString("es-CL")}</td>
                <td className="pr-4">
                  {c.guestName}
                  <div className="text-xs text-charcoal/50">{c.guestEmail}</div>
                </td>
                <td className="pr-4">{c.item.name}</td>
                <td className="pr-4">${formatClp(c.amount)}</td>
                <td className="pr-4">{STATUS_LABELS[c.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {contributions.length === 0 && (
          <p className="py-8 text-center text-charcoal/50">Todavía no hay aportes.</p>
        )}
      </div>
    </div>
  );
}
