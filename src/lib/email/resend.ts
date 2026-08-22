import { Resend } from "resend";
import { formatClp } from "@/lib/format";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Resend no está configurado: falta RESEND_API_KEY");
  }
  return new Resend(apiKey);
}

function getFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Falta EMAIL_FROM");
  return from;
}

export async function sendThankYouEmail(params: {
  guestEmail: string;
  guestName: string;
  itemName: string;
  amount: number;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: getFrom(),
    to: params.guestEmail,
    subject: "¡Gracias por tu regalo!",
    html: `
      <p>Hola ${params.guestName},</p>
      <p>¡Muchas gracias por regalarnos <strong>${params.itemName}</strong>
      (${formatClp(params.amount)} CLP)! Tu aporte quedó confirmado.</p>
      <p>Nos vemos en la boda 💛</p>
    `,
  });
}

export async function sendOwnerNotificationEmail(params: {
  guestName: string;
  guestEmail: string;
  itemName: string;
  amount: number;
  message?: string | null;
}) {
  const resend = getResend();
  const notifyTo = process.env.EMAIL_NOTIFY_TO;
  if (!notifyTo) return; // opcional: si no está configurado, no falla el flujo de pago

  await resend.emails.send({
    from: getFrom(),
    to: notifyTo,
    subject: `Nuevo regalo: ${params.itemName}`,
    html: `
      <p><strong>${params.guestName}</strong> (${params.guestEmail}) les regaló
      <strong>${params.itemName}</strong> (${formatClp(params.amount)} CLP).</p>
      ${params.message ? `<p>Mensaje: "${params.message}"</p>` : ""}
    `,
  });
}

/**
 * Alerta para casos que requieren revisión manual: por ejemplo un pago que
 * Mercado Pago confirma como aprobado pero cuya reserva ya había expirado
 * en nuestro sistema. No intentamos resolver esto automáticamente - solo
 * avisamos para que se resuelva a mano, como el resto de las excepciones
 * de pago en este proyecto.
 */
export async function sendAdminAlertEmail(params: {
  subject: string;
  details: Record<string, unknown>;
}) {
  const notifyTo = process.env.EMAIL_NOTIFY_TO;
  if (!notifyTo) return;

  const resend = getResend();
  await resend.emails.send({
    from: getFrom(),
    to: notifyTo,
    subject: `[ACCIÓN REQUERIDA] ${params.subject}`,
    html: `<pre>${JSON.stringify(params.details, null, 2)}</pre>`,
  });
}
