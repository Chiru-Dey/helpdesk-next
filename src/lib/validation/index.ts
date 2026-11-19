import { z } from "zod";

// ── Auth ──
export const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

// ── Users (admin) ──
export const createUserSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "agent", "customer"]),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    role: z.enum(["admin", "agent", "customer"]).optional(),
    is_active: z.boolean().optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field." });

// ── Categories ──
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field." });

// ── Tickets ──
export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(10000),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  category_id: z.number().int().positive().optional(),
});

export const updateTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).max(10000).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    category_id: z.number().int().positive().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field." });

export const assignSchema = z.object({
  assignee_id: z.number().int().positive().nullable(),
});

export const statusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export const ticketListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  search: z.string().trim().max(200).optional(),
});

// ── Comments ──
export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(10000),
});

export const commentListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),
});