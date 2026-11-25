import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";
import { ContributeForm } from "@/components/public/ContributeForm";
import { StatusBadge } from "@/components/public/StatusBadge";
import { PhotoCredit } from "@/components/public/PhotoCredit";

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
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-16">
      <a href={`/${slug}`} className="text-sm font-bold uppercase hover:underline">
        ← Volver a la lista
      </a>

      <p className="titulo mt-8 text-[clamp(3.5rem,18vw,6rem)]">Regalar</p>

      <div className="mt-2 bg-azul-600 p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <span className="etiqueta">Tu regalo</span>
          <StatusBadge stock={item.stock} />
        </div>
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="mt-4 aspect-[4/3] w-full border-4 border-white object-cover"
          />
        )}
        <PhotoCredit name={item.imageCredit} url={item.imageCreditUrl} className="mt-1" />
        <h1 className="mt-4 font-display text-3xl uppercase leading-[1.05]">{item.name}</h1>
        {item.description && <p className="mt-2 text-sm text-white/80">{item.description}</p>}
        <p className="mt-5 text-2xl font-bold">
          ${formatClp(item.price)}
          {item.stock > 1 && (
            <span className="ml-2 text-xs font-normal uppercase opacity-70">por aporte</span>
          )}
        </p>
      </div>

      <div className="mt-8">
        <ContributeForm itemId={item.id} />
      </div>
    </main>
  );
}
