import type { NextRequest } from "next/server";

/** Vercel Cron llama con `Authorization: Bearer $CRON_SECRET`. */
export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
