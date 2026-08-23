import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { MercadoPagoPaymentStatus, type PaymentStatusResult } from "@/lib/payments/mercadopago";

vi.mock("@/lib/db", () => ({ prisma: {} }));

const emailMocks = vi.hoisted(() => ({
  sendThankYouEmail: vi.fn(),
  sendOwnerNotificationEmail: vi.fn(),
  sendAdminAlertEmail: vi.fn(),
}));
vi.mock("@/lib/email/resend", () => emailMocks);

const { applyPaymentStatus } = await import("./apply-payment-status");

function basePayment(overrides: Partial<PaymentStatusResult> = {}): PaymentStatusResult {
  return {
    paymentId: "999",
    externalReference: "contribution-1",
    status: MercadoPagoPaymentStatus.APPROVED,
    amount: 30000,
    ...overrides,
  };
}

function fakeContribution(overrides: Record<string, unknown> = {}) {
  return {
    id: "contribution-1",
    itemId: "item-1",
    guestName: "María",
    guestEmail: "maria@example.com",
    message: null,
    amount: 30000,
    status: "PENDING",
    mpPaymentId: null,
    externalReference: "contribution-1",
    item: { id: "item-1", name: "Set de sábanas" },
    ...overrides,
  };
}

function fakeDb(
  contribution: ReturnType<typeof fakeContribution> | null,
  itemAfterUpdate: { stock: number } = { stock: 3 }
) {
  const contributionUpdate = vi.fn().mockResolvedValue({});
  const itemUpdate = vi.fn().mockResolvedValue(itemAfterUpdate);
  const db = {
    contribution: {
      findUnique: vi.fn().mockResolvedValue(contribution),
      update: contributionUpdate,
    },
    item: {
      update: itemUpdate,
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaClient;

  return { db, contributionUpdate, itemUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("applyPaymentStatus", () => {
  it("lanza si no existe la contribución (external_reference debería ser siempre válido)", async () => {
    const { db } = fakeDb(null);
    await expect(applyPaymentStatus(basePayment(), db)).rejects.toThrow(/No existe contribución/);
  });

  it("aprueba la contribución y descuenta 1 del stock cuando Mercado Pago confirma el pago", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution());

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.APPROVED }),
      db
    );

    expect(result).toEqual({ outcome: "approved" });
    expect(contributionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED" }) })
    );
    expect(itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: { decrement: 1 } } })
    );
    expect(emailMocks.sendThankYouEmail).toHaveBeenCalledOnce();
    expect(emailMocks.sendOwnerNotificationEmail).toHaveBeenCalledOnce();
    expect(emailMocks.sendAdminAlertEmail).not.toHaveBeenCalled();
  });

  it("avisa por email cuando el descuento deja el stock en negativo (se vendió de más)", async () => {
    const { db } = fakeDb(fakeContribution(), { stock: -1 });

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.APPROVED }),
      db
    );

    expect(result).toEqual({ outcome: "approved" });
    expect(emailMocks.sendAdminAlertEmail).toHaveBeenCalledOnce();
  });

  it("ignora un webhook duplicado para un pago ya aprobado", async () => {
    const { db, contributionUpdate } = fakeDb(fakeContribution({ status: "APPROVED" }));

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.APPROVED }),
      db
    );

    expect(result).toEqual({ outcome: "already-resolved" });
    expect(contributionUpdate).not.toHaveBeenCalled();
    expect(emailMocks.sendThankYouEmail).not.toHaveBeenCalled();
  });

  it("avisa por email en vez de descartar en silencio un pago aprobado tardío sobre una contribución ya rechazada", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution({ status: "REJECTED" }));

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.APPROVED }),
      db
    );

    expect(result).toEqual({ outcome: "anomaly-late-payment" });
    expect(contributionUpdate).not.toHaveBeenCalled();
    expect(itemUpdate).not.toHaveBeenCalled();
    expect(emailMocks.sendAdminAlertEmail).toHaveBeenCalledOnce();
  });

  it("rechaza la contribución sin tocar el stock del ítem cuando Mercado Pago rechaza el pago", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution());

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.REJECTED }),
      db
    );

    expect(result).toEqual({ outcome: "rejected" });
    expect(contributionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REJECTED" }) })
    );
    expect(itemUpdate).not.toHaveBeenCalled();
  });

  it("no hace nada si Mercado Pago todavía reporta el pago como pendiente o en proceso", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution());

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.IN_PROCESS }),
      db
    );

    expect(result).toEqual({ outcome: "still-pending" });
    expect(contributionUpdate).not.toHaveBeenCalled();
    expect(itemUpdate).not.toHaveBeenCalled();
  });

  it("ignora un rechazo duplicado sobre una contribución que ya estaba resuelta", async () => {
    const { db, contributionUpdate } = fakeDb(fakeContribution({ status: "REJECTED" }));

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.REJECTED }),
      db
    );

    expect(result).toEqual({ outcome: "already-resolved" });
    expect(contributionUpdate).not.toHaveBeenCalled();
  });

  it("avisa por email cuando un pago ya aprobado se revierte (reembolso o contracargo)", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution({ status: "APPROVED" }));

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.REFUNDED }),
      db
    );

    expect(result).toEqual({ outcome: "anomaly-reversed-payment" });
    expect(contributionUpdate).not.toHaveBeenCalled();
    expect(itemUpdate).not.toHaveBeenCalled();
    expect(emailMocks.sendAdminAlertEmail).toHaveBeenCalledOnce();
  });

  it("ignora un contracargo sobre una contribución que nunca llegó a aprobarse", async () => {
    const { db } = fakeDb(fakeContribution({ status: "REJECTED" }));

    const result = await applyPaymentStatus(
      basePayment({ status: MercadoPagoPaymentStatus.CHARGED_BACK }),
      db
    );

    expect(result).toEqual({ outcome: "already-resolved" });
    expect(emailMocks.sendAdminAlertEmail).not.toHaveBeenCalled();
  });
});
