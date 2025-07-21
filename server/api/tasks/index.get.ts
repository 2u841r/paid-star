import { eq } from "drizzle-orm";

import { auth } from "~/lib/auth";
import db from "~/lib/db";
import { task, userTaskCompletion } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Get all active tasks
    const tasks = await db.select().from(task).where(eq(task.isActive, true));

    // Get user's completed tasks
    const completedTasks = await db
      .select({ taskId: userTaskCompletion.taskId })
      .from(userTaskCompletion)
      .where(eq(userTaskCompletion.userId, session.user.id));

    const completedTaskIds = completedTasks.map(t => t.taskId);

    return {
      tasks,
      completedTasks: completedTaskIds,
    };
  }
  catch (error) {
    console.error("Error fetching tasks:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
