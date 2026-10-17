"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface OtpVerificationDialogProps {
  type: "email" | "phone";
  target: string;
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  initialDevOtp?: string | null;
}

export function OtpVerificationDialog({
  type,
  target,
  isOpen,
  onSuccess,
  onClose,
  title,
  description,
  initialDevOtp,
}: OtpVerificationDialogProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(initialDevOtp || null);

  // Timer cooldown effect
  useEffect(() => {
    if (!isOpen) return;
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, cooldown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    // Keep only the last character or alphanumeric
    const char = val.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Auto-advance focus to next field if a character was entered
    if (char && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);
    if (pasted.length === 6) {
      const lastInput = document.getElementById(`otp-input-5`);
      lastInput?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = type === "email" ? "/api/auth/otp/verify-email" : "/api/auth/otp/verify-phone";
      const payload = type === "email" ? { email: target, code } : { phone: target, code };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed. Check the code and try again.");
        setLoading(false);
        return;
      }

      setStatusMessage("Verification successful!");
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch {
      setError("Network error validating code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setStatusMessage(null);

    try {
      const endpoint = type === "email" ? "/api/auth/otp/send-email" : "/api/auth/otp/send-phone";
      const payload = type === "email" ? { email: target } : { phone: target };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend verification code.");
        setResending(false);
        return;
      }

      setCooldown(60);
      setStatusMessage("A fresh 6-digit code has been dispatched.");
      if (data.devOtp) {
        setDevOtpCode(data.devOtp);
      }
      setDigits(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("otp-input-0");
      firstInput?.focus();
    } catch {
      setError("Network error resending code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleFillDevCode = () => {
    if (!devOtpCode) return;
    const splitDigits = devOtpCode.split("").slice(0, 6);
    setDigits(splitDigits);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-center">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          {title || (type === "email" ? "Verify Your Email Address" : "Verify Your Mobile Number")}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          {description || (
            <>
              Enter the 6-digit one-time passcode sent to{" "}
              <span className="font-semibold text-slate-700">{target}</span>.
            </>
          )}
        </p>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
            {statusMessage}
          </div>
        )}

        {devOtpCode && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 text-left flex items-center justify-between">
            <div>
              <p className="font-semibold text-[11px] text-blue-700 uppercase tracking-wider">Dev Simulation Active</p>
              <p className="font-mono text-sm font-bold text-blue-950 mt-0.5">Code: {devOtpCode}</p>
            </div>
            <button
              type="button"
              onClick={handleFillDevCode}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs transition"
            >
              Auto-fill Code
            </button>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-12 text-center text-xl font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition bg-slate-50 focus:bg-white"
                disabled={loading}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
            <span>Didn&apos;t receive code?</span>
            {cooldown > 0 ? (
              <span className="font-medium text-slate-400">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                Resend OTP
              </button>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              >
                Skip / Later
              </button>
            )}
            <button
              type="submit"
              disabled={loading || digits.join("").length !== 6}
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
