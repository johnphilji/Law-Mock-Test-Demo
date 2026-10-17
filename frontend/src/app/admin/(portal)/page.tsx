"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  PlayCircle, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Layers, 
  ShieldCheck, 
  RefreshCw,
  Award,
  ChevronRight
} from "lucide-react";
import { formatCurrency, formatRelative } from "@/utils/formatters";
import { Badge } from "@/components/ui/components";

interface DashboardData {
  stats: {
    totalStudents: number;
    activeStudents: number;
    publishedExams: number;
    publishedMockTests: number;
    draftMockTests: number;
    totalAttempts: number;
    completedAttempts: number;
    activeSubscriptions: number;
    todayRevenuePaise: number;
    totalRevenuePaise: number;
    refundedRevenuePaise: number;
  };
  recentPayments: Array<{
    id: string;
    orderId: string;
    userName: string;
    userEmail: string;
    amountPaise: number;
    status: string;
    createdAt: string;
  }>;
  recentStudents: Array<{
    id: string;
    name: string;
    email: string;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: string;
  }>;
  recentAttempts: Array<{
    id: string;
    userName: string;
    userEmail: string;
    testTitle: string;
    status: string;
    score: number | null;
    totalMarks: number | null;
    percentage: number | null;
    submittedAt: string | null;
    createdAt: string;
  }>;
  recentTests: Array<{
    id: string;
    title: string;
    examName: string;
    type: string;
    totalQuestions: number;
    attemptCount: number;
    durationMinutes: number;
    status: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/dashboard")
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load dashboard metrics (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = data?.stats;
  const netRevenuePaise = stats ? Math.max(0, stats.totalRevenuePaise - stats.refundedRevenuePaise) : 0;
  const completionRate = stats && stats.totalAttempts > 0 
    ? Math.round((stats.completedAttempts / stats.totalAttempts) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 uppercase tracking-wider">
              Control Centre
            </span>
            <span className="text-xs text-muted-foreground">• Live Supabase Database</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">Platform Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{dateFormatted}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : "text-slate-500"}`} />
            <span>Sync Data</span>
          </button>

          <Link
            href="/admin/tests/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Mock Test</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to fetch database metrics</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="text-xs font-semibold underline hover:no-underline text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Students */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {loading ? <span className="inline-block w-12 h-6 bg-slate-100 animate-pulse rounded" /> : stats?.totalStudents ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {stats ? `${stats.activeStudents} active accounts` : "—"}
          </p>
        </div>

        {/* Published Tests */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Mock Tests</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {loading ? <span className="inline-block w-12 h-6 bg-slate-100 animate-pulse rounded" /> : stats?.publishedMockTests ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {stats ? `${stats.draftMockTests} drafts in prep` : "—"}
          </p>
        </div>

        {/* Total Exam Attempts */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Attempts</span>
            <PlayCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {loading ? <span className="inline-block w-12 h-6 bg-slate-100 animate-pulse rounded" /> : stats?.totalAttempts ?? 0}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium">
            {stats ? `${stats.completedAttempts} completed (${completionRate}%)` : "—"}
          </p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Plans</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {loading ? <span className="inline-block w-12 h-6 bg-slate-100 animate-pulse rounded" /> : stats?.activeSubscriptions ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Verified student entitlements
          </p>
        </div>

        {/* Net Revenue */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Captured Revenue</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {loading ? <span className="inline-block w-16 h-6 bg-slate-100 animate-pulse rounded" /> : formatCurrency(netRevenuePaise)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {stats && stats.refundedRevenuePaise > 0 
              ? `Gross: ${formatCurrency(stats.totalRevenuePaise)} (-${formatCurrency(stats.refundedRevenuePaise)})`
              : "Reconciled transactions"}
          </p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {loading ? <span className="inline-block w-14 h-6 bg-slate-100 animate-pulse rounded" /> : formatCurrency(stats?.todayRevenuePaise ?? 0)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Since 00:00 UTC today
          </p>
        </div>
      </div>

      {/* Main Two-Column Activity Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Attempts and Results */}
        <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-700" />
              <h2 className="text-sm font-bold text-foreground">Recent Candidate Attempts</h2>
            </div>
            <Link
              href="/admin/results"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              All Results <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading candidate attempts from PostgreSQL...</p>
              </div>
            ) : data?.recentAttempts && data.recentAttempts.length > 0 ? (
              data.recentAttempts.map((attempt) => (
                <div key={attempt.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{attempt.userName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{attempt.testTitle}</p>
                  </div>

                  <div className="text-right shrink-0">
                    {attempt.score !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-foreground tabular-nums">
                          {attempt.score.toFixed(1)} <span className="text-[10px] text-muted-foreground font-normal">pts</span>
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          (attempt.percentage || 0) >= 40 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {attempt.percentage ?? 0}%
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline">{attempt.status}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {formatRelative(attempt.submittedAt || attempt.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs text-muted-foreground">No candidate examination attempts recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">When students launch CBT tests, live attempt records appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payment Transactions */}
        <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-foreground">Recent Transactions</h2>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              All Payments <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading payments from PostgreSQL...</p>
              </div>
            ) : data?.recentPayments && data.recentPayments.length > 0 ? (
              data.recentPayments.map((p) => (
                <div key={p.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{p.userName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{p.orderId}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-foreground tabular-nums block">
                      {formatCurrency(p.amountPaise)}
                    </span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <Badge variant={p.status.toLowerCase()}>{p.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelative(p.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs text-muted-foreground">No payments recorded in database yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Verified enrollments and gateway receipts will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Students & Published Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Student Registrations */}
        <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-foreground">Recent Registrations</h2>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              All Students <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading registered students...
              </div>
            ) : data?.recentStudents && data.recentStudents.length > 0 ? (
              data.recentStudents.map((s) => (
                <div key={s.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.isEmailVerified ? "success" : "warning"}>
                      {s.isEmailVerified ? "Verified" : "Unverified"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelative(s.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No students registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Published Tests Status */}
        <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-foreground">Mock Test Catalogue</h2>
            </div>
            <Link
              href="/admin/tests"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              All Tests <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading tests from database...
              </div>
            ) : data?.recentTests && data.recentTests.length > 0 ? (
              data.recentTests.map((t) => (
                <div key={t.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                  <div className="min-w-0 flex-1">
                    <Link href={`/test/${t.id}`} className="text-xs font-bold text-foreground hover:text-brand-700 transition truncate block">
                      {t.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {t.examName} • {t.totalQuestions} Questions • {t.durationMinutes} mins
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={t.status.toLowerCase()}>{t.status}</Badge>
                    <span className="text-[11px] text-slate-500 font-semibold tabular-nums">
                      {t.attemptCount} attempt{t.attemptCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs text-muted-foreground">No mock tests published yet.</p>
                <div className="mt-3 flex justify-center gap-2">
                  <Link
                    href="/admin/tests/import"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Import PDF/DOCX
                  </Link>
                  <Link
                    href="/admin/tests/new"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Test
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
