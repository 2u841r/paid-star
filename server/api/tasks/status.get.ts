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

  try {
    // Get all active tasks
    const tasks = await db.select().from(task).where(eq(task.isActive, true));

    // Get user's completed tasks from database
    const completedTasks = await db
      .select({ taskId: userTaskCompletion.taskId })
      .from(userTaskCompletion)
      .where(eq(userTaskCompletion.userId, session.user.id));

    const completedTaskIds = completedTasks.map(t => t.taskId);

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
      // If no GitHub token, return basic completion status
      return {
        tasks,
        completedTasks: completedTaskIds,
        githubStatus: {},
      };
    }

    const accessToken = accountRecord.accessToken;
    const githubStatus: Record<number, { starred?: boolean; followed?: boolean }> = {};

    // Check GitHub status for each task
    for (const taskRecord of tasks) {
      try {
        if (taskRecord.type === "repo" && taskRecord.action === "star") {
          // Check if repo is starred
          const _response = await $fetch(`https://api.github.com/user/starred/${taskRecord.target}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "Task-App",
            },
          });
          githubStatus[taskRecord.id] = { starred: true };
        }
        else if (taskRecord.type === "user" && taskRecord.action === "follow") {
          // Check if user is followed
          const _response = await $fetch(`https://api.github.com/user/following/${taskRecord.target}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "Task-App",
            },
          });
          githubStatus[taskRecord.id] = { followed: true };
        }
      }
      catch (apiError) {
        // If API returns 404, it means not starred/followed
        if (apiError && typeof apiError === "object" && "status" in apiError && apiError.status === 404) {
          if (taskRecord.type === "repo") {
            githubStatus[taskRecord.id] = { starred: false };
          }
          else if (taskRecord.type === "user") {
            githubStatus[taskRecord.id] = { followed: false };
          }
        }
        else {
          console.error(`GitHub API error for task ${taskRecord.id}:`, apiError);
          // If there's an error, assume not completed
          if (taskRecord.type === "repo") {
            githubStatus[taskRecord.id] = { starred: false };
          }
          else if (taskRecord.type === "user") {
            githubStatus[taskRecord.id] = { followed: false };
          }
        }
      }
    }

    return {
      tasks,
      completedTasks: completedTaskIds,
      githubStatus,
    };
  }
  catch (error) {
    console.error("Error fetching task status:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
