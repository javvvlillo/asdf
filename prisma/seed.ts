import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const registry = await prisma.registry.upsert({
    where: { slug: "javiera-y-sebastian" },
    update: {},
    create: {
      slug: "javiera-y-sebastian",
      coupleNames: "Javiera & Sebastián",
      weddingDate: new Date("2026-12-12"),
      welcomeMessage:
        "Gracias por acompañarnos en este día tan especial. Si quieres hacernos un regalo, aquí puedes elegir algo con cariño.",
    },
  });

  await prisma.item.createMany({
    data: [
      {
        registryId: registry.id,
        name: "Set de sábanas de lino",
        description: "Para nuestras primeras noches en el depto nuevo.",
        imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
        price: 65000,
        order: 1,
      },
      {
        registryId: registry.id,
        name: "Máquina de café",
        description: "Café bueno todas las mañanas.",
        imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800",
        price: 120000,
        order: 2,
      },
      {
        registryId: registry.id,
        name: "Luna de miel - noche en el sur",
        description: "Un aporte para nuestra luna de miel en la Patagonia.",
        imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
        price: 90000,
        order: 3,
      },
      {
        registryId: registry.id,
        name: "Juego de cuchillos",
        imageUrl: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800",
        price: 45000,
        order: 4,
        status: "GIFTED",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed listo:", registry.slug);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
