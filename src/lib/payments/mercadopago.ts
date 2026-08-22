import crypto from "crypto";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

/**
 * Cliente de Mercado Pago (Checkout Pro).
 * Doc: https://www.mercadopago.cl/developers
 *
 * A diferencia de Flow, no hay host separado para sandbox: el modo
 * (pruebas vs producción) lo determina el prefijo del access token
 * (TEST-... vs APP_USR-...), no la URL.
 */

export interface MercadoPagoEnv {
  accessToken: string;
  webhookSecret: string;
}

export function getMercadoPagoEnv(): MercadoPagoEnv {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;

  if (!accessToken || !webhookSecret) {
    throw new Error(
      "Mercado Pago no está configurado: revisa MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET"
    );
  }

  return { accessToken, webhookSecret };
}

function client(accessToken: string): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken });
}

export interface CreatePreferenceParams {
  externalReference: string;
  itemName: string;
  amount: number;
  guestEmail: string;
  returnUrl: string;
  notificationUrl: string;
}

export interface CreatePreferenceResult {
  preferenceId: string;
  redirectUrl: string;
}

export async function createPreference(
  params: CreatePreferenceParams,
  env: MercadoPagoEnv = getMercadoPagoEnv()
): Promise<CreatePreferenceResult> {
  const preference = new Preference(client(env.accessToken));

  const response = await preference.create({
    body: {
      items: [
        {
          id: params.externalReference,
          title: params.itemName,
          quantity: 1,
          currency_id: "CLP",
          unit_price: params.amount,
        },
      ],
      payer: { email: params.guestEmail },
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      back_urls: {
        success: params.returnUrl,
        pending: params.returnUrl,
        failure: params.returnUrl,
      },
      auto_return: "approved",
    },
  });

  // Con un access token de prueba (TEST-...), Mercado Pago solo deja pagar
  // a través de sandbox_init_point - init_point exige credenciales productivas.
  const redirectUrl = response.sandbox_init_point ?? response.init_point;
  if (!redirectUrl || !response.id) {
    throw new Error("Mercado Pago no devolvió una preferencia válida");
  }

  return { preferenceId: response.id, redirectUrl };
}

export enum MercadoPagoPaymentStatus {
  APPROVED = "approved",
  PENDING = "pending",
  IN_PROCESS = "in_process",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  CHARGED_BACK = "charged_back",
}

export interface PaymentStatusResult {
  paymentId: string;
  externalReference: string;
  status: MercadoPagoPaymentStatus;
  amount: number;
}

export async function getPayment(
  paymentId: string,
  env: MercadoPagoEnv = getMercadoPagoEnv()
): Promise<PaymentStatusResult> {
  const response = await new Payment(client(env.accessToken)).get({ id: paymentId });
  return toPaymentStatusResult(response.id, response.external_reference, response.status, response.transaction_amount);
}

/**
 * Busca el pago asociado a una contribución por external_reference. Se usa
 * cuando todavía no tenemos un payment id propio (ej. al expirar una
 * reserva antes de que llegue el webhook, o en la reconciliación diaria).
 */
export async function findPaymentByExternalReference(
  externalReference: string,
  env: MercadoPagoEnv = getMercadoPagoEnv()
): Promise<PaymentStatusResult | null> {
  const result = await new Payment(client(env.accessToken)).search({
    options: { external_reference: externalReference },
  });

  const found = result.results?.[0];
  if (!found) return null;

  return toPaymentStatusResult(found.id, found.external_reference, found.status, found.transaction_amount);
}

function toPaymentStatusResult(
  id: string | number | undefined,
  externalReference: string | undefined,
  status: string | undefined,
  amount: number | undefined
): PaymentStatusResult {
  if (id === undefined || !externalReference || !status || amount === undefined) {
    throw new Error(`Respuesta de Mercado Pago incompleta para el pago ${id ?? "?"}`);
  }

  return {
    paymentId: String(id),
    externalReference,
    status: status as MercadoPagoPaymentStatus,
    amount,
  };
}

/**
 * Valida la firma x-signature de un webhook de Mercado Pago.
 *
 * Algoritmo (documentado por Mercado Pago): se arma un "manifest"
 * `id:{dataId en minúscula};request-id:{x-request-id};ts:{ts};` y se firma
 * con HMAC-SHA256 usando el secreto del webhook. El header x-signature
 * llega como `ts=...,v1=...`.
 */
export function verifyWebhookSignature(params: {
  xSignatureHeader: string;
  xRequestId: string;
  dataId: string;
  secret: string;
}): boolean {
  const parts: Record<string, string> = {};
  for (const pair of params.xSignatureHeader.split(",")) {
    const [key, value] = pair.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }

  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${params.dataId.toLowerCase()};request-id:${params.xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", params.secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(v1, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
