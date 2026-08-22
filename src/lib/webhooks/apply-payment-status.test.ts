import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { FlowPaymentStatus, type PaymentStatusResult } from "@/lib/payments/flow";

vi.mock("@/lib/db", () => ({ prisma: {} }));

const emailMocks = vi.hoisted(() => ({
  sendThankYouEmail: vi.fn(),
  sendOwnerNotificationEmail: vi.fn(),
  sendAdminAlertEmail: vi.fn(),
}));
vi.mock("@/lib/email/resend", () => emailMocks);

const { applyPaymentStatus } = await import("./apply-payment-status");

function baseStatus(overrides: Partial<PaymentStatusResult> = {}): PaymentStatusResult {
  return {
    flowOrder: 999,
    commerceOrder: "contribution-1",
    requestDate: new Date().toISOString(),
    status: FlowPaymentStatus.PAID,
    subject: "Set de sábanas",
    currency: "CLP",
    amount: 30000,
    payer: "invitado@example.com",
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
    flowToken: "tok-1",
    flowOrder: "contribution-1",
    item: { id: "item-1", name: "Set de sábanas" },
    ...overrides,
  };
}

function fakeDb(contribution: ReturnType<typeof fakeContribution> | null) {
  const contributionUpdate = vi.fn().mockResolvedValue({});
  const itemUpdate = vi.fn().mockResolvedValue({});
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
  it("lanza si no existe la contribución (commerceOrder debería ser siempre válido)", async () => {
    const { db } = fakeDb(null);
    await expect(applyPaymentStatus(baseStatus(), db)).rejects.toThrow(/No existe contribución/);
  });

  it("aprueba la contribución y marca el ítem como regalado cuando Flow confirma el pago", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution());

    const result = await applyPaymentStatus(baseStatus({ status: FlowPaymentStatus.PAID }), db);

    expect(result).toEqual({ outcome: "approved" });
    expect(contributionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED" }) })
    );
    expect(itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "GIFTED" }) })
    );
    expect(emailMocks.sendThankYouEmail).toHaveBeenCalledOnce();
    expect(emailMocks.sendOwnerNotificationEmail).toHaveBeenCalledOnce();
  });

  it("ignora un webhook duplicado para un pago ya aprobado", async () => {
    const { db, contributionUpdate } = fakeDb(fakeContribution({ status: "APPROVED" }));

    const result = await applyPaymentStatus(baseStatus({ status: FlowPaymentStatus.PAID }), db);

    expect(result).toEqual({ outcome: "already-resolved" });
    expect(contributionUpdate).not.toHaveBeenCalled();
    expect(emailMocks.sendThankYouEmail).not.toHaveBeenCalled();
  });

  it("avisa por email en vez de descartar en silencio un pago aprobado tardío sobre una reserva ya expirada", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution({ status: "EXPIRED" }));

    const result = await applyPaymentStatus(baseStatus({ status: FlowPaymentStatus.PAID }), db);

    expect(result).toEqual({ outcome: "anomaly-late-payment" });
    expect(contributionUpdate).not.toHaveBeenCalled();
    expect(itemUpdate).not.toHaveBeenCalled();
    expect(emailMocks.sendAdminAlertEmail).toHaveBeenCalledOnce();
  });

  it("rechaza la contribución y libera el ítem cuando Flow rechaza el pago", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution());

    const result = await applyPaymentStatus(
      baseStatus({ status: FlowPaymentStatus.REJECTED }),
      db
    );

    expect(result).toEqual({ outcome: "rejected" });
    expect(contributionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "REJECTED" } })
    );
    expect(itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "AVAILABLE", reservedUntil: null } })
    );
  });

  it("no hace nada si Flow todavía reporta el pago como pendiente", async () => {
    const { db, contributionUpdate, itemUpdate } = fakeDb(fakeContribution());

    const result = await applyPaymentStatus(
      baseStatus({ status: FlowPaymentStatus.PENDING }),
      db
    );

    expect(result).toEqual({ outcome: "still-pending" });
    expect(contributionUpdate).not.toHaveBeenCalled();
    expect(itemUpdate).not.toHaveBeenCalled();
  });

  it("ignora un rechazo duplicado sobre una contribución que ya estaba resuelta", async () => {
    const { db, contributionUpdate } = fakeDb(fakeContribution({ status: "EXPIRED" }));

    const result = await applyPaymentStatus(
      baseStatus({ status: FlowPaymentStatus.REJECTED }),
      db
    );

    expect(result).toEqual({ outcome: "already-resolved" });
    expect(contributionUpdate).not.toHaveBeenCalled();
  });
});
