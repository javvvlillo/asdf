import crypto from "crypto";

/**
 * Cliente de la API REST de Flow.cl.
 * Doc: https://www.flow.cl/docs/api.html
 *
 * Toda llamada va firmada: se ordenan los parámetros alfabéticamente por
 * nombre, se concatenan como `nombre1valor1nombre2valor2...` (sin el
 * parámetro "s") y se firma ese string con HMAC-SHA256 usando el secretKey.
 */

export interface FlowConfig {
  apiUrl: string;
  apiKey: string;
  secretKey: string;
}

export function getFlowConfig(): FlowConfig {
  const apiUrl = process.env.FLOW_API_URL;
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;

  if (!apiUrl || !apiKey || !secretKey) {
    throw new Error(
      "Flow no está configurado: revisa FLOW_API_URL, FLOW_API_KEY y FLOW_SECRET_KEY"
    );
  }

  return { apiUrl, apiKey, secretKey };
}

/**
 * Firma un set de parámetros según el algoritmo de Flow: orden alfabético
 * ascendente por nombre de parámetro, concatenación sin separadores, HMAC-SHA256
 * en hexadecimal. El parámetro "s" nunca debe estar incluido en `params`.
 */
export function signParams(
  params: Record<string, string | number>,
  secretKey: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
}

function buildSignedForm(
  params: Record<string, string | number>,
  secretKey: string
): URLSearchParams {
  const signature = signParams(params, secretKey);
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    form.set(key, String(value));
  }
  form.set("s", signature);
  return form;
}

export interface CreatePaymentParams {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}

export interface CreatePaymentResult {
  url: string;
  token: string;
  flowOrder: number;
}

export async function createPayment(
  params: CreatePaymentParams,
  config: FlowConfig = getFlowConfig()
): Promise<CreatePaymentResult> {
  const body = buildSignedForm(
    {
      apiKey: config.apiKey,
      commerceOrder: params.commerceOrder,
      subject: params.subject,
      currency: "CLP",
      amount: params.amount,
      email: params.email,
      urlConfirmation: params.urlConfirmation,
      urlReturn: params.urlReturn,
    },
    config.secretKey
  );

  const response = await fetch(`${config.apiUrl}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Flow payment/create falló (${response.status}): ${text}`);
  }

  return response.json();
}

/** Construye la URL a la que se redirige al invitado para pagar. */
export function buildPaymentRedirectUrl(result: CreatePaymentResult): string {
  return `${result.url}?token=${result.token}`;
}

export enum FlowPaymentStatus {
  PENDING = 1,
  PAID = 2,
  REJECTED = 3,
  CANCELED = 4,
}

export interface PaymentStatusResult {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: FlowPaymentStatus;
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  paymentData?: {
    date: string;
    media: string;
    conversionDate: string;
    conversionRate: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
    transferDate: string;
  };
}

export async function getPaymentStatus(
  token: string,
  config: FlowConfig = getFlowConfig()
): Promise<PaymentStatusResult> {
  const query = buildSignedForm(
    { apiKey: config.apiKey, token },
    config.secretKey
  );

  const response = await fetch(`${config.apiUrl}/payment/getStatus?${query.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Flow payment/getStatus falló (${response.status}): ${text}`);
  }

  return response.json();
}
