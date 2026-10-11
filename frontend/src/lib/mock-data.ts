/**
 * Comprehensive mock data for Panther Law Prep admin portal.
 *
 * This module provides typed mock data for all admin screens so the UI
 * can be developed and previewed without a PostgreSQL connection.
 *
 * Structure:
 * - All data follows the same shapes as the Prisma models / app types.
 * - Data is realistic and representative of actual AIBE exam content.
 * - Replace with real Prisma queries later via repository pattern.
 *
 * IMPORTANT: This is mock data only. Do not use for production.
 */

// =============================================================================
// USERS
// =============================================================================

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "STUDENT" | "ADMIN";
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const mockStudents: MockUser[] = [
  { id: "u-001", name: "Aditi Sharma", email: "aditi.sharma@example.com", phone: "9876543210", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-08-15T10:30:00Z", lastLoginAt: "2026-09-27T09:00:00Z" },
  { id: "u-002", name: "Rohit Verma", email: "rohit.verma@example.com", phone: "9876543211", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-08-20T14:15:00Z", lastLoginAt: "2026-09-26T18:30:00Z" },
  { id: "u-003", name: "Priya Patel", email: "priya.patel@example.com", phone: "9876543212", role: "STUDENT", isEmailVerified: false, isActive: true, createdAt: "2026-09-01T08:00:00Z", lastLoginAt: null },
  { id: "u-004", name: "Vikram Singh", email: "vikram.singh@example.com", phone: "9876543213", role: "STUDENT", isEmailVerified: true, isActive: false, createdAt: "2026-07-10T11:45:00Z", lastLoginAt: "2026-08-05T14:20:00Z" },
  { id: "u-005", name: "Sneha Gupta", email: "sneha.gupta@example.com", phone: "9876543214", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-09-05T16:30:00Z", lastLoginAt: "2026-09-27T07:15:00Z" },
  { id: "u-006", name: "Arjun Mehta", email: "arjun.mehta@example.com", phone: "9876543215", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-09-10T09:00:00Z", lastLoginAt: "2026-09-25T20:00:00Z" },
  { id: "u-007", name: "Kavya Nair", email: "kavya.nair@example.com", phone: "9876543216", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-09-12T13:00:00Z", lastLoginAt: "2026-09-27T11:30:00Z" },
  { id: "u-008", name: "Anil Kumar", email: "anil.kumar@example.com", phone: null, role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-09-15T07:30:00Z", lastLoginAt: "2026-09-26T22:00:00Z" },
  { id: "u-009", name: "Deepika Reddy", email: "deepika.reddy@example.com", phone: "9876543218", role: "STUDENT", isEmailVerified: false, isActive: true, createdAt: "2026-09-20T10:00:00Z", lastLoginAt: null },
  { id: "u-010", name: "Manish Joshi", email: "manish.joshi@example.com", phone: "9876543219", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-09-22T15:45:00Z", lastLoginAt: "2026-09-27T06:00:00Z" },
  { id: "u-011", name: "Riya Kapoor", email: "riya.kapoor@example.com", phone: "9876543220", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-09-23T08:30:00Z", lastLoginAt: "2026-09-26T14:00:00Z" },
  { id: "u-012", name: "Suresh Babu", email: "suresh.babu@example.com", phone: "9876543221", role: "STUDENT", isEmailVerified: true, isActive: true, createdAt: "2026-09-24T12:00:00Z", lastLoginAt: "2026-09-27T10:00:00Z" },
];

export const mockAdmins: MockUser[] = [
  { id: "a-001", name: "Admin User", email: "admin@pantherlawprep.com", phone: null, role: "ADMIN", isEmailVerified: true, isActive: true, createdAt: "2026-01-01T00:00:00Z", lastLoginAt: "2026-09-27T08:00:00Z" },
];

// =============================================================================
// EXAMS
// =============================================================================

export interface MockExam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subjectCount: number;
  testCount: number;
}

export const mockExams: MockExam[] = [
  {
    id: "ex-001",
    name: "All India Bar Examination (AIBE) XXI",
    slug: "aibe-xxi",
    description: "The All India Bar Examination is conducted by the Bar Council of India for advocates enrolled in State Bar Councils. The exam tests fundamental knowledge of law required for practicing as an advocate.",
    isActive: true,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-09-15T00:00:00Z",
    subjectCount: 19,
    testCount: 8,
  },
];

// =============================================================================
// SUBJECTS (AIBE XXI — 19 Subjects)
// =============================================================================

export interface MockSubject {
  id: string;
  examId: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  questionCount: number;
}

export const mockSubjects: MockSubject[] = [
  { id: "sub-01", examId: "ex-001", name: "Constitutional Law", slug: "constitutional-law", displayOrder: 1, isActive: true, questionCount: 12 },
  { id: "sub-02", examId: "ex-001", name: "Indian Penal Code, 1860 (now BNS, 2023)", slug: "ipc-bns", displayOrder: 2, isActive: true, questionCount: 8 },
  { id: "sub-03", examId: "ex-001", name: "Code of Criminal Procedure, 1973 (now BNSS, 2023)", slug: "crpc-bnss", displayOrder: 3, isActive: true, questionCount: 7 },
  { id: "sub-04", examId: "ex-001", name: "Indian Evidence Act, 1872 (now BSA, 2023)", slug: "evidence-bsa", displayOrder: 4, isActive: true, questionCount: 5 },
  { id: "sub-05", examId: "ex-001", name: "Civil Procedure Code, 1908", slug: "cpc", displayOrder: 5, isActive: true, questionCount: 7 },
  { id: "sub-06", examId: "ex-001", name: "Contract Law (Indian Contract Act, 1872)", slug: "contract-law", displayOrder: 6, isActive: true, questionCount: 5 },
  { id: "sub-07", examId: "ex-001", name: "Arbitration, Conciliation and ADR", slug: "arbitration-adr", displayOrder: 7, isActive: true, questionCount: 4 },
  { id: "sub-08", examId: "ex-001", name: "Hindu Law", slug: "hindu-law", displayOrder: 8, isActive: true, questionCount: 5 },
  { id: "sub-09", examId: "ex-001", name: "Muslim Law", slug: "muslim-law", displayOrder: 9, isActive: true, questionCount: 3 },
  { id: "sub-10", examId: "ex-001", name: "Law of Torts", slug: "torts", displayOrder: 10, isActive: true, questionCount: 4 },
  { id: "sub-11", examId: "ex-001", name: "Company Law", slug: "company-law", displayOrder: 11, isActive: true, questionCount: 5 },
  { id: "sub-12", examId: "ex-001", name: "Labour and Industrial Laws", slug: "labour-law", displayOrder: 12, isActive: true, questionCount: 5 },
  { id: "sub-13", examId: "ex-001", name: "Environmental Law", slug: "environmental-law", displayOrder: 13, isActive: true, questionCount: 4 },
  { id: "sub-14", examId: "ex-001", name: "Consumer Protection Act", slug: "consumer-protection", displayOrder: 14, isActive: true, questionCount: 4 },
  { id: "sub-15", examId: "ex-001", name: "Cyber Law (IT Act, 2000)", slug: "cyber-law", displayOrder: 15, isActive: true, questionCount: 4 },
  { id: "sub-16", examId: "ex-001", name: "Right to Information Act, 2005", slug: "rti", displayOrder: 16, isActive: true, questionCount: 3 },
  { id: "sub-17", examId: "ex-001", name: "Transfer of Property Act, 1882", slug: "transfer-of-property", displayOrder: 17, isActive: true, questionCount: 5 },
  { id: "sub-18", examId: "ex-001", name: "Limitation Act, 1963", slug: "limitation-act", displayOrder: 18, isActive: true, questionCount: 5 },
  { id: "sub-19", examId: "ex-001", name: "Professional Ethics & Cases", slug: "professional-ethics", displayOrder: 19, isActive: true, questionCount: 5 },
];

// =============================================================================
// TESTS
// =============================================================================

export type MockTestType = "MOCK" | "SECTIONAL" | "TOPIC";
export type MockTestStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface MockTest {
  id: string;
  examId: string;
  examName: string;
  title: string;
  slug: string;
  description: string | null;
  type: MockTestType;
  status: MockTestStatus;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  negativeMarking: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showExplanations: boolean;
  isFree: boolean;
  pricePaise: number;
  discountedPricePaise: number | null;
  accessDays: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  attemptCount: number;
}

export const mockTests: MockTest[] = [
  { id: "t-001", examId: "ex-001", examName: "AIBE XXI", title: "AIBE XXI Full Mock Test 1", slug: "aibe-xxi-mock-1", description: "Complete 100-question mock test following the official AIBE pattern.", type: "MOCK", status: "PUBLISHED", durationMinutes: 210, totalMarks: 100, totalQuestions: 100, negativeMarking: 0, randomizeQuestions: true, randomizeOptions: false, showExplanations: true, isFree: false, pricePaise: 9900, discountedPricePaise: 4900, accessDays: 30, createdBy: "a-001", createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-08-15T00:00:00Z", publishedAt: "2026-08-15T00:00:00Z", attemptCount: 245 },
  { id: "t-002", examId: "ex-001", examName: "AIBE XXI", title: "AIBE XXI Full Mock Test 2", slug: "aibe-xxi-mock-2", description: "Second full-length mock test for AIBE XXI preparation.", type: "MOCK", status: "PUBLISHED", durationMinutes: 210, totalMarks: 100, totalQuestions: 100, negativeMarking: 0, randomizeQuestions: true, randomizeOptions: false, showExplanations: true, isFree: false, pricePaise: 9900, discountedPricePaise: 4900, accessDays: 30, createdBy: "a-001", createdAt: "2026-07-15T00:00:00Z", updatedAt: "2026-08-20T00:00:00Z", publishedAt: "2026-08-20T00:00:00Z", attemptCount: 189 },
  { id: "t-003", examId: "ex-001", examName: "AIBE XXI", title: "Constitutional Law — Sectional Test", slug: "constitutional-law-sectional", description: "Focused sectional test on Constitutional Law topics.", type: "SECTIONAL", status: "PUBLISHED", durationMinutes: 45, totalMarks: 20, totalQuestions: 20, negativeMarking: 0, randomizeQuestions: false, randomizeOptions: false, showExplanations: true, isFree: true, pricePaise: 0, discountedPricePaise: null, accessDays: 30, createdBy: "a-001", createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-25T00:00:00Z", publishedAt: "2026-08-25T00:00:00Z", attemptCount: 312 },
  { id: "t-004", examId: "ex-001", examName: "AIBE XXI", title: "IPC/BNS — Sectional Test", slug: "ipc-bns-sectional", description: "Practice test focusing on Indian Penal Code provisions.", type: "SECTIONAL", status: "PUBLISHED", durationMinutes: 30, totalMarks: 15, totalQuestions: 15, negativeMarking: 0, randomizeQuestions: false, randomizeOptions: false, showExplanations: true, isFree: false, pricePaise: 4900, discountedPricePaise: null, accessDays: 30, createdBy: "a-001", createdAt: "2026-08-10T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z", publishedAt: "2026-09-01T00:00:00Z", attemptCount: 178 },
  { id: "t-005", examId: "ex-001", examName: "AIBE XXI", title: "AIBE XXI Full Mock Test 3", slug: "aibe-xxi-mock-3", description: "Third full-length mock with updated question pool.", type: "MOCK", status: "DRAFT", durationMinutes: 210, totalMarks: 100, totalQuestions: 100, negativeMarking: 0, randomizeQuestions: true, randomizeOptions: false, showExplanations: true, isFree: false, pricePaise: 9900, discountedPricePaise: 4900, accessDays: 30, createdBy: "a-001", createdAt: "2026-09-10T00:00:00Z", updatedAt: "2026-09-25T00:00:00Z", publishedAt: null, attemptCount: 0 },
  { id: "t-006", examId: "ex-001", examName: "AIBE XXI", title: "Fundamental Rights — Topic Drill", slug: "fundamental-rights-drill", description: "Quick topic drill on Fundamental Rights (Articles 12-35).", type: "TOPIC", status: "DRAFT", durationMinutes: 15, totalMarks: 10, totalQuestions: 10, negativeMarking: 0, randomizeQuestions: false, randomizeOptions: false, showExplanations: true, isFree: true, pricePaise: 0, discountedPricePaise: null, accessDays: 30, createdBy: "a-001", createdAt: "2026-09-20T00:00:00Z", updatedAt: "2026-09-20T00:00:00Z", publishedAt: null, attemptCount: 0 },
  { id: "t-007", examId: "ex-001", examName: "AIBE XXI", title: "AIBE XX Recap Mock", slug: "aibe-xx-recap", description: "Archived mock from previous cycle.", type: "MOCK", status: "ARCHIVED", durationMinutes: 210, totalMarks: 100, totalQuestions: 100, negativeMarking: 0, randomizeQuestions: true, randomizeOptions: false, showExplanations: true, isFree: false, pricePaise: 9900, discountedPricePaise: null, accessDays: 30, createdBy: "a-001", createdAt: "2026-03-01T00:00:00Z", updatedAt: "2026-06-30T00:00:00Z", publishedAt: "2026-04-01T00:00:00Z", attemptCount: 567 },
];

// =============================================================================
// QUESTIONS
// =============================================================================

export type MockDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface MockQuestionOption {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface MockQuestionVersion {
  id: string;
  version: number;
  questionText: string;
  difficulty: MockDifficulty;
  explanation: string | null;
  options: MockQuestionOption[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  usedInAttempts: number;
}

export interface MockQuestion {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string | null;
  topicName: string | null;
  currentVersion: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  versions: MockQuestionVersion[];
  usedInTests: number;
}

export const mockQuestions: MockQuestion[] = [
  {
    id: "q-001", subjectId: "sub-01", subjectName: "Constitutional Law", topicId: null, topicName: "Fundamental Rights", currentVersion: 2, isActive: true, createdAt: "2026-07-01T10:00:00Z", updatedAt: "2026-09-10T10:00:00Z", usedInTests: 3,
    versions: [
      { id: "qv-001-1", version: 1, questionText: "Under which Article of the Constitution is the writ jurisdiction of the Supreme Court established?", difficulty: "EASY", explanation: "Article 32 confers the right to constitutional remedies and empowers the Supreme Court to issue writs.", options: [{ optionKey: "A", optionText: "Article 32", isCorrect: true, displayOrder: 0 }, { optionKey: "B", optionText: "Article 226", isCorrect: false, displayOrder: 1 }, { optionKey: "C", optionText: "Article 13", isCorrect: false, displayOrder: 2 }, { optionKey: "D", optionText: "Article 21", isCorrect: false, displayOrder: 3 }], isActive: false, createdBy: "a-001", createdAt: "2026-07-01T10:00:00Z", usedInAttempts: 245 },
      { id: "qv-001-2", version: 2, questionText: "Under which Article of the Constitution of India is the power to issue writs for enforcement of Fundamental Rights vested in the Supreme Court?", difficulty: "EASY", explanation: "Article 32 confers the right to constitutional remedies. Dr. B.R. Ambedkar called it the 'heart and soul' of the Constitution.", options: [{ optionKey: "A", optionText: "Article 32", isCorrect: true, displayOrder: 0 }, { optionKey: "B", optionText: "Article 226", isCorrect: false, displayOrder: 1 }, { optionKey: "C", optionText: "Article 13", isCorrect: false, displayOrder: 2 }, { optionKey: "D", optionText: "Article 14", isCorrect: false, displayOrder: 3 }], isActive: true, createdBy: "a-001", createdAt: "2026-09-10T10:00:00Z", usedInAttempts: 89 },
    ],
  },
  {
    id: "q-002", subjectId: "sub-01", subjectName: "Constitutional Law", topicId: null, topicName: "Fundamental Rights", currentVersion: 1, isActive: true, createdAt: "2026-07-01T11:00:00Z", updatedAt: "2026-07-01T11:00:00Z", usedInTests: 2,
    versions: [
      { id: "qv-002-1", version: 1, questionText: "Which of the following is NOT a Fundamental Right under Part III of the Indian Constitution?", difficulty: "EASY", explanation: "Right to Property was removed from Fundamental Rights by the 44th Amendment Act, 1978. It is now a legal right under Article 300A.", options: [{ optionKey: "A", optionText: "Right to Equality", isCorrect: false, displayOrder: 0 }, { optionKey: "B", optionText: "Right to Property", isCorrect: true, displayOrder: 1 }, { optionKey: "C", optionText: "Right to Freedom of Religion", isCorrect: false, displayOrder: 2 }, { optionKey: "D", optionText: "Right against Exploitation", isCorrect: false, displayOrder: 3 }], isActive: true, createdBy: "a-001", createdAt: "2026-07-01T11:00:00Z", usedInAttempts: 334 },
    ],
  },
  {
    id: "q-003", subjectId: "sub-02", subjectName: "Indian Penal Code, 1860 (now BNS, 2023)", topicId: null, topicName: "General Exceptions", currentVersion: 1, isActive: true, createdAt: "2026-07-05T09:00:00Z", updatedAt: "2026-07-05T09:00:00Z", usedInTests: 2,
    versions: [
      { id: "qv-003-1", version: 1, questionText: "Under Section 300 of the IPC, culpable homicide amounts to murder in all cases EXCEPT when:", difficulty: "MEDIUM", explanation: "Exception 1 to Section 300 provides that culpable homicide is not murder if the offender is deprived of the power of self-control by grave and sudden provocation.", options: [{ optionKey: "A", optionText: "Grave and sudden provocation", isCorrect: true, displayOrder: 0 }, { optionKey: "B", optionText: "The act is done with premeditation", isCorrect: false, displayOrder: 1 }, { optionKey: "C", optionText: "The act is unusually cruel", isCorrect: false, displayOrder: 2 }, { optionKey: "D", optionText: "The offender is an adult", isCorrect: false, displayOrder: 3 }], isActive: true, createdBy: "a-001", createdAt: "2026-07-05T09:00:00Z", usedInAttempts: 289 },
    ],
  },
  {
    id: "q-004", subjectId: "sub-03", subjectName: "Code of Criminal Procedure, 1973 (now BNSS, 2023)", topicId: null, topicName: "FIR and Investigation", currentVersion: 1, isActive: true, createdAt: "2026-07-10T08:00:00Z", updatedAt: "2026-07-10T08:00:00Z", usedInTests: 1,
    versions: [
      { id: "qv-004-1", version: 1, questionText: "Under the Code of Criminal Procedure, 1973, an FIR is recorded under which section?", difficulty: "EASY", explanation: "Section 154 of CrPC deals with information in cognizable cases (FIR). The information must be recorded in writing and signed by the informant.", options: [{ optionKey: "A", optionText: "Section 154", isCorrect: true, displayOrder: 0 }, { optionKey: "B", optionText: "Section 155", isCorrect: false, displayOrder: 1 }, { optionKey: "C", optionText: "Section 156(3)", isCorrect: false, displayOrder: 2 }, { optionKey: "D", optionText: "Section 161", isCorrect: false, displayOrder: 3 }], isActive: true, createdBy: "a-001", createdAt: "2026-07-10T08:00:00Z", usedInAttempts: 198 },
    ],
  },
  {
    id: "q-005", subjectId: "sub-04", subjectName: "Indian Evidence Act, 1872 (now BSA, 2023)", topicId: null, topicName: "Relevancy of Facts", currentVersion: 1, isActive: true, createdAt: "2026-07-15T10:00:00Z", updatedAt: "2026-07-15T10:00:00Z", usedInTests: 2,
    versions: [
      { id: "qv-005-1", version: 1, questionText: "Which sections of the Indian Evidence Act deal with the admissibility of electronic records?", difficulty: "MEDIUM", explanation: "Sections 65A and 65B were introduced by the IT Amendment Act, 2000. Section 65B sets out the conditions for admissibility of electronic records.", options: [{ optionKey: "A", optionText: "Sections 65A and 65B", isCorrect: true, displayOrder: 0 }, { optionKey: "B", optionText: "Sections 62 and 63", isCorrect: false, displayOrder: 1 }, { optionKey: "C", optionText: "Sections 45 and 45A", isCorrect: false, displayOrder: 2 }, { optionKey: "D", optionText: "Sections 73 and 73A", isCorrect: false, displayOrder: 3 }], isActive: true, createdBy: "a-001", createdAt: "2026-07-15T10:00:00Z", usedInAttempts: 267 },
    ],
  },
  {
    id: "q-006", subjectId: "sub-05", subjectName: "Civil Procedure Code, 1908", topicId: null, topicName: "Suits", currentVersion: 1, isActive: false, createdAt: "2026-07-20T14:00:00Z", updatedAt: "2026-08-01T14:00:00Z", usedInTests: 1,
    versions: [
      { id: "qv-006-1", version: 1, questionText: "Under CPC, Order VII Rule 11 deals with:", difficulty: "MEDIUM", explanation: "Order VII Rule 11 empowers the court to reject a plaint at the threshold stage if it does not disclose a cause of action, is barred by limitation, etc.", options: [{ optionKey: "A", optionText: "Rejection of plaint", isCorrect: true, displayOrder: 0 }, { optionKey: "B", optionText: "Return of plaint", isCorrect: false, displayOrder: 1 }, { optionKey: "C", optionText: "Amendment of plaint", isCorrect: false, displayOrder: 2 }, { optionKey: "D", optionText: "Filing of written statement", isCorrect: false, displayOrder: 3 }], isActive: true, createdBy: "a-001", createdAt: "2026-07-20T14:00:00Z", usedInAttempts: 156 },
    ],
  },
];

// =============================================================================
// PAYMENTS
// =============================================================================

export type MockPaymentStatus = "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface MockPayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: MockPaymentStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export const mockPayments: MockPayment[] = [
  { id: "pay-001", userId: "u-001", userName: "Aditi Sharma", userEmail: "aditi.sharma@example.com", razorpayOrderId: "order_PNT001", razorpayPaymentId: "pay_PNT001", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-08-15T10:35:00Z", updatedAt: "2026-08-15T10:36:00Z" },
  { id: "pay-002", userId: "u-002", userName: "Rohit Verma", userEmail: "rohit.verma@example.com", razorpayOrderId: "order_PNT002", razorpayPaymentId: "pay_PNT002", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-08-20T14:20:00Z", updatedAt: "2026-08-20T14:21:00Z" },
  { id: "pay-003", userId: "u-005", userName: "Sneha Gupta", userEmail: "sneha.gupta@example.com", razorpayOrderId: "order_PNT003", razorpayPaymentId: null, amountPaise: 4900, currency: "INR", status: "FAILED", failureReason: "Payment gateway timeout", createdAt: "2026-09-05T16:35:00Z", updatedAt: "2026-09-05T16:40:00Z" },
  { id: "pay-004", userId: "u-005", userName: "Sneha Gupta", userEmail: "sneha.gupta@example.com", razorpayOrderId: "order_PNT004", razorpayPaymentId: "pay_PNT004", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-09-05T16:45:00Z", updatedAt: "2026-09-05T16:46:00Z" },
  { id: "pay-005", userId: "u-006", userName: "Arjun Mehta", userEmail: "arjun.mehta@example.com", razorpayOrderId: "order_PNT005", razorpayPaymentId: "pay_PNT005", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-09-10T09:10:00Z", updatedAt: "2026-09-10T09:11:00Z" },
  { id: "pay-006", userId: "u-007", userName: "Kavya Nair", userEmail: "kavya.nair@example.com", razorpayOrderId: "order_PNT006", razorpayPaymentId: "pay_PNT006", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-09-12T13:10:00Z", updatedAt: "2026-09-12T13:11:00Z" },
  { id: "pay-007", userId: "u-008", userName: "Anil Kumar", userEmail: "anil.kumar@example.com", razorpayOrderId: "order_PNT007", razorpayPaymentId: null, amountPaise: 4900, currency: "INR", status: "CANCELLED", failureReason: "User cancelled", createdAt: "2026-09-15T07:35:00Z", updatedAt: "2026-09-15T07:38:00Z" },
  { id: "pay-008", userId: "u-008", userName: "Anil Kumar", userEmail: "anil.kumar@example.com", razorpayOrderId: "order_PNT008", razorpayPaymentId: "pay_PNT008", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-09-15T07:40:00Z", updatedAt: "2026-09-15T07:41:00Z" },
  { id: "pay-009", userId: "u-010", userName: "Manish Joshi", userEmail: "manish.joshi@example.com", razorpayOrderId: "order_PNT009", razorpayPaymentId: "pay_PNT009", amountPaise: 4900, currency: "INR", status: "REFUNDED", failureReason: null, createdAt: "2026-09-22T15:50:00Z", updatedAt: "2026-09-24T10:00:00Z" },
  { id: "pay-010", userId: "u-011", userName: "Riya Kapoor", userEmail: "riya.kapoor@example.com", razorpayOrderId: "order_PNT010", razorpayPaymentId: "pay_PNT010", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-09-23T08:35:00Z", updatedAt: "2026-09-23T08:36:00Z" },
  { id: "pay-011", userId: "u-012", userName: "Suresh Babu", userEmail: "suresh.babu@example.com", razorpayOrderId: "order_PNT011", razorpayPaymentId: "pay_PNT011", amountPaise: 4900, currency: "INR", status: "CAPTURED", failureReason: null, createdAt: "2026-09-24T12:05:00Z", updatedAt: "2026-09-24T12:06:00Z" },
];

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export type MockSubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "REFUNDED";

export interface MockSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  paymentId: string | null;
  status: MockSubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export const mockSubscriptions: MockSubscription[] = [
  { id: "sub-s-001", userId: "u-001", userName: "Aditi Sharma", userEmail: "aditi.sharma@example.com", paymentId: "pay-001", status: "ACTIVE", startedAt: "2026-08-15T10:36:00Z", expiresAt: "2026-10-15T10:36:00Z", createdAt: "2026-08-15T10:36:00Z" },
  { id: "sub-s-002", userId: "u-002", userName: "Rohit Verma", userEmail: "rohit.verma@example.com", paymentId: "pay-002", status: "ACTIVE", startedAt: "2026-08-20T14:21:00Z", expiresAt: "2026-10-20T14:21:00Z", createdAt: "2026-08-20T14:21:00Z" },
  { id: "sub-s-003", userId: "u-005", userName: "Sneha Gupta", userEmail: "sneha.gupta@example.com", paymentId: "pay-004", status: "ACTIVE", startedAt: "2026-09-05T16:46:00Z", expiresAt: "2026-10-05T16:46:00Z", createdAt: "2026-09-05T16:46:00Z" },
  { id: "sub-s-004", userId: "u-006", userName: "Arjun Mehta", userEmail: "arjun.mehta@example.com", paymentId: "pay-005", status: "ACTIVE", startedAt: "2026-09-10T09:11:00Z", expiresAt: "2026-10-10T09:11:00Z", createdAt: "2026-09-10T09:11:00Z" },
  { id: "sub-s-005", userId: "u-007", userName: "Kavya Nair", userEmail: "kavya.nair@example.com", paymentId: "pay-006", status: "ACTIVE", startedAt: "2026-09-12T13:11:00Z", expiresAt: "2026-10-12T13:11:00Z", createdAt: "2026-09-12T13:11:00Z" },
  { id: "sub-s-006", userId: "u-008", userName: "Anil Kumar", userEmail: "anil.kumar@example.com", paymentId: "pay-008", status: "ACTIVE", startedAt: "2026-09-15T07:41:00Z", expiresAt: "2026-10-15T07:41:00Z", createdAt: "2026-09-15T07:41:00Z" },
  { id: "sub-s-007", userId: "u-010", userName: "Manish Joshi", userEmail: "manish.joshi@example.com", paymentId: "pay-009", status: "REFUNDED", startedAt: "2026-09-22T15:51:00Z", expiresAt: "2026-10-22T15:51:00Z", createdAt: "2026-09-22T15:51:00Z" },
  { id: "sub-s-008", userId: "u-011", userName: "Riya Kapoor", userEmail: "riya.kapoor@example.com", paymentId: "pay-010", status: "ACTIVE", startedAt: "2026-09-23T08:36:00Z", expiresAt: "2026-10-23T08:36:00Z", createdAt: "2026-09-23T08:36:00Z" },
  { id: "sub-s-009", userId: "u-012", userName: "Suresh Babu", userEmail: "suresh.babu@example.com", paymentId: "pay-011", status: "ACTIVE", startedAt: "2026-09-24T12:06:00Z", expiresAt: "2026-10-24T12:06:00Z", createdAt: "2026-09-24T12:06:00Z" },
];

// =============================================================================
// OBJECTIONS
// =============================================================================

export type MockObjectionStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

export interface MockObjection {
  id: string;
  questionId: string;
  questionVersionId: string;
  questionText: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  attemptId: string;
  objectionText: string;
  status: MockObjectionStatus;
  adminNote: string | null;
  submittedAt: string;
  resolvedAt: string | null;
}

export const mockObjections: MockObjection[] = [
  { id: "obj-001", questionId: "q-001", questionVersionId: "qv-001-1", questionText: "Under which Article of the Constitution is the writ jurisdiction...", studentId: "u-001", studentName: "Aditi Sharma", studentEmail: "aditi.sharma@example.com", attemptId: "att-001", objectionText: "The question mentions 'writ jurisdiction' but the correct phrasing should be 'power to issue writs for enforcement of Fundamental Rights'. The current phrasing could be confused with Article 226 which also deals with writ jurisdiction of High Courts.", status: "RESOLVED", adminNote: "Valid observation. Updated the question text in version 2.", submittedAt: "2026-09-01T14:30:00Z", resolvedAt: "2026-09-10T10:00:00Z" },
  { id: "obj-002", questionId: "q-003", questionVersionId: "qv-003-1", questionText: "Under Section 300 of the IPC, culpable homicide amounts to murder...", studentId: "u-002", studentName: "Rohit Verma", studentEmail: "rohit.verma@example.com", attemptId: "att-002", objectionText: "Option A states 'Grave and sudden provocation' as the correct answer, but the question asks 'culpable homicide amounts to murder EXCEPT when'. This is a double negative and could confuse students. The question is technically correct but poorly worded.", status: "UNDER_REVIEW", adminNote: null, submittedAt: "2026-09-15T11:00:00Z", resolvedAt: null },
  { id: "obj-003", questionId: "q-005", questionVersionId: "qv-005-1", questionText: "Which sections of the Indian Evidence Act deal with the admissibility of electronic records?", studentId: "u-007", studentName: "Kavya Nair", studentEmail: "kavya.nair@example.com", attemptId: "att-003", objectionText: "The question refers to 'Indian Evidence Act' but the new Bharatiya Sakshya Adhiniyam (BSA), 2023 has replaced it. The corresponding sections are different under BSA. The question should either clearly specify IEA 1872 or update to BSA provisions.", status: "OPEN", adminNote: null, submittedAt: "2026-09-25T09:30:00Z", resolvedAt: null },
  { id: "obj-004", questionId: "q-002", questionVersionId: "qv-002-1", questionText: "Which of the following is NOT a Fundamental Right...", studentId: "u-010", studentName: "Manish Joshi", studentEmail: "manish.joshi@example.com", attemptId: "att-004", objectionText: "I believe the answer is incorrect. Right to Property is still available under Article 300A.", status: "REJECTED", adminNote: "The objection is based on a misunderstanding. Article 300A provides a legal/constitutional right, not a Fundamental Right under Part III. The 44th Amendment removed it from Part III. The question and answer are correct.", submittedAt: "2026-09-26T16:00:00Z", resolvedAt: "2026-09-26T18:00:00Z" },
];

// =============================================================================
// AUDIT LOGS
// =============================================================================

export interface MockAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const mockAuditLogs: MockAuditLog[] = [
  { id: "al-001", actorId: "a-001", actorName: "Admin User", action: "ADMIN_LOGIN", entityType: "Session", entityId: null, metadata: null, createdAt: "2026-09-27T08:00:00Z" },
  { id: "al-002", actorId: "a-001", actorName: "Admin User", action: "TEST_PUBLISHED", entityType: "Test", entityId: "t-004", metadata: { testTitle: "IPC/BNS — Sectional Test" }, createdAt: "2026-09-01T00:00:00Z" },
  { id: "al-003", actorId: "a-001", actorName: "Admin User", action: "QUESTION_VERSION_CREATED", entityType: "QuestionVersion", entityId: "qv-001-2", metadata: { questionId: "q-001", version: 2 }, createdAt: "2026-09-10T10:00:00Z" },
  { id: "al-004", actorId: "a-001", actorName: "Admin User", action: "OBJECTION_RESOLVED", entityType: "Objection", entityId: "obj-001", metadata: { resolution: "Question updated" }, createdAt: "2026-09-10T10:00:00Z" },
  { id: "al-005", actorId: "a-001", actorName: "Admin User", action: "OBJECTION_REJECTED", entityType: "Objection", entityId: "obj-004", metadata: { reason: "Incorrect objection" }, createdAt: "2026-09-26T18:00:00Z" },
  { id: "al-006", actorId: "a-001", actorName: "Admin User", action: "PAYMENT_REFUNDED", entityType: "Payment", entityId: "pay-009", metadata: { amount: 4900, userId: "u-010" }, createdAt: "2026-09-24T10:00:00Z" },
  { id: "al-007", actorId: "a-001", actorName: "Admin User", action: "USER_DEACTIVATED", entityType: "User", entityId: "u-004", metadata: { reason: "Inactive account" }, createdAt: "2026-08-05T15:00:00Z" },
  { id: "al-008", actorId: "a-001", actorName: "Admin User", action: "EXAM_CREATED", entityType: "Exam", entityId: "ex-001", metadata: { examName: "AIBE XXI" }, createdAt: "2026-06-01T00:00:00Z" },
];

// =============================================================================
// DASHBOARD ANALYTICS
// =============================================================================

export interface MockDashboardStats {
  totalStudents: number;
  activeStudents: number;
  publishedExams: number;
  publishedMockTests: number;
  activeSubscriptions: number;
  todayRevenuePaise: number;
  totalRevenuePaise: number;
  totalAttempts: number;
  openObjections: number;
  openTickets: number;
}

export const mockDashboardStats: MockDashboardStats = {
  totalStudents: 12,
  activeStudents: 10,
  publishedExams: 1,
  publishedMockTests: 4,
  activeSubscriptions: 8,
  todayRevenuePaise: 14700,
  totalRevenuePaise: 44100,
  totalAttempts: 1491,
  openObjections: 1,
  openTickets: 2,
};

export interface MockRevenueDataPoint {
  date: string;
  revenuePaise: number;
  transactions: number;
}

export const mockRevenueData: MockRevenueDataPoint[] = [
  { date: "2026-09-01", revenuePaise: 0, transactions: 0 },
  { date: "2026-09-05", revenuePaise: 4900, transactions: 1 },
  { date: "2026-09-10", revenuePaise: 4900, transactions: 1 },
  { date: "2026-09-12", revenuePaise: 4900, transactions: 1 },
  { date: "2026-09-15", revenuePaise: 4900, transactions: 1 },
  { date: "2026-09-22", revenuePaise: 4900, transactions: 1 },
  { date: "2026-09-23", revenuePaise: 4900, transactions: 1 },
  { date: "2026-09-24", revenuePaise: 4900, transactions: 1 },
  { date: "2026-09-27", revenuePaise: 14700, transactions: 3 },
];

export interface MockRegistrationDataPoint {
  date: string;
  count: number;
}

export const mockRegistrationData: MockRegistrationDataPoint[] = [
  { date: "2026-08-15", count: 1 },
  { date: "2026-08-20", count: 1 },
  { date: "2026-09-01", count: 1 },
  { date: "2026-09-05", count: 1 },
  { date: "2026-09-10", count: 1 },
  { date: "2026-09-12", count: 1 },
  { date: "2026-09-15", count: 1 },
  { date: "2026-09-20", count: 1 },
  { date: "2026-09-22", count: 1 },
  { date: "2026-09-23", count: 1 },
  { date: "2026-09-24", count: 1 },
];

// =============================================================================
// SUPPORT TICKETS
// =============================================================================

export interface MockSupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export const mockSupportTickets: MockSupportTicket[] = [
  { id: "tk-001", userId: "u-005", userName: "Sneha Gupta", userEmail: "sneha.gupta@example.com", category: "PAYMENT", subject: "Payment failed but amount debited", status: "IN_PROGRESS", priority: "HIGH", createdAt: "2026-09-05T17:00:00Z", updatedAt: "2026-09-06T10:00:00Z" },
  { id: "tk-002", userId: "u-002", userName: "Rohit Verma", userEmail: "rohit.verma@example.com", category: "TEST_ISSUE", subject: "Timer issue during mock test", status: "OPEN", priority: "MEDIUM", createdAt: "2026-09-26T19:00:00Z", updatedAt: "2026-09-26T19:00:00Z" },
  { id: "tk-003", userId: "u-001", userName: "Aditi Sharma", userEmail: "aditi.sharma@example.com", category: "ACCOUNT", subject: "Unable to update phone number", status: "RESOLVED", priority: "LOW", createdAt: "2026-09-20T11:00:00Z", updatedAt: "2026-09-21T09:00:00Z" },
];
