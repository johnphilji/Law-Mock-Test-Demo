"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/components";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFieldError("Email address is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Enter a valid email address");
      return;
    }

    // Self-service email delivery is disabled until email provider verification.
    setFieldError("Self-service reset is temporarily unavailable. Please contact support@pantherlawprep.com.");
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
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Reset your password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Account recovery and password reset services.
            </p>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <p className="font-medium text-amber-900 mb-1">Notice: Password Recovery Pending</p>
            <p className="text-xs leading-relaxed text-amber-800">
              Automated self-service password reset via email is currently pending Phase 2 email provider (SMTP/Resend) domain verification.
            </p>
            <p className="text-xs mt-2 text-amber-800">
              If you have lost access to your account, please reach out directly to your institute administrator or email support at{" "}
              <a href="mailto:support@pantherlawprep.com" className="font-semibold underline">
                support@pantherlawprep.com
              </a>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="forgot-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
              error={fieldError}
              required
              autoComplete="email"
              disabled
            />

            <Button type="submit" className="w-full opacity-60 cursor-not-allowed" size="lg" disabled>
              Send Reset Link (Unavailable)
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
        </div>
      </div>
    </div>
  );
}
