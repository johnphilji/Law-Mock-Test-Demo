/**
 * Zod validation schemas — Attempt and Answer submission
 * Uses Zod v4 API.
 */
import { z } from "zod";

// =============================================================================
// START ATTEMPT
// =============================================================================

export const StartAttemptSchema = z.object({
  testId: z.string().uuid("Invalid test ID"),
});

export type StartAttemptInput = z.infer<typeof StartAttemptSchema>;

// =============================================================================
// SAVE ANSWER
// =============================================================================

export const SaveAnswerSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  questionVersionId: z.string().uuid("Invalid question version ID"),
  selectedOptionKey: z.string().max(1).nullable(),
  isMarkedForReview: z.boolean().default(false),
});

export type SaveAnswerInput = z.infer<typeof SaveAnswerSchema>;

// Batch answer save (for offline sync)
export const BatchSaveAnswersSchema = z.object({
  answers: z
    .array(SaveAnswerSchema)
    .min(1, "At least one answer is required")
    .max(200, "Cannot batch more than 200 answers at once"),
});

export type BatchSaveAnswersInput = z.infer<typeof BatchSaveAnswersSchema>;

// =============================================================================
// SUBMIT ATTEMPT
// =============================================================================

export const SubmitAttemptSchema = z.object({
  /**
   * Source identifies how the submission was triggered.
   * Used for analytics and audit logs only.
   * The server independently validates the attempt state — this is not trusted.
   */
  source: z
    .enum(["student", "timer_expired", "auto"])
    .default("student"),
});

export type SubmitAttemptInput = z.infer<typeof SubmitAttemptSchema>;

// =============================================================================
// QUERY PARAMS
// =============================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export const ScoreFilterSchema = PaginationSchema.extend({
  type: z.enum(["MOCK", "SECTIONAL", "TOPIC", "ALL"]).default("ALL"),
});

export type ScoreFilterInput = z.infer<typeof ScoreFilterSchema>;
