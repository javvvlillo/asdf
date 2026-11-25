import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Precios en CLP y stock = cantidad de aportes disponibles por regalo.
// Son valores iniciales: se ajustan desde /admin/items sin tocar código.
type Gift = {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
};

const GIFTS: Gift[] = [
  {
    name: "cm de estatura para Sofía",
    description: "Para que llegue a la repisa de arriba sin pedir ayuda. Cada aporte suma 1 cm.",
    price: 15000,
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1550985543-49bee3167284?w=800&q=80&auto=format&fit=crop",
    imageCredit: "William Warby",
    imageCreditUrl: "https://unsplash.com/photos/WahfNoqbYnM?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "La bici que Cristóbal no se compró por pagar el anillo",
    description: "Eligió el anillo antes que la bici. Es hora de devolverle el pedaleo.",
    price: 50000,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Dmitrii Vaccinium",
    imageCreditUrl: "https://unsplash.com/photos/sw9Vozf6j_4?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Thermomix para que la Sofía no cocine",
    description: "La Thermomix cocina, Sofía descansa y todos comemos mejor.",
    price: 60000,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1595644258096-69155da290fd?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Kolby Milton",
    imageCreditUrl: "https://unsplash.com/photos/IEIoyXSvFD8?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Motorhome para recorrer la Patagonia",
    description: "Carretera Austral, mate y cero reservas de hotel.",
    price: 100000,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1600256697197-02d4e0b93af6?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Tobias Tullius",
    imageCreditUrl: "https://unsplash.com/photos/Q2tPY6zHdSA?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Un talonario de recetas para Cristóbal",
    description: "Porque las recetas se acaban más rápido que el turno.",
    price: 20000,
    stock: 5,
    imageUrl: "https://images.unsplash.com/photo-1758691461990-03b49d969495?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Vitaly Gariev",
    imageCreditUrl: "https://unsplash.com/photos/8WYkI3cEZm8?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Un chaleco anti balas para el Cesfam",
    description: "Elemento de protección personal, versión atención primaria.",
    price: 45000,
    stock: 3,
    imageUrl: "https://images.unsplash.com/photo-1709507531336-3e681fd91956?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Del Nijiro",
    imageCreditUrl: "https://unsplash.com/photos/2b0QW5FTy9A?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Paciencia para Cristóbal",
    description: "Dosis diaria recomendada: harta.",
    price: 25000,
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Nathan Dumlao",
    imageCreditUrl: "https://unsplash.com/photos/LPRrEJU2GbQ?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Paciencia para Sofía",
    description: "Se administra en dosis generosas, idealmente antes del desayuno.",
    price: 25000,
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1522075782449-e45a34f1ddfb?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Sage Friedman",
    imageCreditUrl: "https://unsplash.com/photos/HS5CLnQbCOc?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Bencina gratis por un año",
    description: "Cada aporte llena el estanque por un mes. Son 12 meses.",
    price: 50000,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1709719263439-364363375a3a?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Ali Mkumbwa",
    imageCreditUrl: "https://unsplash.com/photos/BK20Ws-wSFc?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Una rodilla nueva para Sofía",
    description: "Repuesto original, con garantía para bailar hasta las 00:00.",
    price: 60000,
    stock: 5,
    imageUrl: "https://images.unsplash.com/photo-1609113160023-4e31f3765fd7?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Terry Shultz P.T.",
    imageCreditUrl: "https://unsplash.com/photos/EQ-53WaTNC4?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Un crucero a la Antartida",
    description: "Pingüinos, hielo y nada de señal de celular.",
    price: 100000,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1556918936-216daf8e7c4c?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Derek Oyen",
    imageCreditUrl: "https://unsplash.com/photos/-Eu3Iud63rA?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Un viaje a Islandia, Noruega y Finlandia",
    description: "Persiguiendo auroras boreales por el norte de Europa.",
    price: 100000,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1488415032361-b7e238421f1b?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Jonatan Pie",
    imageCreditUrl: "https://unsplash.com/photos/EvKBHBGgaUo?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Un paseo por Canadá y Alaska",
    description: "Osos, glaciares y mucha ropa térmica.",
    price: 100000,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1673114819432-1aa36952dd3e?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Tomas Gonzalez de Rosenzweig",
    imageCreditUrl: "https://unsplash.com/photos/-bPLCEAjaSs?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Ropa nueva para Cristóbal",
    description: "Una renovación de clóset largamente postergada.",
    price: 35000,
    stock: 5,
    imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Amanda Vick",
    imageCreditUrl: "https://unsplash.com/photos/ohWf6YuzOQk?utm_source=lista_sofia_cristobal&utm_medium=referral",
  },
  {
    name: "Huevitos de pascua para el viernes Santo",
    description: "La boda cae justo en Viernes Santo. El conejo también está invitado.",
    price: 10000,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1648022386629-224c9b86e2f9?w=800&q=80&auto=format&fit=crop",
    imageCredit: "Melissa Walker Horn",
    imageCreditUrl: "https://unsplash.com/photos/2sYQPiE5o1E?utm_source=lista_sofia_cristobal&utm_medium=referral",
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
