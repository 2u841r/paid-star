import { eq } from "drizzle-orm";

import { auth } from "~/lib/auth";
import db from "~/lib/db";
import { paymentRequest } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession(event);

  if (!session || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const id = Number(getRouterParam(event, "id"));
  const body = await readBody(event);

  const now = Date.now();
  const updates: Record<string, any> = {
    updatedAt: now,
  };

  if (body.status) updates.status = body.status;
  if (body.adminNotes !== undefined) updates.adminNotes = body.adminNotes;
  if (body.txnId !== undefined) updates.txnId = body.txnId;

  if (body.status === "paid" && !body.keepPaidAt) {
    updates.paidAt = now;
  }
  if (body.status === "verified") {
    updates.verifiedAt = now;
  }

  await db.update(paymentRequest).set(updates).where(eq(paymentRequest.id, id));

  return { success: true };
});
