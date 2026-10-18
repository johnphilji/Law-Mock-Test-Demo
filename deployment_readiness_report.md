# Panther Law Prep — Production Deployment Readiness Report

**Date:** October 17, 2026  
**Repository:** `Law-Mock-Test-Demo`  
**Target Architecture:** Next.js 16.3.5 (Turbopack, App Router) hosted on Vercel, Supabase PostgreSQL with Prisma 6.12.0, Supabase Auth + Resend SMTP email OTP, Razorpay (TEST MODE).

---

## 1. Executive Summary

This report documents the audit and preparation of Panther Law Prep for deployment to Vercel connected to your Supabase PostgreSQL database.

All automated verifications have been conducted on the repository:
- **Backend Test Suite:** `91 / 91 passed` across 8 test suites.
- **Frontend Typecheck:** `tsc --noEmit` passed with **0 errors**.
- **Production Build:** `next build` compiled all **66 static and dynamic routes** cleanly in a simulated production environment.

**Live payments and destructive database commands have NOT been executed.**

---

## 2. Monorepo & Vercel Root Directory Configuration

The repository is organized as an npm monorepo:
```
Law-Mock-Test-Demo/
├── package.json              <-- Root workspace definition ("frontend", "backend")
├── vercel.json               <-- Root Vercel build & install orchestrator (Created)
├── backend/
│   ├── package.json
│   └── prisma/
│       └── schema.prisma     <-- Canonical database schema
└── frontend/
    ├── package.json          <-- Next.js app package
    ├── next.config.ts        <-- Security headers, CSP & runtime settings
    └── src/app/              <-- 66 App Router pages & API routes
```

### Monorepo Build Setup for Vercel:
Because `frontend` relies on the canonical Prisma schema located in `backend/prisma/schema.prisma`, deploying Vercel directly with `Root Directory: frontend` would cause Vercel to fail to locate `../backend/prisma/schema.prisma`.

