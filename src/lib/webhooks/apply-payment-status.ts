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
 * correspondiente. Es el único lugar donde se decide si baja el stock de
 * un ítem - lo usa el webhook de confirmación y el cron de reconciliación,
 * para que la lógica de negocio viva en un solo lugar y sea testeable sin
 * la app corriendo. El stock nunca baja al iniciar un pago, solo acá,
 * cuando Mercado Pago ya confirmó uno aprobado.
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
        // por rechazada la contribución. El dinero sí llegó; nunca lo
        // descartamos en silencio.
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

      const [, updatedItem] = await db.$transaction([
        db.contribution.update({
          where: { id: contribution.id },
          data: { status: "APPROVED", confirmedAt: new Date(), mpPaymentId: payment.paymentId },
        }),
        db.item.update({
          where: { id: contribution.itemId },
          data: { stock: { decrement: 1 } },
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

      if (updatedItem.stock < 0) {
        // Sin reservas no hay forma de garantizar que esto no pase con
        // poco stock y pagos casi simultáneos - se avisa para resolverlo
        // a mano con el invitado, en vez de mostrar un stock inconsistente.
        await sendAdminAlertEmail({
          subject: `Se vendió de más "${contribution.item.name}" (sin stock)`,
          details: {
            itemId: contribution.itemId,
            itemName: contribution.item.name,
            stockRestante: updatedItem.stock,
            contributionId: contribution.id,
            guestName: contribution.guestName,
            guestEmail: contribution.guestEmail,
          },
        });
      }

      return { outcome: "approved" };
    }

    case MercadoPagoPaymentStatus.REJECTED:
    case MercadoPagoPaymentStatus.CANCELLED: {
      if (contribution.status !== "PENDING") {
        return { outcome: "already-resolved" };
      }

      // El stock nunca bajó para esta contribución (no hay reservas), así
      // que no hay nada que revertir en el ítem.
      await db.contribution.update({
        where: { id: contribution.id },
        data: { status: "REJECTED", mpPaymentId: payment.paymentId },
      });

      return { outcome: "rejected" };
    }

    case MercadoPagoPaymentStatus.REFUNDED:
    case MercadoPagoPaymentStatus.CHARGED_BACK: {
      // El pago ya se había aprobado y el stock ya se descontó; el dinero
      // se devolvió después (reembolso o contracargo). No revertimos nada
      // automáticamente - el ítem puede ya estar en manos del invitado. Se
      // resuelve a mano, como el resto de las excepciones.
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
