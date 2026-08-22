import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { signParams, buildPaymentRedirectUrl, type CreatePaymentResult } from "./flow";

describe("signParams", () => {
  it("ordena los parámetros alfabéticamente antes de concatenar", () => {
    // Ejemplo de la documentación de Flow: dado apiKey, currency, amount
    // (en ese orden de inserción), el string a firmar debe quedar en
    // orden alfabético: amount, apiKey, currency.
    const params = {
      apiKey: "XXXX-XXXX-XXXX",
      currency: "CLP",
      amount: 5000,
    };

    const secretKey = "test-secret";
    const expectedStringToSign = "amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP";
    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(expectedStringToSign)
      .digest("hex");

    expect(signParams(params, secretKey)).toBe(expected);
  });

  it("es insensible al orden de inserción del objeto", () => {
    const secretKey = "another-secret";
    const a = signParams({ b: "2", a: "1", c: "3" }, secretKey);
    const b = signParams({ c: "3", a: "1", b: "2" }, secretKey);
    expect(a).toBe(b);
  });

  it("produce firmas distintas si cambia cualquier valor", () => {
    const secretKey = "another-secret";
    const base = signParams({ amount: 1000, commerceOrder: "abc" }, secretKey);
    const tampered = signParams({ amount: 1001, commerceOrder: "abc" }, secretKey);
    expect(base).not.toBe(tampered);
  });

  it("produce firmas distintas con distinta secretKey", () => {
    const params = { amount: 1000, commerceOrder: "abc" };
    const s1 = signParams(params, "secret-1");
    const s2 = signParams(params, "secret-2");
    expect(s1).not.toBe(s2);
  });

  it("nunca debe recibir el parámetro 's' como parte de lo firmado", () => {
    // Si por error se incluyera "s" en los params, cambiaría la firma
    // resultante. Este test documenta que signParams firma exactamente
    // lo que se le pasa - la responsabilidad de excluir "s" es de quien
    // arma el payload (buildSignedForm), no de signParams.
    const secretKey = "test-secret";
    const withoutS = signParams({ amount: 1000 }, secretKey);
    const withS = signParams({ amount: 1000, s: "deberia-no-estar" }, secretKey);
    expect(withoutS).not.toBe(withS);
  });

  it("produce un hex de 64 caracteres (SHA-256)", () => {
    const signature = signParams({ amount: 1000 }, "secret");
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("buildPaymentRedirectUrl", () => {
  it("arma la URL de redirect con el token como query param", () => {
    const result: CreatePaymentResult = {
      url: "https://sandbox.flow.cl/app/web/pay.php",
      token: "abc123",
      flowOrder: 999,
    };
    expect(buildPaymentRedirectUrl(result)).toBe(
      "https://sandbox.flow.cl/app/web/pay.php?token=abc123"
    );
  });
});
