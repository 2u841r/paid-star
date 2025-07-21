import { and, eq } from "drizzle-orm";

import { auth } from "~/lib/auth";
import db from "~/lib/db";
import { task, userTaskCompletion } from "~/lib/db/schema";
import { account } from "~/lib/db/schema/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const taskId = getRouterParam(event, "id");
  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Task ID is required",
    });
  }

  try {
    // Get the task
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, Number.parseInt(taskId)));

    if (!taskRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: "Task not found",
      });
    }

    // Check if already completed
    const [existingCompletion] = await db
      .select()
      .from(userTaskCompletion)
      .where(
        and(
          eq(userTaskCompletion.userId, session.user.id),
          eq(userTaskCompletion.taskId, Number.parseInt(taskId)),
        ),
      );

    if (existingCompletion) {
      return { success: true, message: "Task already completed" };
    }

    // Get user's GitHub access token
    const [accountRecord] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "github"),
        ),
      );

    if (!accountRecord || !accountRecord.accessToken) {
      throw createError({
        statusCode: 400,
        statusMessage: "GitHub access token not found",
      });
    }

    const accessToken = accountRecord.accessToken;

    // Perform GitHub API action based on task type
    let success = false;
    let error = null;

    if (taskRecord.type === "repo" && taskRecord.action === "star") {
      // Star a repository
      try {
        const _response = await $fetch(`https://api.github.com/user/starred/${taskRecord.target}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Task-App",
          },
        });
        success = true;
      }
      catch (apiError) {
        console.error("GitHub API error (star):", apiError);

        // Handle specific error cases
        if (apiError && typeof apiError === "object" && "status" in apiError) {
          if (apiError.status === 403) {
            error = "Insufficient permissions. Please check your GitHub OAuth scopes.";
          }
          else if (apiError.status === 404) {
            error = "Repository not found or you don't have access to it.";
          }
          else {
            error = `GitHub API error: ${apiError.status}`;
          }
        }
        else {
          error = "Failed to star repository";
        }
      }
    }
    else if (taskRecord.type === "user" && taskRecord.action === "follow") {
      // Follow a user
      try {
        const _response = await $fetch(`https://api.github.com/user/following/${taskRecord.target}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Task-App",
          },
        });
        success = true;
      }
      catch (apiError) {
        console.error("GitHub API error (follow):", apiError);

        // Handle specific error cases
        if (apiError && typeof apiError === "object" && "status" in apiError) {
          if (apiError.status === 403) {
            error = "Insufficient permissions. Please check your GitHub OAuth scopes.";
          }
          else if (apiError.status === 404) {
            error = "User not found.";
          }
          else {
            error = `GitHub API error: ${apiError.status}`;
          }
        }
        else {
          error = "Failed to follow user";
        }
      }
    }

    if (!success) {
      // If GitHub API fails, we can still allow manual completion
      // but we'll mark it as manually completed
      console.warn(`GitHub API failed for task ${taskId}: ${error}`);

      // For now, let's still record the completion but mark it as manual
      await db.insert(userTaskCompletion).values({
        userId: session.user.id,
        taskId: Number.parseInt(taskId),
        completedAt: Date.now(),
        proof: `Manual completion - GitHub API error: ${error}`,
      });

      return {
        success: true,
        message: `Task marked as completed manually. GitHub API error: ${error}`,
        manual: true,
      };
    }

    // Record completion in database
    await db.insert(userTaskCompletion).values({
      userId: session.user.id,
      taskId: Number.parseInt(taskId),
      completedAt: Date.now(),
    });

    return {
      success: true,
      message: `Successfully ${taskRecord.action === "star" ? "starred" : "followed"} ${taskRecord.target}`,
    };
  }
  catch (error) {
    console.error("Error completing task:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
