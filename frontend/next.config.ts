import type { NextConfig } from "next";

/**
 * Next.js configuration for Panther Law Prep.
 *
 * Security headers, image optimization, and production hardening
 * are configured here. Business logic lives in services, not here.
 */
const nextConfig: NextConfig = {
  // Strict React mode — catches side-effects and deprecated patterns early.
  reactStrictMode: true,

  // Compress responses in production.
  compress: true,

  // Disable the X-Powered-By header — no reason to advertise the stack.
  poweredByHeader: false,

  // Image optimization — only allow our own domain and Razorpay's CDN.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pantherlawprep.com",
      },
    ],
    // Modern formats for better performance.
    formats: ["image/avif", "image/webp"],
  },

  // Security headers applied to every response.
  // These are defense-in-depth measures — do not remove them.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent browsers from MIME-sniffing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Disallow embedding in iframes (clickjacking protection).
          { key: "X-Frame-Options", value: "DENY" },
          // Stop sending referrer information to third parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — restrict dangerous browser APIs.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          // Content Security Policy — strict but functional.
          // Script-src 'unsafe-inline' is required by Next.js inline scripts.
          // This will be tightened with nonces in a future hardening pass.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
              "frame-src https://api.razorpay.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      // API routes must not be cached by browsers or CDNs by default.
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },

  // Redirect naked HTTP to HTTPS in production.
  // Note: handled by Vercel/hosting in production — included here for completeness.
  async redirects() {
    return [];
  },
};

export default nextConfig;
