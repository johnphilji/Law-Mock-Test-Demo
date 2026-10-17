"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  RefreshCw
} from "lucide-react";
import { OtpVerificationDialog } from "@/components/auth/OtpVerificationDialog";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasPassword: boolean;
  linkedAccounts: Array<{ id: string; provider: string; linkedAt: string }>;
  createdAt: string;
}

export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email verification state
  const [emailOtpOpen, setEmailOtpOpen] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailDevOtp, setEmailDevOtp] = useState<string | null>(null);

  // Phone verification state
  const [phoneInput, setPhoneInput] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneOtpOpen, setPhoneOtpOpen] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [phoneDevOtp, setPhoneDevOtp] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to load user profile");
      const data = await res.json();
      setProfile(data.user);
      if (data.user?.phone) {
        setPhoneInput(data.user.phone);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSendEmailOtp = async () => {
    if (!profile?.email || sendingEmailOtp) return;
    setSendingEmailOtp(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/auth/otp/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to dispatch email verification code.");
        return;
      }
      if (data.devOtp) {
        setEmailDevOtp(data.devOtp);
      }
      setEmailOtpOpen(true);
    } catch {
      setError("Network error sending email verification code.");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneInput.trim() || sendingPhoneOtp) return;
    setSendingPhoneOtp(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/auth/otp/send-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to dispatch mobile OTP.");
        return;
      }
      if (data.devOtp) {
        setPhoneDevOtp(data.devOtp);
      }
      setPhoneOtpOpen(true);
    } catch {
      setError("Network error sending mobile OTP.");
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleUnlink = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    setError(null);
    try {
      const res = await fetch("/api/auth/oauth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to disconnect ${provider}`);
        return;
      }
      setSuccessMessage(`Disconnected ${provider} successfully.`);
      fetchProfile();
    } catch {
      setError(`Network error disconnecting ${provider}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading account credentials...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        Failed to load account profile. Please log in again.
      </div>
    );
  }

  const linkedProviderNames = profile.linkedAccounts.map((a) => a.provider.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your verified contact methods, single sign-on providers, and multi-factor security.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-sm text-green-700">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold">
            {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {profile.role}
              </span>
              <span className="text-xs text-slate-400">
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Verification Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[190px]">{profile.email}</p>
                </div>
              </div>

              {profile.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Unverified
                </span>
              )}
            </div>

            <div>
              {profile.isEmailVerified ? (
                <p className="text-xs text-slate-500">
                  Your email is confirmed and eligible for test attempts and score reports.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-amber-800">
                    Verification is required before attempting mock examinations.
                  </p>
                  <button
                    onClick={handleSendEmailOtp}
                    disabled={sendingEmailOtp}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    {sendingEmailOtp && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Send 6-Digit Email Code
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Phone Verification Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile Number</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {profile.phone || "No phone added"}
                  </p>
                </div>
              </div>

              {profile.isPhoneVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  SMS Coming Soon
                </span>
              )}
            </div>

            <div>
              {profile.isPhoneVerified && !editingPhone ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Used for exam SMS alerts & 2FA.</p>
                  <button
                    onClick={() => setEditingPhone(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Update
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendPhoneOtp} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210 or +91..."
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-600 outline-hidden bg-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={sendingPhoneOtp || !phoneInput.trim()}
                      className="py-1.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition shrink-0 flex items-center gap-1"
                    >
                      {sendingPhoneOtp && <RefreshCw className="w-3 h-3 animate-spin" />}
                      Send OTP
                    </button>
                  </div>
                  {editingPhone && (
                    <button
                      type="button"
                      onClick={() => setEditingPhone(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Linked Single Sign-On Providers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Connected Authentication Providers</h3>
            <p className="text-xs text-slate-500">
              Link external Google or Microsoft accounts for fast, secure single sign-on.
            </p>
          </div>
        </div>

        <OAuthButtons
          isLinking={true}
          linkedProviders={linkedProviderNames}
          onUnlink={handleUnlink}
        />
      </div>

      {/* OTP Modals */}
      {emailOtpOpen && (
        <OtpVerificationDialog
          type="email"
          target={profile.email}
          isOpen={emailOtpOpen}
          initialDevOtp={emailDevOtp}
          onSuccess={() => {
            setEmailOtpOpen(false);
            setSuccessMessage("Email address successfully verified!");
            fetchProfile();
          }}
          onClose={() => setEmailOtpOpen(false)}
        />
      )}

      {phoneOtpOpen && (
        <OtpVerificationDialog
          type="phone"
          target={phoneInput.trim()}
          isOpen={phoneOtpOpen}
          initialDevOtp={phoneDevOtp}
          onSuccess={() => {
            setPhoneOtpOpen(false);
            setEditingPhone(false);
            setSuccessMessage("Mobile number successfully verified!");
            fetchProfile();
          }}
          onClose={() => setPhoneOtpOpen(false)}
        />
      )}
    </div>
  );
}
