import { index, int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

// Task table - stores the tasks (repos/users to follow/star)
export const task = sqliteTable("task", {
  id: int().primaryKey({ autoIncrement: true }),
  type: text().notNull(), // "repo" or "user"
  target: text().notNull(), // e.g., "2u841r/2u841r", "2u841r/config", "2u841r"
  description: text().notNull(), // Human readable description
  action: text().notNull(), // "follow" or "star"
  isActive: integer({ mode: "boolean" }).notNull().default(true),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

// User task completion table - tracks which users completed which tasks
export const userTaskCompletion = sqliteTable("user_task_completion", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  taskId: int().notNull().references(() => task.id, { onDelete: "cascade" }),
  completedAt: integer().notNull(),
  proof: text(), // Optional proof of completion (screenshot, etc.)
}, table => ({
  userIdTaskIdIdx: index("user_task_completion_user_id_task_id_idx").on(table.userId, table.taskId),
}));

// Payment request table - stores user payment requests after completing all tasks
export const paymentRequest = sqliteTable("payment_request", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  mobileNumber: text().notNull(), // 11 digit number starting with 0
  paymentMethod: text().notNull(), // "GP", "BL", "Robi", "Airtel", "Teletalk", "bKash", "Nagad", "Rocket"
  githubId: text().notNull(), // GitHub username for verification
  status: text().notNull().default("pending"), // "pending", "verified", "paid", "rejected"
  adminNotes: text(), // Admin notes for verification
  requestedAt: integer().notNull(),
  verifiedAt: integer(),
  paidAt: integer(),
  updatedAt: integer().notNull(),
});
