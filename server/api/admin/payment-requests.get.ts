import { auth } from "~/lib/auth";
import db from "~/lib/db";
import { paymentRequest, user } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession(event);

  if (!session || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const requests = await db
    .select({
      id: paymentRequest.id,
      status: paymentRequest.status,
      mobileNumber: paymentRequest.mobileNumber,
      paymentMethod: paymentRequest.paymentMethod,
      githubId: paymentRequest.githubId,
      adminNotes: paymentRequest.adminNotes,
      txnId: paymentRequest.txnId,
      requestedAt: paymentRequest.requestedAt,
      verifiedAt: paymentRequest.verifiedAt,
      paidAt: paymentRequest.paidAt,
      updatedAt: paymentRequest.updatedAt,
      userId: paymentRequest.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(paymentRequest)
    .leftJoin(user, eq(paymentRequest.userId, user.id))
    .orderBy(paymentRequest.requestedAt);

  return { requests };
});
