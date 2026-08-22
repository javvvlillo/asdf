import { prisma } from "@/lib/db";

export function getRegistryBySlug(slug: string) {
  return prisma.registry.findUnique({
    where: { slug },
    include: {
      items: { orderBy: { order: "asc" } },
    },
  });
}

/** Una sola lista, una sola boda: si hay más de una fila, se usa la primera. */
export function getTheRegistry() {
  return prisma.registry.findFirst();
}
