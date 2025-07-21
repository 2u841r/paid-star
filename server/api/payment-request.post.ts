import { and, eq } from "drizzle-orm";

import { auth } from "~/lib/auth";
import db from "~/lib/db";
import { paymentRequest, task, userTaskCompletion } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { mobileNumber, paymentMethod, githubId } = body;

  // Validate required fields
  if (!mobileNumber || !paymentMethod || !githubId) {
    throw createError({
      statusCode: 400,
      statusMessage: "All fields are required",
    });
  }

  // Validate mobile number format (11 digits starting with 0)
  if (!/^01\d{9}$/.test(mobileNumber)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid mobile number format",
    });
  }

  // Validate payment method
  const validPaymentMethods = ["GP", "BL", "Robi", "Airtel", "Teletalk", "bKash", "Nagad", "Rocket"];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid payment method",
    });
  }

  try {
    // Check if user has completed all tasks
    const allTasks = await db.select().from(task).where(eq(task.isActive, true));
    const completedTasks = await db
      .select({ taskId: userTaskCompletion.taskId })
      .from(userTaskCompletion)
      .where(eq(userTaskCompletion.userId, session.user.id));

    const completedTaskIds = completedTasks.map(t => t.taskId);
    const allTaskIds = allTasks.map(t => t.id);

    // Check if all tasks are completed
    const allCompleted = allTaskIds.every(taskId => completedTaskIds.includes(taskId));

    if (!allCompleted) {
      throw createError({
        statusCode: 400,
        statusMessage: "You must complete all tasks before submitting a payment request",
      });
    }

    // Check if user already has a pending payment request
    const [existingRequest] = await db
      .select()
      .from(paymentRequest)
      .where(
        and(
          eq(paymentRequest.userId, session.user.id),
          eq(paymentRequest.status, "pending"),
        ),
      );

    if (existingRequest) {
      throw createError({
        statusCode: 400,
        statusMessage: "You already have a pending payment request",
      });
    }

    // Create payment request
    await db.insert(paymentRequest).values({
      userId: session.user.id,
      mobileNumber,
      paymentMethod,
      githubId,
      status: "pending",
      requestedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Payment request submitted successfully",
    };
  }
  catch (error) {
    console.error("Error submitting payment request:", error);

    // If it's already a createError, re-throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
