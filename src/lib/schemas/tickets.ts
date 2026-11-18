import { z } from "zod";

export const ticketStatusEnum = z.enum([
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
]);

export const ticketPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(10000),
  priority: ticketPriorityEnum.optional(),
  customer_id: z.number().int().positive().optional(),
});

export const updateTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).max(10000).optional(),
    priority: ticketPriorityEnum.optional(),
    status: ticketStatusEnum.optional(),
    assignee_id: z.number().int().positive().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  is_internal: z.boolean().optional(),
});

export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;