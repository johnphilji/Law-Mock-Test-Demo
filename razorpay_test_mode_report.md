# Panther Law Prep — Phase 3: Razorpay Test-Mode Integration Report

**Date:** October 16, 2026  
**Repository:** `Law-Mock-Test-Demo`  
**Environment:** Next.js 16.3.5 (Turbopack, App Router, React 19), Prisma 6.12.0, PostgreSQL on Supabase, Vitest 4.1.11  
**Mode:** Razorpay TEST MODE ONLY (`rzp_test_*`)

---

## 1. Architecture and Payment Lifecycle

The integration adheres to strict zero-trust security and financial idempotency:

```
[Student in Browser]
       │
       ▼ (1) POST /api/checkout (Authenticated & Verified Email)
[Next.js Server] ──(Validates tests & calculates authoritative 4900 paise)──► [Prisma: Payment (CREATED)]
       │
       ▼ (2) razorpay.orders.create({ amount: 4900, currency: 'INR' })
[Razorpay API] ──(Returns order_id: 'order_xxx')──► [Next.js Server]
       │
       ▼ (3) Returns { orderId, amount: 4900, currency: 'INR', keyId }
[Student in Browser]
       │
       ▼ (4) Opens Razorpay Standard Checkout modal (Official checkout.js)
       ▼ (5) Student completes test payment with dummy card / Netbanking / UPI
       │
   ┌───┴────────────────────────────────────────┐
   ▼ (Browser Callback Path)                    ▼ (Asynchronous Webhook Path)
POST /api/payment/verify                   POST /api/payment/webhook
   │                                            │
   ├── 1. requireAuth()                         ├── 1. Read exact raw request text
   ├── 2. Verify student ownership              ├── 2. Verify HMAC on X-Razorpay-Signature
   ├── 3. Verify HMAC signature in constant time├── 3. Idempotent insert into WebhookEvent
   ├── 4. Query Razorpay API (payments.fetch)   ├── 4. Verify amount & order match
   ├── 5. Confirm status === 'captured'         └── 5. Concurrency-safe atomic fulfillment
   └── 6. Concurrency-safe atomic fulfillment          └── Status = 'CAPTURED', Subscription = 'ACTIVE'
```

---

## 2. Product and Entitlement Model

- **Product:** All-India Mock Test Series Pass
- **Authoritative Price:** `SUBSCRIPTION_PRICE_PAISE = 4900` (₹49.00)
- **Duration:** 30 Days (`SUBSCRIPTION_DURATION_DAYS = 30`), as confirmed in design alignment.
- **Access Policy:** Provides complete access to proctored computer-based tests (`CBT`) and scorecards.
- **Safe Extension Rule:** If a student already possesses an active subscription expiring in the future, the expiry date is extended by 30 days from the current `expiresAt`. If expired or none exists, it is activated for 30 days from `now`.

---

## 3. Files Created and Modified

1. **`frontend/src/lib/razorpay.ts` (New):**
   - Singleton wrapper for official `Razorpay` Node.js SDK.
   - Enforces key validation: in non-production environments, verifies that `RAZORPAY_KEY_ID` begins with `rzp_test_`. Live keys are strictly rejected.
2. **`frontend/src/lib/payment-fulfillment.ts` (New):**
   - Centralized, concurrency-safe fulfillment service wrapped in a Prisma `$transaction`.
   - Handles race conditions between concurrent browser verification and webhook delivery.
   - Ensures duplicate deliveries return the existing subscription without double-extending duration.
3. **`frontend/src/app/api/checkout/route.ts` (Updated):**
   - Enforces `requireVerifiedEmail()`.
   - Generates local `Payment` (status `CREATED`) and calls `razorpay.orders.create()`.
   - Prevents duplicate order spam by returning existing active pending orders created within 10 minutes.
4. **`frontend/src/app/api/payment/verify/route.ts` (Updated):**
   - Authenticates student and validates input with `VerifyPaymentSchema`.
   - Confirms order ownership (`payment.userId === student.id`).
   - Constant-time HMAC-SHA256 signature verification.
   - Direct server-to-server validation via `razorpay.payments.fetch(paymentId)` to verify status, amount, and order ID.
   - Invokes `fulfillPayment()` atomically.
