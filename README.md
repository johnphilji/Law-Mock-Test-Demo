# PantherPrep — Professional Mock Test & CBT Examination Platform

A production-grade, full-stack examination and test-series platform designed following authentic **NTA (National Testing Agency)** and **TCS iON CBT (Computer Based Test)** standards. The platform supports multiple mock test enrollments, secure payment gateways (Razorpay, UPI, Stripe), proctored exam simulations, automated server-side evaluation, and a comprehensive Administrative Question Bank & Blueprint Builder.

---

## 🏗️ Architecture & Folder Structure

This project is built as a clean, modular monorepo cleanly separating client-side presentation/applications and server-side business logic and data persistence:

```
.
├── frontend/                                # Next.js 16 (App Router) & React 19 Frontend
│   ├── public/                              # Static icons and assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── (student)/                   # 🎓 Candidate / Student Portal
│   │   │   │   ├── layout.tsx               # Student navigation header, roll info & layout
│   │   │   │   ├── dashboard/page.tsx       # Performance dashboard, enrolled mocks, AIR percentiles
│   │   │   │   ├── tests/page.tsx           # Multi-test catalog (Full mocks, sectionals, topic tests)
│   │   │   │   ├── checkout/page.tsx        # Multi-test cart & payment gateway (Razorpay/UPI/Stripe)
│   │   │   │   └── results/page.tsx         # Detailed NTA scorecard, negative markings & solutions
│   │   │   │
│   │   │   ├── (exam)/                      # 🖥️ NTA / TCS-iON CBT Proctored Engine
│   │   │   │   └── test/[testId]/page.tsx   # Fullscreen exam screen with proctoring constraints
│   │   │   │
│   │   │   ├── admin/                       # 🛡️ Administration Portal
│   │   │   │   ├── (portal)/
│   │   │   │   │   ├── page.tsx             # Admin metrics, registrations & revenue stats
│   │   │   │   │   ├── questions/           # Question Bank (Rich text editor, versions & options)
│   │   │   │   │   ├── tests/               # Test series manager & NTA Blueprint builder
│   │   │   │   │   ├── payments/            # Transaction audit logs & webhook reconciliations
│   │   │   │   │   ├── objections/          # Student answer key dispute / challenge portal
│   │   │   │   │   ├── results/             # Candidate score releases & percentile normalization
│   │   │   │   │   └── users/               # Student enrollment & access controls
│   │   │   │   └── login/                   # Dedicated administrative authentication
│   │   │   │
│   │   │   └── api/                         # 💳 Server API Endpoints
│   │   │       ├── checkout/route.ts        # Order generation for Razorpay / UPI
│   │   │       └── payment/verify/route.ts  # HMAC signature verification & automated entitlement
│   │   │
│   │   ├── components/
│   │   │   ├── admin/                       # QuestionEditor, Admin Sidebar, management tables
│   │   │   ├── exam/                        # ExamEngine (5-color question palette, countdown timer)
│   │   │   └── ui/                          # Reusable buttons, cards, badges, modal dialogs
│   │   ├── lib/                             # Mock datasets, validation schemas & rate limiters
│   │   ├── types/                           # Shared TypeScript type definitions
│   │   └── utils/                           # Formatters, styling (cn), and crypto utilities
│   ├── next.config.ts                       # Next.js build configuration
│   ├── postcss.config.mjs                   # PostCSS / Tailwind CSS configuration
│   ├── eslint.config.mjs                    # ESLint rules
│   ├── package.json                         # Frontend dependencies & scripts
│   └── tsconfig.json                        # Frontend TypeScript configuration
│
├── backend/                                 # ⚙️ Backend Services & Database Engine
│   ├── prisma/                              # Prisma ORM
│   │   ├── schema.prisma                    # PostgreSQL schema with UUIDs, attempts, question versioning
│   │   └── seed.ts                          # Database seeding for exams, subjects & admin credentials
│   ├── src/
│   │   ├── server/services/                 # Pure scoring engines and server-side business logic
│   │   │   └── scoringService.ts            # Immutable snapshot scoring with negative marking algorithms
│   │   └── scripts/                         # Bootstrap admin and database management scripts
│   ├── tests/                               # Backend unit & integration test suites
│   │   └── services/                        # Concurrency, race conditions & scoring tests
│   ├── vitest.config.ts                     # Vitest configuration
│   ├── package.json                         # Backend dependencies & scripts
│   └── tsconfig.json                        # Backend TypeScript configuration
│
└── package.json                             # Monorepo workspace orchestrator
```

