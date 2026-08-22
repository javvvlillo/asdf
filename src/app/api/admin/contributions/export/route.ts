import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const contributions = await prisma.contribution.findMany({
    orderBy: { createdAt: "desc" },
    include: { item: true },
  });

  const header = ["Fecha", "Invitado", "Email", "Regalo", "Monto", "Estado", "Mensaje"];
  const rows = contributions.map((c) => [
    c.createdAt.toISOString(),
    c.guestName,
    c.guestEmail,
    c.item.name,
    String(c.amount),
    c.status,
    c.message ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aportes.csv"',
    },
  });
}
