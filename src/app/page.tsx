import { notFound, redirect } from "next/navigation";
import { getTheRegistry } from "@/lib/registry";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const registry = await getTheRegistry();
  if (!registry) notFound();
  redirect(`/${registry.slug}`);
}
