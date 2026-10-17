"use client";

import React, { useState } from "react";

export function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function MicrosoftIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23">
      <rect x="1" y="1" width="10" height="10" fill="#f25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
      <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
      <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}

export function OAuthButtons({
  isLinking = false,
  linkedProviders = [],
  onUnlink,
  disabled = false,
}: {
  isLinking?: boolean;
  linkedProviders?: string[];
  onUnlink?: (provider: string) => void;
  disabled?: boolean;
}) {
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  const handleProviderClick = (e: React.MouseEvent, providerName: string) => {
    e.preventDefault();
    setComingSoonMessage(`${providerName} login is coming soon! For now, please use email verification.`);
    setTimeout(() => {
      setComingSoonMessage(null);
    }, 4500);
  };

  const isGoogleLinked = linkedProviders.includes("google");
  const isMicrosoftLinked = linkedProviders.includes("microsoft");

  if (isLinking) {
    return (
      <div className="space-y-3">
        {comingSoonMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs animate-in fade-in duration-200 flex items-center justify-between">
            <span>{comingSoonMessage}</span>
            <button
              onClick={() => setComingSoonMessage(null)}
              className="text-amber-900 font-bold ml-2 hover:underline"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center justify-between p-3.5 border rounded-lg bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <GoogleIcon className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium text-slate-900">Google Account</p>
              <p className="text-xs text-slate-500">
                {isGoogleLinked ? "Connected for fast one-click login" : "Coming soon"}
              </p>
            </div>
          </div>
          {isGoogleLinked ? (
            <button
              onClick={() => onUnlink && onUnlink("google")}
              disabled={disabled}
              className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => handleProviderClick(e, "Google")}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition"
            >
              Connect
            </button>
          )}
        </div>

        <div className="flex items-center justify-between p-3.5 border rounded-lg bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <MicrosoftIcon className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium text-slate-900">Microsoft Account</p>
              <p className="text-xs text-slate-500">
                {isMicrosoftLinked ? "Connected for Entra ID single sign-on" : "Coming soon"}
              </p>
            </div>
          </div>
          {isMicrosoftLinked ? (
            <button
              onClick={() => onUnlink && onUnlink("microsoft")}
              disabled={disabled}
              className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => handleProviderClick(e, "Microsoft")}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400 font-medium tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      {comingSoonMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs animate-in fade-in duration-200 flex items-center justify-between shadow-xs">
          <span>{comingSoonMessage}</span>
          <button
            onClick={() => setComingSoonMessage(null)}
            className="text-blue-800 font-bold ml-2 hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={(e) => handleProviderClick(e, "Google")}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <GoogleIcon className="w-4 h-4" />
            <span>Google</span>
          </div>
          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-200">
            Coming Soon
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => handleProviderClick(e, "Microsoft")}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <MicrosoftIcon className="w-4 h-4" />
            <span>Microsoft</span>
          </div>
          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-200">
            Coming Soon
          </span>
        </button>
      </div>
    </div>
  );
}
