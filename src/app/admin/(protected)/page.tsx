import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [itemCounts, approvedAgg] = await Promise.all([
    prisma.item.groupBy({ by: ["status"], _count: true }),
    prisma.contribution.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    itemCounts.map((c) => [c.status, c._count])
  ) as Record<string, number>;

  return (
    <div>
      <h1 className="font-display text-2xl">Resumen</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Disponibles" value={countByStatus.AVAILABLE ?? 0} />
        <StatCard label="Reservados" value={countByStatus.RESERVED ?? 0} />
        <StatCard label="Regalados" value={countByStatus.GIFTED ?? 0} />
        <StatCard label="Recaudado" value={`$${formatClp(approvedAgg._sum.amount ?? 0)}`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white/70 p-4">
      <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
