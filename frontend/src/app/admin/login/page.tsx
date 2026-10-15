"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, Checkbox } from "@/components/ui/input";
import { Alert } from "@/components/ui/components";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Admin email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address";
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
        setError(data.error || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      if (data.user?.role !== "ADMIN") {
        await fetch("/api/auth/logout", { method: "POST" });
        setError("Access denied: You do not possess administrator privileges.");
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl && !callbackUrl.startsWith("/api") && !callbackUrl.startsWith("//")) {
        router.push(callbackUrl);
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch {
      setError("Network error connecting to administrative authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 p-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="flex items-center gap-2.5 justify-center mb-3">
            <div className="w-9 h-9 bg-accent-500 rounded flex items-center justify-center">
              <span className="text-brand-900 font-bold text-lg">P</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Panther Law Prep</h1>
          <p className="text-sm text-brand-300 mt-0.5">Administration Portal</p>
        </div>

        <div className="bg-white border border-border rounded-lg p-6 sm:p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Admin Sign In</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Access restricted to authorized administrators.
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="admin-email"
              label="Admin Email"
              type="email"
              placeholder="admin@pantherlawprep.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: "" })); }}
              error={fieldErrors.email}
              required
              autoComplete="username"
              autoFocus
            />

            <PasswordInput
              id="admin-password"
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
                id="admin-remember"
                label="Remember this device"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              <a
                href="/admin/forgot-password"
                className="text-sm text-brand-700 hover:text-brand-800 font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              All login attempts are logged for security purposes.
            </p>
          </div>
        </div>

        <p className="text-xs text-brand-500 text-center mt-6">
          Not an administrator?{" "}
          <a href="/login" className="text-brand-300 hover:text-white transition-colors">
            Student sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-brand-900 text-white text-sm">Loading admin portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}

