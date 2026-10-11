/**
 * Zod validation schemas — Authentication
 *
 * All input validation for registration, login, and password management.
 * These schemas are shared between API route validation and form validation.
 *
 * Note: Server-side validation is authoritative. Client-side validation
 * is a UX convenience only.
 *
 * Uses Zod v4 API.
 */
import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

// =============================================================================
// SHARED FIELD VALIDATORS
// =============================================================================

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Password must not exceed 128 characters");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
  .optional()
  .or(z.literal(""));

// =============================================================================
// REGISTRATION
// =============================================================================

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim(),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema.refine(
      (val) => /[A-Z]/.test(val) || /[0-9]/.test(val),
      "Password must contain at least one uppercase letter or number",
    ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

// =============================================================================
// LOGIN
// =============================================================================

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// =============================================================================
// FORGOT PASSWORD
// =============================================================================

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// =============================================================================
// RESET PASSWORD
// =============================================================================

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// =============================================================================
// CHANGE PASSWORD
// =============================================================================

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
