import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPayment, verifyWebhookSignature, getMercadoPagoEnv } from "@/lib/payments/mercadopago";
import { applyPaymentStatus } from "@/lib/webhooks/apply-payment-status";

/**
 * Única fuente de verdad del flujo de pago. Mercado Pago llama a esta URL
 * server-to-server cuando cambia el estado de un pago (nunca desde el
 * browser del invitado). Siempre respondemos 200: si algo falla acá,
 * confiar en que Mercado Pago reintentará no es una estrategia - el cron
 * de reconciliación diaria es la red de seguridad real para pagos que no
 * se pudieron procesar en este request.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  const rawBody = await req.text();

  if (type !== "payment" || !dataId || !xSignature || !xRequestId) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const { webhookSecret } = getMercadoPagoEnv();
    const validSignature = verifyWebhookSignature({
      xSignatureHeader: xSignature,
      xRequestId,
      dataId,
      secret: webhookSecret,
    });

    if (!validSignature) {
      console.error("Firma de webhook de Mercado Pago inválida", { dataId });
    } else {
      await processWebhook(dataId, rawBody);
    }
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago", { dataId, err });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processWebhook(paymentId: string, rawBody: string) {
  const existing = await prisma.webhookEvent.findUnique({ where: { mpPaymentId: paymentId } });

  if (existing?.processed) {
    return; // Mercado Pago reenvía notificaciones ya confirmadas - no hay nada que hacer.
  }

  const event = existing
    ? await prisma.webhookEvent.update({
        where: { mpPaymentId: paymentId },
        data: { attempts: { increment: 1 } },
      })
    : await prisma.webhookEvent.create({
        data: { mpPaymentId: paymentId, payloadRaw: rawBody, attempts: 1 },
      });

  try {
    const payment = await getPayment(paymentId);
    await applyPaymentStatus(payment);
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