To solve this safely without duplicating schemas or package files, we added a root [vercel.json](file:///c:/Github/Law-Mock-Test-Demo/vercel.json):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "prisma generate --schema=./backend/prisma/schema.prisma && npm --workspace=frontend run build"
}
```

### Vercel Dashboard Settings:
When importing the GitHub repository into Vercel:
- **Framework Preset:** Next.js
- **Root Directory:** `./` (Leave as repository root; **do not** set to `frontend`)
- **Build Command:** Automatically handled by `vercel.json` (or override with `prisma generate --schema=./backend/prisma/schema.prisma && npm --workspace=frontend run build`)
- **Output Directory:** `frontend/.next`
- **Install Command:** `npm install`

---

## 3. Database Deployment & Migration Safety

The database is hosted on Supabase PostgreSQL (AWS ap-south-1).

### Safety Rules Enforced:
1. **Never run `prisma migrate reset`:** This would wipe all users, questions, blueprints, and attempts.
2. **Never run unreviewed `prisma db push` on production:** `db push` does not track migration history and can result in silent data loss if an alteration is destructive.
3. **Correct Production Command:**
   ```bash
   npx prisma migrate deploy --schema=./backend/prisma/schema.prisma
   ```
   *(Note: The database already has the complete schema matching `schema.prisma`. No pending migrations need to be forced).*

### Connection Pooling & PgBouncer:
- In production on Vercel (serverless functions), always supply:
  - **`DATABASE_URL`**: Supabase **Transaction pooler** (`port 6543` with `?pgbouncer=true`). This prevents serverless functions from exhausting PostgreSQL connection limits.
  - **`DIRECT_URL`**: Supabase **Direct connection** (`port 5432`) used for CLI migrations and schema operations.

---

## 4. Environment Variables Checklist

Configure these variables in **Vercel Project Settings $\to$ Environment Variables**:

| Variable Name | Classification | Description & Value Source |
|---|---|---|
| `DATABASE_URL` | **Required Secret** | Supabase pooled connection string (`port 6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | **Required Secret** | Supabase direct connection string (`port 5432`) |
| `AUTH_SECRET` | **Required Secret** | 32+ character random secret used for JWT signing (`openssl rand -base64 32`) |
| `APP_ENVIRONMENT` | **Required Non-Secret** | Set to `preview` in Preview environments, `production` in Production. |
| `NEXT_PUBLIC_APP_URL` | **Required Non-Secret** | Canonical production URL (e.g. `https://your-domain.vercel.app`) without trailing slash. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Public Browser Variable** | Your Supabase project URL (`https://wxwmukgvmzmibtjemkuu.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| **Public Browser Variable** | Your Supabase anonymous public key |
| `RAZORPAY_KEY_ID` | **Required Secret** | Razorpay test key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | **Required Secret** | Razorpay test key secret (Never expose to browser) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Public Browser Variable** | Same test key ID (`rzp_test_...`) for Checkout modal initialization |
| `RAZORPAY_WEBHOOK_SECRET` | **Required Secret** | Secret for verifying webhook HMAC (`whsec_panther_test_secret_2026`) |
| `RESEND_API_KEY` | **Optional Secret** | Resend API key if sending emails directly via SDK in addition to Supabase SMTP |

> [!CAUTION]
> **Environment Isolation Safety:** In any non-production environment (Local or Vercel Preview), the codebase automatically validates that `RAZORPAY_KEY_ID` starts with `rzp_test_`. Using a live key in Preview/Dev will throw an immediate startup safety exception.

---

## 5. Authentication, Cookies, & HTTPS Configuration

1. **Session Cookies:**
   - In [session.ts](file:///c:/Github/Law-Mock-Test-Demo/frontend/src/lib/session.ts#L70), session cookies are configured with:
     ```typescript
     httpOnly: true,
     secure: process.env.NODE_ENV === "production",
     sameSite: "lax",
     path: "/"
     ```
   - On Vercel HTTPS domains, `secure: true` is automatically enforced by Next.js in production builds.
2. **Supabase Auth Redirect URLs:**
   - In **Supabase Dashboard $\to$ Authentication $\to$ URL Configuration**:
     - **Site URL:** Set to `https://your-production-domain.vercel.app`
     - **Redirect URLs:** Add:
       - `https://your-production-domain.vercel.app/**`
       - `https://*-your-team.vercel.app/**` (For Vercel preview branch deployments)
3. **CORS & CSP Hardening:**
   - [next.config.ts](file:///c:/Github/Law-Mock-Test-Demo/frontend/next.config.ts) was updated with strict Content Security Policy allowing:
     - Connect: `'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.supabase.co`
     - Frames: `https://api.razorpay.com https://*.razorpay.com`
     - Scripts: `https://checkout.razorpay.com`

---

## 6. Razorpay TEST MODE Webhook Setup

Once deployed to Vercel:
1. Open the **Razorpay Dashboard** (Confirm top toggle is set to **Test Mode**).
2. Go to **Settings $\to$ Webhooks $\to$ Add New Webhook**.
3. **Webhook URL:** `https://your-production-domain.vercel.app/api/payment/webhook`
4. **Secret:** Set to the exact value configured in `RAZORPAY_WEBHOOK_SECRET`.
5. **Alert Email:** Your admin email.
6. **Active Events:**
   - `payment.captured`
   - `order.paid`
   - `payment.failed`
   - `refund.processed`
7. Click **Create Webhook**.

---

## 7. Reliability and Serverless Considerations

1. **File Uploads & Serverless Limits:**
   - `/api/admin/tests/import/parse` parses `.docx` and `.pdf` files in memory using `Buffer.from(await file.arrayBuffer())`.
   - Vercel serverless request body size limit is **4.5 MB** on Hobby and **10 MB** on Pro. A size limit guard of 20MB is in code; ensure uploaded mock exam papers are under 4.5MB on free tier or 10MB on Pro tier.
2. **Stateless Functions:**
   - The app does not rely on any local filesystem persistence or long-running background daemon processes.
   - All state is persisted in Supabase PostgreSQL.
3. **Database Health Diagnostics:**
   - Admin page `/admin/settings` monitors pool connectivity and token health.

---

## 8. Verification Results

| Check | Tool / Script | Result |
|---|---|---|
| **Backend Test Suite** | `npm test` in `backend` (Vitest 4.1.11) | **91 / 91 passed** (8 test files) |
| **Frontend Typecheck** | `npm run typecheck` in `frontend` (tsc) | **0 errors** |
| **Next.js Production Build** | `npx next build` in `frontend` (Turbopack) | **66/66 routes compiled cleanly** |

---

## 9. Exact Steps to Deploy the Application

When you are ready to deploy to Vercel:

1. **Push your latest changes to GitHub:**
   ```bash
   git add .
   git commit -m "chore: prepare repository for Vercel production deployment"
   git push origin main
   ```
2. **Import Project into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository `Law-Mock-Test-Demo`.
   - Leave **Root Directory** as `./`.
   - The build and install commands are automatically picked up from [vercel.json](file:///c:/Github/Law-Mock-Test-Demo/vercel.json).
3. **Add Environment Variables in Vercel:**
   - Copy the values from your `.env.local` for:
     - `DATABASE_URL`
     - `DIRECT_URL`
     - `AUTH_SECRET`
     - `APP_ENVIRONMENT` (`production`)
     - `NEXT_PUBLIC_APP_URL` (`https://<your-project>.vercel.app`)
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
     - `RAZORPAY_WEBHOOK_SECRET`
4. **Click Deploy:**
   - Vercel will run `npm install`, generate the Prisma Client, compile Next.js, and provide your live HTTPS URL.
5. **Post-Deployment Verification:**
   - Open your live Vercel URL.
   - Test sign in with `admin@pantherlawprep.com` to verify database connectivity.
   - Register a test student and verify email OTP.
   - Navigate to `/tests` and run a test payment of ₹49 via Razorpay Test Mode to confirm payment verification and instant test enrollment!
