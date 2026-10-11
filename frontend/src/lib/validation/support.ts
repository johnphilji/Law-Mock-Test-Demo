/**
 * Zod validation schemas — Support Tickets
 * Uses Zod v4 API.
 */
import { z } from "zod";
import { SUPPORT_MESSAGE_MAX_LENGTH } from "@/lib/constants";

export const CreateTicketSchema = z.object({
  category: z.enum([
    "PAYMENT",
    "ACCOUNT",
    "TECHNICAL",
    "TEST_ISSUE",
    "QUESTION_ISSUE",
    "OTHER",
  ]),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must not exceed 200 characters")
    .trim(),
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(SUPPORT_MESSAGE_MAX_LENGTH, `Message must not exceed ${SUPPORT_MESSAGE_MAX_LENGTH} characters`)
    .trim(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const SendMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(SUPPORT_MESSAGE_MAX_LENGTH, `Message must not exceed ${SUPPORT_MESSAGE_MAX_LENGTH} characters`)
    .trim(),
  isInternal: z.boolean().default(false),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const UpdateTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusSchema>;
