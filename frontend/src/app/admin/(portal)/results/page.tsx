"use client";

import { useState, useEffect, useCallback } from "react";
import { Breadcrumbs, Card, Badge, DataTable, type Column } from "@/components/ui/components";
import { formatDateTime, formatRelative } from "@/utils/formatters";
import { Award, AlertCircle, RefreshCw, BarChart3, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsSummary {
  totalAttempts: number;
  submittedAttempts: number;
  inProgressAttempts: number;
  expiredAttempts: number;
  averageScore: number | null;
  averagePercentage: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  averageTimeMinutes: number | null;
}

interface TestBreakdownItem {
  id: string;
  title: string;
  examName: string;
  type: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  passRate: number | null;
}

interface RecentResultItem {
  id: string;
  studentName: string;
  studentEmail: string;
  testTitle: string;
  examName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

export default function ResultsPage() {
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [testBreakdown, setTestBreakdown] = useState<TestBreakdownItem[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/results");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch results (${res.status})`);
      }
      const data = await res.json();
      setSummary(data.summary || null);
      setTestBreakdown(data.testBreakdown || []);
      setRecentResults(data.recentResults || []);
    } catch (err: any) {
      setError(err.message || "Failed to load examination results");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const resultColumns: Column<RecentResultItem>[] = [
    { key: "student", header: "Candidate", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.studentName}</p>
        <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
      </div>
    )},
    { key: "test", header: "Mock Test", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-xs">{r.testTitle}</p>
        <p className="text-[11px] text-muted-foreground">{r.examName}</p>
      </div>
    )},
    { key: "score", header: "Score / Total", render: (r) => (
      <div>
        <span className="font-bold text-sm text-foreground tabular-nums">
          {r.score.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground"> / {r.totalMarks}</span>
      </div>
    ), className: "w-28" },
    { key: "pct", header: "Percentage", render: (r) => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
        r.percentage >= 40
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}>
        {r.percentage}%
      </span>
    ), className: "w-24" },
    { key: "breakdown", header: "Performance", render: (r) => (
      <div className="text-xs space-x-1.5">
        <span className="text-emerald-700 font-semibold">{r.correctCount}✓</span>
        <span className="text-red-600 font-semibold">{r.incorrectCount}✗</span>
        <span className="text-muted-foreground">{r.unansweredCount} skipped</span>
      </div>
    ), className: "w-32" },
    { key: "duration", header: "Time Taken", render: (r) => (
      <span className="text-xs text-muted-foreground font-mono">
        {Math.floor(r.timeTakenSeconds / 60)}m {r.timeTakenSeconds % 60}s
      </span>
    ), className: "w-24" },
    { key: "date", header: "Submitted", render: (r) => (
      <span className="text-xs text-muted-foreground">{formatRelative(r.submittedAt)}</span>
    ), className: "w-28" },
  ];

  const breakdownColumns: Column<TestBreakdownItem>[] = [
    { key: "test", header: "Mock Test Series", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.title}</p>
        <p className="text-xs text-muted-foreground">{r.examName} • {r.type}</p>
      </div>
    )},
    { key: "attempts", header: "Attempts", render: (r) => (
      <span className="tabular-nums font-semibold text-xs text-slate-800">
        {r.completedAttempts} completed <span className="text-muted-foreground font-normal">/ {r.totalAttempts}</span>
      </span>
    ), className: "w-36" },
    { key: "avg", header: "Average Score", render: (r) => (
      <span className="tabular-nums font-semibold text-xs text-foreground">
        {r.averageScore !== null ? `${r.averageScore} pts` : "—"}
      </span>
    ), className: "w-28" },
    { key: "pass", header: "Pass Rate (≥40%)", render: (r) => (
      r.passRate !== null ? (
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {r.passRate}%
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )
    ), className: "w-32" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Results & Analytics" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Candidate Results & Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test performance metrics, evaluation scorecards, and candidate accuracy analytics calculated from database snapshots.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResults}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Failed to fetch performance analytics</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchResults} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Completed Submissions</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {loading ? "..." : summary?.submittedAttempts ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {summary ? `Out of ${summary.totalAttempts} total attempts` : "—"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Average Test Score</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {loading ? "..." : summary?.averageScore !== null ? `${summary?.averageScore} pts` : "—"}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {summary?.averagePercentage !== null ? `Average Accuracy: ${summary?.averagePercentage}%` : "No submissions yet"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Highest Score Achieved</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {loading ? "..." : summary?.highestScore !== null ? `${summary?.highestScore} pts` : "—"}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {summary?.lowestScore !== null ? `Lowest Score: ${summary?.lowestScore} pts` : "—"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Average Duration</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {loading ? "..." : summary?.averageTimeMinutes !== null ? `${summary?.averageTimeMinutes} mins` : "—"}
          </p>
          <span className="text-[11px] text-muted-foreground">Recorded server-side</span>
        </div>
      </div>

      {/* Test Performance Breakdown */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-700" />
            <h2 className="text-sm font-bold text-foreground">Series Performance Breakdown</h2>
          </div>
        </div>
        <div className="mt-1">
          {testBreakdown.length > 0 ? (
            <DataTable columns={breakdownColumns} data={testBreakdown} />
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No test series available for breakdown analysis.
            </div>
          )}
        </div>
      </Card>

      {/* Recent Candidate Scorecards */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-700" />
            <h2 className="text-sm font-bold text-foreground">Official Candidate Scorecards (Submitted Attempts)</h2>
          </div>
        </div>

        <div className="mt-1">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading candidate evaluation records from PostgreSQL...</p>
            </div>
          ) : recentResults.length > 0 ? (
            <DataTable columns={resultColumns} data={recentResults} />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No evaluated exam results yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Candidate scorecards will appear here immediately upon completing and submitting a mock test.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