---

## 🎯 Key Capabilities

### 1. 🎓 Student Candidate Experience
- **Multi-Test Discovery & Catalog**: Students can browse tests across multiple categories (Full Length Mocks, Sectional Tests, Topic Mastery).
- **Cart & Multi-Enrollment**: Add multiple mock tests or series to a single cart.
- **Payment Gateway Integration**:
  - Secure integration ready for **Razorpay** (Cards, Net Banking, UPI), **Direct UPI QR**, and **Stripe**.
  - Automatic invoice calculation with 18% GST and instant entitlement activation.
- **Detailed NTA Scorecard & Analysis**:
  - Breakdown of Correct, Incorrect, and Unattempted questions.
  - Negative marks deduction calculation.
  - Projected All-India Rank (AIR) and Percentile ranking against thousands of candidates.
  - Step-by-step official question explanations.

### 2. 🖥️ Authentic NTA / TCS-iON CBT Engine
- **Standard 5-State Question Palette**:
  - ⚪ **Not Visited**: Question has not been opened yet.
  - 🔴 **Not Answered**: Question visited but no option selected.
  - 🟢 **Answered**: Question answered and saved.
  - 🟣 **Marked for Review**: Question flagged for later review.
  - 🟣🟢 **Answered & Marked for Review**: Answer saved, will be considered for evaluation even if not revisited.
- **Real-Time Sectional Timer**: Automated countdown with warnings and graceful auto-submission on expiration.
- **Accessibility Tools**: Text resizing, zoom magnification, and question bookmarking.
- **Candidate Objection Window**: In-exam challenge window allowing students to submit objections against provisional questions.

### 3. 🛡️ Administrative Portal
- **NTA Test Blueprint Builder**: Configure exams, section allocations, section cutoffs, timer rules, and pricing tiers.
- **Question Bank Authoring**: Rich question authoring with version history, negative marking parameters, and official solutions.
- **Commercials & Revenue Tracking**: Real-time payment logs, webhook receipts, and enrollment tracking.
- **Answer Key Objection Review**: Dedicated moderation interface to resolve disputed questions.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or pnpm

### Quick Setup

1. **Install Dependencies (Root Workspace)**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` in both `frontend/` and `backend/`:
   ```bash
   cp .env.example frontend/.env
   cp .env.example backend/.env
   ```

3. **Start Frontend Development Server**:
   ```bash
   npm run dev
   # Server runs on: http://localhost:3000
   ```

4. **Run Backend Tests**:
   ```bash
   npm run test
   ```

5. **Prisma Database Commands (PostgreSQL)**:
   ```bash
   npm run db:generate   # Generate Prisma client
   npm run db:migrate    # Apply database migrations
   npm run db:seed       # Seed mock tests and subjects
   ```

---

## 🔗 Key Portal Routes

| Portal | URL Path | Description |
| :--- | :--- | :--- |
| **Landing Page** | `/` | Platform introduction, test series showcase, and pricing |
| **Student Dashboard** | `/dashboard` | Student metrics, enrolled tests, and recent results |
| **Mock Test Catalog** | `/tests` | Browse mock test series, filter by format, and add to cart |
| **Checkout & Payments** | `/checkout` | Order summary, GST calculation, and Razorpay/UPI gateway |
| **Scorecard & Solutions** | `/results` | NTA exam analytics, percentiles, and solution review |
| **CBT Exam Engine** | `/test/test-clat-full-1` | Live proctored NTA CBT exam simulation |
| **Admin Dashboard** | `/admin` | Administrative overview, revenue stats, and system logs |
| **Test Blueprint Builder** | `/admin/tests/new` | Create new mock test papers with sections & pricing |
| **Question Bank Editor** | `/admin/questions/new` | Author and publish new examination questions |
