import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRegistryBySlug } from "@/lib/registry";
import { Hero } from "@/components/public/Hero";
import { ItemGrid } from "@/components/public/ItemGrid";

export const dynamic = "force-dynamic"; // el estado de los regalos cambia todo el tiempo

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const registry = await getRegistryBySlug(slug);
  if (!registry) return {};

  const title = `${registry.coupleNames} · Lista de novios`;
  const description =
    registry.welcomeMessage ?? "Acompáñanos regalando algo de nuestra lista.";

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const registry = await getRegistryBySlug(slug);
  if (!registry) notFound();

  return (
    <main>
      <Hero
        coupleNames={registry.coupleNames}
        weddingDate={registry.weddingDate}
        eventTime={registry.eventTime}
        venue={registry.venue}
        welcomeMessage={registry.welcomeMessage}
      />
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6">
        <ItemGrid items={registry.items} slug={slug} />
      </section>
      <footer className="pb-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/invitacion/pareja-bailando.png"
          alt="Sofía y Cristóbal bailando"
          width={461}
          height={308}
          className="mx-auto w-64 sm:w-80"
        />
        <p className="titulo mt-2 text-[clamp(3.5rem,18vw,8rem)]">Te esperamos</p>
      </footer>
    </main>
  );
}
