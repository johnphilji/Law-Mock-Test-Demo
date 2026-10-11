/**
 * Zod validation schemas — Exam and Test management
 * Uses Zod v4 API.
 */
import { z } from "zod";

// =============================================================================
// TEST CREATION / EDITING
// =============================================================================

export const CreateTestSchema = z.object({
  examId: z.string().uuid("Invalid exam ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters")
    .trim(),
  description: z.string().max(2000, "Description must not exceed 2000 characters").optional(),
  instructions: z.string().max(5000, "Instructions must not exceed 5000 characters").optional(),
  type: z.enum(["MOCK", "SECTIONAL", "TOPIC"]),
  durationMinutes: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 minute")
    .max(480, "Duration cannot exceed 480 minutes (8 hours)"),
  negativeMarking: z
    .number()
    .min(0, "Negative marking cannot be negative")
    .max(1, "Negative marking cannot exceed 1")
    .default(0),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  showExplanations: z.boolean().default(true),
});

export type CreateTestInput = z.infer<typeof CreateTestSchema>;

export const UpdateTestSchema = CreateTestSchema.partial();
export type UpdateTestInput = z.infer<typeof UpdateTestSchema>;

// =============================================================================
// QUESTION CREATION / EDITING
// =============================================================================

const QuestionOptionSchema = z.object({
  optionKey: z.enum(["A", "B", "C", "D", "E", "F"]),
  optionText: z
    .string()
    .min(1, "Option text cannot be empty")
    .max(2000, "Option text must not exceed 2000 characters"),
  isCorrect: z.boolean(),
  displayOrder: z.number().int().min(0).max(5),
});

export const CreateQuestionSchema = z
  .object({
    subjectId: z.string().uuid("Invalid subject ID"),
    topicId: z.string().uuid("Invalid topic ID").optional(),
    questionText: z
      .string()
      .min(10, "Question must be at least 10 characters")
      .max(10000, "Question must not exceed 10000 characters"),
    questionType: z.enum(["SINGLE_CHOICE"]).default("SINGLE_CHOICE"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
    explanation: z.string().max(5000, "Explanation must not exceed 5000 characters").optional(),
    options: z
      .array(QuestionOptionSchema)
      .min(2, "A question must have at least 2 options")
      .max(6, "A question can have at most 6 options"),
  })
  .refine(
    (data) => data.options.filter((o) => o.isCorrect).length === 1,
    {
      message: "Exactly one option must be marked as correct",
      path: ["options"],
    },
  );

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = CreateQuestionSchema.partial();
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

// =============================================================================
// ADD QUESTION TO TEST
// =============================================================================

export const AddTestQuestionSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  questionOrder: z.number().int().min(0),
  marks: z
    .number()
    .positive("Marks must be positive")
    .max(100, "Marks cannot exceed 100"),
  negativeMarks: z
    .number()
    .min(0, "Negative marks cannot be negative")
    .max(100, "Negative marks cannot exceed 100")
    .default(0),
});

export type AddTestQuestionInput = z.infer<typeof AddTestQuestionSchema>;
