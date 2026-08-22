import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";
import { FlowPaymentStatus, type PaymentStatusResult } from "@/lib/payments/flow";
import {
  sendThankYouEmail,
  sendOwnerNotificationEmail,
  sendAdminAlertEmail,
} from "@/lib/email/resend";

export type ApplyResult =
  | { outcome: "approved" }
  | { outcome: "rejected" }
  | { outcome: "still-pending" }
  | { outcome: "already-resolved" }
  | { outcome: "anomaly-late-payment" };

/**
 * Aplica un estado de pago de Flow (obtenido vía payment/getStatus) a la
 * contribución correspondiente. Es el único lugar donde se decide si un
 * ítem pasa a GIFTED o vuelve a AVAILABLE - lo usan tanto el webhook de
 * confirmación como los dos crons, para que la lógica de negocio viva en
 * un solo lugar y sea testeable sin la app corriendo.
 */
export async function applyPaymentStatus(
  status: PaymentStatusResult,
  db: PrismaClient = defaultPrisma
): Promise<ApplyResult> {
  const contribution = await db.contribution.findUnique({
    where: { flowOrder: status.commerceOrder },
    include: { item: true },
  });

  if (!contribution) {
    throw new Error(
      `No existe contribución para commerceOrder=${status.commerceOrder}`
    );
  }

  if (status.status === FlowPaymentStatus.PAID) {
    if (contribution.status === "APPROVED") {
      return { outcome: "already-resolved" };
    }

    if (contribution.status !== "PENDING") {
      // Flow confirma el pago después de que nosotros ya dimos por
      // rechazada/expirada la reserva (ej. el timeout de 20 min venció
      // antes de que el banco confirmara una transferencia). El dinero
      // sí llegó; nunca lo descartamos en silencio.
      await sendAdminAlertEmail({
        subject: `Pago tardío aprobado para contribución ya ${contribution.status}`,
        details: {
          contributionId: contribution.id,
          itemId: contribution.itemId,
          itemName: contribution.item.name,
          guestName: contribution.guestName,
          guestEmail: contribution.guestEmail,
          amount: contribution.amount,
          flowOrder: status.flowOrder,
          commerceOrder: status.commerceOrder,
        },
      });
      return { outcome: "anomaly-late-payment" };
    }

    await db.$transaction([
      db.contribution.update({
        where: { id: contribution.id },
        data: { status: "APPROVED", confirmedAt: new Date() },
      }),
      db.item.update({
        where: { id: contribution.itemId },
        data: { status: "GIFTED", reservedUntil: null },
      }),
    ]);

    await sendThankYouEmail({
      guestEmail: contribution.guestEmail,
      guestName: contribution.guestName,
      itemName: contribution.item.name,
      amount: contribution.amount,
    });
    await sendOwnerNotificationEmail({
      guestName: contribution.guestName,
      guestEmail: contribution.guestEmail,
      itemName: contribution.item.name,
      amount: contribution.amount,
      message: contribution.message,
    });

    return { outcome: "approved" };
  }

  if (
    status.status === FlowPaymentStatus.REJECTED ||
    status.status === FlowPaymentStatus.CANCELED
  ) {
    if (contribution.status !== "PENDING") {
      return { outcome: "already-resolved" };
    }

    await db.$transaction([
      db.contribution.update({
        where: { id: contribution.id },
        data: { status: "REJECTED" },
      }),
      db.item.update({
        where: { id: contribution.itemId },
        data: { status: "AVAILABLE", reservedUntil: null },
      }),
    ]);

    return { outcome: "rejected" };
  }

  // FlowPaymentStatus.PENDING: todavía no hay nada que resolver.
  return { outcome: "still-pending" };
}
