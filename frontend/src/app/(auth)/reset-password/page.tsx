"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/input";
import { Alert } from "@/components/ui/components";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!password) errors.password = "New password is required";
    else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 bg-brand-800 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-base font-semibold text-brand-900">Panther Law Prep</span>
        </div>

        <div className="bg-white border border-border rounded-lg p-6 sm:p-8 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Password Reset Successful</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link href="/login">
                <Button variant="primary" className="mt-6 w-full" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Set new password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <Alert variant="error" className="mb-5">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <PasswordInput
                  id="reset-password"
                  label="New Password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: "" })); }}
                  error={fieldErrors.password}
                  required
                  autoComplete="new-password"
                  autoFocus
                  hint={`Minimum ${PASSWORD_MIN_LENGTH} characters with at least one uppercase letter or number`}
                />

                <PasswordInput
                  id="reset-confirm-password"
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((f) => ({ ...f, confirmPassword: "" })); }}
                  error={fieldErrors.confirmPassword}
                  required
                  autoComplete="new-password"
                />

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Reset Password
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-brand-700 font-medium hover:text-brand-800 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
