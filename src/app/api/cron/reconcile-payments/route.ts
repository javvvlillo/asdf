import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentStatus } from "@/lib/payments/flow";
import { applyPaymentStatus } from "@/lib/webhooks/apply-payment-status";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

const LOOKBACK_DAYS = 3;

/**
 * Corre una vez al día. Vuelve a preguntarle a Flow por cada contribución
 * de los últimos días que quedó PENDING o EXPIRED con token: es la red de
 * seguridad para cualquier pago aprobado que, por lo que sea (webhook que
 * nunca llegó, error de red, bug nuestro), no haya quedado registrado.
 * No usamos un endpoint de "pagos del día" de Flow porque no hay uno
 * documentado de forma confiable para listar transacciones por fecha;
 * reconsultar payment/getStatus por cada token pendiente cubre lo mismo
 * con la única llamada de la API que ya usamos y probamos.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await prisma.contribution.findMany({
    where: {
      status: { in: ["PENDING", "EXPIRED"] },
      flowToken: { not: null },
      createdAt: { gte: since },
    },
  });

  const results: Array<{ contributionId: string; outcome: string }> = [];

  for (const contribution of candidates) {
    try {
      const status = await getPaymentStatus(contribution.flowToken!);
      const result = await applyPaymentStatus(status);
      results.push({ contributionId: contribution.id, outcome: result.outcome });
    } catch (err) {
      console.error("Error reconciliando contribución", { contributionId: contribution.id, err });
      results.push({ contributionId: contribution.id, outcome: "error" });
    }
  }

  return NextResponse.json({ checked: candidates.length, results });
}
