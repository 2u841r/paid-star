import { eq } from "drizzle-orm";

import { auth } from "~/lib/auth";
import db from "~/lib/db";
import { paymentRequest } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Check if user has any payment requests
    const [existingRequest] = await db
      .select()
      .from(paymentRequest)
      .where(eq(paymentRequest.userId, session.user.id))
      .orderBy(paymentRequest.requestedAt);

    if (!existingRequest) {
      return {
        hasPaymentRequest: false,
        paymentRequest: null,
      };
    }

    return {
      hasPaymentRequest: true,
      paymentRequest: {
        id: existingRequest.id,
        status: existingRequest.status,
        mobileNumber: existingRequest.mobileNumber,
        paymentMethod: existingRequest.paymentMethod,
        githubId: existingRequest.githubId,
        requestedAt: existingRequest.requestedAt,
        adminNotes: existingRequest.adminNotes,
        verifiedAt: existingRequest.verifiedAt,
        paidAt: existingRequest.paidAt,
      },
    };
  }
  catch (error) {
    console.error("Error checking payment request status:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
