import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Project phases
export const projectPhases = ["pre-production", "production", "post-production"] as const;
export type ProjectPhase = typeof projectPhases[number];

// Task status
export const taskStatuses = ["not-started", "in-progress", "completed"] as const;
export type TaskStatus = typeof taskStatuses[number];

// Task priorities
export const taskPriorities = ["high", "medium", "low"] as const;
export type TaskPriority = typeof taskPriorities[number];

// Task categories
export const taskCategories = ["programming", "design", "audio", "marketing", "other"] as const;
export type TaskCategory = typeof taskCategories[number];

// Game engines
export const gameEngines = ["unity", "unreal", "godot", "gamemaker", "custom", "other"] as const;
export type GameEngine = typeof gameEngines[number];

// Development tools
export const developmentTools = ["blender", "maya", "photoshop", "illustrator", "audacity", "fmod", "substance", "other"] as const;
export type DevelopmentTool = typeof developmentTools[number];

// Notification types
export const notificationTypes = ["deadline", "reminder", "update", "completion"] as const;
export type NotificationType = typeof notificationTypes[number];

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  phase: text("phase").$type<ProjectPhase>().notNull().default("pre-production"),
  color: text("color").notNull().default("#6200EA"),
  deadline: timestamp("deadline"),
  progress: integer("progress").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // New fields
  gameEngine: text("game_engine").$type<GameEngine>(),
  developmentTools: text("development_tools").notNull().default('[]'), // JSON string array
});

// Project insert schema
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").$type<TaskStatus>().notNull().default("not-started"),
  priority: text("priority").$type<TaskPriority>().notNull().default("medium"),
  category: text("category").$type<TaskCategory>().notNull().default("other"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  // New fields
  parentTaskId: integer("parent_task_id"),
  order: integer("order").notNull().default(0),
  blockId: text("block_id"),
  assignedTo: text("assigned_to"),
});

// Task insert schema
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Subtasks table
export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  order: integer("order").notNull().default(0),
});

// Subtask insert schema
export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
});

// Blocks table (for kanban-style task organization)
export const blocks = pgTable("blocks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  color: text("color").notNull().default("#6200EA"),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
});

// Block insert schema
export const insertBlockSchema = createInsertSchema(blocks);

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

// Comment insert schema
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Time logs table
export const timeLogs = pgTable("time_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration").notNull().default(0), // in seconds
  description: text("description"),
});

// Time log insert schema
export const insertTimeLogSchema = createInsertSchema(timeLogs).omit({
  id: true,
});

// Activity log table
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userId: text("user_id"),
  details: text("details"),
});

// Activity log insert schema
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").$type<NotificationType>().notNull(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  scheduledFor: timestamp("scheduled_for"),
});

// Notification insert schema
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  avatar: text("avatar"),
});

// User insert schema
export const insertUserSchema = createInsertSchema(users);

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  theme: text("theme").notNull().default("light"),
  language: text("language").notNull().default("en"),
  primaryColor: text("primary_color").notNull().default("#6200EA"),
  // New fields
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  reminderTime: integer("reminder_time").notNull().default(24), // hours before deadline
  widgetEnabled: boolean("widget_enabled").notNull().default(true),
  widgetSettings: text("widget_settings").notNull().default('{"showCompleted":false,"maxItems":5,"sortBy":"deadline"}'), // JSON string
  offlineMode: boolean("offline_mode").notNull().default(false),
  pomodoroSettings: text("pomodoro_settings").notNull().default('{"workDuration":25,"breakDuration":5,"longBreakDuration":15,"longBreakInterval":4}'), // JSON string
});

// Settings insert schema
export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type TimeLog = typeof timeLogs.$inferSelect;
export type InsertTimeLog = z.infer<typeof insertTimeLogSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Export a backup schema for JSON export/import
export const backupSchema = z.object({
  projects: z.array(z.any()),
  tasks: z.array(z.any()),
  subtasks: z.array(z.any()).optional(),
  blocks: z.array(z.any()).optional(),
  comments: z.array(z.any()).optional(),
  timeLogs: z.array(z.any()).optional(),
  activityLog: z.array(z.any()).optional(),
  notifications: z.array(z.any()).optional(),
  users: z.array(z.any()).optional(),
  settings: z.any().optional(),
  date: z.string(),
});

export type Backup = z.infer<typeof backupSchema>;
