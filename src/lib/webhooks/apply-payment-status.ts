import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";
import { MercadoPagoPaymentStatus, type PaymentStatusResult } from "@/lib/payments/mercadopago";
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
  | { outcome: "anomaly-late-payment" }
  | { outcome: "anomaly-reversed-payment" };

/**
 * Aplica un estado de pago de Mercado Pago a la contribución
 * correspondiente. Es el único lugar donde se decide si un ítem pasa a
 * GIFTED o vuelve a AVAILABLE - lo usan el webhook de confirmación y los
 * dos crons, para que la lógica de negocio viva en un solo lugar y sea
 * testeable sin la app corriendo.
 */
export async function applyPaymentStatus(
  payment: PaymentStatusResult,
  db: PrismaClient = defaultPrisma
): Promise<ApplyResult> {
  const contribution = await db.contribution.findUnique({
    where: { externalReference: payment.externalReference },
    include: { item: true },
  });

  if (!contribution) {
    throw new Error(
      `No existe contribución para externalReference=${payment.externalReference}`
    );
  }

  switch (payment.status) {
    case MercadoPagoPaymentStatus.APPROVED: {
      if (contribution.status === "APPROVED") {
        return { outcome: "already-resolved" };
      }

      if (contribution.status !== "PENDING") {
        // Mercado Pago confirma el pago después de que nosotros ya dimos
        // por rechazada/expirada la reserva (ej. el timeout de 20 min
        // venció antes de que se acreditara una transferencia). El dinero
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
            mpPaymentId: payment.paymentId,
            externalReference: payment.externalReference,
          },
        });
        return { outcome: "anomaly-late-payment" };
      }

      await db.$transaction([
        db.contribution.update({
          where: { id: contribution.id },
          data: { status: "APPROVED", confirmedAt: new Date(), mpPaymentId: payment.paymentId },
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

    case MercadoPagoPaymentStatus.REJECTED:
    case MercadoPagoPaymentStatus.CANCELLED: {
      if (contribution.status !== "PENDING") {
        return { outcome: "already-resolved" };
      }

      await db.$transaction([
        db.contribution.update({
          where: { id: contribution.id },
          data: { status: "REJECTED", mpPaymentId: payment.paymentId },
        }),
        db.item.update({
          where: { id: contribution.itemId },
          data: { status: "AVAILABLE", reservedUntil: null },
        }),
      ]);

      return { outcome: "rejected" };
    }

    case MercadoPagoPaymentStatus.REFUNDED:
    case MercadoPagoPaymentStatus.CHARGED_BACK: {
      // El pago ya se había aprobado y el ítem ya se marcó regalado; el
      // dinero se devolvió después (reembolso o contracargo). No
      // revertimos nada automáticamente - el ítem puede ya estar en manos
      // del invitado. Se resuelve a mano, como el resto de las excepciones.
      if (contribution.status !== "APPROVED") {
        return { outcome: "already-resolved" };
      }

      await sendAdminAlertEmail({
        subject: `Pago revertido (${payment.status}) para un regalo ya confirmado`,
        details: {
          contributionId: contribution.id,
          itemId: contribution.itemId,
          itemName: contribution.item.name,
          guestName: contribution.guestName,
          guestEmail: contribution.guestEmail,
          amount: contribution.amount,
          mpPaymentId: payment.paymentId,
        },
      });

      return { outcome: "anomaly-reversed-payment" };
    }

    default:
      // pending, in_process u otros estados transitorios de Mercado Pago.
      return { outcome: "still-pending" };
  }
}
