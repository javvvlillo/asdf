import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findPaymentByExternalReference } from "@/lib/payments/mercadopago";
import { applyPaymentStatus } from "@/lib/webhooks/apply-payment-status";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

const LOOKBACK_DAYS = 3;

/**
 * Corre una vez al día. Vuelve a preguntarle a Mercado Pago por cada
 * contribución de los últimos días que quedó PENDING: es la red de
 * seguridad para cualquier pago aprobado que, por lo que sea (webhook que
 * nunca llegó, error de red, bug nuestro), no haya quedado registrado.
 * Buscamos por external_reference (no hay un token/id guardado desde el
 * inicio como con Flow, ya que Mercado Pago solo genera el id del pago
 * cuando el invitado efectivamente paga).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await prisma.contribution.findMany({
    where: {
      status: "PENDING",
      createdAt: { gte: since },
    },
  });

  const results: Array<{ contributionId: string; outcome: string }> = [];

  for (const contribution of candidates) {
    try {
      const payment = await findPaymentByExternalReference(contribution.externalReference);
      if (!payment) {
        results.push({ contributionId: contribution.id, outcome: "no-payment-found" });
        continue;
      }
      const result = await applyPaymentStatus(payment);
      results.push({ contributionId: contribution.id, outcome: result.outcome });
    } catch (err) {
      console.error("Error reconciliando contribución", { contributionId: contribution.id, err });
      results.push({ contributionId: contribution.id, outcome: "error" });
    }
  }

  return NextResponse.json({ checked: candidates.length, results });
}
