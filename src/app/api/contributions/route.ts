import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { createPayment, buildPaymentRedirectUrl } from "@/lib/payments/flow";

const RESERVATION_MINUTES = 20;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const itemId = typeof body?.itemId === "string" ? body.itemId : null;
  const guestName = typeof body?.guestName === "string" ? body.guestName.trim() : "";
  const guestEmail = typeof body?.guestEmail === "string" ? body.guestEmail.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : null;

  if (!itemId || !guestName || !guestEmail) {
    return NextResponse.json(
      { error: "Faltan datos: itemId, guestName y guestEmail son obligatorios" },
      { status: 400 }
    );
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "El regalo no existe" }, { status: 404 });
  }

  const now = new Date();
  const reservedUntil = new Date(now.getTime() + RESERVATION_MINUTES * 60_000);

  // Update condicional atómico: solo reserva si está AVAILABLE, o si está
  // RESERVED pero su reserva anterior ya venció. Esto evita que dos
  // invitados reserven el mismo ítem en una condición de carrera - la
  // garantía la da Postgres al ejecutar un solo UPDATE, no un
  // read-then-write en la aplicación.
  const reservation = await prisma.item.updateMany({
    where: {
      id: itemId,
      OR: [{ status: "AVAILABLE" }, { status: "RESERVED", reservedUntil: { lt: now } }],
    },
    data: { status: "RESERVED", reservedUntil },
  });

  if (reservation.count === 0) {
    return NextResponse.json(
      { error: "Este regalo ya no está disponible" },
      { status: 409 }
    );
  }

  const contributionId = randomUUID();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("Falta NEXT_PUBLIC_SITE_URL");
  }

  const contribution = await prisma.contribution.create({
    data: {
      id: contributionId,
      itemId: item.id,
      guestName,
      guestEmail,
      message,
      amount: item.price,
      flowOrder: contributionId,
    },
  });

  try {
    const payment = await createPayment({
      commerceOrder: contribution.id,
      subject: item.name,
      amount: item.price,
      email: guestEmail,
      urlConfirmation: `${siteUrl}/api/webhooks/flow`,
      urlReturn: `${siteUrl}/gracias`,
    });

    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { flowToken: payment.token },
    });

    return NextResponse.json({ redirectUrl: buildPaymentRedirectUrl(payment) });
  } catch (err) {
    // Flow no pudo crear la orden: liberamos el ítem y descartamos la
    // contribución - nunca se llegó a intentar cobrar, no queda nada que
    // reconciliar.
    await prisma.$transaction([
      prisma.item.update({
        where: { id: item.id },
        data: { status: "AVAILABLE", reservedUntil: null },
      }),
      prisma.contribution.delete({ where: { id: contribution.id } }),
    ]);

    console.error("Error creando pago en Flow", err);
    return NextResponse.json(
      { error: "No pudimos iniciar el pago. Intenta de nuevo en unos minutos." },
      { status: 502 }
    );
  }
}
