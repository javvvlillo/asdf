import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Precios en CLP y stock = cantidad de aportes disponibles por regalo.
// Son valores iniciales: se ajustan desde /admin/items sin tocar código.
const GIFTS: Array<{ name: string; description: string; price: number; stock: number }> = [
  {
    name: "cm de estatura para Sofía",
    description: "Para que llegue a la repisa de arriba sin pedir ayuda. Cada aporte suma 1 cm.",
    price: 15000,
    stock: 10,
  },
  {
    name: "La bici que Cristóbal no se compró por pagar el anillo",
    description: "Eligió el anillo antes que la bici. Es hora de devolverle el pedaleo.",
    price: 50000,
    stock: 8,
  },
  {
    name: "Thermomix para que la Sofía no cocine",
    description: "La Thermomix cocina, Sofía descansa y todos comemos mejor.",
    price: 60000,
    stock: 15,
  },
  {
    name: "Motorhome para recorrer la Patagonia",
    description: "Carretera Austral, mate y cero reservas de hotel.",
    price: 100000,
    stock: 20,
  },
  {
    name: "Un talonario de recetas para Cristóbal",
    description: "Porque las recetas se acaban más rápido que el turno.",
    price: 20000,
    stock: 5,
  },
  {
    name: "Un chaleco anti balas para el Cesfam",
    description: "Elemento de protección personal, versión atención primaria.",
    price: 45000,
    stock: 3,
  },
  {
    name: "Paciencia para Cristóbal",
    description: "Dosis diaria recomendada: harta.",
    price: 25000,
    stock: 10,
  },
  {
    name: "Paciencia para Sofía",
    description: "Se administra en dosis generosas, idealmente antes del desayuno.",
    price: 25000,
    stock: 10,
  },
  {
    name: "Bencina gratis por un año",
    description: "Cada aporte llena el estanque por un mes. Son 12 meses.",
    price: 50000,
    stock: 12,
  },
  {
    name: "Una rodilla nueva para Sofía",
    description: "Repuesto original, con garantía para bailar hasta las 00:00.",
    price: 60000,
    stock: 5,
  },
  {
    name: "Un crucero a la Antartida",
    description: "Pingüinos, hielo y nada de señal de celular.",
    price: 100000,
    stock: 20,
  },
  {
    name: "Un viaje a Islandia, Noruega y Finlandia",
    description: "Persiguiendo auroras boreales por el norte de Europa.",
    price: 100000,
    stock: 20,
  },
  {
    name: "Un paseo por Canadá y Alaska",
    description: "Osos, glaciares y mucha ropa térmica.",
    price: 100000,
    stock: 20,
  },
  {
    name: "Ropa nueva para Cristóbal",
    description: "Una renovación de clóset largamente postergada.",
    price: 35000,
    stock: 5,
  },
  {
    name: "Huevitos de pascua para el viernes Santo",
    description: "La boda cae justo en Viernes Santo. El conejo también está invitado.",
    price: 10000,
    stock: 20,
  },
];

async function main() {
  const registryData = {
    coupleNames: "Sofía & Cristóbal",
    weddingDate: new Date("2027-03-26T12:00:00-03:00"),
    eventTime: "De 14:00 a 00:00 horas",
    venue: "Punta Los Lunes, Puchuncaví",
    welcomeMessage:
      "Su compañía es nuestro mejor regalo. Pero si además quieren regalarnos algo, aquí va nuestra lista (100% honesta).",
  };

  const registry = await prisma.registry.upsert({
    where: { slug: "sofia-y-cristobal" },
    update: registryData,
    create: { slug: "sofia-y-cristobal", ...registryData },
  });

  // Los regalos que ya recibieron aportes no se tocan: borrarlos rompería el
  // historial de pagos. El resto se reemplaza por la lista de arriba.
  await prisma.item.deleteMany({
    where: { registryId: registry.id, contributions: { none: {} } },
  });
  const kept = await prisma.item.findMany({
    where: { registryId: registry.id },
    select: { name: true },
  });
  const keptNames = new Set(kept.map((i) => i.name));

  await prisma.item.createMany({
    data: GIFTS.map((gift, index) => ({ ...gift, registryId: registry.id, order: index + 1 }))
      .filter((gift) => !keptNames.has(gift.name)),
  });

  console.log(`Seed listo: ${registry.slug} (${GIFTS.length} regalos)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