5. **`frontend/src/app/api/payment/webhook/route.ts` (New):**
   - Reads exact raw request body for `X-Razorpay-Signature` validation.
   - Idempotently logs into `WebhookEvent` table using `eventId` unique constraint.
   - Handles `payment.captured`, `order.paid`, `payment.failed`, and `refund.processed`.
   - Prevents delayed failure events from overwriting already `CAPTURED` payments.
6. **`frontend/src/app/(student)/checkout/page.tsx` (Updated):**
   - Loads official `https://checkout.razorpay.com/v1/checkout.js`.
   - Launches checkout modal with prefilled student details.
   - Displays clear loading, verifying, and error states with a clean success confirmation card.
7. **`backend/tests/services/razorpayPayment.test.ts` (New):**
   - 9 automated tests covering signatures, idempotency, webhook deduplication, cross-student protection, tampered amounts, and subscription extensions.

---

## 4. Environment Variables Required

In your `.env.local` (or `frontend/.env.local`), add your Razorpay Test Mode credentials:

```env
# Razorpay Test Credentials (Obtain from https://dashboard.razorpay.com -> Settings -> API Keys)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_test_key_secret"

# Webhook Secret (Obtain when setting up Webhook in Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Public key exposed to browser for Checkout modal initialization
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
```

---

## 5. Webhook Events to Configure in Razorpay Dashboard

In **Razorpay Dashboard** (in **Test Mode**) $\to$ **Settings** $\to$ **Webhooks** $\to$ **Add New Webhook**:
- **Webhook URL:** `https://your-domain-or-ngrok-url/api/payment/webhook`
- **Secret:** Enter a strong random secret and copy it into `RAZORPAY_WEBHOOK_SECRET`.
- **Active Events to Select:**
  1. `payment.captured`
  2. `order.paid`
  3. `payment.failed`
  4. `refund.processed`

---

## 6. Automated Verification Results

| Check | Command Executed | Result | Notes |
|---|---|---|---|
| **Backend Test Suite** | `npm test` in `backend` | **91 / 91 passed** (8 test files) | Includes all 9 new Razorpay security & idempotency tests |
| **Frontend Typecheck** | `npm run typecheck` in `frontend` | **0 errors** | `tsc --noEmit` succeeded |
| **Next.js Production Build** | `npx next build` in `frontend` | **0 errors** | All 66 static and dynamic routes compiled successfully |

---

## 7. How to Manually Test in Razorpay TEST MODE

### Prerequisite:
Add your Razorpay Test Key (`rzp_test_...`) and Secret to `.env.local`.

### Test Case A: Successful Payment
1. Run `npm run dev` in `frontend`.
2. Log in with a verified student account and navigate to `/tests`.
3. Add a mock test series to cart and click **Proceed to Checkout**.
4. Click **Pay ₹49.00 with Razorpay**.
5. When the Razorpay test modal appears:
   - Select **Netbanking** $\to$ choose **SBI** or **HDFC** (or choose **Card** and use test card `4111 1111 1111 1111`, any future expiry, CVV `123`).
   - Razorpay test simulator will display **"Success"** and **"Failure"** buttons $\to$ Click **Success**.
6. The modal closes $\to$ the page shows **"Verifying Payment..."** $\to$ transitions to **"Payment Confirmed / Enrolled Successfully!"** with your Subscription Reference.
7. Open `/dashboard` $\to$ your enrolled tests are unlocked with 30 days active access.

### Test Case B: Failed / Dismissed Payment
1. Click **Pay ₹49.00 with Razorpay** again.
2. When the simulator opens, click the **Failure** button (or close the modal via **✕**).
3. The page displays an honest error alert: *"Payment failed at gateway"* or allows safe retry.
4. No subscription extension or entitlement is granted.

---

## 8. Safety & Compliance Confirmation
- **Live Mode:** Disabled (forbidden by environment guards).
- **Deployment:** Not triggered.
- **Database Safety:** Zero records deleted; zero destructive migrations applied.
- **Authentication & Email OTP:** Fully preserved.
