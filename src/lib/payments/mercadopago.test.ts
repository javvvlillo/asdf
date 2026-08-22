import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyWebhookSignature } from "./mercadopago";

function sign(manifest: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(manifest).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const secret = "test-webhook-secret";
  const dataId = "123456";
  const xRequestId = "bb56a2f1-6aae-46ac-982e-9dcd3581d08e";
  const ts = "1742505638683";

  // Manifest documentado por Mercado Pago para validar x-signature.
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  it("acepta una firma válida", () => {
    const v1 = sign(manifest, secret);
    const xSignatureHeader = `ts=${ts},v1=${v1}`;

    expect(
      verifyWebhookSignature({ xSignatureHeader, xRequestId, dataId, secret })
    ).toBe(true);
  });

  it("es insensible al orden ts/v1 dentro del header", () => {
    const v1 = sign(manifest, secret);
    const xSignatureHeader = `v1=${v1},ts=${ts}`;

    expect(
      verifyWebhookSignature({ xSignatureHeader, xRequestId, dataId, secret })
    ).toBe(true);
  });

  it("compara el data.id en minúscula, como especifica Mercado Pago", () => {
    const v1 = sign(manifest, secret); // manifest ya está en minúscula
    const xSignatureHeader = `ts=${ts},v1=${v1}`;

    expect(
      verifyWebhookSignature({
        xSignatureHeader,
        xRequestId,
        dataId: dataId.toUpperCase(),
        secret,
      })
    ).toBe(true);
  });

  it("rechaza si el data.id fue alterado", () => {
    const v1 = sign(manifest, secret);
    const xSignatureHeader = `ts=${ts},v1=${v1}`;

    expect(
      verifyWebhookSignature({ xSignatureHeader, xRequestId, dataId: "999999", secret })
    ).toBe(false);
  });

  it("rechaza si el ts fue alterado", () => {
    const v1 = sign(manifest, secret);
    const xSignatureHeader = `ts=9999999999999,v1=${v1}`;

    expect(
      verifyWebhookSignature({ xSignatureHeader, xRequestId, dataId, secret })
    ).toBe(false);
  });

  it("rechaza si el x-request-id no coincide con el firmado", () => {
    const v1 = sign(manifest, secret);
    const xSignatureHeader = `ts=${ts},v1=${v1}`;

    expect(
      verifyWebhookSignature({
        xSignatureHeader,
        xRequestId: "otro-request-id",
        dataId,
        secret,
      })
    ).toBe(false);
  });

  it("rechaza con el secreto equivocado", () => {
    const v1 = sign(manifest, "un-secreto-distinto");
    const xSignatureHeader = `ts=${ts},v1=${v1}`;

    expect(
      verifyWebhookSignature({ xSignatureHeader, xRequestId, dataId, secret })
    ).toBe(false);
  });

  it("no lanza excepción con un header malformado", () => {
    expect(
      verifyWebhookSignature({
        xSignatureHeader: "esto-no-tiene-el-formato-esperado",
        xRequestId,
        dataId,
        secret,
      })
    ).toBe(false);
  });

  it("no lanza excepción si v1 no es hex válido", () => {
    expect(
      verifyWebhookSignature({
        xSignatureHeader: `ts=${ts},v1=no-es-hexadecimal`,
        xRequestId,
        dataId,
        secret,
      })
    ).toBe(false);
  });
});
