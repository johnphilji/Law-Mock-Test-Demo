"use client";

import { useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, Checkbox } from "@/components/ui/input";
import { Alert } from "@/components/ui/components";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => {
    return {
      length: password.length >= PASSWORD_MIN_LENGTH,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-danger-400", "bg-warning-400", "bg-accent-400", "bg-success-500"];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? colors[score] : "bg-border"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{labels[score]}</span>
      </div>
      <ul className="space-y-0.5 text-xs">
        <li className={checks.length ? "text-success-600" : "text-muted-foreground"}>
          {checks.length ? "✓" : "○"} At least {PASSWORD_MIN_LENGTH} characters
        </li>
        <li className={checks.uppercase ? "text-success-600" : "text-muted-foreground"}>
          {checks.uppercase ? "✓" : "○"} One uppercase letter
        </li>
        <li className={checks.number ? "text-success-600" : "text-muted-foreground"}>
          {checks.number ? "✓" : "○"} One number
        </li>
        <li className={checks.special ? "text-success-600" : "text-muted-foreground"}>
          {checks.special ? "✓" : "○"} One special character (recommended)
        </li>
      </ul>
    </div>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    else if (formData.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

    if (!formData.email.trim()) errors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Enter a valid email address";

    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = "Enter a valid 10-digit Indian mobile number";
    }

    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    } else if (!/[A-Z]/.test(formData.password) && !/[0-9]/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter or number";
    }

    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeTerms) errors.agreeTerms = "You must agree to the terms";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
        <div className="w-full max-w-[420px] bg-white border border-border rounded-lg p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Account Created Successfully</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            A verification link has been sent to <strong>{formData.email}</strong>.
            Please check your inbox and verify your email address to activate your account.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button className="text-brand-700 font-medium hover:underline">
              resend verification email
            </button>.
          </p>
          <Link href="/login">
            <Button variant="primary" className="mt-6 w-full" size="lg">
              Go to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-brand-900 text-white flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-accent-500 rounded flex items-center justify-center">
              <span className="text-brand-900 font-bold text-lg">P</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Panther Law Prep</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold leading-tight">
              Start your AIBE<br />
              preparation today
            </h1>
            <p className="text-brand-200 text-base leading-relaxed max-w-sm">
              Join thousands of law graduates preparing for the All India Bar Examination.
              Create your account and start practicing with our comprehensive test series.
            </p>
          </div>

          <div className="mt-12 p-5 bg-brand-800/50 rounded-lg border border-brand-700/30">
            <p className="text-sm font-medium text-accent-300 mb-3">What you get:</p>
            <ul className="space-y-2 text-sm text-brand-200">
              <li>• Full-length AIBE mock tests (100 MCQs)</li>
              <li>• Subject-wise sectional tests</li>
              <li>• Topic-wise practice drills</li>
              <li>• Instant scoring with explanations</li>
              <li>• Performance analytics</li>
              <li>• All 19 AIBE subjects covered</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-brand-400">
          © {new Date().getFullYear()} Panther Law Prep. All rights reserved.
        </p>
      </div>

      {/* Right panel — Registration form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-muted">
        <div className="w-full max-w-[440px]">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-brand-800 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-base font-semibold text-brand-900">Panther Law Prep</span>
          </div>

          <div className="bg-white border border-border rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Create your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill in your details to get started.
              </p>
            </div>

            {error && (
              <Alert variant="error" className="mb-5">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="reg-name"
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                error={fieldErrors.name}
                required
                autoComplete="name"
                autoFocus
              />

              <Input
                id="reg-email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                error={fieldErrors.email}
                required
                autoComplete="email"
              />

              <Input
                id="reg-phone"
                label="Mobile Number"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                error={fieldErrors.phone}
                hint="Optional — used for account recovery"
                autoComplete="tel"
              />

              <PasswordInput
                id="reg-password"
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                error={fieldErrors.password}
                required
                autoComplete="new-password"
              />

              {formData.password && <PasswordStrength password={formData.password} />}

              <PasswordInput
                id="reg-confirm-password"
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                error={fieldErrors.confirmPassword}
                required
                autoComplete="new-password"
              />

              <div className="pt-1">
                <Checkbox
                  id="reg-terms"
                  label="I agree to the Terms of Service and Privacy Policy"
                  checked={formData.agreeTerms}
                  onChange={(e) => updateField("agreeTerms", e.target.checked)}
                  error={fieldErrors.agreeTerms}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-brand-700 font-medium hover:text-brand-800 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
