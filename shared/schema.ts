import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for storing technicians info
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  role: text("role").default("technician"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  avatar: true,
  role: true,
});

// Tasks table for service tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  locationName: text("location_name").notNull(),
  locationAddress: text("location_address").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high
  progress: integer("progress").default(0), // Percentage 0-100
  clientId: integer("client_id"), // Optional relationship to a client
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  locationName: true,
  locationAddress: true,
  scheduledDate: true,
  status: true,
  priority: true,
  progress: true,
  clientId: true,
});

// Task Assignments - linking tasks to technicians
export const taskAssignments = pgTable("task_assignments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments).pick({
  taskId: true,
  userId: true,
});

// Service Sheets for task details
export const serviceSheets = pgTable("service_sheets", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  serviceType: text("service_type").notNull(), // maintenance, repair, installation, inspection
  equipmentType: text("equipment_type").notNull(),
  checklist: jsonb("checklist").notNull(), // Array of items to check with status
  technicianSignature: text("technician_signature"),
  customerSignature: text("customer_signature"),
  customerName: text("customer_name"),
  completionDate: timestamp("completion_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceSheetSchema = createInsertSchema(serviceSheets).pick({
  taskId: true,
  serviceType: true,
  equipmentType: true,
  checklist: true,
  technicianSignature: true,
  customerSignature: true,
  customerName: true,
  completionDate: true,
});

// Task Notes
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  noteType: text("note_type").default("text").notNull(), // text, voice
  voiceRecordingUrl: text("voice_recording_url"),
  duration: integer("duration"), // For voice notes, in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  taskId: true,
  userId: true,
  content: true,
  noteType: true,
  voiceRecordingUrl: true,
  duration: true,
});

// Photos attached to tasks
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  taskId: true,
  userId: true,
  filename: true,
  description: true,
});

// Products/Materials that can be used in tasks
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  unitPrice: real("unit_price").notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  sku: true,
  description: true,
  unitPrice: true,
  stockQuantity: true,
  lowStockThreshold: true,
  category: true,
});

// Product usage in tasks
export const productUsage = pgTable("product_usage", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const insertProductUsageSchema = createInsertSchema(productUsage).pick({
  taskId: true,
  productId: true,
  quantity: true,
});

// Timesheets for tracking time spent on tasks
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheets).pick({
  taskId: true,
  userId: true,
  startTime: true,
  endTime: true,
  durationMinutes: true,
  notes: true,
});

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  contactName: true,
  phone: true,
  email: true,
  address: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;

export type ServiceSheet = typeof serviceSheets.$inferSelect;
export type InsertServiceSheet = z.infer<typeof insertServiceSheetSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductUsage = typeof productUsage.$inferSelect;
export type InsertProductUsage = z.infer<typeof insertProductUsageSchema>;

export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
