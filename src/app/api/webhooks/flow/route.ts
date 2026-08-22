import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentStatus } from "@/lib/payments/flow";
import { applyPaymentStatus } from "@/lib/webhooks/apply-payment-status";

/**
 * Única fuente de verdad del flujo de pago. Flow llama a esta URL
 * server-to-server tras resolver el pago (nunca desde el browser del
 * invitado). Siempre respondemos 200: si algo falla acá, confiar en que
 * Flow reintentará no es una estrategia - el cron de reconciliación
 * diaria es la red de seguridad real para pagos que no se pudieron
 * procesar en este request.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const token = new URLSearchParams(rawBody).get("token");

  if (!token) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    await processWebhook(token, rawBody);
  } catch (err) {
    console.error("Error procesando webhook de Flow", { token, err });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processWebhook(token: string, rawBody: string) {
  const existing = await prisma.webhookEvent.findUnique({ where: { flowToken: token } });

  if (existing?.processed) {
    return; // Flow reenvía notificaciones ya confirmadas - no hay nada que hacer.
  }

  const event = existing
    ? await prisma.webhookEvent.update({
        where: { flowToken: token },
        data: { attempts: { increment: 1 } },
      })
    : await prisma.webhookEvent.create({
        data: { flowToken: token, payloadRaw: rawBody, attempts: 1 },
      });

  try {
    const status = await getPaymentStatus(token);
    await applyPaymentStatus(status);
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { processed: true, error: null },
    });
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { error: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}
