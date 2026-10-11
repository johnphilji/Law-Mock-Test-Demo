/**
 * Shared TypeScript types for Panther Law Prep.
 *
 * This file re-exports from feature-specific type files and defines
 * cross-cutting types used throughout the application.
 *
 * IMPORTANT: These types describe shapes for the application layer.
 * Prisma-generated types are used at the database layer.
 * Do not conflate the two — map explicitly in services/repositories.
 */

// =============================================================================
// USER / AUTH
// =============================================================================

export type UserRole = "STUDENT" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// =============================================================================
// SUBSCRIPTION
// =============================================================================

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";

export interface SubscriptionInfo {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  startedAt: Date | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  isActive: boolean;
}

// =============================================================================
// PAYMENT
// =============================================================================

export type PaymentStatus =
  | "CREATED"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface PaymentRecord {
  id: string;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
}

// =============================================================================
// EXAM
// =============================================================================

export type TestType = "MOCK" | "SECTIONAL" | "TOPIC";
export type TestStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionType = "SINGLE_CHOICE";

export interface ExamSummary {
  id: string;
  name: string;
  slug: string;
}

export interface TestSummary {
  id: string;
  title: string;
  slug: string;
  type: TestType;
  status: TestStatus;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  examId: string;
  examName: string;
}

export interface QuestionOptionData {
  optionKey: string;
  optionText: string;
  isCorrect?: boolean; // Only populated for admin views / post-submission
  displayOrder: number;
}

/**
 * Question data sent to the client during an active exam.
 * NOTE: isCorrect is NEVER included in this type for active exams.
 * Correct answers are only revealed after submission.
 */
export interface ExamQuestion {
  id: string;
  questionVersionId: string;
  questionText: string;
  questionType: QuestionType;
  options: Omit<QuestionOptionData, "isCorrect">[];
  marks: number;
  negativeMarks: number;
}

/**
 * Question data shown during result review.
 * Includes the correct answer and explanation.
 */
export interface ReviewQuestion extends ExamQuestion {
  selectedOptionKey: string | null;
  correctOptionKey: string;
  explanation: string | null;
  isCorrect: boolean;
  isUnanswered: boolean;
}

// =============================================================================
// ATTEMPT
// =============================================================================

export type AttemptStatus =
  | "NOT_STARTED"     // No DB record yet — student is on instructions page
  | "IN_PROGRESS"     // Active exam session
  | "SUBMITTED"       // Submitted by student
  | "AUTO_SUBMITTED"  // Server auto-submitted due to timer expiry
  | "EXPIRED"         // Timer expired with no answers; no score calculated
  | "ABANDONED";      // Admin-only action; precisely defined below

/**
 * ABANDONED state — precise definition per Amendment #4:
 *
 * An attempt becomes ABANDONED ONLY when an admin explicitly marks it.
 * The following events do NOT cause ABANDONED:
 * - Browser close/tab close
 * - Page refresh
 * - Network loss (temporary or extended)
 * - Leaving the exam URL
 * - Browser sleep/wake
 * - System sleep/wake
 * - Closing the laptop
 *
 * An IN_PROGRESS attempt with no activity for any amount of time
 * remains IN_PROGRESS until: (a) the student submits, (b) the timer
 * expires (→ AUTO_SUBMITTED or EXPIRED), or (c) an admin abandons it.
 *
 * Students can always resume an IN_PROGRESS attempt by returning to the exam URL.
 * Answers saved before the disconnect are preserved server-side.
 */

export type QuestionState =
  | "NOT_VISITED"               // Student has not seen this question yet
  | "NOT_ANSWERED"              // Student visited but did not answer
  | "ANSWERED"                  // Student has selected an answer
  | "MARKED_FOR_REVIEW"         // Student marked for review without answering
  | "ANSWERED_AND_MARKED";      // Student answered AND marked for review

export interface AttemptSummary {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  testType: TestType;
  status: AttemptStatus;
  startedAt: Date;
  expiresAt: Date;
  submittedAt: Date | null;
  score: number | null;
  percentage: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unansweredCount: number | null;
  totalMarks: number | null;
  timeTakenSeconds: number | null;
  createdAt: Date;
}

/**
 * The data returned when a student starts/resumes an exam.
 * NOTE: This never contains correct answers or the full test configuration.
 * Only the information needed to render the exam UI.
 */
export interface ActiveAttemptData {
  attemptId: string;
  testId: string;
  testTitle: string;
  durationMinutes: number;
  startedAt: string;   // ISO string
  expiresAt: string;   // ISO string
  serverTime: string;  // ISO string — client uses this to calibrate display timer
  questions: ExamQuestion[];
  answers: Record<string, string | null>;           // questionId → selectedOptionKey
  reviewFlags: Record<string, boolean>;             // questionId → isMarkedForReview
  visitedFlags: Record<string, boolean>;            // questionId → has been visited
}

// =============================================================================
// RESULT
// =============================================================================

export interface AttemptResult {
  attemptId: string;
  testTitle: string;
  testType: TestType;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  submittedAt: Date;
  questions: ReviewQuestion[];
}

// =============================================================================
// SUPPORT
// =============================================================================

export type TicketCategory =
  | "PAYMENT"
  | "ACCOUNT"
  | "TECHNICAL"
  | "TEST_ISSUE"
  | "QUESTION_ISSUE"
  | "OTHER";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface SupportTicketSummary {
  id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// ADMIN
// =============================================================================

export interface AdminAnalyticsSummary {
  totalUsers: number;
  activeSubscribers: number;
  expiredSubscribers: number;
  totalRevenuePaise: number;
  totalTests: number;
  publishedTests: number;
  totalAttempts: number;
  openTickets: number;
}

// =============================================================================
// PAGINATION
// =============================================================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}
