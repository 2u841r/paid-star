import { auth } from "~/lib/auth";
import db from "~/lib/db";
import { task } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Check if tasks already exist
    const existingTasks = await db.select().from(task);

    if (existingTasks.length > 0) {
      return {
        success: true,
        message: "Tasks already exist",
        count: existingTasks.length,
      };
    }

    // Add default tasks
    const defaultTasks = [
      {
        type: "repo",
        target: "w3cj/next-start",
        description: "Star the main repository",
        action: "star",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        type: "repo",
        target: "w3cj/youtube-face-enhancer",
        description: "Star the YouTube face enhancer repository",
        action: "star",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        type: "user",
        target: "agentellisense",
        description: "Follow the user",
        action: "follow",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    await db.insert(task).values(defaultTasks);

    return {
      success: true,
      message: "Default tasks added successfully",
      count: defaultTasks.length,
    };
  }
  catch (error) {
    console.error("Error seeding tasks:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
