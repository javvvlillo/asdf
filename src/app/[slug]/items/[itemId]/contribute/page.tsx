import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";
import { ContributeForm } from "@/components/public/ContributeForm";

export const dynamic = "force-dynamic";

export default async function ContributePage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { registry: true },
  });

  if (!item || item.registry.slug !== slug) {
    notFound();
  }

  if (item.stock <= 0) {
    redirect(`/${slug}`);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <a href={`/${slug}`} className="text-sm text-charcoal/60 hover:underline">
        ← Volver a la lista
      </a>

      <div className="mt-6 rounded-2xl border border-charcoal/10 bg-white/70 p-6">
        <h1 className="font-display text-2xl">{item.name}</h1>
        {item.description && (
          <p className="mt-2 text-sm text-charcoal/70">{item.description}</p>
        )}
        <p className="mt-4 font-display text-2xl text-terracotta-600">
          ${formatClp(item.price)}
        </p>
      </div>

      <div className="mt-8">
        <ContributeForm itemId={item.id} />
      </div>
    </main>
  );
}
