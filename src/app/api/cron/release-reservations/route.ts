import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentStatus } from "@/lib/payments/flow";
import { applyPaymentStatus } from "@/lib/webhooks/apply-payment-status";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

/**
 * Corre cada 5 minutos. Antes de liberar una reserva vencida, verifica con
 * Flow si el pago en realidad sí se completó (ej. una transferencia que
 * demoró más de los 20 minutos de reserva) - si no hiciéramos esto
 * podríamos regalar el mismo ítem dos veces mientras un pago real sigue
 * en camino.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expiredItems = await prisma.item.findMany({
    where: { status: "RESERVED", reservedUntil: { lt: now } },
  });

  const results: Array<{ itemId: string; action: string }> = [];

  for (const item of expiredItems) {
    const contribution = await prisma.contribution.findFirst({
      where: { itemId: item.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!contribution) {
      // No debería pasar: un ítem RESERVED siempre tiene una contribución
      // PENDING asociada. Liberamos igual para no dejarlo bloqueado.
      await prisma.item.update({
        where: { id: item.id },
        data: { status: "AVAILABLE", reservedUntil: null },
      });
      results.push({ itemId: item.id, action: "released-no-contribution" });
      continue;
    }

    if (contribution.flowToken) {
      try {
        const status = await getPaymentStatus(contribution.flowToken);
        const result = await applyPaymentStatus(status);
        if (result.outcome !== "still-pending") {
          results.push({ itemId: item.id, action: `resolved-${result.outcome}` });
          continue;
        }
      } catch (err) {
        console.error("Error consultando estado en Flow al expirar reserva", {
          itemId: item.id,
          contributionId: contribution.id,
          err,
        });
        // Si Flow no responde, preferimos no liberar el ítem todavía -
        // se reintentará en la próxima corrida del cron.
        results.push({ itemId: item.id, action: "skipped-flow-error" });
        continue;
      }
    }

    await prisma.$transaction([
      prisma.contribution.update({
        where: { id: contribution.id },
        data: { status: "EXPIRED" },
      }),
      prisma.item.update({
        where: { id: item.id },
        data: { status: "AVAILABLE", reservedUntil: null },
      }),
    ]);
    results.push({ itemId: item.id, action: "expired" });
  }

  return NextResponse.json({ checked: expiredItems.length, results });
}
