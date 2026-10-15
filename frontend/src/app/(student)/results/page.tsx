"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  FileText,
  Award,
  Loader2,
  BookOpen
} from "lucide-react";

interface ResultQuestion {
  questionId: string;
  order: number;
  questionText: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  options: { key: string; text: string; isCorrect?: boolean }[];
  selectedOptionKey: string | null;
  correctOptionKey: string;
  isCorrect: boolean;
  isUnanswered: boolean;
}

interface AttemptResultData {
  attemptId: string;
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
  questions: ResultQuestion[];
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  const [activeTab, setActiveTab] = useState<"summary" | "solutions">("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResultData | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    fetch(`/api/attempts/${attemptId}/result`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load exam results or access denied");
        return res.json();
      })
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-600">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium">Generating official scorecard...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Result Selected</h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          {error || "Please complete an exam attempt from your dashboard to view your official evaluation and solutions."}
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const accuracy = (result.correctCount + result.incorrectCount) > 0
    ? Math.round((result.correctCount / (result.correctCount + result.incorrectCount)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Scorecard: {result.testTitle}</h1>
          <p className="text-xs text-slate-500">
            Exam: {result.examName} • Submitted on {new Date(result.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} • Evaluated Server-side
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" /> Print Scorecard
          </button>
        </div>
      </div>

      {/* Main Score & Rank Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Your Final Score</p>
            <h2 className="text-4xl sm:text-5xl font-black text-amber-400">{result.score.toFixed(2)}</h2>
            <p className="text-xs text-slate-400">Out of {result.totalMarks.toFixed(2)} Marks</p>
          </div>

          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Percentage</p>
            <h2 className="text-4xl sm:text-5xl font-black text-emerald-400">{result.percentage}%</h2>
            <p className="text-xs text-slate-400">Calculated over total test marks</p>
          </div>

          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Accuracy Rate</p>
            <h2 className="text-4xl sm:text-5xl font-black text-blue-400">{accuracy}%</h2>
            <p className="text-xs text-slate-400">{result.correctCount} Correct • {result.incorrectCount} Incorrect</p>
          </div>

          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Time Taken</p>
            <h2 className="text-4xl sm:text-5xl font-black text-purple-400">
              {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
            </h2>
            <p className="text-xs text-slate-400">Recorded on server</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "summary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Performance Summary
        </button>
        <button
          onClick={() => setActiveTab("solutions")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "solutions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Detailed Solutions & Explanations ({result.questions.length})
        </button>
      </div>

      {activeTab === "summary" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Correct Attempts</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{result.correctCount}</div>
            <p className="text-xs text-slate-500">Positive marks added</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Incorrect Attempts</span>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{result.incorrectCount}</div>
            <p className="text-xs text-slate-500">Negative deductions applied</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Skipped / Unattempted</span>
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{result.unansweredCount}</div>
            <p className="text-xs text-slate-500">No mark change</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {result.questions.map((q, idx) => (
            <div key={q.questionId || idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  Question {q.order}
                </span>
                <div className="flex items-center gap-2">
                  {q.isCorrect ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Correct
                    </span>
                  ) : q.isUnanswered ? (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Unattempted
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      ✗ Incorrect
                    </span>
                  )}
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Correct Option: {q.correctOptionKey}
                  </span>
                </div>
              </div>

              <div className="text-sm font-medium text-slate-900 leading-relaxed">
                {q.questionText}
              </div>

              <div className="space-y-2 text-xs">
                {q.options.map((opt) => {
                  const isUserSelection = q.selectedOptionKey === opt.key;
                  const isCorrectKey = q.correctOptionKey === opt.key;

                  let borderClass = "border-slate-200 bg-slate-50 text-slate-700";
                  if (isCorrectKey) {
                    borderClass = "border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold";
                  } else if (isUserSelection && !isCorrectKey) {
                    borderClass = "border-red-300 bg-red-50 text-red-900 font-medium";
                  }

                  return (
                    <div 
                      key={opt.key}
                      className={`p-3 rounded-lg border flex items-center justify-between ${borderClass}`}
                    >
                      <span>
                        <strong className="mr-1">({opt.key})</strong> {opt.text}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isUserSelection && (
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Your Choice
                          </span>
                        )}
                        {isCorrectKey && (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                            Correct Key
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">Official Explanation:</span>
                  <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading scorecard...
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
