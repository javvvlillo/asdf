import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { createPreference } from "@/lib/payments/mercadopago";

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

  // Solo bloquea iniciar un pago si ya no queda stock. No reserva ni
  // descuenta nada acá - el stock solo baja cuando Mercado Pago confirma
  // un pago aprobado (ver applyPaymentStatus). Entre este chequeo y ese
  // momento, dos invitados pueden pagar el mismo último cupo; es un
  // trade-off aceptado a cambio de no tener reservas temporales.
  if (item.stock <= 0) {
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
      externalReference: contributionId,
    },
  });

  try {
    const preference = await createPreference({
      externalReference: contribution.id,
      itemName: item.name,
      amount: item.price,
      guestEmail,
      notificationUrl: `${siteUrl}/api/webhooks/mercadopago`,
      // Mercado Pago agrega external_reference, payment_id y status a esta
      // URL automáticamente al redirigir - no hace falta armarla nosotros.
      returnUrl: `${siteUrl}/gracias`,
    });

    return NextResponse.json({ redirectUrl: preference.redirectUrl });
  } catch (err) {
    // Mercado Pago no pudo crear la preferencia: nunca se llegó a intentar
    // cobrar, así que solo descartamos la contribución - no hay nada más
    // que revertir.
    await prisma.contribution.delete({ where: { id: contribution.id } });

    console.error("Error creando preferencia en Mercado Pago", err);
    return NextResponse.json(
      { error: "No pudimos iniciar el pago. Intenta de nuevo en unos minutos." },
      { status: 502 }
    );
  }
}
