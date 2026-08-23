import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [availableCount, soldOutCount, approvedAgg] = await Promise.all([
    prisma.item.count({ where: { stock: { gt: 0 } } }),
    prisma.item.count({ where: { stock: { lte: 0 } } }),
    prisma.contribution.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl">Resumen</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Disponibles" value={availableCount} />
        <StatCard label="Agotados" value={soldOutCount} />
        <StatCard label="Regalos confirmados" value={approvedAgg._count} />
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
