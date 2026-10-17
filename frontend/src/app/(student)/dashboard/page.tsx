"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PlayCircle, 
  Clock, 
  Award, 
  CheckCircle, 
  TrendingUp, 
  ShoppingCart, 
  ChevronRight, 
  ShieldCheck, 
  BarChart2, 
  BookOpen
} from "lucide-react";

interface TestItem {
  id: string;
  title: string;
  examName: string;
  type: string;
  durationMinutes: number;
  totalQuestions: number;
  pricePaise: number;
  discountedPricePaise: number | null;
  isFree?: boolean;
}

interface DashboardStats {
  testsAttempted: number;
  totalSessions?: number;
  enrolledCount: number;
  allIndiaPercentile: number | null;
  averageAccuracy: number | null;
  strongestSubject: string | null;
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<"enrolled" | "available">("enrolled");
  const [userName, setUserName] = useState<string>("Student");
  const [stats, setStats] = useState<DashboardStats>({
    testsAttempted: 0,
    enrolledCount: 0,
    allIndiaPercentile: null,
    averageAccuracy: null,
    strongestSubject: null,
  });
  const [enrolledTests, setEnrolledTests] = useState<TestItem[]>([]);
  const [exploreTests, setExploreTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Fetch authenticated user
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name) setUserName(data.user.name);
          if (data.user.email) setUserEmail(data.user.email);
          setIsEmailVerified(Boolean(data.user.isEmailVerified));
        }
      })
      .catch(() => {});

    // Fetch real dashboard stats and tests
    fetch("/api/student/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.stats) setStats(data.stats);
          if (Array.isArray(data.enrolledTests)) setEnrolledTests(data.enrolledTests);
          if (Array.isArray(data.availableTests)) setExploreTests(data.availableTests);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {!isEmailVerified && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Email Verification Pending</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Please verify <span className="font-medium">{userEmail}</span> to ensure access to full scorecards, all-India ranks, and proctored mock exams.
              </p>
            </div>
          </div>
          <Link
            href="/account"
            className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition shrink-0"
          >
            Verify Now
          </Link>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-200 border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            NTA / TCS-iON CBT Engine Active
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Welcome back, {userName}!
          </h1>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            {enrolledTests.length > 0 
              ? "Your enrolled mock tests and scheduled exam sessions are ready below. Review your analytics or start your next test."
              : "You have not enrolled in any mock tests yet. Explore our authentic NTA/TCS-iON CBT mock tests and test series to begin preparing."}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            {enrolledTests.length > 0 && enrolledTests[0] ? (
              <Link
                href={`/test/${enrolledTests[0].id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-800 font-semibold text-sm shadow-md hover:bg-blue-50 transition transform active:scale-95"
              >
                <PlayCircle className="w-4 h-4 text-blue-700" />
                Resume Active Mock Test
              </Link>
            ) : null}
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/20 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              Browse Test Series
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests Completed</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {stats.testsAttempted} <span className="text-xs text-slate-400 font-normal">/ {stats.enrolledCount} Enrolled</span>
            </h3>
            {stats.totalSessions && stats.totalSessions > stats.testsAttempted ? (
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                {stats.totalSessions} total attempt sessions
              </p>
            ) : null}
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All-India Percentile</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {stats.allIndiaPercentile !== null ? `${stats.allIndiaPercentile} %ile` : "—"}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Accuracy</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {stats.averageAccuracy !== null ? `${stats.averageAccuracy}%` : "—"}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strongest Subject</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {stats.strongestSubject ?? "—"}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`text-sm font-semibold pb-3 -mb-3 transition border-b-2 ${
                activeTab === "enrolled"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              My Enrolled Tests ({enrolledTests.length})
            </button>
            <button
              onClick={() => setActiveTab("available")}
              className={`text-sm font-semibold pb-3 -mb-3 transition border-b-2 ${
                activeTab === "available"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Available Test Series ({exploreTests.length})
            </button>
          </div>
          <Link href="/tests" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            View All Packs <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeTab === "enrolled" ? (
          enrolledTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {enrolledTests.map((test) => (
                <div 
                  key={test.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {test.type}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {test.durationMinutes} mins
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {test.examName} • {test.totalQuestions} Questions • Standard NTA Marking
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="w-4 h-4" /> Ready to Take
                    </div>
                    <Link
                      href={`/test/${test.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Start Test Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No mock tests enrolled yet</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                When you enroll in an authentic NTA/TCS-iON CBT mock test or series, your scheduled tests will appear right here.
              </p>
              <div className="mt-5">
                <Link
                  href="/tests"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Browse Available Tests
                </Link>
              </div>
            </div>
          )
        ) : (
          exploreTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {exploreTests.map((test) => (
                <div 
                  key={test.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {test.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {test.isFree ? "FREE" : `₹${((test.discountedPricePaise || test.pricePaise) / 100).toFixed(0)}`}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {test.examName} • Full Detailed Solutions & Percentile Ranking
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{test.durationMinutes} Minutes</span>
                    <Link
                      href={test.isFree ? `/test/${test.id}` : `/checkout?testId=${test.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> {test.isFree ? "Start Test" : "Buy & Enroll"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No mock tests published yet</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                When administrators publish new full-length or sectional test series into the system, they will automatically appear here.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function FileCheck2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
