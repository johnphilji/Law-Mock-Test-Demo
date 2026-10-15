"use client";

import { useState, type FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, Checkbox } from "@/components/ui/input";
import { Alert } from "@/components/ui/components";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl && !callbackUrl.startsWith("/api") && !callbackUrl.startsWith("//")) {
        router.push(callbackUrl);
      } else if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Unable to connect to the authentication service. Please try again.");
      setLoading(false);
    }
  };

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
              Prepare for the<br />
              All India Bar Examination
            </h1>
            <p className="text-brand-200 text-base leading-relaxed max-w-sm">
              Full-length mock tests, section-wise papers, and topic drills built to the AIBE pattern.
              Practice across all 19 subjects with instant scoring and detailed explanations.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-accent-400" />
              </div>
              <div>
                <p className="text-sm font-medium">100 MCQ Mock Tests</p>
                <p className="text-xs text-brand-300">Modeled on the official AIBE pattern</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-accent-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Instant Results & Analysis</p>
                <p className="text-xs text-brand-300">Know exactly where you stand after every attempt</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-accent-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Detailed Explanations</p>
                <p className="text-xs text-brand-300">Learn from every answer with cited legal provisions</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-brand-400">
          © {new Date().getFullYear()} Panther Law Prep. All rights reserved.
        </p>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-muted">
        <div className="w-full max-w-[400px]">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-brand-800 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-base font-semibold text-brand-900">Panther Law Prep</span>
          </div>

          <div className="bg-white border border-border rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Sign in to your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            {error && (
              <Alert variant="error" className="mb-5">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="login-email"
                label="Email or Mobile Number"
                type="text"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: "" })); }}
                error={fieldErrors.email}
                required
                autoComplete="username"
                autoFocus
              />

              <PasswordInput
                id="login-password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: "" })); }}
                error={fieldErrors.password}
                required
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between">
                <Checkbox
                  id="login-remember"
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <Link
                  href="/forgot-password"
                  className="text-sm text-brand-700 hover:text-brand-800 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-brand-700 font-medium hover:text-brand-800 transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6 bg-muted text-muted-foreground text-sm">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}

